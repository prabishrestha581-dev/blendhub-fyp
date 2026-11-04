"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function LogoutButton() {
  const router = useRouter();
  const [message, setMessage] = useState("");

  async function handleLogout() {
    setMessage("");

    try {
      const { error } = await authClient.signOut();

      if (error) {
        setMessage("Could not log out. Please try again.");
        return;
      }

      router.replace("/auth/login");
      router.refresh();
    } catch {
      setMessage("Unable to connect. Please try again.");
    }
  }

  return (
    <div className="mt-6">
      <button
        onClick={handleLogout}
        className="rounded-md bg-blue-500 px-4 py-2 text-white"
      >
        Logout
      </button>
      <p role="status" className="mt-2 text-sm">{message}</p>
    </div>
  );
}