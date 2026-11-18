import { assertPositiveInteger } from '../../utils';

export type BugId = number & { readonly __brand: unique symbol };
export type BugActionId = number & { readonly __brand: unique symbol };
export type BugFileId = number & { readonly __brand: unique symbol };
export type BugActionHistoryId = number & { readonly __brand: unique symbol };

export const BUG_STATUS = ['active', 'resolved', 'closed'] as const;
export type BugStatus = (typeof BUG_STATUS)[number];

export function toBugId(id: number, path = 'BugId'): BugId {
    return assertPositiveInteger(id, path) as BugId;
}

export function toBugActionId(id: number, path = 'BugActionId'): BugActionId {
    return assertPositiveInteger(id, path) as BugActionId;
}

export function toBugFileId(id: number, path = 'BugFileId'): BugFileId {
    return assertPositiveInteger(id, path) as BugFileId;
}

export function toBugActionHistoryId(id: number, path = 'BugActionHistoryId'): BugActionHistoryId {
    return assertPositiveInteger(id, path) as BugActionHistoryId;
}

export interface ZenTaoBugListItem {
    id: BugId;
    title: string;
}

export interface ZenTaoBugListData {
    bugs: ZenTaoBugListItem[];
}

export interface ZenTaoBugFile {
    id: BugFileId;
    title: string;
    name: string;
    extension: string;
    size: number;
    url: string;
    webPath?: string;
    realPath?: string;
    addedBy?: string;
    addedDate?: string;
}

export interface ZenTaoBugActionHistory {
    field: string;
    old: string;
    oldValue: string;
    new: string;
    newValue: string;
    diff?: string;
}

export interface ZenTaoBugAction {
    id: BugActionId;
    actor: string;
    action: string;
    date: string;
    comment: string;
    history: ZenTaoBugActionHistory[];
}

export interface ZenTaoBugDetail {
    id: BugId;
    title: string;
    status: string;
    steps: string;
    openedBy?: string;
    openedDate?: string;
    assignedTo?: string;
    files: Record<string, ZenTaoBugFile>;
}

export interface ZenTaoBugDetailData {
    bug: ZenTaoBugDetail;
    actions: ZenTaoBugAction[];
}
