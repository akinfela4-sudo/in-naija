const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

/**
 * Escapes characters for Telegram MarkdownV2
 */
export function escapeMarkdown(text: string): string {
  if (!text) return "";
  // Characters that need escaping in MarkdownV2: _ * [ ] ( ) ~ ` > # + - = | { } . !
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

/**
 * Sends a Telegram message to a specific chat ID
 */
export async function sendTelegramMessage(
  chatId: string,
  text: string,
  parseMode?: "Markdown" | "MarkdownV2" | "HTML"
): Promise<void> {
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
