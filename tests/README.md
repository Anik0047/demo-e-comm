# Catalog regression tests

Run the catalog service regression suite with:

```sh
pnpm test:catalog
```

This command uses the installed Playwright test runner without launching a browser. It exercises the service output and query transitions in `tests/domain/catalog.test.ts`. Browser coverage for catalog filters is part of the normal two-project suite:

```sh
pnpm test:e2e
```
