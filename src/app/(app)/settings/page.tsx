import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Spread } from "@/components/shell/spread";
import { SettingsAside, SettingsForm } from "@/components/settings/settings-form";
import { AccountForm, PeopleManager } from "@/components/settings/account-forms";
import { User, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { pageBody } from "@/components/ui/page-body";
import { cx } from "@/lib/cx";
import { getSettings } from "@/server/queries/core";
import { currentUser } from "@/server/auth";
import { listPeople } from "@/server/actions/settings";
import { localDate, weekDays } from "@/lib/time";

export const metadata: Metadata = { title: "Instellingen" };

export default async function SettingsPage() {
  const [s, h, me] = await Promise.all([getSettings(), headers(), currentUser()]);
  if (!me) redirect("/unlock");
  const people = me.role === "owner" ? await listPeople() : [];
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = host ? `${proto}://${host}` : "";
  const days = weekDays(localDate(new Date(), s.timezone), s.weekStart === 0 ? 0 : 1);
  return (
    <Spread
      leftLabel="Account"
      rightLabel="Overige"
      initial={!me.email || !me.hasPassword ? "left" : undefined}
      left={
        <div className={pageBody}>
          <PageHeader title="Instellingen" info="settings" className="pt-2" />
          <Card icon={User} title="Account" bodyClassName="flex flex-col gap-4 pt-1">
            <AccountForm name={me.name} email={me.email} hasPassword={me.hasPassword} />
          </Card>
          <SettingsForm origin={origin} timezone={s.timezone} weekStart={s.weekStart} icsToken={s.icsToken} weekFrom={days[0]} weekTo={days[6]} />
        </div>
      }
      right={
        <div className={cx(pageBody, "lg:pt-[4.75rem]")}>
          {me.role === "owner" && (
            <Card icon={Users} title="Mensen" count={people.length} bodyClassName="flex flex-col gap-4 pt-1">
              <PeopleManager people={people} meId={me.id} />
            </Card>
          )}
          <SettingsAside />
        </div>
      }
    />
  );
}
