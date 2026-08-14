import { Check } from "lucide-react";

import type { Service } from "@/backend/data/services";
import { serviceIcons } from "@/frontend/lib/icons";

export function ServiceCard({
  service,
  detailed = false,
}: {
  service: Service;
  /** En la página de servicios se muestran también los sub-servicios */
  detailed?: boolean;
}) {
  const Icon = serviceIcons[service.icon];

  return (
    <article
      id={service.slug}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-carbon-200 bg-white p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/60 hover:shadow-lift"
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-brand-500 transition-transform duration-300 group-hover:scale-x-100"
      />

      <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-carbon-900 text-brand-500 transition-colors duration-300 group-hover:bg-brand-500 group-hover:text-carbon-950">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </span>

      <h3 className="font-display mt-6 text-xl font-bold text-carbon-900">
        {service.title}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-carbon-600">
        {service.summary}
      </p>

      {detailed && (
        <ul className="mt-6 space-y-2.5 border-t border-carbon-100 pt-5">
          {service.bullets.map((bullet) => (
            <li
              key={bullet}
              className="flex items-start gap-2.5 text-sm text-carbon-700"
            >
              <Check
                className="mt-0.5 h-4 w-4 shrink-0 text-brand-600"
                aria-hidden="true"
              />
              {bullet}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
