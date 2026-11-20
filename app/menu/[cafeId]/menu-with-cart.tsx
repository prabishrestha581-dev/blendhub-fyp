"use client";

import { useState } from "react";
import CheckoutForm from "./checkout-form";
import Link from "next/link";

type MenuItem = {
  id: string;
  name: string;
  category: string;
  price: string;
  is_available: boolean;
  image_url: string | null;
};

export default function MenuWithCart({
  cafeId,
  items,
}: {
  cafeId: string;
  items: MenuItem[];
}) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [checkoutLocked, setCheckoutLocked] = useState(false);
  const [orderMessage, setOrderMessage] = useState("");
  const [trackingUrl, setTrackingUrl] = useState<string | null>(null);

  function changeQuantity(itemId: string, change: number) {
    if (checkoutLocked) return;
    const item = items.find((item) => item.id === itemId);
    if (!item || (change > 0 && !item.is_available)) return;

    setQuantities((current) => ({
      ...current,
      [itemId]: Math.max(0, Math.min(99, (current[itemId] ?? 0) + change)),
    }));
  }

  const cartItems = items.filter((item) => (quantities[item.id] ?? 0) > 0);

  // Calculate using whole paisa, then convert to rupees for display.
  const priceInPaisa = (price: string) => Math.round(Number(price) * 100);

  const total = cartItems.reduce(
    (sum, item) => sum + priceInPaisa(item.price) * quantities[item.id],
    0,
  );

  return (
    <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_300px]">
      <section>
        <h2 className="text-xl font-semibold">Our menu</h2>

        {items.length === 0 ? (
          <p className="mt-4">This café hasn’t added any menu items yet.</p>
        ) : (
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {items.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-xl border border-[#2b1709]/15 bg-white"
              >
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    width={600}
                    height={400}
                    loading="lazy"
                    className="h-44 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-44 items-center justify-center bg-[#f0e8dc] text-sm">
                    No photo available
                  </div>
                )}

                <div className="p-5">
                  <p className="text-sm text-[#a85520]">{item.category}</p>
                  <h3 className="mt-1 text-lg font-semibold">{item.name}</h3>
                  <p className="mt-3 font-medium">
                    NPR {Number(item.price).toFixed(2)}
                  </p>

                  <button
                    type="button"
                    onClick={() => changeQuantity(item.id, 1)}
                    disabled={
                      checkoutLocked ||
                      !item.is_available ||
                      (quantities[item.id] ?? 0) >= 99
                    }
                    className="mt-4 w-full rounded-md bg-[#2b1709] px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {!item.is_available
                      ? "Currently unavailable"
                      : (quantities[item.id] ?? 0) >= 99
                        ? "Maximum quantity reached"
                        : "Add to cart"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <aside className="rounded-xl border border-[#2b1709]/15 bg-white p-5">
        <h2 className="text-xl font-semibold">Your cart</h2>

        {orderMessage && (
          <p
            role="status"
            className="mt-4 wrap-break-word rounded-md bg-green-50 p-3 text-sm text-green-800"
          >
            {orderMessage}
          </p>
        )}
        {trackingUrl && (
          <Link
            href={trackingUrl}
            prefetch={false}
            className="mt-4 inline-block rounded-md bg-[#2b1709] px-4 py-2 text-white"
          >
            Track your order
          </Link>
        )}

        {cartItems.length === 0 ? (
          <p className="mt-4 text-sm text-[#2b1709]/70">Your cart is empty.</p>
        ) : (
          <>
            <ul className="mt-4 space-y-5">
              {cartItems.map((item) => (
                <li key={item.id}>
                  <p className="font-medium">{item.name}</p>
                  <p className="mt-1 text-sm">
                    NPR{" "}
                    {(
                      (priceInPaisa(item.price) * quantities[item.id]) /
                      100
                    ).toFixed(2)}
                  </p>

                  <div className="mt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => changeQuantity(item.id, -1)}
                      disabled={checkoutLocked}
                      aria-label={`Decrease quantity of ${item.name}`}
                      className="rounded border px-3 py-1"
                    >
                      −
                    </button>

                    <span>{quantities[item.id]}</span>

                    <button
                      type="button"
                      onClick={() => changeQuantity(item.id, 1)}
                      disabled={
                        checkoutLocked ||
                        !item.is_available ||
                        quantities[item.id] >= 99
                      }
                      aria-label={`Increase quantity of ${item.name}`}
                      className="rounded border px-3 py-1 disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-5 border-t pt-4">
              <p className="flex justify-between font-semibold">
                <span>Total</span>
                <span>NPR {(total / 100).toFixed(2)}</span>
              </p>

              <button
                type="button"
                onClick={() => setQuantities({})}
                disabled={checkoutLocked}
                className="mt-4 text-sm text-red-700 hover:underline"
              >
                Clear cart
              </button>
            </div>
            <CheckoutForm
              cafeId={cafeId}
              items={cartItems.map((item) => ({
                id: item.id,
                quantity: quantities[item.id],
              }))}
              onLockChange={setCheckoutLocked}
              onOrdered={(orderId, total, trackingToken) => {
                setOrderMessage(
                  `Order placed! Reference: ${orderId}. Total: NPR ${total}. Collect and pay at the café.`,
                );

                setTrackingUrl(
                  `/orders/${orderId}?token=${encodeURIComponent(trackingToken)}`,
                );

                setQuantities({});
              }}
            />
          </>
        )}
      </aside>
    </div>
  );
}
