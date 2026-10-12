"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { CalendarSync, Check, Copy, Download, FileUp, Globe, LogOut, Palette, RefreshCw, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { Button, inputClass } from "@/components/ui/button";
import { rotateCalendarToken, signOut, updateSettings } from "@/server/actions/settings";
import { cx } from "@/lib/cx";


export function SettingsForm({
  origin: serverOrigin,
  timezone,
  weekStart,
  icsToken,
  weekFrom,
  weekTo,
}: {
  origin: string;
  timezone: string;
  weekStart: number;
  icsToken: string;
  weekFrom: string;
  weekTo: string;
}) {
  const [origin, setOrigin] = useState(serverOrigin);
  const [copied, setCopied] = useState(false);
  const [confirmRotate, setConfirmRotate] = useState(false);
  const [pending, run] = useTransition();
  useEffect(() => setOrigin(window.location.origin), []);

  const zones = useMemo(() => {
    try {
      return Intl.supportedValuesOf("timeZone");
    } catch {
      return [timezone];
    }
  }, [timezone]);

  const feed = origin ? `${origin}/api/cal/${icsToken}.ics` : "";
  const webcal = feed.replace(/^https?:/, "webcal:");

  return (
    <div className="flex flex-col gap-3 lg:gap-4">
      <Group title="Tijd" icon={Globe}>
        <Row label="Tijdzone">
          <select
            value={timezone}
            onChange={(e) => run(() => updateSettings({ timezone: e.target.value }))}
            className={inputClass}
            aria-label="Tijdzone"
          >
            {zones.map((z) => (
              <option key={z} value={z}>
                {z.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </Row>
        <Row label="Week begint op">
          <Segmented
            label="Week begint op"
            value={weekStart}
            onChange={(v) => run(() => updateSettings({ weekStart: v }))}
            options={[
              { value: 1, label: "maandag" },
              { value: 0, label: "zondag" },
            ]}
          />
        </Row>
      </Group>

      <Group title="Agenda op je telefoon" icon={CalendarSync}>
        <Row label="Abonnementslink">
          <div className="flex gap-1.5">
            <input readOnly value={feed} onFocus={(e) => e.target.select()} aria-label="Abonnementslink" className={cx(inputClass, "figures truncate text-xs")} />
            <Button
              aria-label="Link kopiëren"
              onClick={async () => {
                await navigator.clipboard.writeText(feed);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? <Check className="size-3.5" strokeWidth={2} /> : <Copy className="size-3.5" strokeWidth={1.75} />}
            </Button>
          </div>
        </Row>
        <div className="flex flex-wrap gap-2">
          <a
            href={webcal || undefined}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-cloth px-4 text-sm font-medium text-cloth-ink transition-colors hover:bg-cloth-3 lg:h-8"
          >
            Abonneren op dit toestel
          </a>
          <a
            href={feed ? `${feed}?from=${weekFrom}&to=${weekTo}&download=1` : undefined}
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-rule-strong bg-card px-4 text-sm font-medium text-ink transition-colors hover:bg-paper-3 lg:h-8"
          >
            <Download className="size-3.5" strokeWidth={1.75} />
            Deze week als .ics
          </a>
          {confirmRotate ? (
            <Button
              variant="danger"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  await rotateCalendarToken();
                  setConfirmRotate(false);
                })
              }
            >
              Nieuwe link, de oude stopt
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => setConfirmRotate(true)}>
              <RefreshCw className="size-3.5" strokeWidth={1.75} />
              Nieuwe link
            </Button>
          )}
        </div>
      </Group>

    </div>
  );
}

function Group({ title, icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <Card icon={icon} title={title} bodyClassName="flex flex-col gap-4 pt-1">
      {children}
    </Card>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm text-ink-2">{label}</span>
      {children}
    </div>
  );
}

type Theme = "system" | "light" | "dark";

/** Pages and session controls for the facing page. */
export function SettingsAside() {
  const [theme, setTheme] = useState<Theme>("system");
  useEffect(() => {
    const t = document.documentElement.dataset.theme;
    setTheme(t === "light" || t === "dark" ? t : "system");
  }, []);

  function choose(next: Theme) {
    setTheme(next);
    try {
      if (next === "system") {
        delete document.documentElement.dataset.theme;
        localStorage.removeItem("theme");
      } else {
        document.documentElement.dataset.theme = next;
        localStorage.setItem("theme", next);
      }
    } catch {}
  }

  return (
    <div className="flex flex-col gap-3 lg:gap-4">
      <Group title="Weergave" icon={Palette}>
        <Row label="Uiterlijk">
          <Segmented
            label="Uiterlijk"
            value={theme}
            onChange={choose}
            options={[
              { value: "system", label: "Zoals toestel" },
              { value: "light", label: "Licht" },
              { value: "dark", label: "Donker" },
            ]}
          />
        </Row>
      </Group>

      <Group title="Gegevens" icon={FileUp}>
        <Link
          href="/import"
          className="inline-flex h-10 items-center gap-1.5 self-start rounded-full border border-rule-strong bg-card px-4 text-sm font-medium text-ink transition-colors hover:bg-paper-3 lg:h-8"
        >
          <FileUp className="size-3.5" strokeWidth={1.75} />
          Schema importeren
        </Link>
      </Group>

      <Group title="Sessie" icon={LogOut}>
        <form action={signOut}>
          <Button type="submit" variant="ghost">
            <LogOut className="size-3.5" strokeWidth={1.75} />
            Afmelden
          </Button>
        </form>
      </Group>
    </div>
  );
}
