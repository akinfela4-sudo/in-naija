import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { distributeToAllPlatforms } from "@/lib/social/distributor";
import { sendTelegramMessage, escapeMarkdown } from "@/lib/telegram";

export const dynamic = "force-dynamic";

// Configuration from environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || "";
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || "";

/**
 * POST /api/telegram/webhook
 * Receives incoming Telegram messages from the bot webhook.
 *
 * Supported commands:
 *   /approve_<id> or /approve <id> -> publishes the article + distributes to social
 *   /reject_<id>  or /reject <id>  -> deletes the draft
 *   /list                          -> returns a summary of pending articles
 *   /status_<id>  or /status <id>  -> returns status of a specific article
 */
export async function POST(request: Request) {
  try {
    // Optional security check if webhook was set with a secret token
    const secretToken = request.headers.get("x-telegram-bot-api-secret-token");
    if (TELEGRAM_WEBHOOK_SECRET && secretToken !== TELEGRAM_WEBHOOK_SECRET) {
      console.warn("Unauthorized Telegram webhook attempt (invalid secret token).");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const update = await request.json();

    // Check if it's a message event
    if (!update.message || !update.message.text) {
      return NextResponse.json({ status: "ok" });
    }

    const messageText: string = update.message.text.trim();
    const chatId: string = update.message.chat.id.toString();

    // Restrict access to the designated admin chat ID
    if (chatId !== TELEGRAM_ADMIN_CHAT_ID) {
      console.warn(`Unauthorized Telegram access attempt from chat ID: ${chatId}`);
      await sendTelegramMessage(chatId, "⛔ You are not authorized to use this bot.");
      return NextResponse.json({ status: "ok" }); // Return 200 so Telegram stops retrying
    }

    console.log(`💬 Telegram command received: "${messageText}"`);

    // Parse commands
    // We support both space-separated (e.g. "/approve 123") and underscore-separated (e.g. "/approve_123")
    const commandMatch = messageText.match(/^\/(approve|reject|list|status)(?:_|\s+)?(.*)?$/i);

    if (!commandMatch) {
      await sendTelegramMessage(
        chatId,
        `🤖 *In-Naija AI Newsroom*\n\nUnknown command. Available commands:\n` +
        `• /approve_id — Publish an article\n` +
        `• /reject_id — Delete a draft\n` +
        `• /list — Show pending articles\n` +
        `• /status_id — Check article status`,
        "Markdown"
      );
      return NextResponse.json({ status: "ok" });
    }

    const command = commandMatch[1].toLowerCase();
    const argument = (commandMatch[2] || "").trim().toLowerCase();

    if (command === "approve" && argument) {
      return await handleApprove(argument, chatId);
    }

    if (command === "reject" && argument) {
      return await handleReject(argument, chatId);
    }

    if (command === "list") {
      return await handleList(chatId);
    }

    if (command === "status" && argument) {
      return await handleStatus(argument, chatId);
    }

    // Default catch-all
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}

// ─── HANDLERS ─────────────────────────────────────────────────────────────────

async function handleApprove(articleId: string, chatId: string): Promise<Response> {
  let debugInfo: any = {};
  try {
    let article = null;
    
    // Check for exact UUID first
    if (articleId.length === 36) {
      const { data, error } = await supabase
        .from("articles")
        .update({ status: "published" })
        .eq("id", articleId)
        .eq("status", "pending_approval")
        .select()
        .single();
      article = data;
      if (error) debugInfo.exactError = error.message;
    }

    // Find matching pending article in JS to avoid UUID cast errors in Supabase ilike
    const { data: pending, error: pendingError } = await supabase
      .from("articles")
      .select("id")
      .eq("status", "pending_approval");

    debugInfo.pendingCount = pending?.length || 0;
    if (pendingError) debugInfo.pendingError = pendingError.message;

    if (!article && pending) {
      const matched = pending.find(a => a.id.startsWith(articleId));
      debugInfo.matchedId = matched ? matched.id : null;
      
      if (matched) {
         const { data, error } = await supabase
           .from("articles")
           .update({ status: "published" })
           .eq("id", matched.id)
           .select()
           .single();
           
         if (error || !data) {
           debugInfo.fuzzyUpdateError = error?.message || "No data returned";
         } else {
           article = data;
         }
      }
    }

    if (!article) {
      await sendTelegramMessage(
        chatId,
        `❌ Could not approve article \`${articleId}\`.\nIt may not exist or is already published.`,
        "Markdown"
      );
      return NextResponse.json({ 
        status: "not_found",
        debug: {
          hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          articleId,
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "MISSING_URL",
          supabaseKeyPrefix: (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").slice(0, 15),
          ...debugInfo
        }
      });
    }

    return await distributeAndNotify(article, chatId);
  } catch (err: any) {
    console.error("Approve handler error:", err);
    await sendTelegramMessage(chatId, `❌ Approval failed due to a server error. Check the logs.`);
    return NextResponse.json({ status: "error", error: err.message, debug: debugInfo }, { status: 500 });
  }
}

async function distributeAndNotify(article: any, chatId: string): Promise<Response> {
  // Distribute to all social platforms in parallel
  const distribution = await distributeToAllPlatforms({
    id: article.id,
    title_en: article.title_en,
    title_pidgin: article.title_pidgin,
    content_en: article.content_en,
    slug: article.slug,
    thumbnail_url: article.thumbnail_url,
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://in-naija.vercel.app";

  const socialStatus = [
    `${distribution.twitter ? "✅" : "❌"} X (Twitter)`,
    `${distribution.facebook ? "✅" : "❌"} Facebook`,
    `${distribution.instagram ? "✅" : "❌"} Instagram`,
  ].join("\n");

  await sendTelegramMessage(
    chatId,
    `✅ *Article Published!*\n\n` +
    `📰 *${escapeMarkdown(article.title_en)}*\n` +
    `🇳🇬 ${escapeMarkdown(article.title_pidgin)}\n\n` +
    `[Read on In-Naija](${siteUrl}/news/${article.slug})\n\n` +
    `*Social Distribution:*\n${socialStatus}`,
    "MarkdownV2" // Using MarkdownV2 for inline links
  );

  return NextResponse.json({ status: "approved", distribution });
}

async function handleReject(articleId: string, chatId: string): Promise<Response> {
  try {
    let targetId = articleId;
    let title = "";

    // Check exact first
    if (articleId.length === 36) {
      const { data } = await supabase
        .from("articles")
        .select("id, title_en")
        .eq("id", articleId)
        .eq("status", "pending_approval")
        .single();
      if (data) {
        targetId = data.id;
        title = data.title_en;
      }
    }

    if (!title) {
      // Find matching pending article in JS to avoid UUID cast errors in Supabase ilike
      const { data: pending } = await supabase
        .from("articles")
        .select("id, title_en")
        .eq("status", "pending_approval");

      const matched = pending?.find(a => a.id.startsWith(articleId));
      if (matched) {
        targetId = matched.id;
        title = matched.title_en;
      }
    }

    if (!title) {
      await sendTelegramMessage(chatId, `❌ Article \`${articleId}\` not found or already processed.`, "Markdown");
      return NextResponse.json({ status: "not_found" });
    }

    const { error } = await supabase
      .from("articles")
      .delete()
      .eq("id", targetId)
      .eq("status", "pending_approval");

    if (error) {
      await sendTelegramMessage(chatId, `❌ Rejection failed due to a server error.`);
    } else {
      await sendTelegramMessage(
        chatId,
        `🗑️ *Article Rejected & Deleted*\n\n"${escapeMarkdown(title)}"\n\nSend /list to see remaining drafts.`,
        "MarkdownV2"
      );
    }

    return NextResponse.json({ status: "rejected" });
  } catch (err) {
    console.error("Reject handler error:", err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}

async function handleList(chatId: string): Promise<Response> {
  try {
    const { data } = await supabase
      .from("articles")
      .select("id, title_en, created_at")
      .eq("status", "pending_approval")
      .order("created_at", { ascending: false })
      .limit(10);

    if (!data || data.length === 0) {
      await sendTelegramMessage(chatId, `📭 No articles pending approval right now.\n\nNew articles will appear here after the next scan.`);
    } else {
      let listMessage = `📋 *Pending Approval (${data.length})*\n\n`;
      
      data.forEach((a, i) => {
        const shortId = a.id.split("-")[0];
        listMessage += `${i + 1}\\. *${escapeMarkdown(a.title_en.slice(0, 60))}...*\n`;
        listMessage += `ID: \`${shortId}\`\n`;
        listMessage += `Approve: /approve\\_${shortId}\n`;
        listMessage += `Reject: /reject\\_${shortId}\n\n`;
      });

      await sendTelegramMessage(chatId, listMessage, "MarkdownV2");
    }

    return NextResponse.json({ status: "listed" });
  } catch (err) {
    console.error("List handler error:", err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}

async function handleStatus(articleId: string, chatId: string): Promise<Response> {
  try {
    let article = null;

    if (articleId.length === 36) {
      const { data } = await supabase
        .from("articles")
        .select("title_en, status, created_at")
        .eq("id", articleId)
        .single();
      article = data;
    }

    if (!article) {
      // Query recent ones to find fuzzy match
      const { data: recent } = await supabase
        .from("articles")
        .select("id, title_en, status, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      const matched = recent?.find(a => a.id.startsWith(articleId));
      article = matched;
    }

    if (!article) {
      await sendTelegramMessage(chatId, `❌ No article found matching ID \`${articleId}\`.`, "Markdown");
    } else {
      const statusEmoji: Record<string, string> = {
        draft: "📝",
        pending_approval: "⏳",
        published: "✅",
      };
      
      await sendTelegramMessage(
        chatId,
        `📊 *Article Status*\n\n"${escapeMarkdown(article.title_en)}"\n\nStatus: ${statusEmoji[article.status] || "❓"} ${escapeMarkdown(article.status)}\nCreated: ${escapeMarkdown(new Date(article.created_at).toLocaleString("en-NG", { timeZone: "Africa/Lagos" }))}`,
        "MarkdownV2"
      );
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("Status handler error:", err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
