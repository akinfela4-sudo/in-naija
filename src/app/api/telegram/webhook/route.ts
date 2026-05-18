import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { distributeToAllPlatforms } from "@/lib/social/distributor";

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
  try {
    const { data: article, error } = await supabase
      .from("articles")
      .update({ status: "published" })
      .eq("id", articleId)
      .eq("status", "pending_approval")
      .select()
      .single();

    if (error || !article) {
      // Sometimes user might pass a partial ID. Let's try matching via ilike if exact fails
      const { data: fuzzyMatch } = await supabase
        .from("articles")
        .select("id")
        .eq("status", "pending_approval")
        .ilike("id", `${articleId}%`)
        .single();
        
      if (fuzzyMatch) {
         // Approve the fuzzy matched one
         const { data: fuzzyArticle, error: fuzzyError } = await supabase
           .from("articles")
           .update({ status: "published" })
           .eq("id", fuzzyMatch.id)
           .select()
           .single();
           
         if (fuzzyError || !fuzzyArticle) throw fuzzyError || new Error("Failed fuzzy match approval");
         
         // Continue with the fuzzy approved article
         return await distributeAndNotify(fuzzyArticle, chatId);
      }

      await sendTelegramMessage(
        chatId,
        `❌ Could not approve article \`${articleId}\`.\nIt may not exist or is already published.`,
        "Markdown"
      );
      return NextResponse.json({ status: "not_found" });
    }

    return await distributeAndNotify(article, chatId);
  } catch (err) {
    console.error("Approve handler error:", err);
    await sendTelegramMessage(chatId, `❌ Approval failed due to a server error. Check the logs.`);
    return NextResponse.json({ status: "error" }, { status: 500 });
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
    
    const { data: checkData } = await supabase
      .from("articles")
      .select("id, title_en")
      .ilike("id", `${articleId}%`)
      .eq("status", "pending_approval")
      .single();

    if (checkData) {
      targetId = checkData.id;
    }

    const { error } = await supabase
      .from("articles")
      .delete()
      .eq("id", targetId)
      .eq("status", "pending_approval");

    if (error || !checkData) {
      await sendTelegramMessage(chatId, `❌ Article \`${articleId}\` not found or already processed.`, "Markdown");
    } else {
      await sendTelegramMessage(
        chatId,
        `🗑️ *Article Rejected & Deleted*\n\n"${escapeMarkdown(checkData.title_en)}"\n\nSend /list to see remaining drafts.`,
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
    const { data } = await supabase
      .from("articles")
      .select("title_en, status, created_at")
      .ilike("id", `${articleId}%`)
      .single();

    if (!data) {
      await sendTelegramMessage(chatId, `❌ No article found matching ID \`${articleId}\`.`, "Markdown");
    } else {
      const statusEmoji: Record<string, string> = {
        draft: "📝",
        pending_approval: "⏳",
        published: "✅",
      };
      
      await sendTelegramMessage(
        chatId,
        `📊 *Article Status*\n\n"${escapeMarkdown(data.title_en)}"\n\nStatus: ${statusEmoji[data.status] || "❓"} ${escapeMarkdown(data.status)}\nCreated: ${escapeMarkdown(new Date(data.created_at).toLocaleString("en-NG", { timeZone: "Africa/Lagos" }))}`,
        "MarkdownV2"
      );
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("Status handler error:", err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}

// ─── TELEGRAM MESSAGE SENDER ───────────────────────────────────────────────────

/**
 * Escapes characters for Telegram MarkdownV2
 */
function escapeMarkdown(text: string): string {
  if (!text) return "";
  // Characters that need escaping in MarkdownV2: _ * [ ] ( ) ~ ` > # + - = | { } . !
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

/**
 * Sends a Telegram message to a specific chat ID
 */
async function sendTelegramMessage(chatId: string, text: string, parseMode?: "Markdown" | "MarkdownV2" | "HTML"): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn("Telegram bot token not set — skipping message send.");
    return;
  }

  const apiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  const payload: any = {
    chat_id: chatId,
    text: text,
  };
  
  if (parseMode) {
    payload.parse_mode = parseMode;
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Telegram send failed (${response.status}):`, errorText);
    }
  } catch (err) {
    console.error("Telegram request failed:", err);
  }
}
