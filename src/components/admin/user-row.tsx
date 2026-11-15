"use client";

import { useActionState } from "react";

import type { Role } from "@/generated/prisma/enums";
import { ROLE_LABEL } from "@/lib/auth-forms";
import { cn } from "@/lib/cn";
import { changeUserRole, resendInvite, toggleUserActive } from "@/server/admin/users";

import { tdClass } from "./ui";

export type UserRowData = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  isActive: boolean;
  hasPassword: boolean;
  lastLogin: string | null;
};

const smallButton = "text-caption text-ink-muted underline underline-offset-4 transition-colors hover:text-ink disabled:opacity-50";

/** Red u tabeli korisnika: uloga, uključen/isključen, ponovna pozivnica. Sopstveni nalog se ne menja. */
export function UserRow({ user, isSelf }: { user: UserRowData; isSelf: boolean }) {
  const [roleState, roleAction, rolePending] = useActionState(changeUserRole, null);
  const [activeState, activeAction, activePending] = useActionState(toggleUserActive, null);
  const [inviteState, inviteAction, invitePending] = useActionState(resendInvite, null);
  const feedback = roleState ?? activeState ?? inviteState;

  return (
    <tr className={cn(!user.isActive && "opacity-60")}>
      <td className={tdClass}>
        <p className="text-ink">{user.name ?? "—"}</p>
        <p className="text-caption text-ink-muted">{user.email}</p>
      </td>
      <td className={tdClass}>
        {isSelf ? (
          <span className="text-ink">{ROLE_LABEL[user.role]} (vi)</span>
        ) : (
          <form action={roleAction} className="flex items-center gap-3">
            <input type="hidden" name="userId" value={user.id} />
            <select
              name="role"
              defaultValue={user.role}
              aria-label={`Uloga: ${user.email}`}
              className="h-9 border border-hairline bg-transparent px-2 text-body text-ink outline-none focus:border-ink"
            >
              {(Object.keys(ROLE_LABEL) as Role[]).map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABEL[role]}
                </option>
              ))}
            </select>
            <button type="submit" disabled={rolePending} className={smallButton}>
              Sačuvaj
            </button>
          </form>
        )}
      </td>
      <td className={`${tdClass} whitespace-nowrap text-ink-muted`}>
        {!user.hasPassword ? "Poziv poslat" : (user.lastLogin ?? "Nikad")}
      </td>
      <td className={tdClass}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {!isSelf ? (
            <form action={activeAction}>
              <input type="hidden" name="userId" value={user.id} />
              <button type="submit" disabled={activePending} className={smallButton}>
                {user.isActive ? "Isključi" : "Uključi"}
              </button>
            </form>
          ) : null}
          {!user.hasPassword && user.isActive ? (
            <form action={inviteAction}>
              <input type="hidden" name="userId" value={user.id} />
              <button type="submit" disabled={invitePending} className={smallButton}>
                Pošalji poziv ponovo
              </button>
            </form>
          ) : null}
        </div>
        {feedback?.error ? <p className="mt-1 text-caption text-accent">{feedback.error}</p> : null}
        {feedback?.message ? <p className="mt-1 text-caption text-ink-muted">{feedback.message}</p> : null}
      </td>
    </tr>
  );
}