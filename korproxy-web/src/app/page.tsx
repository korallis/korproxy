import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  Hero,
  HowItWorks,
  QuickStart,
  SupportedTools,
  ModelsPreview,
  Features,
  Pricing,
  FAQ,
} from "@/components/home";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <Hero />
      <div id="how-it-works">
        <HowItWorks />
      </div>
      <QuickStart />
      <SupportedTools />
      <Features />
      <ModelsPreview />
      <Pricing />
      <FAQ />
      <Footer />
    </div>
  );
}
