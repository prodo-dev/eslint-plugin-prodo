/**
 * @fileoverview Sorts ES6/flow imports by path
 * @author Tom Dawes
 */

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

const TYPE = "type";
const NAMED = "named";
const UNNAMED = "unnamed";

const isTypeImport = node => node.importKind === "type";
const isNamedImport = node => node.importKind === "value";

const getImportType = importDeclaration => {
  if (!isImport(importDeclaration)) {
    throw new Error(`Expected type ImportDeclaration, received type ${importDeclaration.type}`);
  }
  if (isTypeImport(importDeclaration)) {
    return TYPE;
  }
  if (isNamedImport(importDeclaration)) {
    return NAMED;
  }
  return UNNAMED;
};

const compareImportTypes = (first, second, sortOrder) => {
  const firstType = getImportType(first);
  const secondType = getImportType(second);
  if (sortOrder.indexOf(firstType) < sortOrder.indexOf(secondType)) {
    return -1;
  } else if (sortOrder.indexOf(firstType) > sortOrder.indexOf(secondType)) {
    return 1;
  } else {
    return 0;
  }
}

const compareImportPaths = (first, second, ignoreCase) => {
  const firstPath = ignoreCase ? first.source.value.toLowerCase() : first.source.value;
  const secondPath = ignoreCase ? second.source.value.toLowerCase() : second.source.value;
  if (firstPath < secondPath) {
    return -1;
  } else if (firstPath > secondPath) {
    return 1;
  } else {
    return 0;
  }
}

const compareSpecifiers = (first, second, ignoreCase) => {
  const firstName = ignoreCase ? first.local.name.toLowerCase() : first.local.name;
  const secondName = ignoreCase ? second.local.name.toLowerCase() : second.local.name;
  if (firstName < secondName) {
    return -1;
  } else if (firstName > secondName) {
    return 1;
  } else {
    return 0;
  }
}

const isImport = node => node.type === "ImportDeclaration";

module.exports = {
  meta: {
    docs: {
      description: "Sorts ES6/flow imports by path",
      category: "ECMAScript 6",
      recommended: false,
    },
    fixable: "code",
    schema: [
      {
        type: "object",
        properties: {
          importsAtStart: {
            type: "boolean",
          },
          sortOrder: {
            type: "array",
            items: {
              enum: ["type", "named", "unnamed"],
            },
            uniqueItems: true,
            minItems: 3,
            maxItems: 3,
          },
          enforceBlankLine: {
            type: "boolean",
          },
          enforceTrailingLine: {
            type: "boolean",
          },
          ignoreCase: {
            type: "boolean",
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create: (context) => {
    const configuration = context.options[0] || {},
      importsAtStart = configuration.importsAtStart != null ? configuration.importsAtStart : true,
      sortOrder = configuration.sortOrder || ["type", "named", "unnamed"],
      enforceBlankLine = configuration.enforceBlankLine != null ? configuration.enforceBlankLine : false,
      enforceTrailingLine = configuration.enforceTrailingLine != null ? configuration.enforceTrailingLine : false,
      ignoreCase = configuration.ignoreCase != null ? configuration.ignoreCase : true,
      sourceCode = context.getSourceCode();

    const reportIncorrectOrder = imports => {
      const firstImport = imports[0];
      const lastImport = imports[imports.length - 1];
      const allImports = {};
      allImports.type = imports.filter(isTypeImport);
      allImports.named = imports.filter(isNamedImport);
      allImports.unnamed = imports.filter(node => !isTypeImport(node) && !isNamedImport(node));
      const sortedImportsText = sortOrder.map(
        type => allImports[type]
          .sort((first, second) => compareImportPaths(first, second, ignoreCase))
          .map(importDeclaration =>
            sourceCode
              .getText()
              .slice(importDeclaration.start, importDeclaration.end)
            )
          .join("\n")
        )
        .filter(part => part.length > 0)
        .join(enforceBlankLine ? "\n\n" : "\n");
      return context.report({
        node: firstImport,
        message: "Import order is not correct.",
        fix: fixer => {
          return fixer.replaceTextRange([firstImport.start, lastImport.end], sortedImportsText);
        }
      });
    };

    const reportImportAfterNonImport = (node, program) => {
      const startPoint = program.body[0].start;
      const endPoint = program.body[program.body.indexOf(node)].end
      const rangeToReplace = [
        startPoint,
        endPoint,
      ];
      const replacementText = [
        sourceCode.getText().slice(node.start, node.end),
        sourceCode.getText().slice(startPoint, node.start),
      ].join("\n");
      return context.report({
        node: node,
        message: "All imports should go at the top of the file.",
        fix: fixer => {
          return fixer.replaceTextRange(
            rangeToReplace,
            replacementText
          );
        },
      });
    };

    const reportMissingTrailingLine = (node) => {
      return context.report({
        node: node,
        message: "Imports should be followed by a blank line.",
        fix: fixer => {
          return fixer.insertTextAfter(node, "\n");
        },
      });
    };

    const reportIncorrectSpecifierOrder = (node) => {
      const importSpecifiers = node.specifiers.filter(specifier => specifier.type === "ImportSpecifier");
      const startPoint = importSpecifiers[0].start;
      const endPoint = importSpecifiers[importSpecifiers.length - 1].end;
      const rangeToReplace = [
        startPoint,
        endPoint,
      ];
      const replacementText = importSpecifiers.slice()
        .sort((first, second) => compareSpecifiers(first, second, ignoreCase))
        .reduce((acc, specifier, index) => {
          const textAfterSpecifier = index === importSpecifiers.length - 1
            ? ""
            : sourceCode.getText().slice(importSpecifiers[index].end, importSpecifiers[index + 1].start);
          return acc + sourceCode.getText().slice(specifier.start, specifier.end) + textAfterSpecifier;
        }, "");
      return context.report({
        node: node,
        message: "Import specifiers should be sorted alphabetically.",
        fix: fixer => {
          return fixer.replaceTextRange(rangeToReplace, replacementText);
        },
      });
    };

    const collectGroups = (nodes) => {
      const groups = [];
      let currentGroup = [];
      for (let node of nodes) {
        if (isImport(node)) {
          currentGroup.push(node);
        } else if (currentGroup.length > 0) {
          groups.push(currentGroup);
          currentGroup = [];
        }
      }
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }
      return groups;
    }

    return {
      Program: (program) => {
        if (importsAtStart) {
          // All imports should come at the start of the file
          const areImports = program.body.map(isImport);
          const firstNonImportIndex = areImports.indexOf(false);
          const lastImportIndex = areImports.lastIndexOf(true);
          if (firstNonImportIndex !== -1 && lastImportIndex !== -1 && firstNonImportIndex < lastImportIndex) {
            const badImports = program.body
              .slice(firstNonImportIndex + 1)
              .filter(isImport);
            badImports.forEach(node => {
              reportImportAfterNonImport(node, program)
            });
            return;
          }
        }
        const importGroups = collectGroups(program.body);
        for (let imports of importGroups) {
          let previousImport = undefined;
          imports.forEach(importDeclaration => {
            if (previousImport != null) {
              // Imports should be collected by import-type (e.g. type imports, value imports, unnamed imports)
              const comparisonByType = compareImportTypes(previousImport, importDeclaration, sortOrder);
              if (comparisonByType === 1) {
                reportIncorrectOrder(imports);
                return;
              } else if (comparisonByType === 0) {
                // Imports of the same type should be sorted by path
                const comparisonByPath = compareImportPaths(previousImport, importDeclaration, ignoreCase);
                if (comparisonByPath === 1) {
                  reportIncorrectOrder(imports);
                  return;
                }
              } else if (comparisonByType === -1) {
                if (enforceBlankLine && importDeclaration.loc.start.line <= previousImport.loc.start.line + 1) {
                  reportIncorrectOrder(imports);
                  return;
                }
              }
            }
            previousImport = importDeclaration;


            // Non-default import specifiers should be sorted by name
            let previousSpecifier = null;
            importDeclaration.specifiers.filter(specifier => specifier.type === "ImportSpecifier").forEach(specifier => {
              if (previousSpecifier != null) {
                const comparisonBySpecifiers = compareSpecifiers(previousSpecifier, specifier, ignoreCase);
                if (comparisonBySpecifiers === 1) {
                  reportIncorrectSpecifierOrder(importDeclaration);
                  return;
                }
              }
              previousSpecifier = specifier;
            });
          });
          if (enforceTrailingLine) {
            const lastImport = imports[imports.length - 1];
            const lastImportIndex = program.body.indexOf(lastImport);
            if (lastImportIndex < program.body.length - 1) {
              const followingNode = program.body[lastImportIndex + 1];
              if (followingNode.loc.start.line <= lastImport.loc.end.line + 1) {
                reportMissingTrailingLine(lastImport);
              }
            }
          }
        }
      }
    };
  },
};
