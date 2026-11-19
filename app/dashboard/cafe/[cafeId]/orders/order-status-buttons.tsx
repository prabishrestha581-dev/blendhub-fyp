"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "./actions";

type Props = {
  cafeId: string;
  orderId: string;
  status: string;
};

const nextSteps: Record<string, { status: string; label: string }> = {
  pending: { status: "accepted", label: "Accept order" },
  accepted: { status: "preparing", label: "Start preparing" },
  preparing: { status: "ready", label: "Mark ready" },
  ready: { status: "completed", label: "Mark collected" },
};

export default function OrderStatusButtons({
  cafeId,
  orderId,
  status,
}: Props) {
  const router = useRouter();
  const submitting = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const nextStep = Object.hasOwn(nextSteps, status)
    ? nextSteps[status]
    : undefined;

  const canCancel = status === "pending" || status === "accepted";

  async function handleUpdate(nextStatus: string) {
    if (submitting.current) return;

    if (
      nextStatus === "cancelled" &&
      !window.confirm("Cancel this order? This cannot be undone.")
    ) {
      return;
    }

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
      setMessage(
        "Unable to confirm the update. Refresh to check the current status.",
      );
    } finally {
      submitting.current = false;
      setIsLoading(false);
    }
  }

  if (!nextStep && !canCancel) return null;

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        {nextStep && (
          <button
            type="button"
            onClick={() => handleUpdate(nextStep.status)}
            disabled={isLoading}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Updating..." : nextStep.label}
          </button>
        )}

        {canCancel && (
          <button
            type="button"
            onClick={() => handleUpdate("cancelled")}
            disabled={isLoading}
            className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Cancel order
          </button>
        )}
      </div>

      <p role="status" className="mt-2 text-sm">
        {message}
      </p>
    </div>
  );
}