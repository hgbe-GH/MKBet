import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { VStack } from "@astryxdesign/core/VStack";
import type { ReactNode } from "react";

export type AsyncStateKind = "loading" | "empty" | "error" | "not-configured";

export interface AsyncStateProps {
  kind: AsyncStateKind;
  title?: string;
  description?: string;
  action?: ReactNode;
}

const defaultContent: Record<
  Exclude<AsyncStateKind, "loading">,
  { title: string; description: string }
> = {
  empty: {
    title: "Aucun contenu",
    description: "Aucun élément n’est disponible pour le moment.",
  },
  error: {
    title: "Une erreur est survenue",
    description: "Impossible d’afficher ce contenu pour le moment.",
  },
  "not-configured": {
    title: "Configuration indisponible",
    description: "Cette fonctionnalité n’est pas disponible pour le moment.",
  },
};

export function AsyncState({
  action,
  description,
  kind,
  title,
}: AsyncStateProps) {
  if (kind === "loading") {
    const loadingLabel = title ?? "Chargement";

    return (
      <div aria-label={loadingLabel} role="status">
        <VStack gap={3}>
          <Skeleton height={144} index={0} width="100%" />
          <Skeleton height={208} index={1} width="100%" />
        </VStack>
        <span className="sr-only">{description ?? loadingLabel}</span>
      </div>
    );
  }

  const content = defaultContent[kind];

  return (
    <EmptyState
      actions={action}
      description={description ?? content.description}
      headingLevel={2}
      title={title ?? content.title}
    />
  );
}
