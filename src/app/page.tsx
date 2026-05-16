import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Clock, 
  ArrowRight, 
  Zap, 
  BarChart3, 
  MessageSquare,
  ShieldCheck
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function Home() {
  // 1. Fetch Featured Story
  const { data: featured } = await supabase
    .from("articles")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // 2. Fetch Latest Headlines
  const { data: latest } = await supabase
    .from("articles")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(6);

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 1) return "Just now";
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Hero Section */}
      <section className="bg-white border-b overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-green-50/50 skew-x-12 translate-x-24 hidden lg:block" />
        <div className="container mx-auto px-6 py-12 lg:py-20 flex flex-col lg:flex-row gap-12 items-center relative">
          <div className="lg:w-1/2 space-y-6">
            <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1 text-xs font-bold uppercase tracking-wider">
              <Zap className="h-3 w-3 mr-1.5 fill-green-600 text-green-600" />
              AI-Automated News Platform
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-black text-zinc-900 leading-[1.1] tracking-tight">
              Nigeria's News, <br />
              <span className="text-green-700">Intelligently Refined.</span>
            </h1>
            <p className="text-lg text-zinc-600 max-w-lg leading-relaxed">
              Experience zero-plagiarism news localized in Standard English and Pidgin. Powered by AI, verified by journalists.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Button size="lg" className="bg-green-700 hover:bg-green-800 text-white rounded-full px-8 font-bold shadow-lg shadow-green-900/20" asChild>
                <Link href="/category/trending">Read Headlines <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8 font-bold border-2" asChild>
                <Link href="/elections">Election Map</Link>
              </Button>
            </div>
            
            <div className="flex items-center gap-6 pt-4 text-zinc-400">
               <div className="flex items-center gap-2">
                 <ShieldCheck className="h-5 w-5 text-green-600" />
                 <span className="text-xs font-medium uppercase tracking-widest">Verified Sources</span>
               </div>
               <div className="flex items-center gap-2">
                 <MessageSquare className="h-5 w-5 text-green-600" />
                 <span className="text-xs font-medium uppercase tracking-widest">Pidgin Ready</span>
               </div>
            </div>
          </div>

          {/* Featured Article Card */}
          <div className="lg:w-1/2 w-full">
            {featured ? (
              <Link href={`/news/${featured.slug}`} className="group block">
                <div className="relative aspect-[16/10] rounded-3xl overflow-hidden shadow-2xl bg-zinc-200">
                  {featured.thumbnail_url && (
                    <img 
                      src={featured.thumbnail_url} 
                      alt={featured.title_en}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-8 space-y-3">
                    <Badge className="bg-green-600 text-white border-none">{featured.category_slug || 'Breaking'}</Badge>
                    <h2 className="text-2xl lg:text-3xl font-bold text-white leading-tight group-hover:text-green-300 transition-colors">
                      {featured.title_en}
                    </h2>
                    <div className="flex items-center gap-4 text-zinc-300 text-sm">
                      <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {timeAgo(featured.created_at)}</span>
                      <span className="flex items-center gap-1.5"><TrendingUp className="h-4 w-4" /> {featured.views_count || 0} reads</span>
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="aspect-[16/10] rounded-3xl bg-zinc-100 animate-pulse border-2 border-dashed border-zinc-200 flex items-center justify-center">
                <p className="text-zinc-400 font-medium italic">Connecting to Newsroom...</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Latest News Grid */}
      <section className="container mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-10">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-green-600" />
              Latest Headlines
            </h2>
            <p className="text-sm text-zinc-500">Fresh updates from across Nigeria, updated every 30 minutes.</p>
          </div>
          <Link href="/category/trending" className="text-sm font-bold text-green-700 hover:underline flex items-center gap-1">
            View All News <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {latest && latest.map((article) => (
            <Link key={article.id} href={`/news/${article.slug}`} className="group">
              <article className="space-y-4">
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-zinc-200 shadow-sm">
                  {article.thumbnail_url && (
                    <img 
                      src={article.thumbnail_url} 
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  )}
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-black/50 backdrop-blur text-white border-none capitalize">{article.category_slug}</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold leading-snug text-zinc-900 group-hover:text-green-700 transition-colors line-clamp-2">
                    {article.title_en}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {timeAgo(article.created_at)}</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-300" />
                    <span>{article.views_count || 0} views</span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>

      {/* Election Intelligence Hub Promo */}
      <section className="bg-zinc-900 text-white overflow-hidden">
        <div className="container mx-auto px-6 py-20 relative">
          <div className="max-w-2xl space-y-6 relative z-10">
            <h2 className="text-3xl lg:text-4xl font-black leading-tight">
              Nigeria's #1 <br />
              <span className="text-green-500 underline decoration-green-500/30 underline-offset-8">Election Intelligence Hub</span>
            </h2>
            <p className="text-zinc-400 text-lg leading-relaxed">
              Track results, compare candidates, and analyze live polling data from all 36 states plus the FCT. Real-time visualization of the Nigerian political landscape.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Button className="bg-white text-zinc-900 hover:bg-zinc-100 rounded-full px-8 font-bold gap-2" asChild>
                <Link href="/elections"><BarChart3 className="h-4 w-4" /> Live Election Map</Link>
              </Button>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-full px-8 font-bold" asChild>
                <Link href="/polls">View Public Polls</Link>
              </Button>
            </div>
          </div>
          
          {/* Abstract Graphic Element */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 aspect-square bg-green-500/10 blur-[120px] rounded-full hidden lg:block" />
        </div>
      </section>
    </div>
  );
}
