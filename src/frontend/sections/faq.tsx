import { MessageCircle, Plus } from "lucide-react";

import { faqs } from "@/backend/data/company";
import { site, whatsappUrl } from "@/backend/config/site";
import { Container, SectionHeading } from "@/frontend/components/ui";
import { Reveal } from "@/frontend/components/reveal";

export function Faq() {
  return (
    <section className="bg-carbon-50 py-20 sm:py-28">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-20">
          <Reveal>
            <div className="lg:sticky lg:top-32">
              <SectionHeading
                eyebrow="Preguntas frecuentes"
                title="Lo que más nos consultan"
                description="Si tu duda no está aquí, escríbenos y te respondemos directo."
              />
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-brand-700 transition-colors hover:text-brand-600"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                WhatsApp {site.contact.phoneDisplay}
              </a>
            </div>
          </Reveal>

          <div className="divide-y divide-carbon-200 border-y border-carbon-200">
            {faqs.map((faq, index) => (
              <Reveal key={faq.question} delay={index * 60}>
                <details className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500">
                    <h3 className="font-display text-base font-bold text-carbon-900 sm:text-lg">
                      {faq.question}
                    </h3>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-carbon-200 text-carbon-700 transition-all group-open:rotate-45 group-open:border-brand-500 group-open:bg-brand-500 group-open:text-carbon-950">
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </summary>
                  <p className="faq-answer mt-3 max-w-2xl pr-14 text-sm leading-relaxed text-carbon-600 sm:text-base">
                    {faq.answer}
                  </p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
