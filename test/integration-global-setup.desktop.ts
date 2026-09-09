import { createSetup } from "obsidian-integration-testing/vitest-global-setup";
import { createDesktopPopulate } from "./fixtures/vaultPopulate";

const { setup, teardown } = createSetup({
  populate: () => createDesktopPopulate(),
});

export { setup, teardown };
