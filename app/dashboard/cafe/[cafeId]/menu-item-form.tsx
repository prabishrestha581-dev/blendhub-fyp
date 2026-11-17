"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { createMenuItem } from "./actions";

export default function MenuItemForm({ cafeId }: { cafeId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) return;

    const form = event.currentTarget;
    const formData = new FormData(form);

    setIsLoading(true);
    setMessage("");

    try {
      const result = await createMenuItem(cafeId, formData);

      if (result.error) {
        setMessage(result.error);
        return;
      }

      form.reset();
      setMessage("Menu item added.");
      router.refresh();
    } catch {
      setMessage("Unable to connect. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const inputClass = "rounded-md border border-gray-300 px-3 py-2";

  return (
    <section className="mt-8 rounded-xl border border-gray-200 p-5">
      <h2 className="text-xl font-semibold">Add menu item</h2>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="item-name">Item name</label>
          <input
            id="item-name"
            name="name"
            required
            maxLength={100}
            placeholder="Cappuccino"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="item-category">Category</label>
          <input
            id="item-category"
            name="category"
            required
            maxLength={50}
            placeholder="Coffee"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="item-price">Price (NPR)</label>
          <input
            id="item-price"
            name="price"
            type="number"
            required
            min="0"
            max="99999999.99"
            step="0.01"
            placeholder="250.00"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="item-image">Photo (optional)</label>

          <input
            id="item-image"
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-describedby="image-hint"
            className={inputClass}
          />

          <p id="image-hint" className="text-sm text-gray-600">
            JPG, PNG or WebP. Maximum 2 MB.
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Saving..." : "Add item"}
        </button>

        <p role="status" className="text-sm">
          {message}
        </p>
      </form>
    </section>
  );
}
