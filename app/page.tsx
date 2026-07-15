import { CtaSection } from "@/components/cta/cta-section";
import { HeroSection } from "@/components/hero/hero-section";
import { LogisticsSection } from "@/components/logistics/logistics-section";
import { SiteNav } from "@/components/nav/site-nav";
import { NetworkSection } from "@/components/network/network-section";
import { Scene3D } from "@/components/scene/scene-3d";
import { VisionSection } from "@/components/vision/vision-section";

export default function Home() {
  return (
    <>
      <Scene3D />
      <SiteNav />
      <main className="relative z-10">
        <HeroSection />
        <VisionSection />
        <LogisticsSection />
        <NetworkSection />
        <CtaSection />
      </main>
    </>
  );
}
