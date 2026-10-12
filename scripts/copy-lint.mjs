// Fails when UI source contains em dashes or stock AI phrasing.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "src";
const BANNED = [
  [/—/, "em dash"],
  [/\bseamless(ly)?\b/i, "seamless"],
  [/\bdelve\b/i, "delve"],
  [/\bunlock (your|the)\b/i, "unlock your/the"],
  [/\belevate\b/i, "elevate"],
  [/\bsupercharge\b/i, "supercharge"],
  [/\bembark\b/i, "embark"],
  [/\bLet's\b/, "Let's"],
  [/\bgame[- ]changer\b/i, "game changer"],
  [/\bjourney\b/i, "journey"],
  [/\beffortless(ly)?\b/i, "effortless"],
  [/[✨\u{1F680}\u{1F389}]/u, "decorative emoji"],
];

const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx?|css|md)$/.test(name)) files.push(p);
  }
})(ROOT);

let failures = 0;
for (const file of files) {
  readFileSync(file, "utf8")
    .split("\n")
    .forEach((line, i) => {
      for (const [re, label] of BANNED) {
        if (re.test(line)) {
          failures++;
          console.error(`${file}:${i + 1}  ${label}: ${line.trim().slice(0, 100)}`);
        }
      }
    });
}
if (failures) {
  console.error(`\ncopy-lint: ${failures} problem(s)`);
  process.exit(1);
}
console.log(`copy-lint: ${files.length} files clean`);
