import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";

interface StatusPageProps {
  eyebrow: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function StatusPage({
  eyebrow,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: StatusPageProps) {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-5 py-12 text-white">
      <div
        aria-hidden="true"
        className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-[var(--brand)]/25 blur-3xl"
      />
      <Card className="relative w-full" maxWidth="36rem" padding={8}>
        <VStack gap={4}>
          <Badge label={eyebrow} variant="red" />
          <Heading level={1}>{title}</Heading>
          <Text as="p" color="secondary">
            {description}
          </Text>
          {actionLabel && actionHref ? (
            <Button
              href={actionHref}
              label={actionLabel}
              size="lg"
              variant="primary"
            />
          ) : null}
          {actionLabel && onAction ? (
            <Button
              label={actionLabel}
              onClick={onAction}
              size="lg"
              variant="primary"
            />
          ) : null}
        </VStack>
      </Card>
    </main>
  );
}
