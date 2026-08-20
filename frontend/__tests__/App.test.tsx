/**
 * @format
 */

import React from "react";
import ReactTestRenderer from "react-test-renderer";

const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  disconnect: jest.fn(),
};

jest.mock("socket.io-client", () => ({
  io: jest.fn(() => mockSocket),
}));

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
