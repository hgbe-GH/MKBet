import "server-only";

import { EventApplicationError } from "@/application/events/event-errors";
import type {
  EventReportView,
  EventReportStatus,
  EventReportType,
  EventVoteDecision,
  ReportableMarket,
} from "@/domain/events/types";
import { asRpcClient } from "@/data/supabase/rpc";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface EventEvidenceInput {
  storage_path: string;
  caption: string | null;
  taken_at: string | null;
}

export interface SubmitEventReportInput {
  reportType: EventReportType;
  occurredAt: string;
  note: string;
  marketId: string | null;
  outcomeId: string | null;
  media: EventEvidenceInput[];
  idempotencyKey: string;
}

export interface EventReportRpcPayload {
  report_id: string;
  status: EventReportStatus;
  [key: string]: unknown;
}

export async function listEventReports(
  currentUserId: string,
  status?: EventReportStatus,
): Promise<EventReportView[]> {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("event_reports")
    .select(
      "id,author_user_id,report_type,occurred_at,declared_at,note,status,market_id,outcome_id",
    )
    .eq("season_id", await ensureSingleRoomAccess())
    .order("declared_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data: reports, error } = await query;
  if (error) throw new EventApplicationError("EVENT_OPERATION_FAILED");
  if (!reports?.length) return [];

  const reportIds = reports.map((report) => report.id);
  const authorIds = [...new Set(reports.map((report) => report.author_user_id))];
  const marketIds = reports.flatMap((report) =>
    report.market_id ? [report.market_id] : [],
  );
  const outcomeIds = reports.flatMap((report) =>
    report.outcome_id ? [report.outcome_id] : [],
  );

  const [profilesResult, votesResult, mediaLinksResult, marketsResult, outcomesResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id,display_name,avatar_url")
        .in("id", authorIds),
      supabase
        .from("event_report_votes")
        .select("report_id,user_id,decision")
        .in("report_id", reportIds),
      supabase
        .from("event_report_media")
        .select("report_id,media_asset_id")
        .in("report_id", reportIds),
      marketIds.length
        ? supabase.from("markets").select("id,title").in("id", marketIds)
        : Promise.resolve({ data: [], error: null }),
      outcomeIds.length
        ? supabase
            .from("market_outcomes")
            .select("id,label")
            .in("id", outcomeIds)
        : Promise.resolve({ data: [], error: null }),
    ]);
  if (
    profilesResult.error ||
    votesResult.error ||
    mediaLinksResult.error ||
    marketsResult.error ||
    outcomesResult.error
  ) {
    throw new EventApplicationError("EVENT_OPERATION_FAILED");
  }

  const mediaIds = (mediaLinksResult.data ?? []).map(
    (link) => link.media_asset_id,
  );
  const { data: media, error: mediaError } = mediaIds.length
    ? await supabase
        .from("media_assets")
        .select("id,caption,media_type")
        .in("id", mediaIds)
    : { data: [], error: null };
  if (mediaError) throw new EventApplicationError("EVENT_OPERATION_FAILED");

  const voterIds = [
    ...new Set((votesResult.data ?? []).map((vote) => vote.user_id)),
  ].filter((id) => !authorIds.includes(id));
  const { data: voterProfiles, error: voterProfilesError } = voterIds.length
    ? await supabase
        .from("profiles")
        .select("id,display_name,avatar_url")
        .in("id", voterIds)
    : { data: [], error: null };
  if (voterProfilesError) {
    throw new EventApplicationError("EVENT_OPERATION_FAILED");
  }

  const profiles = new Map(
    [...(profilesResult.data ?? []), ...(voterProfiles ?? [])].map((profile) => [
      profile.id,
      profile,
    ]),
  );
  const markets = new Map(
    (marketsResult.data ?? []).map((market) => [market.id, market]),
  );
  const outcomes = new Map(
    (outcomesResult.data ?? []).map((outcome) => [outcome.id, outcome]),
  );
  const mediaById = new Map((media ?? []).map((asset) => [asset.id, asset]));

  return reports.map((report) => {
    const reportVotes = (votesResult.data ?? []).filter(
      (vote) => vote.report_id === report.id,
    );
    const author = profiles.get(report.author_user_id);
    const linkedMarket = report.market_id
      ? markets.get(report.market_id)
      : undefined;
    const linkedOutcome = report.outcome_id
      ? outcomes.get(report.outcome_id)
      : undefined;
    return {
      id: report.id,
      author: {
        id: report.author_user_id,
        displayName: author?.display_name ?? "Membre MK Bet",
        avatarUrl: author?.avatar_url ?? null,
      },
      reportType: report.report_type,
      occurredAt: report.occurred_at,
      declaredAt: report.declared_at,
      note: report.note,
      status: report.status,
      evidence: (mediaLinksResult.data ?? [])
        .filter((link) => link.report_id === report.id)
        .flatMap((link) => {
          const asset = mediaById.get(link.media_asset_id);
          return asset
            ? [{ id: asset.id, caption: asset.caption, mediaType: asset.media_type }]
            : [];
        }),
      market:
        linkedMarket && linkedOutcome
          ? {
              id: linkedMarket.id,
              title: linkedMarket.title,
              outcomeLabel: linkedOutcome.label,
            }
          : null,
      votes: {
        confirmCount: reportVotes.filter((vote) => vote.decision === "CONFIRM")
          .length,
        rejectCount: reportVotes.filter((vote) => vote.decision === "REJECT")
          .length,
        currentUserDecision:
          reportVotes.find((vote) => vote.user_id === currentUserId)?.decision ??
          null,
        voters: reportVotes.map((vote) => ({
          displayName:
            profiles.get(vote.user_id)?.display_name ?? "Membre MK Bet",
          decision: vote.decision,
        })),
      },
    } satisfies EventReportView;
  });
}

export async function listReportableMarkets(): Promise<ReportableMarket[]> {
  const supabase = await createServerSupabaseClient();
  const roomId = await ensureSingleRoomAccess();
  const { data: markets, error } = await supabase
    .from("markets")
    .select("id,title,event_code")
    .eq("season_id", roomId)
    .eq("status", "OPEN")
    .in("event_code", ["KISS", "OFFICIAL_COUPLE"])
    .order("title");
  if (error) throw new EventApplicationError("EVENT_OPERATION_FAILED");
  if (!markets?.length) return [];

  const { data: outcomes, error: outcomeError } = await supabase
    .from("market_outcomes")
    .select("id,market_id,label,code")
    .in(
      "market_id",
      markets.map((market) => market.id),
    )
    .eq("code", "YES");
  if (outcomeError) throw new EventApplicationError("EVENT_OPERATION_FAILED");

  return markets.map((market) => ({
    id: market.id,
    title: market.title,
    outcomes: (outcomes ?? [])
      .filter((outcome) => outcome.market_id === market.id)
      .map((outcome) => ({ id: outcome.id, label: outcome.label })),
  }));
}

export async function ensureSingleRoomAccess(): Promise<string> {
  const { data, error } = await asRpcClient(
    await createServerSupabaseClient(),
  ).rpc<string>("ensure_single_room_access");
  if (error || typeof data !== "string") {
    throw new EventApplicationError("EVENT_OPERATION_FAILED");
  }
  return data;
}

export async function submitEventReport(
  input: SubmitEventReportInput,
): Promise<EventReportRpcPayload> {
  const { data, error } = await asRpcClient(
    await createServerSupabaseClient(),
  ).rpc<EventReportRpcPayload>("submit_event_report", {
    p_report_type: input.reportType,
    p_occurred_at: input.occurredAt,
    p_note: input.note,
    p_market_id: input.marketId,
    p_outcome_id: input.outcomeId,
    p_media: input.media,
    p_idempotency_key: input.idempotencyKey,
  });
  if (error || !data) {
    throw new EventApplicationError("EVENT_OPERATION_FAILED");
  }
  return data;
}

export async function voteEventReport(
  reportId: string,
  decision: EventVoteDecision,
): Promise<EventReportRpcPayload> {
  const { data, error } = await asRpcClient(
    await createServerSupabaseClient(),
  ).rpc<EventReportRpcPayload>("vote_event_report", {
    p_report_id: reportId,
    p_decision: decision,
  });
  if (error || !data) {
    throw new EventApplicationError(
      "EVENT_OPERATION_FAILED",
      error?.message,
    );
  }
  return data;
}
