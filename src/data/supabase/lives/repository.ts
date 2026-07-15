import "server-only";

import type { SeasonMemberRole } from "@/domain/database/enums";
import type { SportsbookLive } from "@/fixtures/sportsbook/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import { mapLiveRow, type PersistedLivePresentationRow } from "./live-mappers";

export interface LiveMemberOption {
  userId: string;
  displayName: string;
  roles: SeasonMemberRole[];
}

type LiveAttendeeRow = {
  live_id: string;
  live_role: "HOST" | "REPORTER" | "VIEWER";
  user_id: string;
};

async function mapSeasonLives(
  rows: PersistedLivePresentationRow[],
): Promise<SportsbookLive[]> {
  if (!rows.length) return [];
  const supabase = await createServerSupabaseClient();
  const liveIds = rows.map((row) => row.id);
  const profileIds = [
    ...new Set(rows.flatMap((row) => (row.host_user_id ? [row.host_user_id] : []))),
  ];
  const [{ data: attendees, error: attendeesError }, { data: markets, error: marketsError }] =
    await Promise.all([
      supabase
        .from("live_attendees")
        .select("live_id,user_id,live_role")
        .in("live_id", liveIds),
      supabase.from("markets").select("live_id").in("live_id", liveIds),
    ]);
  if (attendeesError || marketsError) throw new Error("DATABASE_OPERATION_FAILED");

  const attendeeRows = (attendees ?? []) as LiveAttendeeRow[];
  for (const attendee of attendeeRows) profileIds.push(attendee.user_id);
  const uniqueProfileIds = [...new Set(profileIds)];
  const { data: profiles, error: profilesError } = uniqueProfileIds.length
    ? await supabase
        .from("profiles")
        .select("id,display_name")
        .in("id", uniqueProfileIds)
    : { data: [], error: null };
  if (profilesError) throw new Error("DATABASE_OPERATION_FAILED");

  const names = new Map(
    (profiles ?? []).map((profile) => [
      profile.id,
      profile.display_name ?? "Membre",
    ]),
  );
  const roleOrder: Record<LiveAttendeeRow["live_role"], number> = {
    HOST: 0,
    REPORTER: 1,
    VIEWER: 2,
  };

  return rows.map((row) => {
    const liveAttendees = attendeeRows
      .filter((attendee) => attendee.live_id === row.id)
      .toSorted(
        (left, right) =>
          roleOrder[left.live_role] - roleOrder[right.live_role] ||
          (names.get(left.user_id) ?? "").localeCompare(
            names.get(right.user_id) ?? "",
            "fr",
          ),
      );
    return mapLiveRow(row, {
      hostName: row.host_user_id ? (names.get(row.host_user_id) ?? null) : null,
      participantNames: liveAttendees.map(
        (attendee) => names.get(attendee.user_id) ?? "Membre",
      ),
      marketCount: (markets ?? []).filter((market) => market.live_id === row.id)
        .length,
    });
  });
}

export async function listSeasonLives(
  seasonId: string,
): Promise<SportsbookLive[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("live_sessions")
    .select(
      "id,title,live_type,status,scheduled_start,scheduled_end,host_user_id",
    )
    .eq("season_id", seasonId)
    .order("scheduled_start", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error("DATABASE_OPERATION_FAILED");
  return mapSeasonLives(data ?? []);
}

export async function getSeasonLive(
  seasonId: string,
  liveId: string,
): Promise<SportsbookLive | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("live_sessions")
    .select(
      "id,title,live_type,status,scheduled_start,scheduled_end,host_user_id",
    )
    .eq("season_id", seasonId)
    .eq("id", liveId)
    .maybeSingle();
  if (error) throw new Error("DATABASE_OPERATION_FAILED");
  if (!data) return null;
  return (await mapSeasonLives([data]))[0] ?? null;
}

export async function listActiveSeasonMembers(
  seasonId: string,
): Promise<LiveMemberOption[]> {
  const supabase = await createServerSupabaseClient();
  const { data: members, error: membersError } = await supabase
    .from("season_members")
    .select("user_id,role")
    .eq("season_id", seasonId)
    .eq("is_active", true);
  if (membersError) throw new Error("DATABASE_OPERATION_FAILED");
  const userIds = [...new Set((members ?? []).map((member) => member.user_id))];
  if (!userIds.length) return [];
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id,display_name")
    .in("id", userIds);
  if (profilesError) throw new Error("DATABASE_OPERATION_FAILED");
  const profileNames = new Map(
    (profiles ?? []).map((profile) => [
      profile.id,
      profile.display_name ?? "Membre",
    ]),
  );

  return userIds
    .map((userId) => ({
      userId,
      displayName: profileNames.get(userId) ?? "Membre",
      roles: (members ?? [])
        .filter((member) => member.user_id === userId)
        .map((member) => member.role),
    }))
    .toSorted((left, right) =>
      left.displayName.localeCompare(right.displayName, "fr"),
    );
}
