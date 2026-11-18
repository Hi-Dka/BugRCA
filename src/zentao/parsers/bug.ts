import {
    ParseError,
    isRecord,
    optional,
    parseArray,
    parseId,
    parseNumber,
    parseShape,
    parseString,
    type Parser,
} from '../../utils';
import {
    toBugActionId,
    toBugFileId,
    toBugId,
    type ZenTaoBugAction,
    type ZenTaoBugActionHistory,
    type ZenTaoBugDetail,
    type ZenTaoBugDetailData,
    type ZenTaoBugFile,
    type ZenTaoBugListData,
    type ZenTaoBugListItem,
} from '../types';

const parseBugListItem = parseShape<ZenTaoBugListItem>({
    id: parseId(toBugId),
    title: parseString,
});

const parseBugListPayload = parseShape<ZenTaoBugListData>({
    bugs: parseArray(parseBugListItem),
});

export function parseBugListData(body: Record<string, unknown>): ZenTaoBugListItem[] {
    return parseBugListPayload(body, 'response').bugs;
}

const parseBugFile = parseShape<ZenTaoBugFile>({
    id: parseId(toBugFileId),
    title: parseString,
    name: parseString,
    extension: parseString,
    size: parseNumber,
    url: parseString,
    webPath: optional(parseString),
    realPath: optional(parseString),
    addedBy: optional(parseString),
    addedDate: optional(parseString),
});

// ZenTao PHP API serializes an empty attachment map as `[]`; normalize it to `{}`.
export const parseBugFiles: Parser<Record<string, ZenTaoBugFile>> = (
    value: unknown,
    path: string,
): Record<string, ZenTaoBugFile> => {
    if (Array.isArray(value)) {
        if (value.length === 0) {
            return {};
        }
        throw new ParseError(path, 'attachment map or empty array', value);
    }

    if (!isRecord(value)) {
        throw new ParseError(path, 'attachment map or empty array', value);
    }

    const files: Record<string, ZenTaoBugFile> = {};
    for (const [key, entry] of Object.entries(value)) {
        files[key] = parseBugFile(entry, `${path}.${key}`);
    }
    return files;
};

export const parseBugActionHistory = parseShape<ZenTaoBugActionHistory>({
    field: parseString,
    old: parseString,
    oldValue: parseString,
    new: parseString,
    newValue: parseString,
    diff: optional(parseString),
});

const parseBugAction = parseShape<ZenTaoBugAction>({
    id: parseId(toBugActionId),
    actor: parseString,
    action: parseString,
    date: parseString,
    comment: parseString,
    history: parseArray(parseBugActionHistory),
});

const parseBugDetail = parseShape<ZenTaoBugDetail>({
    id: parseId(toBugId),
    title: parseString,
    status: parseString,
    steps: parseString,
    openedBy: optional(parseString),
    openedDate: optional(parseString),
    assignedTo: optional(parseString),
    files: parseBugFiles,
});

const parseBugDetailPayload = parseShape<ZenTaoBugDetailData>({
    bug: parseBugDetail,
    actions: parseArray(parseBugAction),
});

export function parseBugDetailData(body: Record<string, unknown>): ZenTaoBugDetailData {
    return parseBugDetailPayload(body, 'response');
}
