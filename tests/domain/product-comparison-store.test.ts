import assert from "node:assert/strict";
import { test } from "@playwright/test";
import { productComparisonStore } from "@/services/product-comparison-store";

test("shared comparison store hydrates canonical IDs, applies atomic limits, and stays usable when storage fails", () => {
  const originalWindow = globalThis.window;
  let persisted: string | null = JSON.stringify([
    "prod-wireless-earbuds-pro",
    "prod-cotton-panjabi",
    "prod-wireless-earbuds-pro",
    "not-canonical",
  ]);
  const storage = {
    getItem: () => persisted,
    setItem: (_key: string, value: string) => { persisted = value; },
  };
  Object.defineProperty(globalThis, "window", { configurable: true, value: { sessionStorage: storage } });

  try {
    productComparisonStore.setState({ ids: [], hydrated: false, storageReady: false });
    productComparisonStore.getState().hydrate();
    assert.deepEqual(productComparisonStore.getState().ids, ["prod-wireless-earbuds-pro", "prod-cotton-panjabi"]);
    assert.equal(persisted, '["prod-wireless-earbuds-pro","prod-cotton-panjabi"]');

    assert.deepEqual(productComparisonStore.getState().add("prod-smart-watch-series-5"), {
      added: true,
      count: 3,
    });
    assert.deepEqual(productComparisonStore.getState().add("prod-bluetooth-speaker"), {
      added: false,
      reason: "limit",
      count: 3,
    });
    assert.deepEqual(productComparisonStore.getState().ids, [
      "prod-wireless-earbuds-pro",
      "prod-cotton-panjabi",
      "prod-smart-watch-series-5",
    ]);

    productComparisonStore.getState().remove("prod-cotton-panjabi");
    assert.deepEqual(productComparisonStore.getState().add("prod-bluetooth-speaker"), {
      added: true,
      count: 3,
    });
    assert.deepEqual(productComparisonStore.getState().ids, [
      "prod-wireless-earbuds-pro",
      "prod-smart-watch-series-5",
      "prod-bluetooth-speaker",
    ]);

    persisted = '["prod-cotton-panjabi"]';
    productComparisonStore.setState({
      ids: ["prod-bluetooth-speaker"],
      hydrated: false,
      storageReady: false,
    });
    productComparisonStore.getState().hydrate();
    assert.deepEqual(productComparisonStore.getState().ids, ["prod-bluetooth-speaker"]);
    assert.equal(persisted, '["prod-bluetooth-speaker"]');

    persisted = '["prod-cotton-panjabi"]';
    productComparisonStore.getState().hydrate();
    assert.deepEqual(productComparisonStore.getState().ids, ["prod-bluetooth-speaker"]);
    assert.equal(persisted, '["prod-cotton-panjabi"]');

    assert.deepEqual(productComparisonStore.getState().add("prod-wireless-earbuds-pro"), {
      added: true,
      count: 2,
    });
    assert.deepEqual(productComparisonStore.getState().add("prod-cotton-panjabi"), {
      added: true,
      count: 3,
    });
    assert.deepEqual(productComparisonStore.getState().ids, [
      "prod-bluetooth-speaker",
      "prod-wireless-earbuds-pro",
      "prod-cotton-panjabi",
    ]);
    assert.equal(persisted, '["prod-bluetooth-speaker","prod-wireless-earbuds-pro","prod-cotton-panjabi"]');

    persisted = '["prod-cotton-panjabi"]';
    let writesAfterReadFailure = 0;
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        sessionStorage: {
          getItem: () => { throw new Error("Storage unavailable"); },
          setItem: (_key: string, value: string) => { writesAfterReadFailure += 1; persisted = value; },
        },
      },
    });
    productComparisonStore.setState({ ids: [], hydrated: false, storageReady: false });
    assert.deepEqual(productComparisonStore.getState().add("prod-wireless-earbuds-pro"), {
      added: true,
      count: 1,
    });
    assert.deepEqual(productComparisonStore.getState().ids, ["prod-wireless-earbuds-pro"]);
    assert.equal(writesAfterReadFailure, 0);
    assert.equal(persisted, '["prod-cotton-panjabi"]');
  } finally {
    productComparisonStore.setState({ ids: [], hydrated: false, storageReady: false });
    if (originalWindow === undefined) Reflect.deleteProperty(globalThis, "window");
    else Object.defineProperty(globalThis, "window", { configurable: true, value: originalWindow });
  }
});
