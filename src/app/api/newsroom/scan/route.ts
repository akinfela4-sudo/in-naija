import { scanNewsFeeds } from "@/lib/ai/scanner";
import { rewriteArticle, generateThumbnail } from "@/lib/ai/rewriter";
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * POST /api/newsroom/scan
 * Triggers the full AI news pipeline:
 * 1. Scans RSS feeds for trending Nigerian news
 * 2. Rewrites each article in English + Pidgin (zero plagiarism)
 * 3. Generates an AI thumbnail
 * 4. Saves as a draft pending WhatsApp approval
 *
 * Protected by CRON_SECRET header for Vercel Cron Jobs
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("🔍 In-Naija News Scanner: Starting feed scan...");
    const rawArticles = await scanNewsFeeds(5);
    console.log(`✅ Found ${rawArticles.length} trending articles.`);

    const results = [];

    for (const article of rawArticles) {
      try {
        // Check for duplicate source URLs
        const { data: existing } = await supabase
          .from("articles")
          .select("id")
          .eq("source_url", article.url)
          .single();

        if (existing) {
          console.log(`⏭️ Skipping duplicate: ${article.title}`);
          continue;
        }

        console.log(`✍️ Rewriting: "${article.title}"`);

        // AI rewrite: English + Pidgin
        const rewritten = await rewriteArticle(article.title, article.content, article.url);

        // Generate AI thumbnail (non-blocking)
        const thumbnailUrl =
          article.imageUrl || (await generateThumbnail(rewritten.title_en));

        // Save to Supabase as 'pending_approval' draft
        const { data: saved, error } = await supabase
          .from("articles")
          .insert({
            title_en: rewritten.title_en,
            title_pidgin: rewritten.title_pidgin,
            content_en: rewritten.content_en,
            content_pidgin: rewritten.content_pidgin,
            slug: rewritten.slug,
            category_slug: rewritten.category_slug,
            thumbnail_url: thumbnailUrl,
            source_url: article.url,
            status: "pending_approval",
          })
          .select()
          .single();

        if (error) {
          console.error("Supabase insert error:", error.message);
          continue;
        }

        results.push({
          id: saved.id,
          title: rewritten.title_en,
          slug: rewritten.slug,
          status: "pending_approval",
        });

        console.log(`✅ Saved draft: "${rewritten.title_en}" (ID: ${saved.id})`);
      } catch (articleError) {
        console.error(`Failed processing article "${article.title}":`, articleError);
      }
    }

    return NextResponse.json({
      success: true,
      scanned: rawArticles.length,
      processed: results.length,
      articles: results,
    });
  } catch (error) {
    console.error("News scan pipeline failed:", error);
    return NextResponse.json(
      { success: false, error: "Pipeline failed" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/newsroom/scan
 * Returns the current queue of pending articles
 */
export async function GET(request: Request) {
  const { data, error } = await supabase
    .from("articles")
    .select("id, title_en, title_pidgin, status, created_at, thumbnail_url, source_url")
    .in("status", ["pending_approval", "draft"])
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ articles: data });
}
