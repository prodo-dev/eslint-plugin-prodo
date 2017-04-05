/**
 * @fileoverview Sorts ES6/flow imports by path
 * @author Tom Dawes
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

var rule = require("../../../lib/rules/sort-imports-by-path"),

    RuleTester = require("eslint").RuleTester;

const parser = require.resolve('babel-eslint');


//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

var ruleTester = new RuleTester({ parserOptions: { ecmaVersion: 6, sourceType: "module" } });
ruleTester.run("sort-imports-by-path", rule, {
  valid: [
    {
      code: "import a from \"a\";\nimport b from \"b\";",
      parser: parser,
    },
    {
      code: "import b from \"a\";\nimport a from \"b\";",
      parser: parser,
    },
    {
      code: "import b from \"./b\";\nimport a from \"a\";",
      parser: parser,
    },
    {
      code: "import a from \"./aa/a\";\nimport b from \"./aaa/a\";",
      parser: parser,
    },
    {
      code: "import a from \"./aa/a\";\nimport b from \"./aaa/a\";",
      parser: parser,
    },
    {
      code: "import type {b} from \"b\";\nimport {a} from \"a\";",
      parser: parser,
    },
  ],

  invalid: [
    {
        code: "import b from \"b\";\nimport a from \"a\";",
        errors: [{
          message: "Imports should be sorted according to path.",
          type: "ImportDeclaration",
        }],
        parser: parser,
    },
    {
        code: "import a from \"b\";\nimport b from \"a\";",
        errors: [{
          message: "Imports should be sorted according to path.",
          type: "ImportDeclaration",
        }],
        parser: parser,
    },
    {
      code: "import a from \"a\";\nimport b from \"./b\";",
      errors: [{
        message: "Imports should be sorted according to path.",
        type: "ImportDeclaration",
      }],
      parser: parser,
    },
    {
      code: "import b from \"./aaa/a\";\nimport a from \"./aa/a\";",
      errors: [{
        message: "Imports should be sorted according to path.",
        type: "ImportDeclaration",
      }],
      parser: parser,
    },
    {
      code: "import {a} from \"a\";\nimport type {b} from \"b\";",
      errors: [{
        message: "Imports should be sorted according to path.",
        type: "ImportDeclaration",
      }],
      parser: parser,
    }
  ]
});
