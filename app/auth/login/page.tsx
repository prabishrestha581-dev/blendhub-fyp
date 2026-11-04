"use client";

import Link from "next/link";
import { useState } from "react";
import type { SubmitEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading) return;

    const formData = new FormData(event.currentTarget);

    setIsLoading(true);
    setMessage("");

    try {
      const { error } = await authClient.signIn.email({
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
      });

      if (error) {
        setMessage(error.message ?? "Could not login.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setMessage("Unable to connect. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm px-5 py-8 border-2 border-gray-100 rounded-2xl shadow-md">
        <div className="signup-heading text-center mb-8">
          <h1 className="text-2xl">Login to BlendHub</h1>
          <h2 className="text-nd text-gray-600">
            Sign in to your café account
          </h2>
        </div>
        <div className="signup-form">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className="border border-blue-100 rounded-md p-1"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                className="border border-blue-100 rounded-md p-1"
              />
            </div>

            <div className="mt-3 text-center">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-400 py-2 px-1 w-full rounded-md text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Logging in..." : "Login"}
              </button>

              <p role="status" className="mt-3 text-sm">
                {message}
              </p>
            </div>

            <div className="text-center">
              <p>
                Don't have an acccount?{" "}
                <Link
                  href="/auth/register"
                  className="text-blue-400 hover:text-blue-500 hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
