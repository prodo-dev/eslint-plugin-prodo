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
      importsAtStart = configuration.importsAtStart || true,
      sortOrder = configuration.sortOrder || ["type", "named", "unnamed"],
      enforceBlankLine = configuration.enforceBlankLine || false,
      enforceTrailingLine = configuration.enforceTrailingLine || false,
      ignoreCase = configuration.ignoreCase || true,
      sourceCode = context.getSourceCode();

    const reportIncorrectOrder = imports => {
      const firstImport = imports[0];
      const lastImport = imports[imports.length - 1];
      const otherImports = imports.slice(1);
      const allImports = {};
      allImports.type = imports.filter(isTypeImport);
      allImports.named = imports.filter(isNamedImport);
      allImports.unnamed = imports.filter(node => !isTypeImport(node) && !isNamedImport(node));
      const sortedImportsText = sortOrder.map(
        type => allImports[type]
          .sort(compareImportPaths)
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
      const endPoint = program.body[program.body.indexOf(node) + 1].start
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
    }

    const reportMissingTrailingLine = (node) => {
      return context.report({
        node: node,
        message: "Imports should be followed by a blank line.",
        fix: fixer => {
          return fixer.insertTextAfter(node, "\n");
        },
      })
    }

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
          const firstToken = program.body[0];
          const areImports = program.body.map(node => isImport(node));
          const firstNonImportIndex = areImports.indexOf(false);
          const lastImportIndex = areImports.lastIndexOf(true);
          if (firstNonImportIndex < lastImportIndex) {
            const badImports = program.body
              .slice(firstNonImportIndex + 1)
              .filter(node => isImport(node));
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
              const comparisonByType = compareImportTypes(previousImport, importDeclaration, sortOrder);
              if (comparisonByType === 1) {
                reportIncorrectOrder(imports);
                return;
              } else if (comparisonByType === 0) {
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

            if (enforceTrailingLine) {
              const lastImport = imports[imports.length - 1];
              const followingNode = program.body[program.body.indexOf(lastImport) + 1];
              if (followingNode.loc.start.line <= lastImport.loc.end.line + 1) {
                reportMissingTrailingLine(lastImport);
              }
            }
          });
        }
      }
    };
  },
};
