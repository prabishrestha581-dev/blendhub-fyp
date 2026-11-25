"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { changeTeamMemberRole, removeTeamMember } from "./actions";

type Props = {
  cafeId: string;
  memberUserId: string;
  memberName: string;
  currentRole: string;
};

export default function TeamMemberControls({
  cafeId,
  memberUserId,
  memberName,
  currentRole,
}: Props) {
  const router = useRouter();
  const submitting = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleAction(action: "change" | "remove") {
    if (submitting.current) return;

    if (
      action === "remove" &&
      !window.confirm(`Remove ${memberName}'s access to this café?`)
    ) {
      return;
    }

    submitting.current = true;
    setIsLoading(true);
    setMessage("");

    try {
      const result =
        action === "remove"
          ? await removeTeamMember(cafeId, memberUserId)
          : await changeTeamMemberRole(
              cafeId,
              memberUserId,
              currentRole === "staff" ? "kitchen" : "staff",
            );

      if (result.error) {
        setMessage(result.error);
      } else {
        setMessage(
          action === "remove" ? "Member removed." : "Role updated.",
        );
      }

      router.refresh();
    } catch {
      setMessage("Unable to confirm the change. Refresh to check the team.");
    } finally {
      submitting.current = false;
      setIsLoading(false);
    }
  }

  if (currentRole !== "staff" && currentRole !== "kitchen") {
    return null;
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleAction("change")}
          disabled={isLoading}
          className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {isLoading
            ? "Updating..."
            : currentRole === "staff"
              ? "Change to kitchen"
              : "Change to staff"}
        </button>

        <button
          type="button"
          onClick={() => handleAction("remove")}
          disabled={isLoading}
          className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          Remove member
        </button>
      </div>

      <p role="status" className="mt-2 text-sm">
        {message}
      </p>
    </div>
  );
}