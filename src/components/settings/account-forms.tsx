"use client";

import { useState, useTransition } from "react";
import { KeyRound, Trash2, UserPlus } from "lucide-react";
import { Button, inputClass } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { changePassword, invitePerson, removePerson, resetPassword, updateAccount } from "@/server/actions/settings";
import { cx } from "@/lib/cx";

type Result = { ok: true } | { ok: false; error: string };

function useSubmit() {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  function run(fn: () => Promise<Result>, done: string, after?: () => void) {
    setMessage(null);
    start(async () => {
      try {
        const r = await fn();
        setMessage(r.ok ? { ok: true, text: done } : { ok: false, text: r.error });
        if (r.ok) after?.();
      } catch {
        setMessage({ ok: false, text: "Dat lukte niet. Probeer opnieuw." });
      }
    });
  }
  return { pending, message, run };
}

function Note({ message }: { message: { ok: boolean; text: string } | null }) {
  if (!message) return null;
  return (
    <p role={message.ok ? "status" : "alert"} className={cx("text-sm", message.ok ? "text-[var(--dye-moss-deep)]" : "text-danger")}>
      {message.text}
    </p>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm text-ink-2">{label}</span>
      {children}
    </label>
  );
}

export function AccountForm({
  name: initialName,
  email: initialEmail,
  hasPassword,
}: {
  name: string;
  email: string | null;
  hasPassword: boolean;
}) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail ?? "");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const profile = useSubmit();
  const pass = useSubmit();
  const setupNeeded = !initialEmail || !hasPassword;

  return (
    <div className="flex flex-col gap-6">
      {setupNeeded && (
        <p className="rounded-sm bg-ribbon-wash px-3 py-2.5 text-sm text-ink">
          Je bent aangemeld met de opstartcode. Stel je e-mailadres en een wachtwoord in; daarna werkt de code niet meer.
        </p>
      )}
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          profile.run(() => updateAccount({ name, email }), "Opgeslagen.");
        }}
      >
        <Field label="Naam">
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={inputClass} />
        </Field>
        <Field label="E-mailadres">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={inputClass} />
        </Field>
        <div className="flex items-center gap-3">
          <Button type="submit" variant="quiet" disabled={profile.pending}>
            Opslaan
          </Button>
          <Note message={profile.message} />
        </div>
      </form>

      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          pass.run(() => changePassword({ current, next }), "Wachtwoord ingesteld.", () => {
            setCurrent("");
            setNext("");
          });
        }}
      >
        {hasPassword && (
          <Field label="Huidig wachtwoord">
            <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" className={inputClass} />
          </Field>
        )}
        <Field label={hasPassword ? "Nieuw wachtwoord" : "Wachtwoord"}>
          <input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" minLength={8} className={inputClass} />
        </Field>
        <div className="flex items-center gap-3">
          <Button type="submit" variant="quiet" disabled={pass.pending || next.length < 8}>
            {hasPassword ? "Wachtwoord wijzigen" : "Wachtwoord instellen"}
          </Button>
          <Note message={pass.message} />
        </div>
      </form>
    </div>
  );
}

type Person = { id: string; name: string; email: string | null; role: "owner" | "member" };

export function PeopleManager({ people, meId }: { people: Person[]; meId: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const invite = useSubmit();

  return (
    <div className="flex flex-col gap-4">
      <ul>
        {people.map((p) => (
          <PersonRow key={p.id} person={p} isMe={p.id === meId} />
        ))}
      </ul>
      <form
        className="flex flex-col gap-2.5 rounded-lg border border-rule bg-canvas p-3"
        onSubmit={(e) => {
          e.preventDefault();
          invite.run(() => invitePerson({ name, email, password }), `${name} kan nu inloggen.`, () => {
            setName("");
            setEmail("");
            setPassword("");
          });
        }}
      >
        <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
          <UserPlus className="size-4" strokeWidth={1.75} />
          Iemand uitnodigen
        </span>
        <div className="grid gap-2 sm:grid-cols-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Naam" aria-label="Naam" className={inputClass} />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mailadres" aria-label="E-mailadres" className={inputClass} />
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Startwachtwoord"
            aria-label="Startwachtwoord"
            autoComplete="off"
            className={inputClass}
          />
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary" disabled={invite.pending}>
            Account maken
          </Button>
          <Note message={invite.message} />
        </div>
        <p className="text-xs text-ink-3">Elk account heeft een eigen, lege planner. Geef het startwachtwoord zelf door.</p>
      </form>
    </div>
  );
}

function PersonRow({ person, isMe }: { person: Person; isMe: boolean }) {
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState(false);
  const reset = useSubmit();
  const remove = useSubmit();
  return (
    <li className="flex items-center gap-3 border-b border-rule py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-base text-ink">
          {person.name}
          {isMe && <span className="ml-2 text-xs text-ink-3">jij</span>}
        </p>
        <p className="truncate text-xs text-ink-3">
          {person.email ?? "geen e-mailadres"} · {person.role === "owner" ? "eigenaar" : "lid"}
        </p>
      </div>
      {!isMe && (
        <>
          <Popover>
            <PopoverTrigger className="inline-flex h-8 items-center gap-1.5 rounded-sm px-2 text-sm text-ink-2 hover:bg-paper-3 hover:text-ink">
              <KeyRound className="size-3.5" strokeWidth={1.75} />
              Wachtwoord
            </PopoverTrigger>
            <PopoverContent align="end" className="flex w-64 flex-col gap-2">
              <input
                value={next}
                onChange={(e) => setNext(e.target.value)}
                placeholder="Nieuw wachtwoord"
                aria-label="Nieuw wachtwoord"
                className={inputClass}
              />
              <Button variant="primary" disabled={reset.pending || next.length < 8} onClick={() => reset.run(() => resetPassword(person.id, next), "Ingesteld.", () => setNext(""))}>
                Instellen
              </Button>
              <Note message={reset.message} />
            </PopoverContent>
          </Popover>
          {confirm ? (
            <Button variant="danger" disabled={remove.pending} onClick={() => remove.run(() => removePerson(person.id), "Verwijderd.")}>
              Alles van {person.name} wissen
            </Button>
          ) : (
            <Button variant="ghost" aria-label={`${person.name} verwijderen`} onClick={() => setConfirm(true)}>
              <Trash2 className="size-3.5" strokeWidth={1.75} />
            </Button>
          )}
        </>
      )}
      <Note message={remove.message} />
    </li>
  );
}
