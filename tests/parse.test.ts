import test from 'node:test';
import assert from 'node:assert/strict';
import {
    ParseError,
    assertPositiveInteger,
    optional,
    parseArray,
    parseNumber,
    parseShape,
    parseString,
} from '../src/utils';

interface SampleItem {
    name: string;
    count: number;
    note?: string;
}

const parseSample = parseShape<SampleItem>({
    name: parseString,
    count: parseNumber,
    note: optional(parseString),
});

test('parseShape parses valid objects with optional field present', () => {
    const parsed = parseSample({ name: 'bug-1', count: 3, note: 'hello', extra: true }, 'item');
    assert.deepEqual(parsed, { name: 'bug-1', count: 3, note: 'hello' });
});

test('parseShape omits optional keys when undefined or null', () => {
    const omitted = parseSample({ name: 'bug-1', count: 1 }, 'item');
    assert.deepEqual(omitted, { name: 'bug-1', count: 1 });
    assert.equal('note' in omitted, false);

    const nulled = parseSample({ name: 'bug-1', count: 1, note: null }, 'item');
    assert.deepEqual(nulled, { name: 'bug-1', count: 1 });
    assert.equal('note' in nulled, false);
});

test('parseShape throws ParseError with descriptive labels and field paths', () => {
    assert.throws(
        () => parseSample(null, 'root'),
        (err: unknown) =>
            err instanceof ParseError &&
            err.path === 'root' &&
            err.received === null &&
            err.message.includes('expected object, got null'),
    );

    assert.throws(
        () => parseSample([], 'root'),
        (err: unknown) =>
            err instanceof ParseError &&
            err.path === 'root' &&
            err.message.includes('expected object, got array'),
    );

    assert.throws(
        () => parseSample({ name: 'bug-1', count: Number.NaN }, 'root'),
        (err: unknown) =>
            err instanceof ParseError &&
            err.path === 'root.count' &&
            err.message.includes('expected number, got NaN'),
    );

    assert.throws(
        () => parseSample({ name: 'bug-1', count: 1, note: 42 }, 'root'),
        (err: unknown) =>
            err instanceof ParseError &&
            err.path === 'root.note' &&
            err.received === 42 &&
            err.message.includes('expected string, got number'),
    );
});

test('parseArray parses elements and tracks element index path on error', () => {
    const parseNumbers = parseArray(parseNumber);
    assert.deepEqual(parseNumbers([1, 2, 3], 'nums'), [1, 2, 3]);

    assert.throws(
        () => parseNumbers('not-an-array', 'nums'),
        (err: unknown) => err instanceof ParseError && err.path === 'nums',
    );

    assert.throws(
        () => parseNumbers([1, 'bad', 3], 'nums'),
        (err: unknown) =>
            err instanceof ParseError &&
            err.path === 'nums[1]' &&
            err.received === 'bad',
    );
});

test('assertPositiveInteger validates positive integers', () => {
    assert.equal(assertPositiveInteger(1, 'id'), 1);
    assert.equal(assertPositiveInteger(42, 'id'), 42);

    for (const invalid of [0, -1, Number.NaN, 1.5, Number.POSITIVE_INFINITY]) {
        assert.throws(
            () => assertPositiveInteger(invalid, 'id'),
            (err: unknown) => err instanceof ParseError && err.path === 'id',
        );
    }
});
