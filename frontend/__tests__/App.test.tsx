/**
 * @format
 */

import React from "react";
import ReactTestRenderer from "react-test-renderer";
import App from "../App";

beforeEach(() => {
  jest.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: true,
    json: async () => ({ leads: [] }),
  } as Response);
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("renders correctly", async () => {
  await ReactTestRenderer.act(async () => {
    ReactTestRenderer.create(<App />);
    await Promise.resolve();
  });
});
