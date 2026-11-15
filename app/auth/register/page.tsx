"use client";

import Link from "next/link";
import { useState } from "react";
import type { SubmitEvent } from "react";
import { authClient } from "@/lib/auth-client";
import Image from "next/image";

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
    <main className="relative isolate grid min-h-screen overflow-hidden bg-[#faf6ee] text-[#2b1709] lg:grid-cols-[56%_44%]">
      <section className="relative z-10 flex flex-col px-6 py-8 sm:px-12 lg:px-[12%]">
        <Image
          src="/blendhub-logo.svg"
          alt="BlendHub"
          width={160}
          height={40}
          className="h-auto w-50"
        />

        <div className="mx-auto my-auto w-full max-w-md py-10">
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Create your <span className="text-[#a85520]">account</span>
            </h1>
            <p className="mt-3">
              Start managing your café with BlendHub.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="full-name" className="font-medium">
                Full name
              </label>
              <input
                id="full-name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="rounded-md border border-[#2b1709]/30 px-3 py-3 outline-none focus:border-[#a85520] focus:ring-2 focus:ring-[#a85520]/20"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="font-medium">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="rounded-md border border-[#2b1709]/30 px-3 py-3 outline-none focus:border-[#a85520] focus:ring-2 focus:ring-[#a85520]/20"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="font-medium">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
                aria-describedby="password-hint"
                className="rounded-md border border-[#2b1709]/30 px-3 py-3 outline-none focus:border-[#a85520] focus:ring-2 focus:ring-[#a85520]/20"
              />
              <p id="password-hint" className="text-sm text-[#2b1709]/70">
                Use at least 8 characters.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-400 py-2 px-1 w-full rounded-md text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating account..." : "Create account"}
            </button>

            <p role="status" className="text-sm">
              {message}
            </p>

            <p className="text-center text-sm">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-[#a85520] hover:underline"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </section>

      <div aria-hidden="true" className="relative hidden lg:block">
        <Image
          src="/auth-coffee-V1.png"
          alt=""
          fill
          sizes="44vw"
          loading="eager"
          className="object-cover"
        />
      </div>
    </main>
  );
}
