"use client";

import Link from "next/link";
import { useState } from "react";
import type { SubmitEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { Erica_One } from "next/font/google";

export default function Register() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading) return;

    const formData = new FormData(event.currentTarget);

    setIsLoading(true);
    setMessage("");

    try {
      const { error } = await authClient.signUp.email({
        name: String(formData.get("name") ?? "").trim(),
        email: String(formData.get("email") ?? "").trim(),
        password: String(formData.get("password") ?? ""),
      });

      if (error) {
        setMessage(error.message ?? "Could not create your account.");
        return;
      }

      setMessage("Account created successfully.");
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
          <h1 className="text-2xl">Create Account</h1>
          <h2 className="text-nd text-gray-600">Sign up to get started</h2>
        </div>
        <div className="signup-form">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <label htmlFor="full-name">Full Name</label>
              <input
                minLength={8}
                id="full-name"
                name="name"
                type="text"
                autoComplete="name"
                className="border border-blue-100 rounded-md p-1"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="email">Email</label>
              <input
                minLength={8}
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
                minLength={8}
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                className="border border-blue-100 rounded-md p-1"
              />
            </div>

            <div className="mt-3 text-center">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-400 py-2 px-1 w-full rounded-md text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Creating account..." : "Create Account"}
              </button>

              <p role="status" className="mt-3 text-sm">
                {message}
              </p>
            </div>

            <div className="text-center">
              <p>
                Already have an acccount? <Link href="/auth/login">Login</Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
