"use client";

import { Avatar } from "@astryxdesign/core/Avatar";
import { Badge } from "@astryxdesign/core/Badge";
import { DropdownMenu } from "@astryxdesign/core/DropdownMenu";
import Link from "next/link";
import { useState } from "react";

import { canSeeAdministration } from "@/application/sportsbook/navigation";
import type { SeasonMemberRole } from "@/domain/database/enums";

interface AccountMenuProps {
  seasonTitle: string;
  roles: readonly SeasonMemberRole[];
}

const roleLabels: Record<SeasonMemberRole, string> = {
  ADMIN: "Admin",
  LIVE_HOST: "Hôte live",
  REPORTER: "Déclarant",
  PLAYER: "Joueur",
  SUBJECT: "Sujet",
};

const menuItemClassName =
  "flex min-h-11 w-full items-center rounded-md px-3 py-2 text-left text-sm font-semibold hover:bg-white/10";

export function AccountMenu({ seasonTitle, roles }: AccountMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <DropdownMenu
      button={{
        icon: <Avatar name="Compte MK Bet" size={32} />,
        isIconOnly: true,
        label: "Ouvrir le menu du compte",
        size: "lg",
        style: { minHeight: 44, minWidth: 44 },
        variant: "ghost",
      }}
      isMenuOpen={isMenuOpen}
      menuWidth={256}
      onOpenChange={setIsMenuOpen}
      placement="below"
    >
      <div className="space-y-2 px-3 py-2" role="presentation">
        <p className="text-sm font-semibold">{seasonTitle}</p>
        <div className="flex flex-wrap gap-1.5">
          {roles.map((role) => (
            <Badge key={role} label={roleLabels[role]} variant="neutral" />
          ))}
        </div>
      </div>
      <Link
        className={menuItemClassName}
        href="/settings/account"
        onClick={() => setIsMenuOpen(false)}
        role="menuitem"
        tabIndex={-1}
      >
        Compte
      </Link>
      {canSeeAdministration(roles) ? (
        <Link
          className={menuItemClassName}
          href="/admin"
          onClick={() => setIsMenuOpen(false)}
          role="menuitem"
          tabIndex={-1}
        >
          Administration
        </Link>
      ) : null}
      <form action="/logout" method="post">
        <button
          className={menuItemClassName}
          onClick={() => setIsMenuOpen(false)}
          role="menuitem"
          tabIndex={-1}
          type="submit"
        >
          Déconnexion
        </button>
      </form>
    </DropdownMenu>
  );
}
