import { expect, test } from "vitest";

import { generateSlots } from "@/lib/slots";

test("generateSlots returns given number of days starting the day after from", () => {
  const days = generateSlots(new Date(2026, 9, 27), 3);

  expect(days).toHaveLength(3);
  expect(days.map((day) => day.date.getDate())).toEqual([28, 29, 30]);
});

test("each day has slots at fixed times with stable ids", () => {
  const [firstDay] = generateSlots(new Date(2026, 9, 27), 1);

  expect(firstDay.slots.map((slot) => [slot.date.getHours(), slot.date.getMinutes()])).toEqual([
    [10, 0],
    [14, 0],
    [18, 0],
  ]);
  expect(firstDay.slots.map((slot) => slot.id)).toEqual([
    "2026-10-28T10:00",
    "2026-10-28T14:00",
    "2026-10-28T18:00",
  ]);
});
