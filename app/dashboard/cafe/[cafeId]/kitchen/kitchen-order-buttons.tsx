"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "../orders/actions";

type Props = {
  cafeId: string;
  orderId: string;
  status: string;
};

export default function KitchenOrderButtons({
  cafeId,
  orderId,
  status,
}: Props) {
  const router = useRouter();
  const submitting = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const nextStatus =
    status === "accepted"
      ? "preparing"
      : status === "preparing"
        ? "ready"
        : null;

  async function handleUpdate() {
    if (!nextStatus || submitting.current) return;

    submitting.current = true;
    setIsLoading(true);
    setMessage("");

    try {
      const result = await updateOrderStatus(cafeId, orderId, nextStatus);

      if (result.error) {
        setMessage(result.error);
      }

      router.refresh();
    } catch {
      setMessage("Unable to confirm the update. Refresh to check the status.");
    } finally {
      submitting.current = false;
      setIsLoading(false);
    }
  }

  if (!nextStatus) return null;

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={handleUpdate}
        disabled={isLoading}
        className="w-full rounded-lg bg-[#2b1709] px-4 py-3 font-semibold text-white disabled:opacity-50"
      >
        {isLoading
          ? "Updating..."
          : status === "accepted"
            ? "Start preparing"
            : "Mark ready"}
      </button>

      <p role="status" className="mt-2 text-sm text-red-700">
        {message}
      </p>
    </div>
  );
}