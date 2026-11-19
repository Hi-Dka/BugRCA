export type LiteralUnion<T extends U, U> = T | (U & Record<never, never>);
export type LiteralUnionString<T extends string> = LiteralUnion<T, string>;
export type LiteralUnionNumber<T extends number> = LiteralUnion<T, number>;
