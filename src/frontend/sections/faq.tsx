import { Plus } from "lucide-react";

import { faqs } from "@/backend/data/company";
import { Container, SectionHeading } from "@/frontend/components/ui";
import { Reveal } from "@/frontend/components/reveal";

export function Faq() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="Preguntas frecuentes"
            title="Lo que más nos consultan"
            align="center"
          />
        </Reveal>

        <div className="mx-auto mt-14 max-w-3xl divide-y divide-carbon-200 border-y border-carbon-200">
          {faqs.map((faq, index) => (
            <Reveal key={faq.question} delay={index * 60}>
              <details className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-left">
                  <h3 className="font-display text-base font-bold text-carbon-900 sm:text-lg">
                    {faq.question}
                  </h3>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-carbon-200 text-carbon-700 transition-all group-open:rotate-45 group-open:border-brand-500 group-open:bg-brand-500 group-open:text-carbon-950">
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl pr-14 text-sm leading-relaxed text-carbon-600 sm:text-base">
                  {faq.answer}
                </p>
              </details>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
