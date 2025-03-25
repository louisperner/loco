# Linting in Loco Project

This project uses ESLint for code quality and consistency. The linter has been configured to work with React, TypeScript, and React Three Fiber.

## Running the Linter

To run the linter, use the following command:

```bash
npm run lint
```

This will check all TypeScript and TSX files in the `src` directory.

## ESLint Configuration

The ESLint configuration is located in `.eslintrc.js` in the root of the project. It includes special handling for:

- React Three Fiber properties (position, rotation, args, etc.)
- TypeScript-specific rules
- React Hooks rules

## Common Warnings

The project has several common warnings that you might see:

1. **Unused Variables**: Prefix unused variables with an underscore (e.g., `_unusedVar`) to suppress these warnings.
2. **Any Types**: The project has many `any` types that could be replaced with more specific types.
3. **Console Statements**: Consider removing `console.log` statements in production code.
4. **React Hooks Dependencies**: Make sure to include all dependencies in the dependency array of hooks.

## Adding New Rules

If you want to add or modify linting rules, you can edit the `.eslintrc.js` file. The configuration follows the standard ESLint format.

## For Three.js Properties

The project already includes special handling for Three.js/R3F properties. If you encounter errors about unknown props when using Three.js, you might need to add them to the `react/no-unknown-property` rule in the `.eslintrc.js` file. 