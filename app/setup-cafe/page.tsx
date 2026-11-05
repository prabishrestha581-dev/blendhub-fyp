import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import CafeForm from "./cafe-form";

export default function SetupCafePage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <SetupCafeContent />
    </Suspense>
  );
}

async function SetupCafeContent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 p-6 shadow-md">
        <h1 className="mb-2 text-2xl">Set up your café</h1>
        <p className="mb-6 text-gray-600">
          Enter your café’s name to get started.
        </p>
        <CafeForm />
      </div>
    </main>
  );
}
