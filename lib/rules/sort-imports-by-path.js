/**
 * @fileoverview Sorts ES6/flow imports by path
 * @author Tom Dawes
 */

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

const types = {
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
};

const getType = (importDeclaration) => {
  var availableTypes = Object.keys(types);
  for (var i = 0 ; i < availableTypes.length ; i++) {
    var type = availableTypes[i];
    if (types[type](importDeclaration)) {
      return type;
    }
  }
  throw new Error("Could not find a suitable type");
};

const compareImportTypes = (first, second, sortOrder) => {
  const firstType = getType(first);
  const secondType = getType(second);
  if (sortOrder.indexOf(firstType) < sortOrder.indexOf(secondType)) {
    return -1;
  } else if (sortOrder.indexOf(firstType) > sortOrder.indexOf(secondType)) {
    return 1;
  } else {
    return 0;
  }
}

const compareImportPaths = (first, second) => {
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

  create: (context) => {
    const configuration = context.options[0] || {},
      sortOrder = configuration.sortOrder || ["types", "named", "unnamed"],
      ignoreMemberSort = configuration.ignoreMemberSort || false,
      enforceBlankLine = configuration.enforceBlankLine || false
      sourceCode = context.getSourceCode();

    const report = imports => {
      const firstImport = imports[0];
      const otherImports = imports.slice(1);
      const allImports = {};
      allImports.types = imports.filter(types.types);
      allImports.named = imports.filter(types.named);
      allImports.unnamed = imports.filter(types.unnamed);
      const sortedImportsText = sortOrder.map(type => allImports[type].sort(compareImportPaths).map(importDeclaration => sourceCode.getText().slice(importDeclaration.start, importDeclaration.end)).join("\n")).join(enforceBlankLine ? "\n\n" : "\n");
      return context.report(
        firstImport,
        "Import order is not correct.",
        fixer => {
          process.stdout.write("Replacing", sourceCode.getText().slice(firstImport.start, firstImport.end), "with", sortedImportsText);
          fixer.replaceRange([firstImport.start, firstImport.end], sortedImportsText);
          otherImports.forEach(otherImport => {
            process.stdout.write("Replacing", sourceCode.getText().slice(otherImport.start, otherImport.end), "with", "");
            fixer.replaceRange([otherImport.start, otherImport.end], "");
          });
        }
      );
    };

    return {
      Program: (node) => {
        const imports = node.body.filter(part => part.type === "ImportDeclaration");
        let previousImport = undefined;
        imports.forEach(importDeclaration => {
          if (previousImport != null) {
            const comparisonByType = compareImportTypes(previousImport, importDeclaration, sortOrder);
            if (comparisonByType === 1) {
              report(imports);
              return;
            } else if (comparisonByType === 0) {
              const comparisonByPath = compareImportPaths(previousImport, importDeclaration);
              if (comparisonByPath === 1) {
                report(imports);
                return;
              }
            } else if (comparisonByType === -1) {
              if (enforceBlankLine && importDeclaration.loc.start.line <= previousImport.loc.start.line + 1) {
                report(imports);
                return;
              }
            }
          }
          previousImport = importDeclaration;
        });
      }
    };
  },
};
