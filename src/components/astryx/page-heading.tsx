import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import type { ReactNode } from "react";

export interface PageHeadingProps {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: ReactNode;
}

export function PageHeading({
  action,
  description,
  eyebrow,
  title,
}: PageHeadingProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <VStack gap={2}>
        {eyebrow ? (
          <Text color="accent" display="block" type="label">
            {eyebrow}
          </Text>
        ) : null}
        <Heading level={1} type="display-3">
          {title}
        </Heading>
        {description ? (
          <Text color="secondary" display="block" type="body">
            {description}
          </Text>
        ) : null}
      </VStack>
      {action ? <div className="shrink-0 sm:pt-1">{action}</div> : null}
    </header>
  );
}
