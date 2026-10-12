export const DYES = [
  "moss",
  "lagoon",
  "cobalt",
  "iris",
  "plum",
  "rose",
  "coral",
  "ochre",
  "olive",
  "slate",
  "clay",
  "teal",
] as const;

export type Dye = (typeof DYES)[number];

export function isDye(value: string): value is Dye {
  return (DYES as readonly string[]).includes(value);
}

export function dyeVars(dye: string) {
  const d = isDye(dye) ? dye : "slate";
  return {
    "--dye": `var(--dye-${d})`,
    "--dye-deep": `var(--dye-${d}-deep)`,
  } as React.CSSProperties;
}
