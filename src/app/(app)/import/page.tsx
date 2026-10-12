import type { Metadata } from "next";
import { Spread } from "@/components/shell/spread";
import { Importer } from "@/components/import/importer";
import { ImportHistory } from "@/components/import/import-history";
import { FileUp, History } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { pageBody } from "@/components/ui/page-body";
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
        <div className={pageBody}>
          <PageHeader
            title="Schema importeren"
            info="import"
            subtitle="Een trainings- of studieschema uit een CSV- of JSON-bestand in één keer in je planning."
            className="pt-2"
          />
          <Card icon={FileUp} title="Bestand" bodyClassName="pt-1">
            <Importer sections={sections.map(({ id, name }) => ({ id, name }))} today={today} />
          </Card>
        </div>
      }
      right={
        <div className={pageBody}>
          <Card icon={History} title="Eerdere imports" count={history.length}>
            <ImportHistory items={history} />
          </Card>
        </div>
      }
    />
  );
}
