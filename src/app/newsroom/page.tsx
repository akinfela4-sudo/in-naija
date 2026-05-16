"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";

interface Article {
  id: string;
  title_en: string;
  title_pidgin: string;
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

export default function NewsroomPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activePreview, setActivePreview] = useState<Article | null>(null);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/newsroom/scan");
      const data = await res.json();
      setArticles(data.articles || []);
    } catch {
      console.error("Failed to fetch queue");
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
      if (data.success) fetchQueue();
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

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-green-900 flex items-center gap-2">
              <Bot className="h-6 w-6 text-green-600" />
              AI Newsroom
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Automated news pipeline · Scan → Rewrite → Approve → Publish
            </p>
          </div>
          <Button
            onClick={handleScan}
            disabled={scanning}
            className="bg-green-700 hover:bg-green-800 gap-2"
          >
            {scanning ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Scan Now
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 flex gap-8">
        {/* Main Queue */}
        <div className="flex-grow space-y-6">
          {/* Pipeline Status Banner */}
          {scanResult && (
            <div
              className={`rounded-lg p-4 border flex items-start gap-4 ${
                scanResult.success
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
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
                    <p className="font-semibold text-green-800">Scan Complete!</p>
                    <p className="text-sm text-green-700">
                      Scanned {scanResult.scanned} feeds · Processed{" "}
                      {scanResult.processed} new articles into the approval queue.
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-red-700">{scanResult.error}</p>
                )}
              </div>
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Pending Approval", value: articles.length, color: "text-amber-600" },
              { label: "Published Today", value: "—", color: "text-green-600" },
              { label: "RSS Sources", value: "5", color: "text-blue-600" },
            ].map((s) => (
              <Card key={s.label} className="border-none shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Article Queue */}
          <div>
            <h2 className="text-base font-bold mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Approval Queue
            </h2>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-white rounded-lg animate-pulse border" />
                ))}
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed rounded-xl">
                <Bot className="h-10 w-10 mx-auto text-zinc-300 mb-4" />
                <p className="font-semibold text-zinc-500">Queue is empty</p>
                <p className="text-sm text-zinc-400 mt-1">
                  Click "Scan Now" to fetch and process new articles.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {articles.map((article) => (
                  <Card
                    key={article.id}
                    className={`border-none shadow-sm transition-all ${
                      processingId === article.id ? "opacity-50" : ""
                    }`}
                  >
                    <CardContent className="p-4 flex items-start gap-4">
                      {/* Thumbnail */}
                      <div className="w-20 h-16 rounded-md bg-zinc-100 shrink-0 overflow-hidden">
                        {article.thumbnail_url ? (
                          <img
                            src={article.thumbnail_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileText className="h-6 w-6 text-zinc-300" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-grow min-w-0">
                        <p className="font-bold text-sm leading-snug truncate">
                          {article.title_en}
                        </p>
                        <p className="text-xs text-green-700 mt-0.5 italic truncate">
                          🇳🇬 {article.title_pidgin}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant="outline" className="text-[10px]">
                            {article.status.replace("_", " ")}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {timeAgo(article.created_at)}
                          </span>
                          <a
                            href={article.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5"
                          >
                            Source <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setActivePreview(article)}
                          className="p-1.5 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
                          title="Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleReject(article.id)}
                          disabled={!!processingId}
                          className="p-1.5 rounded hover:bg-red-50 text-zinc-300 hover:text-red-500 transition-colors"
                          title="Reject"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleApprove(article.id)}
                          disabled={!!processingId}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-700 hover:bg-green-800 text-white text-xs rounded font-medium transition-colors"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Approve
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Preview Panel */}
        {activePreview && (
          <div className="w-96 shrink-0">
            <div className="sticky top-24 bg-white border rounded-xl overflow-hidden shadow-lg">
              <div className="flex items-center justify-between p-4 border-b">
                <p className="font-semibold text-sm">Article Preview</p>
                <button
                  onClick={() => setActivePreview(null)}
                  className="text-zinc-400 hover:text-zinc-700"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>

              <div className="p-4 max-h-[70vh] overflow-y-auto">
                <Tabs defaultValue="english">
                  <TabsList className="w-full mb-4">
                    <TabsTrigger value="english" className="flex-1">
                      🇬🇧 English
                    </TabsTrigger>
                    <TabsTrigger value="pidgin" className="flex-1">
                      🇳🇬 Pidgin
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="english" className="space-y-3">
                    <h3 className="font-bold text-base leading-snug">
                      {activePreview.title_en}
                    </h3>
                    <p className="text-xs text-muted-foreground italic">
                      Full content available after fetching from API...
                    </p>
                  </TabsContent>

                  <TabsContent value="pidgin" className="space-y-3">
                    <h3 className="font-bold text-base leading-snug text-green-800">
                      {activePreview.title_pidgin}
                    </h3>
                    <p className="text-xs text-muted-foreground italic">
                      Full Pidgin content available after fetching from API...
                    </p>
                  </TabsContent>
                </Tabs>

                <div className="mt-4 pt-4 border-t flex gap-2">
                  <button
                    onClick={() => {
                      handleReject(activePreview.id);
                      setActivePreview(null);
                    }}
                    className="flex-1 py-2 border border-red-200 text-red-600 rounded text-sm font-medium hover:bg-red-50 transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      handleApprove(activePreview.id);
                      setActivePreview(null);
                    }}
                    className="flex-1 py-2 bg-green-700 text-white rounded text-sm font-medium hover:bg-green-800 transition-colors"
                  >
                    ✓ Approve & Publish
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
