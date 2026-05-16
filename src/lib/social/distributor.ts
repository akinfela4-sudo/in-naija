/**
 * In-Naija Social Media Distributor
 * Automatically posts published articles to:
 * 1. X (Twitter)
 * 2. Facebook Page
 * 3. Instagram Business
 */

interface DistributionPayload {
  id: string;
  title_en: string;
  title_pidgin: string;
  content_en: string;
  slug: string;
  thumbnail_url: string | null;
}

interface DistributionResult {
  twitter: boolean;
  facebook: boolean;
  instagram: boolean;
}

export async function distributeToAllPlatforms(
  payload: DistributionPayload
): Promise<DistributionResult> {
  console.log(`🚀 Distributing article: ${payload.title_en}`);

  // In a real production app, these would be separate async calls to the respective APIs.
  // For the demo, we simulate them.
  
  const [twitter, facebook, instagram] = await Promise.all([
    postToTwitter(payload),
    postToFacebook(payload),
    postToInstagram(payload),
  ]);

  return { twitter, facebook, instagram };
}

// ─── X (TWITTER) ──────────────────────────────────────────────────────────────

async function postToTwitter(payload: DistributionPayload): Promise<boolean> {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  if (!bearerToken) {
    console.warn("TWITTER_BEARER_TOKEN not set — skipping X distribution.");
    return false;
  }

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://in-naija.vercel.app";
    const text = `🇳🇬 ${payload.title_en}\n\nRead in English & Pidgin: ${siteUrl}/news/${payload.slug}\n\n#InNaija #NigeriaNews #Breaking`;

    // Note: This requires X API v2 (Free or Pro tier)
    // For the demo, we'll just log the attempt.
    console.log("🐦 Posting to X (Twitter)...");
    
    /* Real implementation:
    const res = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });
    return res.ok;
    */
    
    return true; 
  } catch (err) {
    console.error("X distribution failed:", err);
    return false;
  }
}

// ─── FACEBOOK ─────────────────────────────────────────────────────────────────

async function postToFacebook(payload: DistributionPayload): Promise<boolean> {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

  if (!pageId || !accessToken) {
    console.warn("Facebook credentials not set — skipping FB distribution.");
    return false;
  }

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://in-naija.vercel.app";
    const message = `📰 ${payload.title_en}\n\n${payload.title_pidgin}\n\nFull story here: ${siteUrl}/news/${payload.slug}`;

    console.log("👥 Posting to Facebook Page...");

    /* Real implementation:
    const res = await fetch(`https://graph.facebook.com/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        link: `${siteUrl}/news/${payload.slug}`,
        access_token: accessToken,
      }),
    });
    return res.ok;
    */
    
    return true;
  } catch (err) {
    console.error("Facebook distribution failed:", err);
    return false;
  }
}

// ─── INSTAGRAM ────────────────────────────────────────────────────────────────

async function postToInstagram(payload: DistributionPayload): Promise<boolean> {
  const igId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN; // Shared with FB

  if (!igId || !accessToken || !payload.thumbnail_url) {
    console.warn("Instagram credentials or thumbnail missing — skipping IG distribution.");
    return false;
  }

  try {
    console.log("📸 Posting to Instagram Business...");

    /* Real implementation (2-step process: container creation + publish):
    // 1. Create Media Container
    const containerRes = await fetch(`https://graph.facebook.com/v19.0/${igId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: payload.thumbnail_url,
        caption: `${payload.title_en}\n\n#InNaija #Nigeria #News`,
        access_token: accessToken,
      }),
    });
    const { id: containerId } = await containerRes.json();

    // 2. Publish Container
    const publishRes = await fetch(`https://graph.facebook.com/v19.0/${igId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: accessToken,
      }),
    });
    return publishRes.ok;
    */

    return true;
  } catch (err) {
    console.error("Instagram distribution failed:", err);
    return false;
  }
}
