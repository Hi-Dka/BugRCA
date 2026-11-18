export class ParseError extends Error {
    constructor(
        public readonly path: string,
        expected: string,
        public readonly received: unknown,
    ) {
        super(`Invalid data at ${path}: expected ${expected}, got ${describeType(received)}`);
        this.name = 'ParseError';
    }
}

function describeType(value: unknown): string {
    if (value === null) {
        return 'null';
    }
    if (Array.isArray(value)) {
        return 'array';
    }
    if (typeof value === 'number' && Number.isNaN(value)) {
        return 'NaN';
    }
    return typeof value;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function asRecord(value: unknown, path: string): Record<string, unknown> {
    if (!isRecord(value)) {
        throw new ParseError(path, 'object', value);
    }
    return value;
}

export type Parser<T> = (value: unknown, path: string) => T;

export interface OptionalParser<T> {
    optional: true;
    parse: Parser<T>;
}

type IsOptionalKey<T, K extends keyof T> = Record<never, never> extends Pick<T, K> ? true : false;

export type ShapeOf<T> = {
    [K in keyof T]-?: IsOptionalKey<T, K> extends true
        ? OptionalParser<Exclude<T[K], undefined>>
        : Parser<T[K]>;
};

export function optional<T>(parser: Parser<T>): OptionalParser<T> {
    return {
        optional: true,
        parse: parser,
    };
}

export function isOptionalParser(value: unknown): value is OptionalParser<unknown> {
    return typeof value === 'object' && value !== null && 'optional' in value && 'parse' in value;
}

export function parseShape<T extends object>(shape: ShapeOf<T>): Parser<T> {
    return (value: unknown, path: string): T => {
        const obj = asRecord(value, path);
        const result: Record<string, unknown> = {};

        // Object.entries widens mapped type values; ShapeOf<T> guarantees every spec matches its key.
        for (const [key, spec] of Object.entries(shape) as Array<
            [string, Parser<unknown> | OptionalParser<unknown>]
        >) {
            const fieldPath = `${path}.${key}`;
            const fieldRaw = obj[key];

            if (isOptionalParser(spec)) {
                if (fieldRaw !== undefined && fieldRaw !== null) {
                    result[key] = spec.parse(fieldRaw, fieldPath);
                }
            } else {
                result[key] = spec(fieldRaw, fieldPath);
            }
        }

        // Safe because ShapeOf<T> validated every required and optional property of T above.
        return result as T;
    };
}

export const parseString: Parser<string> = (value: unknown, path: string): string => {
    if (typeof value !== 'string') {
        throw new ParseError(path, 'string', value);
    }
    return value;
};

export const parseNumber: Parser<number> = (value: unknown, path: string): number => {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new ParseError(path, 'number', value);
    }
    return value;
};

export function parseArray<T>(itemParser: Parser<T>): Parser<T[]> {
    return (value: unknown, path: string): T[] => {
        if (!Array.isArray(value)) {
            throw new ParseError(path, 'array', value);
        }
        return value.map((item, index) => itemParser(item, `${path}[${index}]`));
    };
}


function isOneOf<T extends readonly string[]>(list: T, value: string): value is T[number] {
    return list.some((item) => item === value);
}

export function parseEnum<const T extends readonly string[]>(allowed: T): Parser<T[number]> {
    return (value: unknown, path: string): T[number] => {
        const text = parseString(value, path);
        if (!isOneOf(allowed, text)) {
            throw new ParseError(path, `one of ${allowed.join(' | ')}`, value);
        }
        return text;
    };
}

export function assertPositiveInteger(value: number, path: string): number {
    if (!Number.isInteger(value) || value <= 0) {
        throw new ParseError(path, 'positive integer', value);
    }
    return value;
}

export function parseId<T>(toId: (id: number, path: string) => T): Parser<T> {
    return (value: unknown, path: string): T => toId(parseNumber(value, path), path);
}
