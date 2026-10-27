import { expect, test, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import Home from "@/app/page";

afterEach(cleanup);

test("renders hero with heading, subtitle and booking links", () => {
  render(<Home />);

  expect(
    screen.getByRole("heading", { level: 1, name: "Календарь звонков" }),
  ).toBeInTheDocument();
  expect(
    screen.getByText("Сервис для бронирования времени звонков"),
  ).toBeInTheDocument();

  const bookLinks = screen.getAllByRole("link", { name: "Записаться" });
  expect(bookLinks).toHaveLength(2);
  for (const link of bookLinks) {
    expect(link).toHaveAttribute("href", "/book");
  }
});

test("renders header link to upcoming events", () => {
  render(<Home />);

  expect(
    screen.getByRole("link", { name: "Предстоящие события" }),
  ).toHaveAttribute("href", "/events");
});

test("renders the three feature cards", () => {
  render(<Home />);

  const featureTexts = [
    "Выбирайте время из свободных слотов",
    "Мгновенное бронирование без переписок",
    "Все ваши записи — в одном списке",
  ];

  for (const text of featureTexts) {
    expect(screen.getByText(text)).toBeInTheDocument();
  }
});
