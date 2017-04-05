/**
 * @fileoverview Sorts ES6/flow imports by path
 * @author Tom Dawes
 */
"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
  meta: {
    docs: {
      description: "Sorts ES6/flow imports by path",
      category: "ECMAScript 6",
      recommended: false
    },
    fixable: "code",
    schema: [
      {
        type: "object",
        properties: {
          sortOrder: {
            type: "array",
            items: {
              enum: ["types", "named", "unnamed"],
            },
            uniqueItems: true,
            minItems: 3,
            maxItems: 4,
          },
          ignoreMemberSort: {
            type: "boolean"
          },
          enforceBlankLine: {
            type: "boolean",
          }
        },
        additionalProperties: false
      }
    ]
  },

  create: function(context) {
    const configuration = context.options[0] || {},
      sortOrder = configuration.sortOrder || ["types", "named", "unnamed"],
      ignoreMemberSort = configuration.ignoreMemberSort || false,
      enforceBlankLine = configuration.enforceBlankLine || true;

    return {
      Program: function(node) {
        var imports = {};
        imports.all = node.body.filter(function(part) {
          return part.type === "ImportDeclaration";
        });
        imports.types = imports.all.filter(function(importNode) {
          return importNode.importKind === "type";
        });
        imports.named = imports.all.filter(function(importNode) {
          return importNode.importKind === "value";
        });
        imports.unnamed = imports.all.filter(function(importNode) {
          return importNode.importKind !== "type"
            && importNode.importKind !== "value";
        });
        var previousLine = 0;
        sortOrder.forEach(
          function(importType) {
            var importsSection = imports[importType];
            var sortedImports = importsSection.sort(function(o1, o2) {
              if (o1.source.value < o2.source.value) {
                return -1;
              } else if (o1.source.value > o2.source.value) {
                return 1;
              } else {
                return 0;
              }
            });
            for (var i = 0 ; i < sortedImports.length ; i++) {
              var sortedImport = sortedImports[i];
              if (sortedImport.loc.start.line < previousLine) {
                context.report(sortedImport, "Imports should be sorted according to path.")
              }
              previousLine = sortedImport.loc.start.line;
            }
          }
        );
      }
    };
  }
};
