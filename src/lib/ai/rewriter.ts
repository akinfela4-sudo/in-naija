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
Be factual, comprehensive, highly detailed, and engaging.

Output ONLY valid JSON with this exact schema:
{
  "title_en": "Compelling English headline (max 90 chars)",
  "content_en": "Comprehensive and detailed news article in Standard English. It must be highly descriptive, thorough, and run for 5 to 6 full paragraphs (at least 400-500 words). Include all core background details, key events, explanations, and implications for Nigeria. Maintain a high-quality professional journalism standard.",
  "title_pidgin": "Pidgin headline that grabs attention (max 90 chars)",
  "content_pidgin": "Comprehensive and detailed news article in authentic Nigerian Pidgin English. Write 5 to 6 full paragraphs (at least 350-450 words) filled with details. Use natural phrases like 'e don happen', 'as e dey go', 'oya', 'wahala', 'oga', 'naija', 'dem', 'e be like say'. Explain all the deep details of the event so that the reader gets full understanding of the story.",
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
          "You are a photo editor creating high-quality, relevant editorial photography prompts for Nigerian news thumbnails. " +
          "Your prompt MUST be directly related to the core subject of the headline. " +
          "If the headline mentions a specific musician (like Wizkid), politician (like Tinubu), or organization (like INEC), describe a photorealistic scene depicting that person or entity (or an actor resembling them in a realistic Nigerian setup, e.g. performing on a grand stage or speaking at an official INEC podium with official banners). " +
          "Avoid generic placeholders or unrelated symbolic elements (like bottles, random nature, or abstract shapes). " +
          "The style must be: photorealistic, documentary, professional editorial news photo. Max 200 characters.",
      },
      {
        role: "user",
        content: `Create an editorial thumbnail photo prompt for: "${title_en}"`,
      },
    ],
    max_tokens: 150,
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

/**
 * Automatically generates a news article based on a topic or headline prompt
 */
export async function generateAIArticle(prompt: string): Promise<RewriteResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are the Chief AI Editor of In-Naija, Nigeria's leading digital news platform. 
Your job is to write a news article from scratch based on a topic or headline prompt provided by the user.
Write a comprehensive, professional, zero-plagiarism news story in two versions:
1. Standard English (professional journalism style, 5-6 paragraphs, detailed background, key events, at least 400-500 words).
2. Nigerian Pidgin (authentic In-Naija voice, 5-6 paragraphs, natural pidgin slang like 'e don happen', 'as e dey go', 'oya', 'wahala', 'dem', 'e be like say', at least 350-450 words).

Choose the most appropriate category_slug matching the topic.

Output ONLY valid JSON with this exact schema:
{
  "title_en": "Compelling English headline (max 90 chars)",
  "content_en": "Comprehensive and detailed news article in Standard English. It must be highly descriptive, thorough, and run for 5 to 6 full paragraphs (at least 400-500 words). Include core background details, key events, and implications for Nigeria.",
  "title_pidgin": "Pidgin headline that grabs attention (max 90 chars)",
  "content_pidgin": "Comprehensive and detailed news article in authentic Nigerian Pidgin English. Write 5 to 6 full paragraphs (at least 350-450 words) filled with details. Use natural pidgin flow.",
  "slug": "url-friendly-slug-from-title-max-60-chars",
  "category_slug": "Must be one of: politics, business, tech, entertainment, sports, trending",
  "summary": "One sentence summary for social media sharing (max 140 chars)"
}`,
        },
        {
          role: "user",
          content: `Write a news story about: "${prompt}"`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result as RewriteResult;
  } catch (error: any) {
    console.error("AI Article generation failed:", error);
    if (
      error?.status === 429 || 
      error?.message?.includes("quota") || 
      error?.message?.includes("billing") ||
      error?.message?.includes("exceeded your current quota")
    ) {
      return {
        title_en: `Breaking: ${prompt}`,
        title_pidgin: `Oya look: ${prompt}`,
        content_en: `This is a high-quality fallback draft generated for "${prompt}" because the configured OpenAI API key has exceeded its billing quota.\n\nTo restore full AI writing capabilities, please update the OpenAI API key and billing details in your settings. Once configured, the AI will write comprehensive, multi-paragraph news stories from scratch.`,
        content_pidgin: `We bring you standard fallback gist on top "${prompt}" as our OpenAI API key don get billing/quota issue.\n\nAbeg update your OpenAI API key and billing details inside settings make AI for begin write full beta news for you again.`,
        slug: prompt.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""),
        category_slug: "trending",
        summary: `Fallback article created for: ${prompt}`
      };
    }
    throw error;
  }
}
