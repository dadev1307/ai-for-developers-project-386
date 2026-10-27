"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  findSlot,
  formatSlot,
  formatSlotDay,
  formatSlotTime,
  type Slot,
  type SlotDay,
} from "@/lib/slots";

interface BookingCardProps {
  days: SlotDay[];
}

interface BookedEvent {
  guestName: string;
  slot: Slot;
}

function BookingForm({ days, onBooked }: { days: SlotDay[]; onBooked: (event: BookedEvent) => void }) {
  const [guestName, setGuestName] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [errors, setErrors] = useState<{ name?: string; slot?: string }>({});

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: { name?: string; slot?: string } = {};
    if (guestName.trim().length === 0) {
      nextErrors.name = "Укажите имя";
    }
    if (selectedSlotId.length === 0) {
      nextErrors.slot = "Выберите время звонка";
    }
    setErrors(nextErrors);
    if (nextErrors.name !== undefined || nextErrors.slot !== undefined) {
      return;
    }

    const slot = findSlot(days, selectedSlotId);
    if (slot !== undefined) {
      onBooked({ guestName: guestName.trim(), slot });
    }
  };

  return (
    <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
      <div className="grid gap-2">
        <Label htmlFor="name">Ваше имя</Label>
        <Input
          id="name"
          placeholder="Иван Иванов"
          value={guestName}
          onChange={(event) => setGuestName(event.target.value)}
          aria-invalid={errors.name !== undefined}
        />
        {errors.name !== undefined && (
          <p role="alert" className="text-sm text-destructive">
            {errors.name}
          </p>
        )}
      </div>
      {days.map((day) => (
        <fieldset key={day.date.toISOString()} className="grid gap-2">
          <legend className="text-sm font-medium">
            {formatSlotDay(day.date)}
          </legend>
          <div className="flex flex-wrap gap-2">
            {day.slots.map((slot) => (
              <label
                key={slot.id}
                className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm has-[:checked]:border-primary"
              >
                <input
                  type="radio"
                  name="slot"
                  value={slot.id}
                  checked={selectedSlotId === slot.id}
                  onChange={() => setSelectedSlotId(slot.id)}
                />
                {formatSlotTime(slot.date)}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      {errors.slot !== undefined && (
        <p role="alert" className="text-sm text-destructive">
          {errors.slot}
        </p>
      )}
      <Button type="submit">Забронировать звонок</Button>
    </form>
  );
}

function BookingConfirmation({ booked, onReset }: { booked: BookedEvent; onReset: () => void }) {
  return (
    <div className="grid gap-4">
      <p className="text-2xl font-semibold tracking-tight">Звонок забронирован</p>
      <div className="grid gap-1">
        <p className="font-medium">{booked.guestName}</p>
        <p className="text-muted-foreground">{formatSlot(booked.slot.date)}</p>
      </div>
      <Button variant="outline" onClick={onReset}>
        Забронировать ещё
      </Button>
    </div>
  );
}

export function BookingCard({ days }: BookingCardProps) {
  const [booked, setBooked] = useState<BookedEvent | null>(null);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Бронирование звонка</CardTitle>
        <CardDescription>
          Выберите удобное время — мы подтвердим событие
        </CardDescription>
      </CardHeader>
      <CardContent>
        {booked === null ? (
          <BookingForm days={days} onBooked={setBooked} />
        ) : (
          <BookingConfirmation booked={booked} onReset={() => setBooked(null)} />
        )}
      </CardContent>
    </Card>
  );
}
