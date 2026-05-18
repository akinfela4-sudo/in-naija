import { scanNewsFeeds } from "@/lib/ai/scanner";
import { rewriteArticle, generateThumbnail } from "@/lib/ai/rewriter";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";
import { sendTelegramMessage, escapeMarkdown } from "@/lib/telegram";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * POST /api/newsroom/scan
 * Triggers the full AI news pipeline:
 * 1. Scans RSS feeds for trending Nigerian news
 * 2. Rewrites each article in English + Pidgin (zero plagiarism)
 * 3. Generates an AI thumbnail
 * 4. Saves as a draft pending Telegram approval
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

        // Notify the admin in Telegram of the new draft pending approval
        const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID || "";
        if (adminChatId) {
          const shortId = saved.id.split("-")[0];
          const cleanTitle = escapeMarkdown(rewritten.title_en);
          const cleanPidgin = escapeMarkdown(rewritten.title_pidgin);
          const cleanCategory = escapeMarkdown(rewritten.category_slug);
          const cleanSummary = escapeMarkdown(rewritten.summary);

          const draftMessage = `🔔 *New Draft Scanned & Pending!* \n\n` +
            `📰 *Title:* ${cleanTitle}\n` +
            `🇳🇬 *Pidgin:* ${cleanPidgin}\n` +
            `📂 *Category:* \`${cleanCategory}\`\n` +
            `📝 *Summary:* _${cleanSummary}_\n\n` +
            `👉 *Approve:* /approve\\_${shortId}\n` +
            `❌ *Reject:* /reject\\_${shortId}`;

          await sendTelegramMessage(adminChatId, draftMessage, "MarkdownV2");
        }
      } catch (innerErr: any) {
        console.error(`Failed to process article: ${article.title}`, innerErr);
      }
    }

    return NextResponse.json({
      success: true,
      scanned: rawArticles.length,
      inserted: results.length,
      results,
    });
  } catch (error: any) {
    console.error("Scan route error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
