import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ArticleReader from "./ArticleReader";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  const { data: article } = await supabase
    .from("articles")
    .select("title_en, content_en, thumbnail_url")
    .eq("slug", slug)
    .single();

  if (!article) return { title: "Article Not Found | In-Naija" };

  return {
    title: `${article.title_en} | In-Naija`,
    description: article.content_en?.substring(0, 160) + "...",
    openGraph: {
      images: article.thumbnail_url ? [article.thumbnail_url] : [],
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;

  // 1. Fetch the main article
  const { data: article, error } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !article) {
    notFound();
  }

  // 2. Fetch related articles in the same category
  const { data: relatedArticles } = await supabase
    .from("articles")
    .select("id, title_en, slug, thumbnail_url, category_slug, created_at")
    .eq("status", "published")
    .eq("category_slug", article.category_slug)
    .neq("id", article.id)
    .order("created_at", { ascending: false })
    .limit(3);

  // 3. (Optional) In production, we should increment views_count here or via an API route.
  // We'll increment views_count via an RPC or direct update, but doing it on every page load 
  // might break ISR caching if not careful. For this demo, we'll fire and forget an update.
  supabase.rpc('increment_views', { article_id: article.id }).then();

  return (
    <ArticleReader 
      article={article} 
      relatedArticles={relatedArticles || []} 
    />
  );
}
