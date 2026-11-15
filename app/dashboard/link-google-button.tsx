"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function LinkGoogleButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLink() {
    if (isLoading) return;

    setIsLoading(true);
    setMessage("");

    try {
      const { error } = await authClient.linkSocial({
        provider: "google",
        callbackURL: "/dashboard",
      });

      if (error) {
        setMessage(error.message ?? "Could not link Google.");
        setIsLoading(false);
      }
    } catch {
      setMessage("Unable to connect. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className="my-4">
      <button
        type="button"
        onClick={handleLink}
        disabled={isLoading}
        className="rounded-md border px-4 py-2 disabled:opacity-50"
      >
        {isLoading ? "Connecting..." : "Connect Google account"}
      </button>

      <p role="status" className="mt-2 text-sm">
        {message}
      </p>
    </div>
  );
}