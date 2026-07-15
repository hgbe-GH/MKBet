import type { ReactNode } from "react";

export function PageIntro({
  action,
  description,
  eyebrow,
  title,
}: {
  action?: ReactNode;
  description?: ReactNode;
  eyebrow: string;
  title: ReactNode;
}) {
  return (
    <header className="mk-page-intro">
      <div className="min-w-0">
        <p className="mk-eyebrow">{eyebrow}</p>
        <h1 className="mk-display-title">{title}</h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
