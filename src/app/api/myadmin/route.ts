import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { distributeToAllPlatforms } from "@/lib/social/distributor";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/myadmin
 * Returns dashboard statistics, popular articles, and polls list
 */
export async function GET() {
  try {
    // 1. Fetch article stats (counts by status and views)
    const { data: statusCounts, error: statsError } = await supabase
      .from("articles")
      .select("status, views_count");

    if (statsError) throw statsError;

    const stats = {
      draft: 0,
      pending_approval: 0,
      published: 0,
      total_views: 0,
    };

    statusCounts?.forEach((a) => {
      if (a.status === "draft") stats.draft++;
      if (a.status === "pending_approval") stats.pending_approval++;
      if (a.status === "published") stats.published++;
      stats.total_views += (a.views_count || 0);
    });

    // 2. Fetch popular articles (by views_count)
    const { data: popular, error: popularError } = await supabase
      .from("articles")
      .select("id, title_en, views_count, status, created_at")
      .order("views_count", { ascending: false })
      .limit(5);

    if (popularError) throw popularError;

    // 3. Fetch active polls
    const { data: polls, error: pollsError } = await supabase
      .from("polls")
      .select("id, question, options, is_active, created_at")
      .order("created_at", { ascending: false });

    if (pollsError) throw pollsError;

    // 4. Fetch poll responses to count votes per poll
    const { data: votes, error: votesError } = await supabase
      .from("poll_responses")
      .select("poll_id");

    if (votesError) throw votesError;

    const pollVoteCounts: Record<string, number> = {};
    votes?.forEach((v) => {
      pollVoteCounts[v.poll_id] = (pollVoteCounts[v.poll_id] || 0) + 1;
    });

    const pollsWithVotes = polls?.map((p) => ({
      ...p,
      votes_count: pollVoteCounts[p.id] || 0,
    })) || [];

    return NextResponse.json({
      success: true,
      stats,
      popular,
      polls: pollsWithVotes,
    });
  } catch (err: any) {
    console.error("MyAdmin analytics GET error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/myadmin
 * Core administration actions:
 * - Create a manual article
 * - Create a poll
 * - Toggle social sharing options
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // Action A: Create manual article
    if (action === "create_article") {
      const { title_en, title_pidgin, content_en, content_pidgin, category_slug, status, thumbnail_url, should_tweet } = body;
      
      const slug = title_en
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

      const { data: saved, error } = await supabase
        .from("articles")
        .insert({
          title_en,
          title_pidgin,
          content_en,
          content_pidgin,
          slug,
          category_slug,
          status: status || "draft",
          thumbnail_url,
          source_url: "manual-cms",
        })
        .select()
        .single();

      if (error) throw error;

      // Automatically publish to Twitter if requested and status is published
      if (status === "published" && should_tweet) {
        try {
          await distributeToAllPlatforms({
            id: saved.id,
            title_en: saved.title_en,
            title_pidgin: saved.title_pidgin,
            content_en: saved.content_en,
            slug: saved.slug,
            thumbnail_url: saved.thumbnail_url,
          });
        } catch (tweetErr) {
          console.error("Auto manual tweet failed:", tweetErr);
        }
      }

      return NextResponse.json({ success: true, article: saved });
    }

    // Action B: Create poll
    if (action === "create_poll") {
      const { question, description, options, ends_at } = body;

      const { data: poll, error } = await supabase
        .from("polls")
        .insert({
          question,
          description,
          options, // Expected format: [{"id": 1, "text": "Option A"}, ...]
          ends_at,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, poll });
    }

    // Action C: Toggle active status of a poll
    if (action === "toggle_poll") {
      const { poll_id, is_active } = body;

      const { data: poll, error } = await supabase
        .from("polls")
        .update({ is_active })
        .eq("id", poll_id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, poll });
    }

    return NextResponse.json({ error: "Unknown action parameter" }, { status: 400 });
  } catch (err: any) {
    console.error("MyAdmin POST action error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
