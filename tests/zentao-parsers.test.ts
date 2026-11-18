import test from 'node:test';
import assert from 'node:assert/strict';
import { ParseError } from '../src/utils';
import {
    toBugActionHistoryId,
    toBugActionId,
    toBugFileId,
    toBugId,
    toProductId,
} from '../src/zentao/types';
import { ZenTaoError } from '../src/zentao/errors/ZenTaoError';
import { parseEnvelope } from '../src/zentao/parsers/envelope';
import {
    parseBugActionHistory,
    parseBugDetailData,
    parseBugFiles,
    parseBugListData,
} from '../src/zentao/parsers/bug';
import { parseProductListData } from '../src/zentao/parsers/product';
import { parseLoginData } from '../src/zentao/parsers/auth';
import { HttpClient } from '../src/zentao/client/HttpClient';
import { BugApi } from '../src/zentao/modules/BugApi';

test('branded ID constructors accept positive integers and reject invalid values', () => {
    const constructors = [
        toBugId,
        toBugActionId,
        toBugFileId,
        toBugActionHistoryId,
        toProductId,
    ];

    for (const construct of constructors) {
        assert.equal(construct(1), 1);
        assert.equal(construct(99), 99);

        for (const invalid of [0, -1, Number.NaN, 1.5]) {
            assert.throws(
                () => construct(invalid),
                (err: unknown) => err instanceof ParseError && Object.is(err.received, invalid),
            );
        }
    }
});

test('parseEnvelope returns body on success and throws ZenTaoError with raw payload otherwise', () => {
    const okPayload = { status: 'success', bugs: [] };
    assert.deepEqual(parseEnvelope(okPayload), okPayload);

    const failPayload = { status: 'fail', message: 'unauthorized' };
    assert.throws(
        () => parseEnvelope(failPayload),
        (err: unknown) =>
            err instanceof ZenTaoError &&
            err.response === failPayload &&
            err.message.includes('fail'),
    );

    assert.throws(
        () => parseEnvelope('not-an-object'),
        (err: unknown) => err instanceof ParseError && err.path === 'response',
    );
});

test('parseBugListData parses list items and rejects invalid ids or titles', () => {
    const items = parseBugListData({
        status: 'success',
        bugs: [
            { id: 12, title: 'Null pointer on login', extraField: 'ignored' },
            { id: 13, title: 'Timeout on save' },
        ],
    });
    assert.deepEqual(items, [
        { id: 12, title: 'Null pointer on login' },
        { id: 13, title: 'Timeout on save' },
    ]);

    assert.throws(
        () => parseBugListData({ bugs: [{ id: 0, title: 'bad id' }] }),
        (err: unknown) => err instanceof ParseError && err.path === 'response.bugs[0].id',
    );
});

test('parseBugActionHistory treats diff as optional', () => {
    const withoutDiff = parseBugActionHistory(
        {
            field: 'status',
            old: 'active',
            oldValue: 'Active',
            new: 'resolved',
            newValue: 'Resolved',
        },
        'history[0]',
    );
    assert.equal('diff' in withoutDiff, false);

    const nulledDiff = parseBugActionHistory(
        {
            field: 'status',
            old: 'active',
            oldValue: 'Active',
            new: 'resolved',
            newValue: 'Resolved',
            diff: null,
        },
        'history[1]',
    );
    assert.equal('diff' in nulledDiff, false);

    const withDiff = parseBugActionHistory(
        {
            field: 'steps',
            old: 'a',
            oldValue: 'a',
            new: 'b',
            newValue: 'b',
            diff: '- a\n+ b',
        },
        'history[2]',
    );
    assert.equal(withDiff.diff, '- a\n+ b');
});

test('parseBugFiles handles attachment maps, empty PHP arrays, and invalid shapes', () => {
    assert.deepEqual(parseBugFiles([], 'response.bug.files'), {});

    const files = parseBugFiles(
        {
            '10': {
                id: 10,
                title: 'crash.log',
                name: 'crash.log',
                extension: 'log',
                size: 2048,
                url: '/files/10',
                webPath: null,
                realPath: '/data/10.log',
            },
        },
        'response.bug.files',
    );
    assert.deepEqual(files, {
        '10': {
            id: 10,
            title: 'crash.log',
            name: 'crash.log',
            extension: 'log',
            size: 2048,
            url: '/files/10',
            realPath: '/data/10.log',
        },
    });
    assert.equal('webPath' in files['10']!, false);

    assert.throws(
        () => parseBugFiles(['unexpected'], 'response.bug.files'),
        (err: unknown) => err instanceof ParseError && err.path === 'response.bug.files',
    );
    assert.throws(
        () => parseBugFiles('bad', 'response.bug.files'),
        (err: unknown) => err instanceof ParseError && err.path === 'response.bug.files',
    );
});

test('parseBugDetailData parses full bug detail and nested actions', () => {
    const detail = parseBugDetailData({
        bug: {
            id: 101,
            title: 'Crash on startup',
            status: 'active',
            steps: '<p>step 1</p>',
            openedBy: 'alice',
            assignedTo: null,
            files: [],
        },
        actions: [
            {
                id: 501,
                actor: 'alice',
                action: 'opened',
                date: '2026-11-18 10:00:00',
                comment: '',
                history: [],
            },
        ],
    });

    assert.equal(detail.bug.id, 101);
    assert.deepEqual(detail.bug.files, {});
    assert.equal('assignedTo' in detail.bug, false);
    assert.equal(detail.actions.length, 1);
    assert.equal(detail.actions[0]?.id, 501);
});

test('parseProductListData and parseLoginData validate product and login payloads', () => {
    const products = parseProductListData({
        products: [{ id: 7, name: 'BugRCA' }],
    });
    assert.deepEqual(products, [{ id: 7, name: 'BugRCA' }]);

    assert.throws(
        () => parseProductListData({ products: [{ id: -5, name: 'Bad' }] }),
        (err: unknown) => err instanceof ParseError && err.path === 'response.products[0].id',
    );

    assert.equal(parseLoginData({ token: 'abc-token' }), 'abc-token');
    assert.throws(
        () => parseLoginData({}),
        (err: unknown) => err instanceof ParseError && err.path === 'response.token',
    );
});

test('BugApi.getBugDetail issues a single GET request and returns validated detail', async () => {
    const client = new HttpClient({ baseUrl: 'https://zentao.example.com' });
    let getCalls = 0;
    client.get = async (path: string) => {
        getCalls += 1;
        assert.equal(path, '/bugs/101');
        return {
            status: 'success',
            bug: {
                id: 101,
                title: 'Crash on startup',
                status: 'active',
                steps: '<p>step 1</p>',
                files: [],
            },
            actions: [],
        };
    };

    const bugApi = new BugApi(client);
    const detail = await bugApi.getBugDetail(toBugId(101));
    assert.equal(getCalls, 1);
    assert.equal(detail.bug.id, 101);
    assert.deepEqual(detail.bug.files, {});
});
