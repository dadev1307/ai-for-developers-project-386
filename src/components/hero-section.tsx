import Link from "next/link";

import { cn } from "cn";

import { buttonVariants } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 flex flex-col items-center gap-4 text-center duration-700">
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        Календарь звонков
      </h1>
      <p className="max-w-md text-lg text-muted-foreground">
        Сервис для бронирования времени звонков
      </p>
      <Link
        href="/book"
        className={cn(
          buttonVariants({ size: "lg" }),
          "mt-2 h-11 px-6 text-base",
        )}
      >
        Записаться
      </Link>
    </section>
  );
}
