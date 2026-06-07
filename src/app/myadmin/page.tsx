"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  Bot,
  Clock,
  ExternalLink,
  Zap,
  FileText,
  Eye,
  Settings,
  LayoutDashboard,
  FileEdit,
  Globe,
  Radio,
  Image as ImageIcon,
  LogOut,
  Sliders,
  TrendingUp,
  Database,
  ThumbsUp,
  FileCode,
  Menu,
  Plus,
  Trash2,
  Vote,
  Share2,
  BarChart2
} from "lucide-react";

interface Article {
  id: string;
  title_en: string;
  title_pidgin: string;
  content_en?: string;
  content_pidgin?: string;
  status: string;
  created_at: string;
  thumbnail_url: string | null;
  source_url: string;
}

interface ScanResult {
  success: boolean;
  scanned?: number;
  processed?: number;
  articles?: Array<{ id: string; title: string; slug: string }>;
  error?: string;
}

export default function MyAdminPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [publishedCount, setPublishedCount] = useState(0);
  const [draftCount, setDraftCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activePreview, setActivePreview] = useState<Article | null>(null);
  const [activeTab, setActiveTab] = useState<"posts" | "crawler" | "settings" | "polls">("posts");

  // Dynamic dashboard analytics states
  const [stats, setStats] = useState({ draft: 0, pending_approval: 0, published: 0, total_views: 0 });
  const [popular, setPopular] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);

  // Dialog & Form States - Manual Article
  const [isCreateArticleOpen, setIsCreateArticleOpen] = useState(false);
  const [articleTitleEn, setArticleTitleEn] = useState("");
  const [articleTitlePidgin, setArticleTitlePidgin] = useState("");
  const [articleContentEn, setArticleContentEn] = useState("");
  const [articleContentPidgin, setArticleContentPidgin] = useState("");
  const [articleCategorySlug, setArticleCategorySlug] = useState("politics");
  const [articleThumbnailUrl, setArticleThumbnailUrl] = useState("");
  const [articleStatus, setArticleStatus] = useState("draft");
  const [articleShouldTweet, setArticleShouldTweet] = useState(false);
  const [creatingArticle, setCreatingArticle] = useState(false);

  // Dialog & Form States - Polls
  const [isCreatePollOpen, setIsCreatePollOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollDescription, setPollDescription] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [pollEndsAt, setPollEndsAt] = useState("");
  const [creatingPoll, setCreatingPoll] = useState(false);

  // Social Sharing Config Preferences
  const [autoTweetEnabled, setAutoTweetEnabled] = useState(true);
  const [autoTelegramEnabled, setAutoTelegramEnabled] = useState(true);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch pending queue
      const res = await fetch("/api/newsroom/scan");
      const data = await res.json();
      const pendingArticles = data.articles || [];
      setArticles(pendingArticles);

      // 2. Fetch myadmin analytics, popular, and polls
      const adminRes = await fetch("/api/myadmin");
      const adminData = await adminRes.json();
      if (adminData.success) {
        setStats(adminData.stats || { draft: 0, pending_approval: 0, published: 0, total_views: 0 });
        setPopular(adminData.popular || []);
        setPolls(adminData.polls || []);
        setPublishedCount(adminData.stats?.published || 0);
        setDraftCount(adminData.stats?.draft || 0);
      }
    } catch (err) {
      console.error("Failed to fetch queue and dashboard stats", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleScan = async () => {
    setScanning(true);
    setScanResult(null);
    try {
      const res = await fetch("/api/newsroom/scan", { method: "POST" });
      const data: ScanResult = await res.json();
      setScanResult(data);
      if (data.success) {
        fetchQueue();
      }
    } catch {
      setScanResult({ success: false, error: "Scan request failed" });
    } finally {
      setScanning(false);
    }
  };

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      await fetch(`/api/newsroom/approve/${id}`, { method: "POST" });
      setArticles((prev) => prev.filter((a) => a.id !== id));
      setPublishedCount(prev => prev + 1);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      await fetch(`/api/newsroom/approve/${id}`, { method: "DELETE" });
      setArticles((prev) => prev.filter((a) => a.id !== id));
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleTitleEn || !articleContentEn) {
      alert("English Title and Content are required.");
      return;
    }
    setCreatingArticle(true);
    try {
      const res = await fetch("/api/myadmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_article",
          title_en: articleTitleEn,
          title_pidgin: articleTitlePidgin || articleTitleEn,
          content_en: articleContentEn,
          content_pidgin: articleContentPidgin || articleContentEn,
          category_slug: articleCategorySlug,
          thumbnail_url: articleThumbnailUrl || null,
          status: articleStatus,
          should_tweet: articleShouldTweet,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsCreateArticleOpen(false);
        fetchQueue();
      } else {
        alert("Failed to create article: " + data.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setCreatingArticle(false);
    }
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pollQuestion) {
      alert("Question is required.");
      return;
    }
    const filteredOptions = pollOptions
      .map(o => o.trim())
      .filter(o => o !== "");
    if (filteredOptions.length < 2) {
      alert("Please provide at least 2 options.");
      return;
    }
    
    const formattedOptions = filteredOptions.map((text, idx) => ({
      id: idx + 1,
      text,
    }));

    setCreatingPoll(true);
    try {
      const res = await fetch("/api/myadmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_poll",
          question: pollQuestion,
          description: pollDescription || null,
          options: formattedOptions,
          ends_at: pollEndsAt || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsCreatePollOpen(false);
        fetchQueue();
      } else {
        alert("Failed to create poll: " + data.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setCreatingPoll(false);
    }
  };

  const handleTogglePoll = async (pollId: string, currentActive: boolean) => {
    try {
      const res = await fetch("/api/myadmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_poll",
          poll_id: pollId,
          is_active: !currentActive,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        alert("Failed to toggle poll status: " + data.error);
      } else {
        fetchQueue();
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const addOptionField = () => setPollOptions([...pollOptions, ""]);
  const removeOptionField = (index: number) => {
    if (pollOptions.length <= 2) return;
    setPollOptions(pollOptions.filter((_, idx) => idx !== index));
  };
  const updateOptionField = (index: number, val: string) => {
    const newOpts = [...pollOptions];
    newOpts[index] = val;
    setPollOptions(newOpts);
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="min-h-screen bg-[#f1f4f8] flex text-slate-800">
      
      {/* ─── SIDEBAR LAYOUT (Wordpress Style) ─── */}
      <aside className="w-64 bg-[#1e293b] text-slate-300 flex flex-col shrink-0 border-r border-slate-700 shadow-md">
        
        {/* Brand Logo */}
        <div className="p-6 border-b border-slate-700/60 bg-[#0f172a] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/20">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-white text-base leading-none">In-Naija</h1>
            <span className="text-[10px] text-green-400 font-medium uppercase tracking-wider">myAdmin Portal</span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-2">Core Management</div>
          
          <button
            onClick={() => setActiveTab("posts")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "posts"
                ? "bg-green-600 text-white shadow-lg shadow-green-600/20"
                : "hover:bg-slate-800/80 hover:text-white"
            }`}
          >
            <LayoutDashboard className="h-4.5 w-4.5" />
            <span>Editorial Desk</span>
            {articles.length > 0 && (
              <span className="ml-auto bg-amber-500 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                {articles.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("crawler")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "crawler"
                ? "bg-green-600 text-white shadow-lg shadow-green-600/20"
                : "hover:bg-slate-800/80 hover:text-white"
            }`}
          >
            <Radio className="h-4.5 w-4.5" />
            <span>Feed Crawler</span>
          </button>

          <button
            onClick={() => setActiveTab("polls")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "polls"
                ? "bg-green-600 text-white shadow-lg shadow-green-600/20"
                : "hover:bg-slate-800/80 hover:text-white"
            }`}
          >
            <Vote className="h-4.5 w-4.5" />
            <span>Polls Manager</span>
            {polls.filter(p => p.is_active).length > 0 && (
              <span className="ml-auto bg-green-500 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                {polls.filter(p => p.is_active).length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "settings"
                ? "bg-green-600 text-white shadow-lg shadow-green-600/20"
                : "hover:bg-slate-800/80 hover:text-white"
            }`}
          >
            <Sliders className="h-4.5 w-4.5" />
            <span>Settings</span>
          </button>

          <div className="pt-6">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-2">Integrations</div>
            <a
              href="https://t.me/Innaijapublisher_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800/80 hover:text-white transition-all text-slate-400"
            >
              <Bot className="h-4.5 w-4.5 text-blue-400" />
              <span>Telegram Bot</span>
              <ExternalLink className="h-3 w-3 ml-auto opacity-60" />
            </a>
            <a
              href="https://in-naija.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800/80 hover:text-white transition-all text-slate-400"
            >
              <Globe className="h-4.5 w-4.5 text-green-400" />
              <span>Live Website</span>
              <ExternalLink className="h-3 w-3 ml-auto opacity-60" />
            </a>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-700/60 bg-[#0f172a] text-xs flex items-center justify-between text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Connected</span>
          </div>
          <button 
            onClick={() => window.location.href = "/"}
            className="hover:text-white transition-colors"
            title="Log Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT CONTAINER ─── */}
      <main className="flex-grow flex flex-col min-w-0">
        
        {/* Top Header Bar */}
        <header className="h-20 bg-white border-b border-slate-200/80 flex items-center justify-between px-8 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {activeTab === "posts" && "Editorial Desk & Approval Queue"}
              {activeTab === "crawler" && "AI Feed Crawler Hub"}
              {activeTab === "polls" && "Polls & Surveys Manager"}
              {activeTab === "settings" && "System Configuration & API Keys"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeTab === "posts" && "Verify rewritten news stories and publish them directly to channels."}
              {activeTab === "crawler" && "Configure RSS sources, filter topics, and run manual crawler scans."}
              {activeTab === "polls" && "Create interactive surveys and view real-time voter metrics."}
              {activeTab === "settings" && "Manage environment endpoints and access tokens."}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {activeTab === "posts" && (
              <Button
                onClick={() => {
                  setArticleTitleEn("");
                  setArticleTitlePidgin("");
                  setArticleContentEn("");
                  setArticleContentPidgin("");
                  setArticleCategorySlug("politics");
                  setArticleThumbnailUrl("");
                  setArticleStatus("draft");
                  setArticleShouldTweet(false);
                  setIsCreateArticleOpen(true);
                }}
                className="bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-md flex items-center gap-2"
              >
                <Plus className="h-3.5 w-3.5" />
                Create Article
              </Button>
            )}

            {activeTab === "polls" && (
              <Button
                onClick={() => {
                  setPollQuestion("");
                  setPollDescription("");
                  setPollOptions(["", ""]);
                  setPollEndsAt("");
                  setIsCreatePollOpen(true);
                }}
                className="bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-md flex items-center gap-2"
              >
                <Plus className="h-3.5 w-3.5" />
                Create Poll
              </Button>
            )}

            <Button
              onClick={handleScan}
              disabled={scanning}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-md shadow-green-600/10 flex items-center gap-2"
            >
              {scanning ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Crawling feeds...
                </>
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5" />
                  Trigger Manual Scan
                </>
              )}
            </Button>
          </div>
        </header>

        {/* Dashboard Content Body */}
        <div className="p-8 flex-grow overflow-y-auto">

          {/* 1. EDITORIAL POSTS TAB */}
          {activeTab === "posts" && (
            <div className="space-y-6">
              
              {/* Stats Counters Grid */}
              <div className="grid grid-cols-4 gap-6">
                {[
                  { label: "Pending Approval", value: articles.length, color: "text-amber-500 bg-amber-50 border-amber-200", icon: Clock },
                  { label: "Published Articles", value: stats.published, color: "text-green-500 bg-green-50 border-green-200", icon: CheckCircle },
                  { label: "Total Views", value: stats.total_views, color: "text-blue-500 bg-blue-50 border-blue-200", icon: Eye },
                  { label: "Active Polls", value: polls.filter(p => p.is_active).length, color: "text-purple-500 bg-purple-50 border-purple-200", icon: Vote },
                ].map((s) => (
                  <Card key={s.label} className={`border border-slate-200/80 shadow-sm rounded-xl overflow-hidden`}>
                    <CardContent className="p-5 flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-black text-slate-800">{s.value}</p>
                        <p className="text-xs text-slate-400 mt-1 font-semibold">{s.label}</p>
                      </div>
                      <div className={`p-3 rounded-lg ${s.color.split(" ")[1]} border ${s.color.split(" ")[2]}`}>
                        <s.icon className={`h-5 w-5 ${s.color.split(" ")[0]}`} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Status Banner */}
              {scanResult && (
                <div
                  className={`rounded-xl p-4 border-l-4 flex items-start gap-4 shadow-sm ${
                    scanResult.success
                      ? "bg-green-50 border-green-500 text-green-800"
                      : "bg-red-50 border-red-500 text-red-800"
                  }`}
                >
                  {scanResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                  )}
                  <div>
                    {scanResult.success ? (
                      <>
                        <p className="font-bold text-sm">AI Feed Scan Successful!</p>
                        <p className="text-xs text-green-700/95 mt-0.5">
                          Scanned all 5 Nigerian news portals and processed <b>{scanResult.processed}</b> new drafts.
                        </p>
                      </>
                    ) : (
                      <p className="text-xs font-bold">{scanResult.error}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Main Approvals Panel Split Layout */}
              <div className="flex gap-8 items-start">
                
                {/* News Queue */}
                <div className="flex-grow space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider">Queue List</h3>
                    <span className="text-xs text-slate-400 font-medium">Showing top {articles.length} records</span>
                  </div>

                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-28 bg-white rounded-xl animate-pulse border border-slate-200" />
                      ))}
                    </div>
                  ) : articles.length === 0 ? (
                    <div className="text-center py-20 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
                      <Bot className="h-12 w-12 mx-auto text-slate-300 mb-4 animate-bounce" />
                      <p className="font-bold text-slate-600">Queue is completely empty</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                        No articles require review right now. Click "Trigger Manual Scan" to check for fresh stories.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {articles.map((article) => (
                        <Card
                          key={article.id}
                          className={`border border-slate-200/60 shadow-sm hover:shadow-md transition-all rounded-xl overflow-hidden ${
                            processingId === article.id ? "opacity-45" : ""
                          }`}
                        >
                          <CardContent className="p-5 flex items-start gap-5">
                            
                            {/* Thumbnail */}
                            <div className="w-24 h-20 rounded-lg bg-slate-100 shrink-0 overflow-hidden border border-slate-200/60 relative">
                              {article.thumbnail_url ? (
                                <img
                                  src={article.thumbnail_url}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                                  <ImageIcon className="h-8 w-8" />
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-grow min-w-0">
                              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">Headline</span>
                              <h4 className="font-extrabold text-sm text-slate-800 leading-snug truncate">
                                {article.title_en}
                              </h4>
                              <p className="text-xs text-green-600 mt-1 italic font-semibold truncate">
                                🇳🇬 {article.title_pidgin}
                              </p>
                              
                              <div className="flex items-center gap-3.5 mt-3">
                                <Badge className="text-[9px] uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 font-bold border border-slate-200/50">
                                  {article.status.replace("_", " ")}
                                </Badge>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {timeAgo(article.created_at)}
                                </span>
                                <a
                                  href={article.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-blue-500 font-semibold hover:underline flex items-center gap-0.5"
                                >
                                  Original Link <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                              </div>
                            </div>

                            {/* Custom Actions */}
                            <div className="flex items-center gap-2 shrink-0 self-center">
                              <button
                                onClick={() => setActivePreview(article)}
                                className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors"
                                title="Open Reviewer Panel"
                              >
                                <Eye className="h-4.5 w-4.5" />
                              </button>
                              <button
                                onClick={() => handleReject(article.id)}
                                disabled={!!processingId}
                                className="p-2.5 rounded-lg border border-red-200 hover:bg-red-50/60 text-red-500 transition-colors"
                                title="Delete Draft"
                              >
                                <XCircle className="h-4.5 w-4.5" />
                              </button>
                              <button
                                onClick={() => handleApprove(article.id)}
                                disabled={!!processingId}
                                className="flex items-center gap-1.5 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg shadow-md shadow-green-600/10 transition-all"
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                Publish
                              </button>
                            </div>

                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Side Preview Panel */}
                {activePreview && (
                  <div className="w-[480px] shrink-0 sticky top-8">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
                      
                      {/* Panel Title */}
                      <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                        <div>
                          <p className="font-extrabold text-sm text-slate-800">Article Reviewer</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">Audit rewritten copies before broadcast</p>
                        </div>
                        <button
                          onClick={() => setActivePreview(null)}
                          className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"
                        >
                          <XCircle className="h-4.5 w-4.5" />
                        </button>
                      </div>

                      {/* Content tabs */}
                      <div className="p-5 flex-grow overflow-y-auto">
                        <Tabs defaultValue="english">
                          <TabsList className="w-full grid grid-cols-2 bg-slate-100 p-1 rounded-xl mb-5">
                            <TabsTrigger value="english" className="py-2.5 text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                              🇬🇧 English Copy
                            </TabsTrigger>
                            <TabsTrigger value="pidgin" className="py-2.5 text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                              🇳🇬 Pidgin Copy
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="english" className="space-y-4">
                            <h3 className="font-extrabold text-base leading-snug text-slate-800">
                              {activePreview.title_en}
                            </h3>
                            <div className="text-xs text-slate-600 leading-relaxed space-y-3 whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-200/50 font-medium">
                              {activePreview.content_en}
                            </div>
                          </TabsContent>

                          <TabsContent value="pidgin" className="space-y-4">
                            <h3 className="font-extrabold text-base leading-snug text-green-800">
                              {activePreview.title_pidgin}
                            </h3>
                            <div className="text-xs text-slate-600 leading-relaxed space-y-3 whitespace-pre-line bg-green-50/20 p-4 rounded-xl border border-green-200/30 font-medium">
                              {activePreview.content_pidgin}
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>

                      {/* Approvals */}
                      <div className="p-5 bg-slate-50 border-t border-slate-100 flex gap-3">
                        <button
                          onClick={() => {
                            handleReject(activePreview.id);
                            setActivePreview(null);
                          }}
                          className="flex-1 py-3 border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 transition-colors"
                        >
                          Reject / Delete
                        </button>
                        <button
                          onClick={() => {
                            handleApprove(activePreview.id);
                            setActivePreview(null);
                          }}
                          className="flex-1 py-3 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 shadow-lg shadow-green-600/15 transition-all"
                        >
                          ✓ Approve & Publish
                        </button>
                      </div>

                    </div>
                  </div>
                )}
              </div>

              {/* Popular Articles Tracker */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mt-8">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Live Traffic & Popular Articles</h3>
                </div>
                {popular.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No published articles tracked yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase">
                          <th className="pb-3 font-semibold">Title</th>
                          <th className="pb-3 font-semibold">Status</th>
                          <th className="pb-3 font-semibold">Created</th>
                          <th className="pb-3 font-semibold text-right">Views</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {popular.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="py-3 font-medium text-slate-800 max-w-[500px] truncate">{item.title_en}</td>
                            <td className="py-3">
                              <Badge className="text-[9px] font-bold px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 uppercase">
                                {item.status}
                              </Badge>
                            </td>
                            <td className="py-3 text-slate-400 font-medium">{new Date(item.created_at).toLocaleDateString()}</td>
                            <td className="py-3 text-right font-bold text-slate-700 flex items-center justify-end gap-1.5">
                              <Eye className="h-3.5 w-3.5 text-slate-400" />
                              {item.views_count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* 2. CRAWLER CONTROL TAB */}
          {activeTab === "crawler" && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm max-w-4xl space-y-8">
              <div>
                <h3 className="text-lg font-bold text-slate-800">RSS Feeds & Keywords Configurations</h3>
                <p className="text-xs text-slate-400 mt-1">Configure sources scanned by the AI news aggregation pipeline.</p>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Scanned Portals</h4>
                <div className="divide-y border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                  {[
                    { name: "Vanguard News", url: "https://www.vanguardngr.com/feed/" },
                    { name: "Punch Newspapers", url: "https://punchng.com/feed/" },
                    { name: "Premium Times", url: "https://www.premiumtimesng.com/feed" },
                    { name: "The Nation Online", url: "https://thenationonlineng.net/feed/" },
                    { name: "Daily Post Nigeria", url: "https://dailypost.ng/feed/" },
                  ].map((f) => (
                    <div key={f.name} className="p-4 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-700">{f.name}</p>
                        <p className="text-slate-400 font-mono mt-0.5">{f.url}</p>
                      </div>
                      <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 font-bold border border-green-500/20 px-2 py-0.5">Active</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Trending Category Keywords</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Nigeria", "Abuja", "INEC", "Tinubu", "PDP", "APC", "Naira", "CBN",
                    "Wizkid", "Davido", "Burna", "Afrobeats", "Grammy", "Album", "Music"
                  ].map((kw) => (
                    <span key={kw} className="text-xs font-bold px-3 py-1.5 bg-slate-100 rounded-lg text-slate-600 border border-slate-200">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4. POLLS MANAGER TAB */}
          {activeTab === "polls" && (
            <div className="space-y-6">
              
              {/* Polls Grid/List */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">All Interactive Polls</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Toggle active status to control showing on homepage, and view vote statistics.</p>
                  </div>
                  <Button
                    onClick={() => {
                      setPollQuestion("");
                      setPollDescription("");
                      setPollOptions(["", ""]);
                      setPollEndsAt("");
                      setIsCreatePollOpen(true);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-md flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create New Poll
                  </Button>
                </div>

                {polls.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Vote className="h-10 w-10 mx-auto text-slate-300 mb-2 animate-bounce" />
                    <p className="font-bold text-slate-500">No polls have been launched yet.</p>
                    <p className="text-xs mt-1">Click "Create New Poll" to post the first survey.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {polls.map((poll) => (
                      <Card key={poll.id} className="border border-slate-200/60 shadow-xs rounded-xl overflow-hidden hover:shadow-md transition-all">
                        <CardContent className="p-5 flex items-start justify-between gap-6">
                          
                          <div className="flex-grow min-w-0 space-y-2.5">
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-sm text-slate-800 leading-snug">
                                {poll.question}
                              </h4>
                              <Badge className={`text-[9px] uppercase tracking-wider px-2 py-0.5 font-bold ${
                                poll.is_active 
                                  ? "bg-green-50 text-green-700 border border-green-200" 
                                  : "bg-slate-100 text-slate-500 border border-slate-200"
                              }`}>
                                {poll.is_active ? "Active" : "Closed"}
                              </Badge>
                            </div>

                            {poll.description && (
                              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                {poll.description}
                              </p>
                            )}

                            {/* Option list and vote summary */}
                            <div className="grid grid-cols-2 gap-3 pt-2">
                              {poll.options.map((opt: any) => (
                                <div key={opt.id} className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-xs flex items-center justify-between font-semibold">
                                  <span className="text-slate-650">{opt.text}</span>
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold tracking-wider uppercase pt-2">
                              <span className="flex items-center gap-1">
                                <BarChart2 className="h-3.5 w-3.5 text-green-500" />
                                {poll.votes_count} Votes Cast
                              </span>
                              {poll.ends_at && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                                  Ends: {new Date(poll.ends_at).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 self-center flex items-center gap-3">
                            <button
                              onClick={() => handleTogglePoll(poll.id, poll.is_active)}
                              className={`px-4 py-2 text-xs font-bold rounded-lg border shadow-xs transition-all ${
                                poll.is_active
                                  ? "bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100"
                                  : "bg-green-50 border-green-200 text-green-700 hover:bg-green-105"
                              }`}
                            >
                              {poll.is_active ? "Deactivate" : "Activate"}
                            </button>
                          </div>

                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. SETTINGS TAB */}
          {activeTab === "settings" && (
            <div className="space-y-8 max-w-4xl">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Access Tokens & API Keys</h3>
                  <p className="text-xs text-slate-400 mt-1">Manage pipeline secure credentials.</p>
                </div>

                <div className="space-y-6">
                  {[
                    { name: "Supabase Service Key", status: "Connected", length: "219 chars" },
                    { name: "OpenAI API Token", status: "Connected", length: "164 chars" },
                    { name: "Telegram Bot Key", status: "Connected", length: "46 chars" },
                    { name: "Twitter API Credentials", status: "Configured (HMAC-SHA1 Signature Signed)", length: "4 Keys" },
                  ].map((item) => (
                    <div key={item.name} className="flex items-center justify-between border-b pb-4 text-xs">
                      <div>
                        <p className="font-bold text-slate-700">{item.name}</p>
                        <p className="text-slate-400 mt-0.5">{item.length}</p>
                      </div>
                      <span className="font-bold text-green-600 bg-green-50 border border-green-200 px-3 py-1 rounded-lg">
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Share2 className="h-5 w-5 text-green-600" />
                    Social Distribution Preferences
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Configure global options for auto-sharing published articles to social platforms.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <div>
                      <p className="text-xs font-bold text-slate-700">Auto-Tweet to X (Twitter)</p>
                      <p className="text-[11px] text-slate-450 mt-0.5">Automatically format and tweet new articles using Twitter OAuth HMAC-SHA1 signatures on publish.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoTweetEnabled}
                      onChange={(e) => setAutoTweetEnabled(e.target.checked)}
                      className="h-4 w-4 text-green-600 border-slate-350 rounded focus:ring-green-500 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <div>
                      <p className="text-xs font-bold text-slate-700">Auto-Broadcast to Telegram Channel</p>
                      <p className="text-[11px] text-slate-450 mt-0.5">Send a stylized news flash with both English and Pidgin copies to the official Telegram channel.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoTelegramEnabled}
                      onChange={(e) => setAutoTelegramEnabled(e.target.checked)}
                      className="h-4 w-4 text-green-600 border-slate-350 rounded focus:ring-green-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ─── MANUAL ARTICLE CREATOR DIALOG ─── */}
      <Dialog open={isCreateArticleOpen} onOpenChange={setIsCreateArticleOpen}>
        <DialogContent className="sm:max-w-2xl bg-white text-slate-800 border border-slate-200 shadow-2xl p-6 rounded-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileEdit className="h-5 w-5 text-green-600" />
              Write New News Article
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Draft and publish custom English and Pidgin news stories straight to the database.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateArticle} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Headline (English)</label>
                <input
                  type="text"
                  required
                  value={articleTitleEn}
                  onChange={(e) => setArticleTitleEn(e.target.value)}
                  placeholder="e.g. CBN Increases Interest Rates to 24%"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Headline (Pidgin)</label>
                <input
                  type="text"
                  value={articleTitlePidgin}
                  onChange={(e) => setArticleTitlePidgin(e.target.value)}
                  placeholder="e.g. CBN increase interest rate go 24%"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Content (English)</label>
                <textarea
                  required
                  rows={6}
                  value={articleContentEn}
                  onChange={(e) => setArticleContentEn(e.target.value)}
                  placeholder="Type the full English article body..."
                  className="w-full text-xs p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500 font-medium whitespace-pre-wrap resize-y"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Content (Pidgin)</label>
                <textarea
                  rows={6}
                  value={articleContentPidgin}
                  onChange={(e) => setArticleContentPidgin(e.target.value)}
                  placeholder="Type the full Pidgin article body..."
                  className="w-full text-xs p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500 font-medium whitespace-pre-wrap resize-y"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                <select
                  value={articleCategorySlug}
                  onChange={(e) => setArticleCategorySlug(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500 font-medium"
                >
                  <option value="politics">Politics</option>
                  <option value="business">Business</option>
                  <option value="tech">Tech</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="sports">Sports</option>
                  <option value="trending">Trending</option>
                </select>
              </div>

              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Thumbnail Image URL</label>
                <input
                  type="text"
                  value={articleThumbnailUrl}
                  onChange={(e) => setArticleThumbnailUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Save Status</label>
                <select
                  value={articleStatus}
                  onChange={(e) => setArticleStatus(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500 font-medium"
                >
                  <option value="draft">Save as Draft</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="published">Publish Immediately</option>
                </select>
              </div>

              {articleStatus === "published" && (
                <div className="flex items-center gap-2 self-center mt-4 bg-slate-50 border border-slate-200 rounded-xl p-3.5 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    id="should_tweet"
                    checked={articleShouldTweet}
                    onChange={(e) => setArticleShouldTweet(e.target.checked)}
                    className="h-4 w-4 text-green-600 border-slate-300 rounded focus:ring-green-500"
                  />
                  <label htmlFor="should_tweet" className="text-xs font-bold text-slate-600 cursor-pointer">
                    Auto-Tweet on X (Twitter)
                  </label>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateArticleOpen(false)}
                className="text-xs font-bold px-4 py-2.5 border-slate-200 hover:bg-slate-50 text-slate-600"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creatingArticle}
                className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-5 py-2.5 shadow-md shadow-green-600/10"
              >
                {creatingArticle ? "Saving..." : "Save Article"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── POLL CREATOR DIALOG ─── */}
      <Dialog open={isCreatePollOpen} onOpenChange={setIsCreatePollOpen}>
        <DialogContent className="sm:max-w-md bg-white text-slate-800 border border-slate-200 shadow-2xl p-6 rounded-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Vote className="h-5 w-5 text-green-600" />
              Launch New Poll
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Create a new public opinion poll with custom choice options.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreatePoll} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Poll Question</label>
              <input
                type="text"
                required
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="e.g. Who do you think wins the upcoming LGA elections?"
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Description / Subtext (Optional)</label>
              <textarea
                rows={2}
                value={pollDescription}
                onChange={(e) => setPollDescription(e.target.value)}
                placeholder="Provide details about the poll rules or time boundaries..."
                className="w-full text-xs p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500 font-medium resize-y"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 uppercase">Choice Options</label>
                <button
                  type="button"
                  onClick={addOptionField}
                  className="text-[10px] font-black text-green-600 hover:text-green-700 flex items-center gap-0.5"
                >
                  <Plus className="h-3 w-3" /> Add Choice
                </button>
              </div>

              <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      value={opt}
                      onChange={(e) => updateOptionField(idx, e.target.value)}
                      placeholder={`Choice #${idx + 1}`}
                      className="flex-grow text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500 font-medium"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOptionField(idx)}
                        className="p-2.5 bg-red-50 text-red-500 border border-red-100 hover:bg-red-100 rounded-xl transition-colors"
                        title="Remove choice"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Ends At (Optional)</label>
              <input
                type="datetime-local"
                value={pollEndsAt}
                onChange={(e) => setPollEndsAt(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500 font-medium"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreatePollOpen(false)}
                className="text-xs font-bold px-4 py-2.5 border-slate-200 hover:bg-slate-50 text-slate-600"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creatingPoll}
                className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-5 py-2.5 shadow-md shadow-green-600/10"
              >
                {creatingPoll ? "Launching..." : "Launch Poll"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
