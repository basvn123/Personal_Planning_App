import type { Metadata } from "next";
import { SettingsForm } from "@/components/settings/settings-form";
import { getSettings } from "@/server/queries/core";
import { localDate, weekDays } from "@/lib/time";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const s = await getSettings();
  const days = weekDays(localDate(new Date(), s.timezone), s.weekStart === 0 ? 0 : 1);
  return (
    <div className="paper h-full overflow-y-auto px-5 pb-16 pt-6 lg:px-10">
      <h1 className="mb-8 text-xl font-semibold tracking-[-0.02em]">Settings</h1>
      <SettingsForm timezone={s.timezone} weekStart={s.weekStart} icsToken={s.icsToken} weekFrom={days[0]} weekTo={days[6]} />
    </div>
  );
}
