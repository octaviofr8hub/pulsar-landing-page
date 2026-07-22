import { Toaster } from "sonner";

import { CTA } from "@/components/pulsar/cta";
import { Fleet } from "@/components/pulsar/fleet";
import { Footer } from "@/components/pulsar/footer";
import { Future } from "@/components/pulsar/future";
import { Hero } from "@/components/pulsar/hero";
import { Journey } from "@/components/pulsar/journey";
import { Navbar } from "@/components/pulsar/navbar";
import { Network } from "@/components/pulsar/network";
import { Platform } from "@/components/pulsar/platform";
import { Problem } from "@/components/pulsar/problem";
import { Race } from "@/components/pulsar/race";

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-space-950 text-foreground">
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <Race />
        <Journey />
        <Network />
        <Fleet />
        <Future />
        <Platform />
        <CTA />
      </main>
      <Footer />
      <Toaster theme="dark" position="top-right" />
    </div>
  );
}
