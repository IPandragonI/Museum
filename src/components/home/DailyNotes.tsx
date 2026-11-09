"use client";

import { useI18n } from "@/lib/i18n/useI18n";

export function DailyNotes() {
  const { t } = useI18n();
  return (
    <section className="grid gap-8 py-12 text-[0.95rem] text-muted sm:grid-cols-3">
      {([1, 2, 3] as const).map((n) => (
        <div key={n}>
          <h2 className="eyebrow mb-2">{t(`daily.note${n}.title`)}</h2>
          <p>{t(`daily.note${n}.body`)}</p>
        </div>
      ))}
    </section>
  );
}
