"use client";

import { useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { placeOrder } from "./actions";
import { validateCustomerDetails } from "@/lib/customer-validation";

type OrderInput = Parameters<typeof placeOrder>[0];

type Props = {
  cafeId: string;
  items: { id: string; quantity: number }[];
  onLockChange: (locked: boolean) => void;
  onOrdered: (orderId: string, total: string, trackingToken: string) => void;
};

export default function CheckoutForm({
  cafeId,
  items,
  onLockChange,
  onOrdered,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [pendingOrder, setPendingOrder] = useState<OrderInput | null>(null);
  const submitting = useRef(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;

    const formData = new FormData(event.currentTarget);

    const customer = validateCustomerDetails(
      pendingOrder?.customerName ?? String(formData.get("customerName") ?? ""),
      pendingOrder?.customerPhone ??
        String(formData.get("customerPhone") ?? ""),
    );

    if (customer.error !== undefined) {
      setMessage(customer.error);
      return;
    }

    // Retry the exact same request after an uncertain result.
    const order = pendingOrder ?? {
      cafeId,
      requestId: crypto.randomUUID(),
      customerName: customer.name,
      customerPhone: customer.phone,
      items: items.map((item) => ({ ...item })),
    };

    submitting.current = true;
    setIsLoading(true);
    setMessage("");
    setPendingOrder(order);
    onLockChange(true);

    try {
      const result = await placeOrder(order);

      if (result.error !== undefined) {
        setMessage(result.error);

        if (!result.retryable) {
          setPendingOrder(null);
          onLockChange(false);
        }

        return;
      }

      setPendingOrder(null);
      onLockChange(false);
      onOrdered(result.orderId, result.total, result.trackingToken);
    } catch {
      setMessage(
        "The connection was interrupted. Retry to check or complete this same order.",
      );
    } finally {
      submitting.current = false;
      setIsLoading(false);
    }
  }

  const inputClass = "w-full rounded-md border border-[#2b1709]/30 px-3 py-2";

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4 border-t pt-5">
      <h3 className="font-semibold">Pickup details</h3>

      <div>
        <label htmlFor="customer-name" className="text-sm">
          Your name
        </label>
        <input
          id="customer-name"
          name="customerName"
          autoComplete="name"
          required
          maxLength={100}
          disabled={pendingOrder !== null}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="customer-phone" className="text-sm">
          Phone number
        </label>
        <input
          id="customer-phone"
          name="customerPhone"
          type="tel"
          autoComplete="tel"
          required
          minLength={7}
          maxLength={20}
          disabled={pendingOrder !== null}
          className={inputClass}
        />
      </div>

      <p className="text-sm text-[#2b1709]/70">
        Collect and pay at the café. The final total uses current menu prices.
      </p>

      {pendingOrder && !isLoading && (
        <p className="text-sm">
          Your cart is held while we confirm this order. Retry below.
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading || items.length === 0}
        className="w-full rounded-md bg-[#2b1709] px-4 py-3 text-white disabled:opacity-50"
      >
        {isLoading
          ? "Placing order..."
          : pendingOrder
            ? "Retry same order"
            : "Place pickup order"}
      </button>

      <p role="status" className="text-sm">
        {message}
      </p>
    </form>
  );
}
