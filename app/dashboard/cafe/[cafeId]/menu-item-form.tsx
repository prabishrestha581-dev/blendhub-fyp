"use client";

import { useId, useState } from "react";
import type { SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { createMenuItem, updateMenuItem } from "./actions";

type MenuItem = {
  id: string;
  name: string;
  category: string;
  price: string;
};

type Props = {
  cafeId: string;
  item?: MenuItem;
  onSaved?: () => void;
};

export default function MenuItemForm({ cafeId, item, onSaved }: Props) {
  const formId = useId();
  const isEditing = Boolean(item);
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
      const result = item
        ? await updateMenuItem(cafeId, item.id, formData)
        : await createMenuItem(cafeId, formData);

      if (result.error) {
        setMessage(result.error);
        return;
      }

      if (!item) form.reset();

      setMessage(item ? "Menu item updated." : "Menu item added.");
      router.refresh();
      onSaved?.();
    } catch {
      setMessage("Unable to connect. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const inputClass = "rounded-md border border-gray-300 px-3 py-2";

  return (
    <section className="mt-8 rounded-xl border border-gray-200 p-5">
      <h2 className="text-xl font-semibold">
        {isEditing ? "Edit menu item" : "Add menu item"}
      </h2>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor={`${formId}-name`}>Item name</label>
          <input
            id={`${formId}-name`}
            name="name"
            defaultValue={item?.name ?? ""}
            required
            maxLength={100}
            placeholder="Cappuccino"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={`${formId}-category`}>Category</label>
          <input
            id={`${formId}-category`}
            name="category"
            defaultValue={item?.category ?? ""}
            required
            maxLength={50}
            placeholder="Coffee"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={`${formId}-price`}>Price (NPR)</label>
          <input
            id={`${formId}-price`}
            name="price"
            type="number"
            defaultValue={item?.price ?? ""}
            required
            min="0"
            max="99999999.99"
            step="0.01"
            placeholder="250.00"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={`${formId}-image`}>
            {isEditing ? "Replace photo (optional)" : "Photo (optional)"}
          </label>

          <input
            id={`${formId}-image`}
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-describedby={`${formId}-image-hint`}
            className={inputClass}
          />

          <p id={`${formId}-image-hint`} className="text-sm text-gray-600">
            JPG, PNG or WebP. Maximum 2 MB.
            {isEditing && " Leave empty to keep the current photo."}
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Saving..." : isEditing ? "Save changes" : "Add item"}
        </button>

        <p role="status" className="text-sm">
          {message}
        </p>
      </form>
    </section>
  );
}
