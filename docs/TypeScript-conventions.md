This document describes the TypeScript conventions used in this repository.
It explains **what** we do and **why**, so that contributors can make consistent
decisions without having to ask.

- Compiler options live in [`tsconfig.json`](../tsconfig.json). The ones that
  shape these conventions: `strict`, `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `verbatimModuleSyntax`.
- Run `npm run typecheck` before committing. A change is not done until it passes.

## 1. Optional properties

`exactOptionalPropertyTypes` is enabled. With it, the two forms below mean
different things:

| Form                 | Key may be absent | May be explicitly `undefined` |
| -------------------- | :---------------: | :---------------------------: |
| `a?: T`              |        yes        |              no               |
| `a?: T \| undefined` |        yes        |              yes              |

Choose the form by where the type is used:

| Where | Form | Why

|                                                             |                                  |                                                         |
| ----------------------------------------------------------- | -------------------------------- | ------------------------------------------------------- |
| Data models: API responses, DTOs, persisted shapes          | `a?: T`                          | JSON keys are either present with a value or absent.    |
| Function parameters and option objects that callers forward | `a?: T \| undefined`             | Callers often pass a variable that may be `undefined`.  |
| Private internal state                                      | `a: T \| undefined`, initialized | Internal state does not need "key is absent" semantics. |

### Do not combine both techniques for the same field

If you build an object with a conditional spread, the key is already absent when
the value is missing. Do not also add `| undefined` to the field type.

```ts
// Bad: the conditional spread already guarantees the key is absent.
interface CardHeader {
    template?: CardColorTheme | undefined;
}
const header = { ...(color !== undefined && { template: color }) };

// Good
interface CardHeader {
    template?: CardColorTheme;
}
```

When there are several optional fields, prefer building a base object and
assigning the optional ones conditionally, instead of repeating spreads:

```ts
const event: MessageEvent = { messageId, chatId, raw: data };
if (parsedText !== undefined) event.text = parsedText;
```
