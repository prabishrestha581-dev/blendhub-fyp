"use client";

import Link from "next/link";
import { Suspense, useState, type SubmitEvent } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const invalidLink = !token || Boolean(searchParams.get("error"));

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading || isComplete || invalidLink || !token) return;

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmation = String(formData.get("confirmation") ?? "");

    if (password !== confirmation) {
      setMessage("The passwords do not match.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const { error } = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (error) {
        setMessage(
          error.message ?? "Could not reset your password. Request a new link.",
        );
        return;
      }

      setIsComplete(true);
      setMessage("Password updated. You can now log in.");
    } catch {
      setMessage("Unable to connect. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#faf6ee] px-6 text-[#2b1709]">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold">Reset your password</h1>

        {invalidLink ? (
          <div className="mt-6">
            <p>This reset link is missing or invalid.</p>
            <Link href="/auth/forgot-password" className="mt-4 inline-block underline">
              Request a new link
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <label htmlFor="password">New password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
              disabled={isComplete}
              className="rounded-md border border-[#2b1709]/30 px-3 py-3"
            />

            <label htmlFor="confirmation">Confirm new password</label>
            <input
              id="confirmation"
              name="confirmation"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
              disabled={isComplete}
              className="rounded-md border border-[#2b1709]/30 px-3 py-3"
            />

            <button
              type="submit"
              disabled={isLoading || isComplete}
              className="rounded-md bg-[#2b1709] px-4 py-3 text-white disabled:opacity-50"
            >
              {isLoading ? "Updating..." : "Update password"}
            </button>

            <p role="status" className="text-sm">
              {message}
            </p>
          </form>
        )}

        <Link href="/auth/login" className="mt-6 inline-block underline">
          Back to login
        </Link>
      </div>
    </main>
  );
}