# Sorts ES6/flow imports by path (sort-imports-by-path)

Provides a canonical ordering for ESM imports.


## Rule Details

This rule aims to...

Examples of **incorrect** code for this rule:

Imported variables must be in alphabetical order.

```js
import {b, a} from "dependency";
```

Imported packages are imported in alphabetical order.

```js
import b from "b";
import a from "a";
```

Local dependencies must come first;

```js
import a from "a";
import b from "./b";
```

Examples of **correct** code for this rule:

```js
import {a, b} from "dependency";
```

```js
import a from "a";
import b from "b";
```

```js
import b from "./b";
import a from "a";
```

### Options

* `importsAtStart` - if `true`, all imports must come at the start of the file.
* `sortOrder` - an array specifying the order of imports. Must contain the following:
  * `type` - Flowtype imports
  * `named` - imported variables (e.g. `import {foo} from "foo";`)
  * `unnamed` - imported files (e.g. `import "foo";`)
* `enforceBlankLine` - if `true`, includes a blank line between different import groups.
* `enforceTrailingLine` - if `true`, includes a blank line after all imports.
* `ignoreCase` - if `true`, ignores case when determining import order.

## When Not To Use It

If you don't care about import order, or if you include comments between import statements.
