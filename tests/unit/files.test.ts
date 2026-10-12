import { describe, expect, it } from "vitest";
import { canShowInline, fileKind, formatBytes, safeFileName } from "@/lib/files";

describe("files", () => {
  it("only shows safe types inline", () => {
    expect(canShowInline("application/pdf")).toBe(true);
    expect(canShowInline("image/png")).toBe(true);
    expect(canShowInline("image/svg+xml")).toBe(false);
    expect(canShowInline("text/html")).toBe(false);
  });
  it("classifies files", () => {
    expect(fileKind("application/vnd.openxmlformats-officedocument.presentationml.presentation", "x.pptx")).toBe("slides");
    expect(fileKind("application/octet-stream", "notes.md")).toBe("text");
  });
  it("formats sizes and cleans names", () => {
    expect(formatBytes(2_500_000)).toBe("2.4 MB");
    expect(safeFileName("../../etc/passwd")).toBe("_.._etc_passwd");
  });
});
