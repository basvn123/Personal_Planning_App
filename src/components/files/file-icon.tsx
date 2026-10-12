import { File, FileImage, FileSpreadsheet, FileText, FileVideo, FileAudio, Presentation, FileType } from "lucide-react";
import { fileKind } from "@/lib/files";

export function FileIcon({ contentType, name, className }: { contentType: string; name: string; className?: string }) {
  const Icon = {
    pdf: FileType,
    image: FileImage,
    video: FileVideo,
    audio: FileAudio,
    text: FileText,
    sheet: FileSpreadsheet,
    slides: Presentation,
    doc: FileText,
    other: File,
  }[fileKind(contentType, name)];
  return <Icon className={className} strokeWidth={1.75} aria-hidden />;
}
