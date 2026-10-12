/** Same-site paths only: no "//host", no "/\host". */
export function safeNext(raw: string) {
  return /^\/(?![/\\])/.test(raw) && !raw.includes("\\") ? raw : "/";
}
