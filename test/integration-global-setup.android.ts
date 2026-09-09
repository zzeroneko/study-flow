import { createSetup } from "obsidian-integration-testing/vitest-global-setup";
import { createAndroidPopulate } from "./fixtures/vaultPopulate";

const { setup, teardown } = createSetup({
  populate: () => createAndroidPopulate(),
});

export { setup, teardown };
