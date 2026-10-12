export const MAX_FILE_BYTES = 50 * 1024 * 1024;

/** Types the browser may display in place. Everything else downloads, so an uploaded page can never run inside the app. */
const INLINE = /^(application\/pdf|image\/(png|jpe?g|gif|webp|avif)|text\/plain|audio\/[\w.+-]+|video\/[\w.+-]+)$/;

export function canShowInline(contentType: string) {
  return INLINE.test(contentType);
}

export function fileKind(contentType: string, name: string): "pdf" | "image" | "video" | "audio" | "text" | "sheet" | "slides" | "doc" | "other" {
  if (contentType === "application/pdf") return "pdf";
  if (/^image\//.test(contentType)) return "image";
  if (/^video\//.test(contentType)) return "video";
  if (/^audio\//.test(contentType)) return "audio";
  if (/^text\//.test(contentType) || /\.(md|txt|csv)$/i.test(name)) return "text";
  if (/sheet|excel|csv/.test(contentType) || /\.(xlsx?|numbers|ods)$/i.test(name)) return "sheet";
  if (/presentation|powerpoint/.test(contentType) || /\.(pptx?|key|odp)$/i.test(name)) return "slides";
  if (/word|opendocument\.text|rtf/.test(contentType) || /\.(docx?|pages|odt|rtf)$/i.test(name)) return "doc";
  return "other";
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`;
  return `${(bytes / 1024 / 1024).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

/** Keeps a readable name but strips path separators and control characters. */
export function safeFileName(name: string) {
  return (
    name
      .normalize("NFC")
      .replace(/[\\/\u0000-\u001f]/g, "_")
      .replace(/^\.+/, "")
      .slice(0, 180) || "bestand"
  );
}
