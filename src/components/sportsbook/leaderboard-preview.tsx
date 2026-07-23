import { Badge } from "@astryxdesign/core/Badge";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { List, ListItem } from "@astryxdesign/core/List";
import { VStack } from "@astryxdesign/core/VStack";

import type { LeaderboardRow } from "@/fixtures/sportsbook/types";

export function LeaderboardPreview({ rows }: { rows: LeaderboardRow[] }) {
  return (
    <section aria-labelledby="leaderboard-preview-title">
      <Card padding={5}>
        <VStack gap={3}>
          <Heading id="leaderboard-preview-title" level={2}>
            Podium
          </Heading>
          <List density="compact" hasDividers>
            {rows.slice(0, 3).map((row) => (
              <ListItem
                endContent={
                  <Badge label={`${row.capitalMkb} MKB`} variant="neutral" />
                }
                key={row.userId}
                label={`#${row.rank} ${row.playerName}`}
              />
            ))}
          </List>
        </VStack>
      </Card>
    </section>
  );
}
