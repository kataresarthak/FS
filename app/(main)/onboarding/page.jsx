import { redirect } from "next/navigation";
import { checkUser } from "@/lib/checkUser";

export default async function OnboardingPage() {
  await checkUser();
  redirect("/dashboard");
}


