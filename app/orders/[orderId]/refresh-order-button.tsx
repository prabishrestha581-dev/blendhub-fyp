"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function RefreshOrderButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      disabled={isPending}
      className="mt-5 rounded-md bg-[#2b1709] px-4 py-2 text-white disabled:opacity-50"
    >
      {isPending ? "Checking..." : "Refresh status"}
    </button>
  );
}