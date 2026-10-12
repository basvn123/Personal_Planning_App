import type { Metadata } from "next";
import { Spread } from "@/components/shell/spread";
import { Importer } from "@/components/import/importer";
import { ImportHistory } from "@/components/import/import-history";
import { InfoButton } from "@/components/help/info-button";
import { listImports } from "@/server/actions/imports";
import { getSections, getSettings } from "@/server/queries/core";
import { localDate } from "@/lib/time";

export const metadata: Metadata = { title: "Importeren" };

export default async function ImportPage() {
  const [sections, settings, history] = await Promise.all([getSections(), getSettings(), listImports()]);
  const today = localDate(new Date(), settings.timezone);
  return (
    <Spread
      leftLabel="Importeren"
      rightLabel="Eerder"
      left={
        <div className="px-5 pb-12 pt-6 lg:px-8">
          <h1 className="mb-6 flex items-center gap-1.5 text-xl font-semibold tracking-[-0.02em]">
            Schema importeren
            <InfoButton topic="import" />
          </h1>
          <Importer sections={sections.map(({ id, name }) => ({ id, name }))} today={today} />
        </div>
      }
      right={
        <div className="px-5 pb-12 pt-6 lg:px-10">
          <h2 className="border-b border-rule-strong pb-1.5 text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">Eerdere imports</h2>
          <ImportHistory items={history} />
        </div>
      }
    />
  );
}
