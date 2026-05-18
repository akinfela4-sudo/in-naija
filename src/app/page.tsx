import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Clock, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

// Export page config
export const dynamic = "force-dynamic";

export default async function Home() {
  // Fetch live published articles
  const { data: articles, error } = await supabase
    .from("articles")
    .select("id, title_en, title_pidgin, slug, category_slug, thumbnail_url, created_at, views_count, is_breaking, content_en")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(10);

  const safeArticles = articles || [];

  // Pick featured (latest) and trending (by views)
  const featuredNews = safeArticles[0] || {
    title_en: "No published articles yet",
    category_slug: "updates",
    created_at: new Date().toISOString(),
    thumbnail_url: "https://images.unsplash.com/photo-1518458084722-6a3976c33c40?auto=format&fit=crop&q=80&w=800",
    content_en: "Run a scan from the admin dashboard to populate the newsroom...",
    slug: "#",
  };

  const trendingStories = [...safeArticles]
    .sort((a, b) => b.views_count - a.views_count)
    .slice(1, 5);

  const politicsStories = safeArticles
    .filter(a => a.category_slug === 'politics')
    .slice(0, 2);

  // If no politics, just show next latest
  const bottomStories = politicsStories.length > 0 ? politicsStories : safeArticles.slice(1, 3);

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 1) return "Just now";
    if (hrs < 24) return `${hrs} hours ago`;
    return `${Math.floor(hrs / 24)} days ago`;
  };

  const breakingNews = safeArticles.find(a => a.is_breaking) || safeArticles[0];

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Breaking News Ticker */}
      {breakingNews && (
        <div className="bg-green-50 border-y py-2 overflow-hidden">
          <div className="container mx-auto px-4 flex items-center gap-4">
            <Badge className="bg-red-600 animate-pulse shrink-0">BREAKING</Badge>
            <p className="text-sm font-medium truncate">
              {breakingNews.title_en}
            </p>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content Area */}
          <main className="lg:col-span-8 space-y-8">
            
            {/* Featured Story */}
            <section>
              <Link href={featuredNews.slug === '#' ? '#' : `/news/${featuredNews.slug}`}>
                <Card className="overflow-hidden border-none shadow-xl group cursor-pointer">
                  <div className="relative aspect-video">
                    <img 
                      src={featuredNews.thumbnail_url || "https://images.unsplash.com/photo-1518458084722-6a3976c33c40?auto=format&fit=crop&q=80&w=800"} 
                      alt="Featured" 
                      className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 p-6 text-white">
                      <Badge className="mb-3 bg-green-600 capitalize">{featuredNews.category_slug || 'General'}</Badge>
                      <h2 className="text-2xl md:text-4xl font-bold mb-3 leading-tight">
                        {featuredNews.title_en}
                      </h2>
                      <p className="text-zinc-200 line-clamp-2 text-sm md:text-base mb-4">
                        {featuredNews.content_en?.substring(0, 150)}...
                      </p>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {timeAgo(featuredNews.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            </section>

            {/* Bottom Stories Section */}
            <section>
              <div className="flex items-center justify-between mb-4 border-b pb-2">
                <h3 className="text-xl font-bold text-green-800">Politics & Power</h3>
                <Link href="/category/politics" className="text-sm text-muted-foreground hover:text-green-600 flex items-center gap-1">
                  View All <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bottomStories.map((story) => (
                  <Link href={`/news/${story.slug}`} key={story.id}>
                    <Card className="flex flex-col border-none shadow-md overflow-hidden hover:shadow-lg transition-shadow h-full">
                      <div className="aspect-video bg-muted relative">
                         {story.thumbnail_url && <img src={story.thumbnail_url} className="w-full h-full object-cover" alt="" />}
                      </div>
                      <CardContent className="p-4">
                        <Badge variant="outline" className="mb-2 capitalize">{story.category_slug || 'Update'}</Badge>
                        <h4 className="font-bold leading-tight mb-2 hover:text-green-700 cursor-pointer">
                          {story.title_en}
                        </h4>
                        <p className="text-xs text-muted-foreground">{timeAgo(story.created_at)}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          </main>

          {/* Sidebar Area */}
          <aside className="lg:col-span-4 space-y-8">
            
            {/* Ad Slot Top */}
            <div className="w-full h-64 bg-zinc-100 flex items-center justify-center border border-dashed rounded-lg border-zinc-300">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">Advertisement</span>
            </div>

            {/* Trending Section */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Trending in Nigeria
                </h3>
                <div className="space-y-4">
                  {trendingStories.length > 0 ? trendingStories.map((story, idx) => (
                    <Link href={`/news/${story.slug}`} key={story.id} className="group block cursor-pointer">
                      <div className="flex items-start gap-4">
                        <span className="text-2xl font-black text-zinc-200 group-hover:text-green-200 transition-colors">
                          0{idx + 1}
                        </span>
                        <div>
                          <p className="text-sm font-bold leading-snug group-hover:text-green-700 transition-colors">
                            {story.title_en}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] uppercase font-bold text-green-600">{story.category_slug || 'General'}</span>
                            <span className="text-[10px] text-muted-foreground">{timeAgo(story.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )) : (
                    <p className="text-sm text-zinc-500">No trending stories yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Ad Slot Sidebar Bottom */}
            <div className="w-full h-64 bg-zinc-100 flex items-center justify-center border border-dashed rounded-lg border-zinc-300">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">Advertisement</span>
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
}

function Button({ children, variant, className }: any) {
  const base = "px-4 py-2 rounded-md font-medium transition-colors";
  const variants: any = {
    primary: "bg-green-700 text-white hover:bg-green-800",
    secondary: "bg-white text-green-900 hover:bg-green-50",
    outline: "border border-zinc-200 hover:bg-zinc-50"
  };
  return <button className={`${base} ${variants[variant || 'primary']} ${className}`}>{children}</button>;
}
