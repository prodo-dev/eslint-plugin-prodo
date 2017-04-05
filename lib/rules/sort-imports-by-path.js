/**
 * @fileoverview Sorts ES6/flow imports by path
 * @author Tom Dawes
 */
"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

var types = {
  types: function(importDeclaration) {
    return importDeclaration.importKind === "type";
  },
  named: function(importDeclaration) {
    return importDeclaration.importKind === "value";
  },
  unnamed: function(importDeclaration) {
    return importDeclaration.importKind !== "type"
      && importDeclaration.importKind !== "value";
  }
}

function getType(importDeclaration) {
  var availableTypes = Object.keys(types);
  for (var i = 0 ; i < availableTypes.length ; i++) {
    var type = availableTypes[i];
    if (types[type](importDeclaration)) {
      return type;
    }
  }
  throw new Error("Could not find a suitable type");
}

function compareImportTypes(first, second, sortOrder) {
  var firstType = getType(first);
  var secondType = getType(second);
  if (sortOrder.indexOf(firstType) < sortOrder.indexOf(secondType)) {
    return -1;
  } else if (sortOrder.indexOf(firstType) > sortOrder.indexOf(secondType)) {
    return 1;
  } else {
    return 0;
  }
}

function compareImportPaths(first, second) {
  if (first.source.value < second.source.value) {
    return -1;
  } else if (first.source.value > second.source.value) {
    return 1;
  } else {
    return 0;
  }
}

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
              enum: Object.keys(types),
            },
            uniqueItems: true,
            minItems: Object.keys(types).length,
            maxItems: Object.keys(types).length,
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
      enforceBlankLine = configuration.enforceBlankLine || false;

    return {
      Program: function(node) {
        var imports = node.body.filter(function(part) {
          return part.type === "ImportDeclaration";
        });
        var previousImport = undefined;
        imports.forEach(function(importDeclaration) {
          if (previousImport != null) {
            var comparisonByType = compareImportTypes(previousImport, importDeclaration, sortOrder);
            if (comparisonByType === 1) {
              context.report(importDeclaration, getType(importDeclaration) + " imports should come before " + getType(previousImport) + " imports.")
            } else if (comparisonByType === 0) {
              var comparisonByPath = compareImportPaths(previousImport, importDeclaration);
              if (comparisonByPath === 1) {
                context.report(importDeclaration, "Imports should be sorted according to path.");
              }
            } else if (comparisonByType === -1) {
              if (enforceBlankLine && importDeclaration.loc.start.line !== previousImport.loc.start.line + 2) {
                context.report(importDeclaration, "Missing blank line between imports.");
              }
            }
          }
          previousImport = importDeclaration;
        });
      }
    };
  }
};
