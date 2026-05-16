"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Share2,
  Globe,
  BookOpen,
  ChevronLeft,
  ExternalLink,
  Link2,
  Send,
  MessageSquare,
} from "lucide-react";

interface ArticleProps {
  article: {
    id: string;
    title_en: string;
    title_pidgin: string;
    content_en: string;
    content_pidgin: string;
    slug: string;
    category_slug: string;
    thumbnail_url: string;
    source_url: string;
    views_count: number;
    created_at: string;
  };
  relatedArticles: any[];
}

export default function ArticleReader({ article, relatedArticles }: ArticleProps) {
  const [lang, setLang] = useState<"en" | "pidgin">("en");

  const title = lang === "en" ? article.title_en : (article.title_pidgin || article.title_en);
  const rawContent = lang === "en" ? article.content_en : (article.content_pidgin || article.content_en);
  // Split paragraphs by newline
  const content = rawContent.split("\n").filter((p: string) => p.trim().length > 0);

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 1) return "Just now";
    if (hrs < 24) return `${hrs} hours ago`;
    return `${Math.floor(hrs / 24)} days ago`;
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareTitle = encodeURIComponent(title);

  return (
    <div className="min-h-screen bg-white">
      {/* Back nav */}
      <div className="container mx-auto px-4 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-green-700 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Headlines
        </Link>
      </div>

      {/* Hero Image */}
      <div className="container mx-auto px-4 pt-4">
        <div className="relative w-full aspect-[16/7] rounded-2xl overflow-hidden shadow-xl bg-zinc-200">
          {article.thumbnail_url && (
            <img
              src={article.thumbnail_url}
              alt={title}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Language Toggle — overlaid on image */}
          {article.content_pidgin && (
            <div className="absolute top-4 right-4">
              <div className="flex rounded-xl overflow-hidden border border-white/30 backdrop-blur">
                <button
                  onClick={() => setLang("en")}
                  className={`px-4 py-2 text-sm font-semibold transition-colors ${
                    lang === "en"
                      ? "bg-white text-green-900"
                      : "bg-black/30 text-white hover:bg-black/50"
                  }`}
                >
                  🇬🇧 English
                </button>
                <button
                  onClick={() => setLang("pidgin")}
                  className={`px-4 py-2 text-sm font-semibold transition-colors ${
                    lang === "pidgin"
                      ? "bg-green-700 text-white"
                      : "bg-black/30 text-white hover:bg-black/50"
                  }`}
                >
                  🇳🇬 Pidgin
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Article Layout */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Article Body */}
          <article className="lg:col-span-8">
            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge className="bg-green-700 text-white capitalize">{article.category_slug || 'General'}</Badge>
              {lang === "pidgin" && (
                <Badge className="bg-amber-500 text-white">🇳🇬 In-Naija Pidgin</Badge>
              )}
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {timeAgo(article.created_at)}
              </span>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                {article.views_count.toLocaleString()} reads
              </span>
            </div>

            {/* Title — animates on lang switch */}
            <h1
              key={`title-${lang}`}
              className="text-3xl md:text-4xl font-black leading-tight mb-6 text-zinc-900 animate-in fade-in duration-300"
            >
              {title}
            </h1>

            {/* Divider with source credit */}
            <div className="flex items-center justify-between border-y py-3 mb-8">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                Source:{" "}
                <a
                  href={article.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-700 hover:underline flex items-center gap-0.5"
                >
                  Original Story <ExternalLink className="h-3 w-3" />
                </a>
              </p>
              <p className="text-xs text-muted-foreground">
                AI-rewritten · Zero plagiarism
              </p>
            </div>

            {/* Body */}
            <div
              key={`content-${lang}`}
              className="prose prose-lg max-w-none text-zinc-700 leading-relaxed animate-in fade-in duration-300"
            >
              {content.map((para, i) => (
                <p key={i} className="mb-6">
                  {para}
                </p>
              ))}
            </div>

            {/* In-article Ad Slot */}
            <div className="my-8 w-full h-24 bg-zinc-100 border border-dashed border-zinc-300 rounded-xl flex items-center justify-center">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">
                Advertisement
              </span>
            </div>

            {/* Share Bar */}
            <div className="border rounded-xl p-4 flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Share this story:
              </span>
              <a
                href={`https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 bg-black text-white text-xs rounded-full hover:bg-zinc-800 transition-colors"
              >
                <Link2 className="h-3.5 w-3.5" /> X / Twitter
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-full hover:bg-blue-700 transition-colors"
              >
                <Send className="h-3.5 w-3.5" /> Facebook
              </a>
              <a
                href={`https://wa.me/?text=${shareTitle}%20${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-xs rounded-full hover:bg-green-700 transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
              </a>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Sticky Ad */}
            <div className="sticky top-24 space-y-6">
              <div className="w-full h-64 bg-zinc-100 border border-dashed border-zinc-300 rounded-xl flex items-center justify-center">
                <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">
                  Advertisement
                </span>
              </div>

              {/* Related Articles */}
              {relatedArticles && relatedArticles.length > 0 && (
                <div className="border border-zinc-200 bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="p-5">
                    <h3 className="font-bold text-base mb-4 pb-2 border-b">
                      Related Stories
                    </h3>
                    <div className="space-y-4">
                      {relatedArticles.map((rel) => (
                        <Link
                          key={rel.id}
                          href={`/news/${rel.slug}`}
                          className="group block"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-16 h-12 bg-zinc-200 rounded-md shrink-0 relative overflow-hidden">
                                {rel.thumbnail_url && <img src={rel.thumbnail_url} className="w-full h-full object-cover" alt="" />}
                            </div>
                            <div>
                              <p className="text-sm font-bold leading-snug group-hover:text-green-700 transition-colors line-clamp-2">
                                {rel.title_en}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[10px] capitalize">
                                  {rel.category_slug || 'General'}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">
                                  {timeAgo(rel.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
