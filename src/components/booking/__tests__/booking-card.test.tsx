import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { BookingCard } from "@/components/booking/booking-card";
import { generateSlots } from "@/lib/slots";

const days = generateSlots(new Date(2026, 9, 27), 2);

test("renders available days and slot times", () => {
  render(<BookingCard days={days} />);

  expect(screen.getByText("ср, 28 октября")).toBeInTheDocument();
  expect(screen.getByText("чт, 29 октября")).toBeInTheDocument();
  expect(screen.getAllByRole("radio", { name: "10:00" })).toHaveLength(2);
  expect(screen.getAllByRole("radio", { name: "18:00" })).toHaveLength(2);
});

test("shows errors when submitting without name and slot", async () => {
  const user = userEvent.setup();
  render(<BookingCard days={days} />);

  await user.click(screen.getByRole("button", { name: "Забронировать звонок" }));

  expect(screen.getByText("Укажите имя")).toBeInTheDocument();
  expect(screen.getByText("Выберите время звонка")).toBeInTheDocument();
});

test("confirms the event with guest name and chosen slot", async () => {
  const user = userEvent.setup();
  render(<BookingCard days={days} />);

  await user.type(screen.getByLabelText("Ваше имя"), "Иван Иванов");
  await user.click(screen.getAllByRole("radio", { name: "14:00" })[0]);
  await user.click(screen.getByRole("button", { name: "Забронировать звонок" }));

  expect(screen.getByText("Звонок забронирован")).toBeInTheDocument();
  expect(screen.getByText("Иван Иванов")).toBeInTheDocument();
  expect(screen.getByText("ср, 28 октября, 14:00")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Забронировать звонок" }),
  ).not.toBeInTheDocument();
});

test("reset from confirmation returns empty form", async () => {
  const user = userEvent.setup();
  render(<BookingCard days={days} />);

  await user.type(screen.getByLabelText("Ваше имя"), "Иван Иванов");
  await user.click(screen.getAllByRole("radio", { name: "14:00" })[0]);
  await user.click(screen.getByRole("button", { name: "Забронировать звонок" }));
  await user.click(screen.getByRole("button", { name: "Забронировать ещё" }));

  const nameInput = screen.getByLabelText("Ваше имя");
  expect(nameInput).toHaveValue("");
  expect(screen.getAllByRole("radio", { name: "14:00" })[0]).not.toBeChecked();
  expect(
    screen.getByRole("button", { name: "Забронировать звонок" }),
  ).toBeInTheDocument();
});
