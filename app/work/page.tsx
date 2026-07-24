import { redirect } from "next/navigation";

// The work portfolio page is hidden for now; "Our Work" in the nav points to
// the artwork canvas at /artwork instead.
export default function WorkPage() {
  redirect("/artwork");
}
