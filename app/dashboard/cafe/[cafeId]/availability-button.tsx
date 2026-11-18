"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setMenuItemAvailability } from "./actions";

type Props = {
  cafeId: string;
  itemId: string;
  isAvailable: boolean;
};

export default function AvailabilityButton({
  cafeId,
  itemId,
  isAvailable,
}: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleClick() {
    if (isLoading) return;

    setIsLoading(true);
    setMessage("");

    try {
      const result = await setMenuItemAvailability(
        cafeId,
        itemId,
        !isAvailable,
      );

      if (result.error) {
        setMessage(result.error);
        return;
      }

      router.refresh();
    } catch {
      setMessage("Unable to connect. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100 disabled:opacity-50"
      >
        {isLoading
          ? "Updating..."
          : isAvailable
            ? "Mark unavailable"
            : "Mark available"}
      </button>

      <p role="status" className="mt-1 text-sm">
        {message}
      </p>
    </div>
  );
}