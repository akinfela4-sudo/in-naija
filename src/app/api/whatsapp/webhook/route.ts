import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || "in-naija-webhook";

/**
 * GET /api/whatsapp/webhook
 * Meta webhook verification challenge.
 * Set this URL in your Meta App Dashboard → Webhooks.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ WhatsApp webhook verified.");
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

/**
 * POST /api/whatsapp/webhook
 * Receives incoming WhatsApp messages from the admin.
 *
 * Expected message format from admin:
 *   "APPROVE <article-id>"    → publishes the article + distributes to social
 *   "REJECT <article-id>"     → deletes the draft
 *   "LIST"                    → returns a summary of pending articles
 *   "STATUS <article-id>"     → returns status of a specific article
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // WhatsApp sends updates inside body.entry[0].changes[0].value
    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (!value?.messages) {
      // Not a message event (e.g., status update) — acknowledge and ignore
      return NextResponse.json({ status: "ok" });
    }

    const message = value.messages[0];
    const fromNumber = message.from; // Admin's WhatsApp number
    const messageText: string = (message.text?.body || "").trim().toUpperCase();

    console.log(`📱 WhatsApp message from ${fromNumber}: "${messageText}"`);

    // Route to appropriate handler
    if (messageText.startsWith("APPROVE ")) {
      const articleId = messageText.replace("APPROVE ", "").trim().toLowerCase();
      return await handleApprove(articleId, fromNumber);
    }

    if (messageText.startsWith("REJECT ")) {
      const articleId = messageText.replace("REJECT ", "").trim().toLowerCase();
      return await handleReject(articleId, fromNumber);
    }

    if (messageText === "LIST") {
      return await handleList(fromNumber);
    }

    if (messageText.startsWith("STATUS ")) {
      const articleId = messageText.replace("STATUS ", "").trim().toLowerCase();
      return await handleStatus(articleId, fromNumber);
    }

    // Unknown command — send help
    await sendWhatsAppMessage(
      fromNumber,
      `🤖 *In-Naija AI Newsroom*\n\nUnknown command. Available commands:\n\n` +
      `• \`APPROVE <id>\` — Publish an article\n` +
      `• \`REJECT <id>\` — Delete a draft\n` +
      `• \`LIST\` — Show pending articles\n` +
      `• \`STATUS <id>\` — Check article status`
    );

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}

// ─── HANDLERS ─────────────────────────────────────────────────────────────────

async function handleApprove(articleId: string, toNumber: string): Promise<Response> {
  try {
    // Dynamic import to avoid circular dependencies
    const { supabase } = await import("@/lib/supabase");
    const { distributeToAllPlatforms } = await import("@/lib/social/distributor");

    const { data: article, error } = await supabase
      .from("articles")
      .update({ status: "published" })
      .eq("id", articleId)
      .eq("status", "pending_approval")
      .select()
      .single();

    if (error || !article) {
      await sendWhatsAppMessage(
        toNumber,
        `❌ Could not approve article \`${articleId}\`.\nIt may not exist or is already published.`
      );
      return NextResponse.json({ status: "not_found" });
    }

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

    await sendWhatsAppMessage(
      toNumber,
      `✅ *Article Published!*\n\n` +
      `📰 *${article.title_en}*\n` +
      `🇳🇬 ${article.title_pidgin}\n\n` +
      `🔗 ${siteUrl}/news/${article.slug}\n\n` +
      `*Social Distribution:*\n${socialStatus}`
    );

    return NextResponse.json({ status: "approved", distribution });
  } catch (err) {
    console.error("Approve handler error:", err);
    await sendWhatsAppMessage(toNumber, `❌ Approval failed due to a server error. Check the logs.`);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}

async function handleReject(articleId: string, toNumber: string): Promise<Response> {
  try {
    const { supabase } = await import("@/lib/supabase");

    const { data, error } = await supabase
      .from("articles")
      .select("title_en")
      .eq("id", articleId)
      .single();

    await supabase
      .from("articles")
      .delete()
      .eq("id", articleId)
      .eq("status", "pending_approval");

    if (error || !data) {
      await sendWhatsAppMessage(toNumber, `❌ Article \`${articleId}\` not found.`);
    } else {
      await sendWhatsAppMessage(
        toNumber,
        `🗑️ *Article Rejected & Deleted*\n\n"${data.title_en}"\n\nSend \`LIST\` to see remaining drafts.`
      );
    }

    return NextResponse.json({ status: "rejected" });
  } catch (err) {
    console.error("Reject handler error:", err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}

async function handleList(toNumber: string): Promise<Response> {
  try {
    const { supabase } = await import("@/lib/supabase");

    const { data } = await supabase
      .from("articles")
      .select("id, title_en, created_at")
      .eq("status", "pending_approval")
      .order("created_at", { ascending: false })
      .limit(5);

    if (!data || data.length === 0) {
      await sendWhatsAppMessage(toNumber, `📭 No articles pending approval right now.\n\nNew articles will appear here after the next scan.`);
    } else {
      const list = data.map((a, i) => {
        const shortId = a.id.split("-")[0];
        return `${i + 1}. *${a.title_en.slice(0, 60)}...*\nID: \`${shortId}\`\nReply: \`APPROVE ${shortId}\` or \`REJECT ${shortId}\``;
      }).join("\n\n");

      await sendWhatsAppMessage(
        toNumber,
        `📋 *Pending Approval (${data.length})*\n\n${list}`
      );
    }

    return NextResponse.json({ status: "listed" });
  } catch (err) {
    console.error("List handler error:", err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}

async function handleStatus(articleId: string, toNumber: string): Promise<Response> {
  try {
    const { supabase } = await import("@/lib/supabase");

    const { data } = await supabase
      .from("articles")
      .select("title_en, status, created_at")
      .ilike("id", `${articleId}%`)
      .single();

    if (!data) {
      await sendWhatsAppMessage(toNumber, `❌ No article found matching ID \`${articleId}\`.`);
    } else {
      const statusEmoji: Record<string, string> = {
        draft: "📝",
        pending_approval: "⏳",
        published: "✅",
      };
      await sendWhatsAppMessage(
        toNumber,
        `📊 *Article Status*\n\n"${data.title_en}"\n\nStatus: ${statusEmoji[data.status] || "❓"} ${data.status}\nCreated: ${new Date(data.created_at).toLocaleString("en-NG", { timeZone: "Africa/Lagos" })}`
      );
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("Status handler error:", err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}


// ─── WHATSAPP MESSAGE SENDER ───────────────────────────────────────────────────

/**
 * Sends a WhatsApp message to a number via the Meta Cloud API
 */
async function sendWhatsAppMessage(to: string, text: string): Promise<void> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    console.warn("WhatsApp credentials not set — skipping message send.");
    return;
  }

  try {
    await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: text },
        }),
      }
    );
  } catch (err) {
    console.error("WhatsApp send failed:", err);
  }
}
