import Link from "next/link";
import { Phone } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-6">
      <Link
        href="/"
        className="flex items-center gap-2 font-semibold tracking-tight"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Phone className="size-4" />
        </span>
        Calendar
      </Link>
      <nav className="flex items-center gap-6 text-sm text-muted-foreground">
        <Link
          href="/book"
          className="transition-colors hover:text-foreground"
        >
          Записаться
        </Link>
        <Link
          href="/events"
          className="transition-colors hover:text-foreground"
        >
          Предстоящие события
        </Link>
      </nav>
    </header>
  );
}
