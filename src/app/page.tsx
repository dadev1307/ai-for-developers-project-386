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

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight">
          Календарь звонков
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Сервис для бронирования времени звонков
        </p>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Бронирование звонка</CardTitle>
          <CardDescription>
            Оставьте имя — мы подберём удобное время
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Ваше имя</Label>
            <Input id="name" placeholder="Иван Иванов" />
          </div>
          <Button>Записаться на звонок</Button>
        </CardContent>
      </Card>
    </main>
  );
}
