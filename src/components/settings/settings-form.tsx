"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Check, Copy, Download, LogOut, RefreshCw } from "lucide-react";
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
    <div className="flex max-w-lg flex-col gap-9">
      <Group title="Time">
        <Row label="Timezone">
          <select
            value={timezone}
            onChange={(e) => run(() => updateSettings({ timezone: e.target.value }))}
            className={inputClass}
            aria-label="Timezone"
          >
            {zones.map((z) => (
              <option key={z} value={z}>
                {z.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </Row>
        <Row label="Week starts on">
          <div role="radiogroup" aria-label="Week starts on" className="flex rounded-sm bg-paper-3 p-0.5">
            {[
              [1, "Monday"],
              [0, "Sunday"],
            ].map(([v, label]) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={weekStart === v}
                onClick={() => run(() => updateSettings({ weekStart: v as number }))}
                className={cx(
                  "h-8 flex-1 rounded-xs text-sm transition-colors",
                  weekStart === v ? "bg-paper font-medium text-ink shadow-[0_1px_2px_oklch(0.2_0.02_258/0.12)]" : "text-ink-2",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </Row>
      </Group>

      <Group title="Calendar">
        <Row label="Subscription link">
          <div className="flex gap-1.5">
            <input readOnly value={feed} onFocus={(e) => e.target.select()} aria-label="Subscription link" className={cx(inputClass, "figures truncate text-xs")} />
            <Button
              aria-label="Copy link"
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
            className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-cloth px-3 text-sm font-medium text-cloth-ink transition-colors hover:bg-cloth-3"
          >
            Subscribe on this device
          </a>
          <a
            href={feed ? `${feed}?from=${weekFrom}&to=${weekTo}&download=1` : undefined}
            className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-rule-strong bg-paper px-3 text-sm font-medium text-ink transition-colors hover:bg-paper-3"
          >
            <Download className="size-3.5" strokeWidth={1.75} />
            This week as .ics
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
              Replace link, old one stops working
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => setConfirmRotate(true)}>
              <RefreshCw className="size-3.5" strokeWidth={1.75} />
              New link
            </Button>
          )}
        </div>
      </Group>

    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col gap-4">
      <h2 className="border-b border-rule-strong pb-1.5 text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">{title}</h2>
      {children}
    </section>
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
    <div className="flex max-w-lg flex-col gap-9">
      <Group title="Pages">
        <Row label="Appearance">
          <div role="radiogroup" aria-label="Appearance" className="flex rounded-sm bg-paper-3 p-0.5">
            {(["system", "light", "dark"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={theme === t}
                onClick={() => choose(t)}
                className={cx(
                  "h-8 flex-1 rounded-xs text-sm transition-colors",
                  theme === t ? "bg-paper font-medium text-ink shadow-[0_1px_2px_oklch(0.2_0.02_258/0.12)]" : "text-ink-2",
                )}
              >
                {{ system: "Match device", light: "Light", dark: "Dark" }[t]}
              </button>
            ))}
          </div>
        </Row>
      </Group>

      <Group title="Data">
        <a href="/import" className="inline-flex h-8 items-center gap-1.5 self-start rounded-sm border border-rule-strong bg-paper px-3 text-sm font-medium text-ink transition-colors hover:bg-paper-3">
          Import a schedule file
        </a>
      </Group>

      <Group title="Session">
        <form action={signOut}>
          <Button type="submit" variant="ghost">
            <LogOut className="size-3.5" strokeWidth={1.75} />
            Lock
          </Button>
        </form>
      </Group>
    </div>
  );
}
