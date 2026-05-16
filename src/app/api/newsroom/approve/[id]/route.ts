import { supabase } from "@/lib/supabase";
import { distributeToAllPlatforms } from "@/lib/social/distributor";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/newsroom/approve/[id]
 * Approves a pending article: publishes it and distributes to all social media.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: article, error } = await supabase
    .from("articles")
    .update({ status: "published" })
    .eq("id", id)
    .eq("status", "pending_approval")
    .select()
    .single();

  if (error || !article) {
    return NextResponse.json(
      { error: error?.message || "Article not found or already published" },
      { status: 404 }
    );
  }

  // Distribute to X, Facebook, and Instagram
  const distribution = await distributeToAllPlatforms({
    id: article.id,
    title_en: article.title_en,
    title_pidgin: article.title_pidgin,
    content_en: article.content_en,
    slug: article.slug,
    thumbnail_url: article.thumbnail_url,
  });

  return NextResponse.json({ success: true, article, distribution });
}

/**
 * DELETE /api/newsroom/approve/[id]
 * Rejects and deletes a pending article.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await supabase
    .from("articles")
    .delete()
    .eq("id", id)
    .eq("status", "pending_approval");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Article rejected and removed" });
}
