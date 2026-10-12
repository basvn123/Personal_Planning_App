import { appIcon } from "@/lib/app-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon for iPhone and iPad ("Zet op beginscherm"). */
export default function AppleIcon() {
  return appIcon(180);
}
