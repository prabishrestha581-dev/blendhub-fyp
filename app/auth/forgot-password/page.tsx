"use client";

import Link from "next/link";
import { useState, type SubmitEvent } from "react";
import { authClient } from "@/lib/auth-client";

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) return;

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    setIsLoading(true);
    setMessage("");

    try {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        setMessage("Unable to request a reset link. Please try again.");
        return;
      }

      setMessage(
        "If an account exists for this email, you’ll receive a reset link. Check your inbox and spam folder.",
      );
    } catch {
      setMessage("Unable to connect. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#faf6ee] px-6 text-[#2b1709]">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold">Forgot password?</h1>
        <p className="mt-2">
          Enter your registered email to request a reset link.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="rounded-md border border-[#2b1709]/30 px-3 py-3"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="rounded-md bg-[#2b1709] px-4 py-3 text-white disabled:opacity-50"
          >
            {isLoading ? "Requesting..." : "Send reset link"}
          </button>

          <p role="status" className="text-sm">
            {message}
          </p>
        </form>

        <Link href="/auth/login" className="mt-6 inline-block underline">
          Back to login
        </Link>
      </div>
    </main>
  );
}