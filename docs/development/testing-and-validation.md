# Testing and Validation

Tital uses `vitest` for unit testing and the TypeScript compiler for static type checking.

## Running Tests

To run the full suite of unit tests, use the following command:

```bash
npm test
```

This will execute all files in the `tests/` directory that end with `.test.ts`.

## Test Structure

The tests are organized by the service or domain model that they are testing. For example, the tests for the `defineFilm` service are in `tests/defineFilm.test.ts`.

The tests primarily focus on the deterministic logic in the services. They use mocking to isolate the services from the AI agents and other external dependencies.

## Static Type Checking

To perform a static type check of the entire codebase, use the following command:

```bash
npm run typecheck
```

This will run the TypeScript compiler with the `--noEmit` flag, which checks for type errors without generating any JavaScript files.

The project is configured with `strict` mode enabled in `tsconfig.json`, so the type checking is very thorough.
