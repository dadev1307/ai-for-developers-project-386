import { afterEach, expect, test, vi } from "vitest";
import * as React from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";

import { Input } from "@/components/ui/input";

afterEach(() => {
  vi.restoreAllMocks();
});

test("input hydrates from its own server HTML without recoverable errors", () => {
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  const serverHtml = renderToString(
    <Input id="name" placeholder="Иван Иванов" />,
  );
  const container = document.createElement("div");
  container.innerHTML = serverHtml;
  document.body.appendChild(container);
  try {
    hydrateRoot(container, <Input id="name" placeholder="Иван Иванов" />);
  } finally {
    document.body.removeChild(container);
  }

  const hydrationErrors = errorSpy.mock.calls
    .map((call) => String(call[0]))
    .filter((message) =>
      /hydrat|mismatch|didn't match|server rendered/i.test(message),
    );

  expect(hydrationErrors).toEqual([]);
});
