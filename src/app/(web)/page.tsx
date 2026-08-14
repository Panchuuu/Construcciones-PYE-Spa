import { Hero } from "@/frontend/sections/hero";
import { ServicesPreview } from "@/frontend/sections/services-preview";
import { WhyUs } from "@/frontend/sections/why-us";
import { FeaturedProjects } from "@/frontend/sections/featured-projects";
import { Process } from "@/frontend/sections/process";
import { Faq } from "@/frontend/sections/faq";
import { CtaBand } from "@/frontend/sections/cta-band";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ServicesPreview />
      <WhyUs />
      <FeaturedProjects />
      <Process />
      <Faq />
      <CtaBand />
    </>
  );
}
