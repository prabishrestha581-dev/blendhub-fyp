"use client";

import { useState } from "react";
import MenuItemForm from "./menu-item-form";

type Props = {
  cafeId: string;
  item: {
    id: string;
    name: string;
    category: string;
    price: string;
  };
};

export default function MenuItemEditor({ cafeId, item }: Props) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setIsEditing(!isEditing)}
        aria-expanded={isEditing}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100"
      >
        {isEditing ? "Cancel editing" : "Edit item"}
      </button>

      {isEditing && (
        <MenuItemForm
          cafeId={cafeId}
          item={item}
          onSaved={() => setIsEditing(false)}
        />
      )}
    </div>
  );
}