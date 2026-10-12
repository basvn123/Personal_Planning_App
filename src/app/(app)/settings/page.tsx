import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Spread } from "@/components/shell/spread";
import { SettingsAside, SettingsForm } from "@/components/settings/settings-form";
import { AccountForm, PeopleManager } from "@/components/settings/account-forms";
import { InfoButton } from "@/components/help/info-button";
import { PhoneExtras } from "@/components/settings/phone-extras";
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
      leftLabel="Account en tijd"
      rightLabel="Overige"
      initial={!me.email || !me.hasPassword ? "left" : undefined}
      left={
        <div className="flex flex-col gap-9 px-5 pb-16 pt-6 lg:px-8">
          <h1 className="flex items-center gap-1.5 text-xl font-semibold tracking-[-0.02em]">
            Instellingen
            <InfoButton topic="settings" />
          </h1>
          <section aria-label="Account" className="flex max-w-lg flex-col gap-4">
            <h2 className="border-b border-rule-strong pb-1.5 text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">Account</h2>
            <AccountForm name={me.name} email={me.email} hasPassword={me.hasPassword} />
          </section>
          <SettingsForm origin={origin} timezone={s.timezone} weekStart={s.weekStart} icsToken={s.icsToken} weekFrom={days[0]} weekTo={days[6]} />
          <PhoneExtras />
        </div>
      }
      right={
        <div className="flex flex-col gap-9 px-5 pb-16 pt-6 lg:px-10 lg:pt-[4.75rem]">
          {me.role === "owner" && (
            <section aria-label="Mensen" className="flex max-w-xl flex-col gap-4">
              <h2 className="border-b border-rule-strong pb-1.5 text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">Mensen</h2>
              <PeopleManager people={people} meId={me.id} />
            </section>
          )}
          <SettingsAside />
        </div>
      }
    />
  );
}
