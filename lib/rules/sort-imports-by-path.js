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

    ]
  },

  create: function(context) {
    return {
      Program: function(node) {
        var imports = node.body.filter(function(part) {
          return part.type === "ImportDeclaration";
        });
        var typeImports = imports.filter(function(importNode) {
          return importNode.importKind === "type";
        });
        var valueImports = imports.filter(function(importNode) {
          return importNode.importKind === "value";
        });
        var simpleImports = imports.filter(function(importNode) {
          return importNode.importKind !== "type"
            && importNode.importKind !== "value";
        });
        var previousLine = 0;
        [typeImports, valueImports, simpleImports].forEach(
          function(importsSection) {
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
