"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteMenuItem } from "./actions";

type Props = {
  cafeId: string;
  itemId: string;
  itemName: string;
};

export default function DeleteMenuItemButton({
  cafeId,
  itemId,
  itemName,
}: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleDelete() {
    if (isLoading) return;

    const confirmed = window.confirm(
      `Delete "${itemName}"? This cannot be undone.`,
    );

    if (!confirmed) return;

    setIsLoading(true);
    setMessage("");

    try {
      const result = await deleteMenuItem(cafeId, itemId);

      if (result.error) {
        setMessage(result.error);
        return;
      }

      router.refresh();
    } catch {
      setMessage("Unable to connect. Refresh to check whether it was deleted.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isLoading}
        className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        {isLoading ? "Deleting..." : "Delete item"}
      </button>

      <p role="status" className="mt-1 text-sm">
        {message}
      </p>
    </div>
  );
}