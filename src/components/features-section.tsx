import type { LucideIcon } from "lucide-react";
import { CalendarClock, ListChecks, Zap } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type Feature = {
  icon: LucideIcon;
  text: string;
};

const features: Feature[] = [
  { icon: CalendarClock, text: "Выбирайте время из свободных слотов" },
  { icon: Zap, text: "Мгновенное бронирование без переписок" },
  { icon: ListChecks, text: "Все ваши записи — в одном списке" },
];

export function FeaturesSection() {
  return (
    <section
      aria-label="Возможности"
      className="grid w-full max-w-4xl gap-4 sm:grid-cols-3"
    >
      {features.map(({ icon: Icon, text }) => (
        <Card key={text} size="sm">
          <CardContent className="flex flex-col items-center gap-3 text-center">
            <span className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <Icon className="size-5 text-muted-foreground" />
            </span>
            <p className="text-sm font-medium">{text}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
