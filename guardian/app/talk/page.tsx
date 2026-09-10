import { redirect } from "next/navigation";

// The control room now lives at "/". Keep the old link working.
export default function TalkRedirect() {
  redirect("/");
}
