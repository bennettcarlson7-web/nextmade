"use client";

import { Trash2 } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { deleteMemberAction } from "@/app/admin/actions";

export function DeleteMemberButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteMemberAction.bind(null, id)}
      onSubmit={(e) => {
        if (!window.confirm(`Remove ${name} from the team and delete their photo? This can't be undone.`)) e.preventDefault();
      }}
    >
      <button type="submit" className={buttonClasses({ variant: "ghost", className: "text-danger-700 hover:bg-danger-50" })}>
        <Trash2 aria-hidden="true" className="size-4" />
        Delete<span className="sr-only"> {name}</span>
      </button>
    </form>
  );
}
