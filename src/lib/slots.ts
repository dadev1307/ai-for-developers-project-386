export interface Slot {
  id: string;
  date: Date;
}

export interface SlotDay {
  date: Date;
  slots: Slot[];
}

const SLOT_TIMES: Array<[number, number]> = [
  [10, 0],
  [14, 0],
  [18, 0],
];

const pad = (value: number) => String(value).padStart(2, "0");

const WEEKDAYS = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"] as const;

const MONTHS_GENITIVE = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
] as const;

export function formatSlotDay(date: Date) {
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS_GENITIVE[date.getMonth()]}`;
}

export function formatSlotTime(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatSlot(date: Date) {
  return `${formatSlotDay(date)}, ${formatSlotTime(date)}`;
}

export function findSlot(days: SlotDay[], slotId: string): Slot | undefined {
  return days.flatMap((day) => day.slots).find((slot) => slot.id === slotId);
}

const toSlotId = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

export function generateSlots(from: Date, dayCount: number): SlotDay[] {
  return Array.from({ length: dayCount }, (_, dayIndex) => {
    const date = new Date(from.getFullYear(), from.getMonth(), from.getDate() + dayIndex + 1);

    return {
      date,
      slots: SLOT_TIMES.map(([hours, minutes]) => {
        const slotDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);

        return { id: toSlotId(slotDate), date: slotDate };
      }),
    };
  });
}
