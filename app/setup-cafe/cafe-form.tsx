"use client";

import { useActionState } from "react";
import { createCafe } from "./actions";
export default function CafeForm() {
  const [state, formAction, isPending] = useActionState(createCafe, {
    error: "",
  });
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="cafe-name">Café name</label>
        <input
          id="cafe-name"
          name="name"
          type="text"
          required
          maxLength={100}
          placeholder="Enter your café's name"
          className="rounded-md border border-gray-300 p-2"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-blue-500 px-4 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Creating café..." : "Create Café"}
      </button>

      <p role="status" className="text-sm text-red-600">
        {state.error}
      </p>
    </form>
  );
}
