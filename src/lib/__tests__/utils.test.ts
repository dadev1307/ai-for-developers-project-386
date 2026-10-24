import { expect, test } from "vitest";

import { cn } from "@/lib/utils";

test("cn combines class names", () => {
  expect(cn("px-2", "py-1")).toBe("px-2 py-1");
});

test("cn resolves conflicting tailwind classes keeping the last one", () => {
  expect(cn("px-2", "px-4")).toBe("px-4");
});

test("cn skips falsy values", () => {
  expect(cn("px-2", false && "py-1", undefined)).toBe("px-2");
});
