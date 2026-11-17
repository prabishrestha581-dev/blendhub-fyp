"use client";

import Link from "next/link";
import { useState } from "react";
import type { SubmitEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Login() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading) return;

    const emailInput = event.currentTarget.elements.namedItem(
      "email",
    ) as HTMLInputElement;
    setMessage("");
    if (!emailInput.validity.valid) {
      setEmailError(true);
      emailInput.focus();
      return;
    }
    setEmailError(false);

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

  async function handleGoogleLogin() {
    if (isLoading) return;

    setIsLoading(true);
    setMessage("");

    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });

      if (error) {
        setMessage(error.message ?? "Google sign-in failed.");
        setIsLoading(false);
      }
    } catch {
      setMessage("Unable to connect. Please try again.");
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
          <div className="mb-8 text-left">
            <h1 className="whitespace-nowrap text-4xl font-bold tracking-normal sm:text-7xl">
              Welcome <span className="text-[#a85520]">back</span>
            </h1>
            <p className="pl-2 mt-4 sm:text-xl">Sign in to manage your café.</p>
          </div>
          <div className="pl-2 signup-form">
            <form
              noValidate
              onSubmit={handleSubmit}
              className="flex flex-col gap-5"
            >
              <div className="flex flex-col gap-1">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  aria-invalid={emailError}
                  aria-describedby={emailError ? "email-error" : undefined}
                  onChange={(event) => {
                    if (emailError && event.currentTarget.validity.valid) {
                      setEmailError(false);
                    }
                  }}
                  className={`border rounded-md p-1 ${emailError ? "border-red-600 bg-red-50 text-red-700 outline-red-600" : "border-blue-100"}`}
                />
                {emailError && (
                  <p
                    id="email-error"
                    role="alert"
                    className="mt-1 flex items-center gap-2 text-sm text-red-600"
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold"
                    >
                      !
                    </span>
                    Please enter a valid email address
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="border border-blue-100 rounded-md p-1"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-controls="password"
                className="self-end text-sm text-[#a85520] hover:underline"
              >
                {showPassword ? "Hide password" : "Show password"}
              </button>

              <Link
                href="/auth/forgot-password"
                className="self-end text-sm text-[#a85520] hover:underline"
              >
                Forgot password?
              </Link>

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

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-[#2b1709]/20" />
                <span className="text-sm">or</span>
                <div className="h-px flex-1 bg-[#2b1709]/20" />
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 rounded-md bg-black px-4 py-3 font-medium hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-50 text-amber-50"
              >
                <img
                  src="/google.svg"
                  alt=""
                  width={20}
                  height={20}
                  className="h-5 w-5 shrink-0"
                />
                Continue with Google
              </button>

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
      </section>

      <div aria-hidden="true" className="relative hidden lg:block">
        <div className="absolute inset-0">
          <Image
            src="/auth-coffee-V1.png"
            alt=""
            fill
            sizes="44vw"
            className="object-cover"
          />
        </div>
      </div>
    </main>
  );
}
