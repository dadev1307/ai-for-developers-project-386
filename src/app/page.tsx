import { FeaturesSection } from "@/components/features-section";
import { HeroSection } from "@/components/hero-section";
import { SiteHeader } from "@/components/site-header";

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-8 sm:gap-14">
        <HeroSection />
        <FeaturesSection />
      </main>
    </div>
  );
}
