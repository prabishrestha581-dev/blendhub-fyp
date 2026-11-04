import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import LogoutButton from "./logout-button";

export default function DashboardPage() {
  return (
    <Suspense fallback={<p>Loading dashboard...</p>}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">BlendHub Dashboard</h1>
      <p className="mt-3">Welcome, {session.user.name}!</p>
      <LogoutButton />
    </main>
    
  );
}