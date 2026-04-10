import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { AdminDashboardPage } from "@/components/admin";
import { AppShell } from "@/components/layout/AppShell";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionCookie ? await verifySessionToken(sessionCookie) : null;

  if (!session) {
    redirect("/login");
  }

  return (
    <AppShell>
      <AdminDashboardPage />
    </AppShell>
  );
}
