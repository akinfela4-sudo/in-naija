import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-build",
});

export interface RewriteResult {
  title_en: string;
  content_en: string;
  title_pidgin: string;
  content_pidgin: string;
  slug: string;
  category_slug: string;
  summary: string;
}

/**
 * Rewrites a raw article into two zero-plagiarism versions:
 * 1. Standard English (professional journalism style)
 * 2. Nigerian Pidgin (authentic In-Naija voice)
 */
export async function rewriteArticle(
  rawTitle: string,
  rawContent: string,
  sourceUrl: string
): Promise<RewriteResult> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are the Chief AI Editor of In-Naija, Nigeria's leading digital news platform. 
Your job is to rewrite news articles into two completely original, zero-plagiarism versions.
You MUST rephrase everything in your own words — never copy sentences from the source.
Be factual, engaging, and Nigeria-specific in your framing.

Output ONLY valid JSON with this exact schema:
{
  "title_en": "Compelling English headline (max 90 chars)",
  "content_en": "Full article in Standard English, 3-4 paragraphs, professional journalism style. Use Nigerian context and examples.",
  "title_pidgin": "Pidgin headline that grabs attention (max 90 chars)",
  "content_pidgin": "Full article in authentic Nigerian Pidgin English. Use phrases like 'e don happen', 'as e dey go', 'oya', 'wahala', 'oga', 'naija', 'dem', 'e be like say'. Keep it natural, not forced. 3-4 paragraphs.",
  "slug": "url-friendly-slug-from-title-max-60-chars",
  "category_slug": "Must be one of: politics, business, trending, tech",
  "summary": "One sentence summary for social media sharing (max 140 chars)"
}`,
      },
      {
        role: "user",
        content: `Rewrite this news story into the two versions.

ORIGINAL TITLE: ${rawTitle}

ORIGINAL CONTENT:
${rawContent}

SOURCE: ${sourceUrl}

Remember: Zero plagiarism. Completely rephrase in your own words.`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const result = JSON.parse(response.choices[0].message.content || "{}");
  return result as RewriteResult;
}

/**
 * Generates a DALL-E thumbnail prompt based on the article headline
 */
export async function generateThumbnailPrompt(title_en: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You create concise DALL-E image prompts for Nigerian news thumbnails. The style should be: photorealistic, bold, editorial. Include Nigerian visual elements where relevant. Max 200 chars.",
      },
      {
        role: "user",
        content: `Create a thumbnail prompt for this headline: "${title_en}"`,
      },
    ],
    max_tokens: 100,
  });

  return response.choices[0].message.content || `Editorial news photo for: ${title_en}`;
}

/**
 * Generates an AI thumbnail image via DALL-E 3
 */
export async function generateThumbnail(title_en: string): Promise<string | null> {
  try {
    const prompt = await generateThumbnailPrompt(title_en);

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `${prompt}, Nigerian news media style, bold colors, high quality editorial photo`,
      n: 1,
      size: "1792x1024",
      quality: "standard",
    });

    return response.data?.[0]?.url || null;
  } catch (error) {
    console.error("Thumbnail generation failed:", error);
    return null;
  }
}
