## 类型谓词

类型谓词是 TypeScript 中的一种特殊类型，它用于在运行时检查一个值是否属于某个特定的类型。类型谓词通常用于自定义类型保护函数，以便在代码中进行更精确的类型推断。value is xxx

## Partial

`Partial<T>` 是 TypeScript 提供的一个内置泛型类型，它将类型 `T` 的所有属性变为可选的。也就是说，使用 `Partial<T>` 可以创建一个新的类型，该类型的所有属性都是可选的。

## 类型世界和值世界

在 TypeScript 中，类型世界（Type World）和值世界（Value World）是两个不同的概念。类型世界是指编译时的类型系统，它用于检查代码的类型安全性。而值世界是指运行时的实际值和对象。

先看这行代码是在冒号后面（类型世界），还是在等号后面/函数体里（值世界）。

## ...

在 TypeScript（以及现代 JavaScript ES6+）中，... 三个点有两种完全相反的作用，具体取决于它出现的位置：展开运算符（Spread Operator） 或 剩余参数/元素（Rest Parameter / Rest Element）。

## extends

`extends` 关键字在 TypeScript 中有多种用途，主要用于类型约束和继承。它可以用于泛型约束、接口继承、类继承等场景。
在写 class A extends B 时，extends 确实是“继承/扩展”的意思。但在 TypeScript 类型系统中，extends 的核心含义是 “约束（限制范围）” 或 “判断（是否兼容/属于）”。

- keyof T：提取对象 T 的所有属性名，组成一个联合类型。
  比如 interface User { id: number; name: string }，那么 keyof User 就是 'id' | 'name'。
  K extends keyof T：意思是 “类型参数 K 必须被限制在 T 的属性名范围内”（即 K 只能是 'id' 或 'name'，不能乱传一个 'age' 进来）。
  A extends B ? X : Y（条件类型）：这里的 extends 相当于 if 判断——“如果 A 能赋值给 B（A 符合 B 的要求），结果就是 X，否则是 Y”。

## Pick

`Pick<T, K>` 是 TypeScript 提供的一个内置泛型类型，英文直译是“挑选”，它用于从类型 `T` 中选择一组属性 `K`，并创建一个新的类型。`K` 必须是 `T` 的属性名的子集。

```TypeScript
interface User {
    id: number;
    name: string;
    age?: number;
}

// 只挑出 'id' 属性
type OnlyId = Pick<User, 'id'>;
// 结果等价于：{ id: number }

// 只挑出 'age' 属性（注意：原本的问号 ? 也会一起被挑出来！）
type OnlyAge = Pick<User, 'age'>;
// 结果等价于：{ age?: number }
```

## Record<never, never> 和 never 是什么？

never 并不等价于 null，null 也不是空对象 {}。

- null：是一个真实存在的值，代表“空值”。
- never：代表 “永远不存在的类型”（空集合）。如果一个变量是 never 类型，说明它不可能有任何值。
- Record<K, V>：TS 内置工具类型，意思是“构造一个属性名为 K、属性值为 V 的对象类型”。比如 Record<string, number> 就是 { [key: string]: number }。
- Record<never, never>：构造一个“没有任何属性名（never）”的对象类型——说白了，它就是一个没有任何属性约束的空对象 {}。(注：之所以写 Record<never, never> 而不直接写 {}，是因为在团队代码规范 ESLint 中，直接写 {} 会触发警告，用 Record<never, never> 是一种绕过 ESLint 报错的写法。)

## Exclude<T, U> 是什么意思？

Exclude 也是 TS 内置的工具类型，英文直译是“排除/剔除”。

作用：从联合类型 T 中，把包含在 U 里的类型踢出去。

例子：

```TypeScript
// 假设某个属性是可选的：nickname?: string
// 在 TS 眼里，可选属性的类型实际上是：string | undefined

type CleanType = Exclude<string | undefined, undefined>;
// 把 undefined 踢出去，结果就只剩下：string
```

在你的代码里，Exclude<T[K], undefined> 就是为了把可选属性自带的 undefined 剥离掉，只保留它真正的数据类型（比如把 number | undefined 还原成 number）。

## -? 是什么意思？

在 TS 的映射类型（[K in keyof T]）中：

?：给属性加上“可选”标记。

+?：明确表示加上“可选”标记（和 ? 效果一样）。

-?：减掉（移除）“可选”标记，把可选属性强制变成必填属性！

对比看一眼就懂了：

```TypeScript
interface User {
  id: number;
  age?: number; // 可选
}

// 1. 原样遍历（保留 ?）
type CopyUser = {
  [K in keyof User]: User[K];
};
// 结果：{ id: number; age?: number }

// 2. 加上 -?（剥夺所有属性的 ?）
type RequiredUser = {
  [K in keyof User]-?: User[K];
};
// 结果：{ id: number; age: number }  <-- 注意 age 的问号被减掉了，变成必填了！
```

## “泛型函数” 和 “泛型类型里的函数”

1. <T></t> 绑定在类型上，而不是函数参数列表上

对比一下这两种完全不同的写法：

```TypeScript

// 写法 A：你的代码（<T> 在类型名字 Parser 后面，不在圆括号前面）
type Parser<T> = (value: unknown, path: string) => T;

// 写法 B：泛型函数（<T> 紧贴在圆括号前面）
type GenericFn = <T>(value: unknown, path: string) => T;
```

在你的代码里使用的是写法 A：

<T></t> 只是用来规定返回值的类型，它甚至没出现在参数 (value: unknown, path: string) 里。

当有人写下 parseString 时，T 就已经被锁定为 string 了，这个函数实际上已经变成了：
(value: unknown, path: string) => string（它本身就是一个普通的两参数函数，根本不接收 <T></t>）。

2. 在 parseShape 里为什么变成了 unknown？

再看 parseShape 内部这几行：

```TypeScript

for (const [key, spec] of Object.entries(shape) as Array<
    [string, Parser<unknown> | OptionalParser<unknown>]
>) {
    if (isOptionalParser(spec)) {
        // 经过 isOptionalParser 判断后，TS 知道 spec 的类型是 OptionalParser<unknown>
        // 所以 spec.parse 的类型就是 Parser<unknown>
        // 展开就是：(value: unknown, path: string) => unknown
        result[key] = spec.parse(rawField, fieldPath);
    }
}
```

这里发生了两件事：

类型被统一擦除为 unknown：在 for 循环里，对象有十几个字段（有的返回 number，有的返回 string，有的返回 boolean），为了能在同一个循环里统一处理，作者用 as Array<[string, Parser<unknown></unknown> | OptionalParser<unknown></unknown>]> 把所有字段的 <T></t> 统一视作 <unknown></unknown>。

直接传两个普通参数即可：既然 spec.parse 的类型已经是 Parser<unknown></unknown>（也就是 (value: unknown, path: string) => unknown），调用它时只需要按照它的签名传入 rawField 和 fieldPath 这两个值就行，返回值会作为 unknown 存进 result[key]（因为 result 的类型本来就是 Record<string, unknown>，正好严丝合缝）。

一句话记忆：<T></t> 在定义规则（如 Parser<string></string>）时就已经消费掉了，真正运行调用 spec.parse(rawField, fieldPath) 时，它就是一个普通的 JavaScript 函数调用。

## for...of 和 for...in 的区别

- for...of（取“值”）：用来遍历数组，直接拿到里面的每一个元素值（配合 Object.entries() 就能同时拿到对象的键和值，是目前最推荐的写法）。
- for...in（取“键”）：用来遍历对象，但每次只能拿到属性名（key），还需要自己写 shape[key] 去取值，而且容易把原型链上的多余属性也遍历出来，所以现代代码里通常更推荐用 for (const [key, value] of Object.entries(obj)) 替代它。

## Object.entries()

Object.entries() 是 JavaScript 的内置方法，英文 entries 的意思是“条目/记录”。
作用：把一个对象（Object）的每一对 key: value，拆成 [key, value] 这样的小数组，最后打包成一个二维数组返回。
为什么要用它？：因为普通对象（{ ... }）不能直接用 for...of 循环遍历，必须先用 Object.entries() 把它转成数组才行。

## 为什么 TS / JS 可以直接遍历并打印键名？

虽然 TypeScript 也有类似 C++ 的静态类型检查（interface / type 编译后也会消失），但它的底层运行时（JavaScript 引擎）里，每一个对象在内存中都是一个动态的哈希表（字典）。

这意味着不管你在 TS 里有没有写类型定义，在代码真正运行的时候，对象的属性名（Key）作为实实在在的字符串，和值（Value）一起保存在内存里。

所以 JavaScript 原生就自带完整的运行时自省/反射能力：

- Object.keys(user)：直接拿到所有键名的字符串数组 ['name', 'age']。
- Object.values(user)：直接拿到所有值的数组 ['Alice', 25]。
- Object.entries(user)：直接拿到键值对数组 [['name', 'Alice'], ['age', 25]]。
- console.log(user)：甚至连遍历都不用写，直接扔进 console.log，引擎就能把整个对象的键和值原原本本打印出来。
