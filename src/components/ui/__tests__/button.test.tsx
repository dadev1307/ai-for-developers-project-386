import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";

import { Button } from "@/components/ui/button";

test("renders a button with accessible name", () => {
  render(<Button>Записаться на звонок</Button>);

  expect(
    screen.getByRole("button", { name: "Записаться на звонок" }),
  ).toBeInTheDocument();
});

test("renders a disabled button", () => {
  render(<Button disabled>Забронировать</Button>);

  expect(screen.getByRole("button", { name: "Забронировать" })).toBeDisabled();
});
