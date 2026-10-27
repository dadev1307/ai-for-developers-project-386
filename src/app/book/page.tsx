import { connection } from "next/server";

import { BookingCard } from "@/components/booking/booking-card";
import { SiteHeader } from "@/components/site-header";
import { generateSlots } from "@/lib/slots";

// Слоты зависят от текущей даты: маршрут рендерится на момент запроса,
// а не пререндерится при сборке.
export const instant = false;

export default async function BookPage() {
  await connection();

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Бронирование звонка
        </h1>
        <BookingCard days={generateSlots(new Date(), 3)} />
      </main>
    </div>
  );
}
