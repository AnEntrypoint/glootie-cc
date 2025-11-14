export const QUERIES = {
  javascript: {
    functions: `
      (function_declaration name: (identifier) @name) @def
      (function name: (identifier) @name) @def
      (method_definition name: (property_identifier) @name) @def
      (arrow_function) @def
    `,
    classes: `
      (class_declaration name: (identifier) @name) @def
    `,
    imports: `
      (import_statement) @import
    `,
    exports: `
      (export_statement) @export
    `,
    complexity: `
      (if_statement) @branch
      (while_statement) @loop
      (for_statement) @loop
      (switch_statement) @branch
      (catch_clause) @error
      (conditional_expression) @branch
    `
  },
  python: {
    functions: `
      (function_definition name: (identifier) @name) @def
    `,
    classes: `
      (class_definition name: (identifier) @name) @def
    `,
    imports: `
      (import_statement) @import
      (import_from_statement) @import
    `,
    complexity: `
      (if_statement) @branch
      (while_statement) @loop
      (for_statement) @loop
      (try_statement) @error
    `
  },
  rust: {
    functions: `
      (function_item name: (identifier) @name) @def
    `,
    classes: `
      (struct_item name: (type_identifier) @name) @def
      (enum_item name: (type_identifier) @name) @def
      (impl_item type: (type_identifier) @name) @def
    `,
    imports: `
      (use_declaration) @import
    `,
    complexity: `
      (if_expression) @branch
      (while_expression) @loop
      (loop_expression) @loop
      (for_expression) @loop
      (match_expression) @branch
    `
  },
  go: {
    functions: `
      (function_declaration name: (identifier) @name) @def
      (method_declaration name: (field_identifier) @name) @def
    `,
    classes: `
      (type_declaration (type_spec name: (type_identifier) @name)) @def
    `,
    imports: `
      (import_declaration) @import
    `,
    complexity: `
      (if_statement) @branch
      (for_statement) @loop
      (switch_statement) @branch
      (select_statement) @branch
    `
  },
  java: {
    functions: `
      (method_declaration name: (identifier) @name) @def
    `,
    classes: `
      (class_declaration name: (identifier) @name) @def
      (interface_declaration name: (identifier) @name) @def
    `,
    imports: `
      (import_declaration) @import
    `,
    complexity: `
      (if_statement) @branch
      (while_statement) @loop
      (for_statement) @loop
      (switch_expression) @branch
      (catch_clause) @error
    `
  }
};