import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, TrendingUp, Filter } from "lucide-react";
import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

// Category config with SEO-friendly descriptions
const CATEGORY_META: Record<string, { title: string; description: string; emoji: string }> = {
  politics: {
    title: "Politics & Power",
    description: "What’s happening in the presidency, national assembly, state government policies, and major political shakeups.",
    emoji: "🏛️",
  },
  trending: {
    title: "Naija Pulse (Trending)",
    description: "High-engagement news—viral social media trends, entertainment, music, and pop culture updates.",
    emoji: "🔥",
  },
  business: {
    title: "Business & Economy",
    description: "Fuel prices, currency rates (Dollar/Naira tracking), inflation updates, and things affecting the daily cost of living.",
    emoji: "📈",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const meta = CATEGORY_META[slug] || { title: slug, description: "", emoji: "📰" };
  return {
    title: `${meta.emoji} ${meta.title} News | In-Naija`,
    description: meta.description,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const meta = CATEGORY_META[slug] || {
    title: slug.charAt(0).toUpperCase() + slug.slice(1),
    description: `Latest ${slug} news from Nigeria.`,
    emoji: "📰",
  };

  // Fetch articles for this category
  const { data: articles, error } = await supabase
    .from("articles")
    .select("id, title_en, slug, thumbnail_url, created_at, views_count, is_breaking")
    .eq("status", "published")
    .eq("category_slug", slug)
    .order("created_at", { ascending: false })
    .limit(10);

  const safeArticles = articles || [];
  const heroArticle = safeArticles[0];
  const listArticles = safeArticles.slice(1);

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 1) return "Just now";
    if (hrs < 24) return `${hrs} hours ago`;
    return `${Math.floor(hrs / 24)} days ago`;
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Category Header */}
      <div className="bg-gradient-to-r from-green-900 to-green-700 text-white">
        <div className="container mx-auto px-6 py-10">
          <div className="flex items-center gap-4">
            <span className="text-5xl">{meta.emoji}</span>
            <div>
              <h1 className="text-3xl font-black">{meta.title}</h1>
              <p className="text-green-100 mt-1 max-w-xl text-sm">{meta.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Feed */}
          <main className="lg:col-span-8">
            {/* Sort/Filter Bar */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Latest Stories
              </h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-3.5 w-3.5" />
                <span>Newest first</span>
              </div>
            </div>

            {safeArticles.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                <p>No published articles in this category yet.</p>
              </div>
            ) : (
              <>
                {/* Hero Article */}
                {heroArticle && (
                  <Link href={`/news/${heroArticle.slug}`} className="group block mb-6">
                    <div className="relative aspect-[16/9] bg-zinc-200 rounded-2xl overflow-hidden mb-4">
                      {heroArticle.thumbnail_url && (
                        <img src={heroArticle.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-0 p-6 text-white">
                        {heroArticle.is_breaking && (
                          <Badge className="bg-red-600 mb-2 animate-pulse">BREAKING</Badge>
                        )}
                        <h2 className="text-xl md:text-2xl font-black leading-snug group-hover:text-green-200 transition-colors">
                          {heroArticle.title_en}
                        </h2>
                        <div className="flex items-center gap-3 mt-2 text-xs text-zinc-300">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{timeAgo(heroArticle.created_at)}</span>
                          <span>{heroArticle.views_count.toLocaleString()} views</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )}

                {/* Article List */}
                <div className="space-y-1">
                  {listArticles.map((article, i) => (
                    <Link key={article.id} href={`/news/${article.slug}`} className="group block">
                      <div className="flex items-start gap-4 py-4 border-b hover:bg-white hover:px-3 hover:rounded-xl transition-all duration-150 -mx-3 px-3">
                        <span className="text-2xl font-black text-zinc-200 group-hover:text-green-200 transition-colors shrink-0 w-8 text-center">
                          {i + 2}
                        </span>
                        <div className="w-20 h-14 bg-zinc-200 rounded-lg shrink-0 relative overflow-hidden">
                           {article.thumbnail_url && <img src={article.thumbnail_url} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-grow">
                          <h3 className="font-bold leading-snug text-sm group-hover:text-green-700 transition-colors">
                            {article.title_en}
                          </h3>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />{timeAgo(article.created_at)}
                            </span>
                            <span>{article.views_count.toLocaleString()} views</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Load More */}
                {listArticles.length >= 9 && (
                  <div className="mt-8 text-center">
                    <button className="px-8 py-3 border-2 border-green-700 text-green-700 font-bold rounded-full hover:bg-green-700 hover:text-white transition-colors text-sm">
                      Load More Stories
                    </button>
                  </div>
                )}
              </>
            )}
          </main>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Ad */}
            <div className="w-full h-64 bg-zinc-100 border border-dashed border-zinc-300 rounded-xl flex items-center justify-center">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">Advertisement</span>
            </div>

            {/* Other categories */}
            <Card className="border-none shadow-md">
              <CardContent className="p-5">
                <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-500 mb-4">Browse Categories</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(CATEGORY_META).map(([catSlug, catMeta]) => (
                    <Link
                      key={catSlug}
                      href={`/category/${catSlug}`}
                      className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium transition-colors ${
                        catSlug === slug
                          ? "bg-green-700 text-white"
                          : "bg-zinc-50 hover:bg-green-50 hover:text-green-700"
                      }`}
                    >
                      <span>{catMeta.emoji}</span>
                      <span className="truncate">{catMeta.title.split(" ")[0]}</span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
