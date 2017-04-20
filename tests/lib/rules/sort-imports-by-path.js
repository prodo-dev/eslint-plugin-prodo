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
    {
      code: "import {b} from \"b\";\nimport type {a} from \"a\";",
      parser: parser,
      options: [{
        sortOrder: ["named", "type", "unnamed"]
      }],
    },
    {
      code: "//This is a comment\n\nimport a from \"a\";",
      parser: parser,
    },
    {
      code: "const x = 0;\n\nimport a from \"a\";",
      parser: parser,
      options: [{
        importsAtStart: false,
      }],
    },
    {
      code: "import {a, b} from \"a\";",
      parser: parser,
    },
    {
      code: "import {B, a} from \"a\";",
      parser: parser,
      options: [{
        ignoreCase: false,
      }],
    },
    {
      code: "import b, {a} from \"a\";",
      parser: parser,
    },
  ],

  invalid: [
    {
      code: "import b from \"b\";\nimport a from \"a\";",
      errors: [{
        message: "Import order is not correct.",
        type: "ImportDeclaration",
      }],
      parser: parser,
    },
    {
      code: "import a from \"b\";\nimport b from \"a\";",
      errors: [{
        message: "Import order is not correct.",
        type: "ImportDeclaration",
      }],
      parser: parser,
    },
    {
      code: "import a from \"a\";\nimport b from \"./b\";",
      errors: [{
        message: "Import order is not correct.",
        type: "ImportDeclaration",
      }],
      parser: parser,
    },
    {
      code: "import b from \"./aaa/a\";\nimport a from \"./aa/a\";",
      errors: [{
        message: "Import order is not correct.",
        type: "ImportDeclaration",
      }],
      parser: parser,
    },
    {
      code: "import {a} from \"a\";\nimport type {b} from \"b\";",
      errors: [{
        message: "Import order is not correct.",
        type: "ImportDeclaration",
      }],
      parser: parser,
    },
    {
      code: "const x = 0;\n\nimport {a} from \"a\";",
      errors: [{
        message: "All imports should go at the top of the file.",
        type: "ImportDeclaration",
      }],
      parser: parser,
      options: [{
        importsAtStart: true,
      }],
    },
    {
      code: "import {b, a} from \"a\";",
      errors: [{
        message: "Import specifiers should be sorted alphabetically.",
        type: "ImportDeclaration",
      }],
      parser: parser,
    },
    {
      code: "import a, {c, b} from \"a\";",
      errors: [{
        message: "Import specifiers should be sorted alphabetically.",
        type: "ImportDeclaration",
      }],
      parser: parser,
    },
    {
      code: "import {B, a} from \"a\";",
      errors: [{
        message: "Import specifiers should be sorted alphabetically.",
        type: "ImportDeclaration",
      }],
      options: [{
        ignoreCase: true,
      }],
      parser: parser,
    }
  ]
});
