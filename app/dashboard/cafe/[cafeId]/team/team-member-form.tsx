"use client";

import { useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { addTeamMember } from "./actions";

export default function TeamMemberForm({ cafeId }: { cafeId: string }) {
  const router = useRouter();
  const submitting = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;

    const form = event.currentTarget;
    const formData = new FormData(form);

    submitting.current = true;
    setIsLoading(true);
    setMessage("");

    try {
      const result = await addTeamMember(cafeId, formData);

      if (result.error) {
        setMessage(result.error);
        return;
      }

      form.reset();
      setMessage("Team member added.");
      router.refresh();
    } catch {
      setMessage("Unable to confirm the change. Refresh to check the team.");
    } finally {
      submitting.current = false;
      setIsLoading(false);
    }
  }

  return (
    <section className="mt-6 rounded-xl border p-5">
      <h2 className="text-xl font-semibold">Add team member</h2>
      <p className="mt-2 text-sm text-gray-600">
        Enter the email of someone who already has a BlendHub account.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <fieldset disabled={isLoading} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="member-email">Email</label>
            <input
              id="member-email"
              name="email"
              type="email"
              required
              maxLength={254}
              className="rounded-md border px-3 py-2"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="member-role">Role</label>
            <select
              id="member-role"
              name="role"
              defaultValue="staff"
              className="rounded-md border px-3 py-2"
            >
              <option value="staff">Staff</option>
              <option value="kitchen">Kitchen</option>
            </select>
          </div>

          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {isLoading ? "Adding..." : "Add member"}
          </button>
        </fieldset>

        <p role="status" className="text-sm">
          {message}
        </p>
      </form>
    </section>
  );
}