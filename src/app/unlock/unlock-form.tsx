"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { unlock } from "./actions";

export function UnlockForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(unlock, undefined);

  return (
    <form action={action} className="flex w-full flex-col gap-3">
      <input type="hidden" name="next" value={next} />
      <label htmlFor="passcode" className="sr-only">
        Passcode
      </label>
      <div className="flex items-center gap-2 rounded-md border border-rule-strong bg-paper px-3 shadow-lift focus-within:border-cloth-3">
        <input
          id="passcode"
          name="passcode"
          type="password"
          autoFocus
          autoComplete="current-password"
          placeholder="Passcode"
          aria-invalid={Boolean(state?.error)}
          aria-describedby={state?.error ? "unlock-error" : undefined}
          className="h-11 min-w-0 flex-1 bg-transparent text-md outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          aria-label="Open"
          className="grid size-8 place-items-center rounded-sm bg-cloth text-cloth-ink transition-colors duration-150 hover:bg-cloth-3 disabled:opacity-50"
        >
          <ArrowRight className="size-4" strokeWidth={2} />
        </button>
      </div>
      <p id="unlock-error" role="alert" className="h-5 text-sm text-danger">
        {state?.error}
      </p>
    </form>
  );
}
