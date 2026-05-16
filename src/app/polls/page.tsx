"use client";

import { useState, useEffect, useOptimistic, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, BarChart3, Clock, Users } from "lucide-react";

// ─── SAMPLE POLL DATA ─────────────────────────────────────────────────────────
// In production, fetch this from Supabase with real-time subscriptions

interface PollOption {
  id: number;
  text: string;
  votes: number;
  color: string;
}

interface Poll {
  id: string;
  question: string;
  description: string;
  options: PollOption[];
  totalVotes: number;
  endsAt: string;
  category: string;
}

const SAMPLE_POLLS: Poll[] = [
  {
    id: "poll-1",
    question: "Who do you think will win the 2026 Osun Gubernatorial Election?",
    description: "Cast your vote and see how Nigerians across the country are thinking.",
    options: [
      { id: 1, text: "Ademola Adeleke (PDP)", votes: 12400, color: "#dc2626" },
      { id: 2, text: "Gboyega Oyetola (APC)", votes: 9800, color: "#16a34a" },
      { id: 3, text: "LP Candidate", votes: 3200, color: "#f59e0b" },
      { id: 4, text: "Too Early to Say", votes: 4600, color: "#6b7280" },
    ],
    totalVotes: 30000,
    endsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    category: "Governorship",
  },
  {
    id: "poll-2",
    question: "How do you rate President Tinubu's first year economic performance?",
    description: "Your opinion matters. Rate the presidency on economic management.",
    options: [
      { id: 1, text: "Excellent — Real progress", votes: 4200, color: "#16a34a" },
      { id: 2, text: "Good — On the right track", votes: 6100, color: "#22c55e" },
      { id: 3, text: "Poor — Nigerians are suffering", votes: 18500, color: "#dc2626" },
      { id: 4, text: "Too early to judge", votes: 3800, color: "#6b7280" },
    ],
    totalVotes: 32600,
    endsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    category: "Presidential",
  },
  {
    id: "poll-3",
    question: "Which Nigerian state has the best governance right now?",
    description: "Based on infrastructure, security, and welfare programs.",
    options: [
      { id: 1, text: "Lagos State", votes: 9200, color: "#7c3aed" },
      { id: 2, text: "Jigawa State", votes: 4100, color: "#2563eb" },
      { id: 3, text: "Enugu State", votes: 6800, color: "#f59e0b" },
      { id: 4, text: "Rivers State", votes: 3400, color: "#dc2626" },
    ],
    totalVotes: 23500,
    endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    category: "State Governance",
  },
];

// ─── CANDIDATE DATA ────────────────────────────────────────────────────────────

interface Candidate {
  id: string;
  name: string;
  party: string;
  partyColor: string;
  state: string;
  age: number;
  education: string;
  experience: string[];
  keyPolicies: string[];
  strengthScore: number;
  imageInitials: string;
  bgColor: string;
}

const CANDIDATES: Candidate[] = [
  {
    id: "c1",
    name: "Ademola Adeleke",
    party: "PDP",
    partyColor: "#dc2626",
    state: "Osun",
    age: 64,
    education: "American Preparatory Institute, Arizona, USA",
    experience: [
      "Senator, Federal Republic of Nigeria (2017-2019)",
      "Governor, Osun State (2022–present)",
    ],
    keyPolicies: [
      "Free school meals for public school pupils",
      "N40,000 minimum wage for civil servants",
      "Infrastructure revival across 30 LGAs",
      "Agricultural investment in Osun",
    ],
    strengthScore: 72,
    imageInitials: "AA",
    bgColor: "#dc2626",
  },
  {
    id: "c2",
    name: "Gboyega Oyetola",
    party: "APC",
    partyColor: "#16a34a",
    state: "Osun",
    age: 68,
    education: "University of Lagos, BSc Actuarial Science",
    experience: [
      "Governor, Osun State (2018-2022)",
      "Chief of Staff, Osun State (2010-2018)",
      "Minister of Marine & Blue Economy (2023–present)",
    ],
    keyPolicies: [
      "O-YES Youth Empowerment program",
      "Osun Health Insurance Scheme",
      "Osun State Pension Reforms",
      "Rural infrastructure via OSBIR",
    ],
    strengthScore: 68,
    imageInitials: "GO",
    bgColor: "#16a34a",
  },
];


// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function PollCard({ poll }: { poll: Poll }) {
  const [voted, setVoted] = useState<number | null>(null);
  const [localPoll, setLocalPoll] = useState(poll);

  function timeLeft(iso: string): string {
    const diff = new Date(iso).getTime() - Date.now();
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  }

  function handleVote(optionId: number) {
    if (voted !== null) return;
    setVoted(optionId);
    setLocalPoll((prev) => ({
      ...prev,
      totalVotes: prev.totalVotes + 1,
      options: prev.options.map((o) =>
        o.id === optionId ? { ...o, votes: o.votes + 1 } : o
      ),
    }));
  }

  return (
    <Card className="border-none shadow-lg overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-green-500 to-green-700" />
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4 mb-2">
          <Badge variant="outline" className="text-xs shrink-0">{localPoll.category}</Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeLeft(localPoll.endsAt)}
          </span>
        </div>
        <h3 className="font-bold text-base leading-snug mb-1">{localPoll.question}</h3>
        <p className="text-xs text-muted-foreground mb-5">{localPoll.description}</p>

        <div className="space-y-3">
          {localPoll.options.map((option) => {
            const pct = Math.round((option.votes / localPoll.totalVotes) * 100);
            const isVoted = voted === option.id;
            return (
              <button
                key={option.id}
                onClick={() => handleVote(option.id)}
                disabled={voted !== null}
                className={`w-full text-left rounded-lg border transition-all overflow-hidden ${
                  voted !== null ? "cursor-default" : "hover:border-green-500 cursor-pointer"
                } ${isVoted ? "border-green-600 bg-green-50" : "border-zinc-200"}`}
              >
                <div className="px-4 py-2.5 relative">
                  {voted !== null && (
                    <div
                      className="absolute inset-0 rounded-lg transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: option.color,
                        opacity: 0.12,
                      }}
                    />
                  )}
                  <div className="relative flex items-center justify-between">
                    <span className={`text-sm font-medium ${isVoted ? "text-green-800" : ""}`}>
                      {isVoted && <CheckCircle className="inline h-3.5 w-3.5 mr-1.5 text-green-600" />}
                      {option.text}
                    </span>
                    {voted !== null && (
                      <span className="text-xs font-bold" style={{ color: option.color }}>
                        {pct}%
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t flex items-center gap-2 text-xs text-muted-foreground">
          <Users className="h-3 w-3" />
          <span>{localPoll.totalVotes.toLocaleString()} votes cast</span>
        </div>
      </CardContent>
    </Card>
  );
}

function ComparisonBar({
  label,
  valueA,
  valueB,
  colorA,
  colorB,
  isScore = false,
}: {
  label: string;
  valueA: string | number;
  valueB: string | number;
  colorA: string;
  colorB: string;
  isScore?: boolean;
}) {
  return (
    <div className="py-3 border-b last:border-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 text-center">
        {label}
      </p>
      <div className="grid grid-cols-3 items-center gap-4">
        <div className="text-right">
          <span
            className={`text-sm font-bold ${isScore ? "text-lg" : ""}`}
            style={{ color: colorA }}
          >
            {isScore ? `${valueA}/100` : valueA}
          </span>
        </div>
        {isScore && (
          <div className="h-3 bg-zinc-100 rounded-full overflow-hidden flex">
            <div
              className="h-full rounded-l-full transition-all"
              style={{ width: `${(Number(valueA) / 100) * 50}%`, backgroundColor: colorA }}
            />
            <div
              className="h-full rounded-r-full transition-all ml-auto"
              style={{ width: `${(Number(valueB) / 100) * 50}%`, backgroundColor: colorB }}
            />
          </div>
        )}
        {!isScore && <div className="text-center text-xs text-zinc-400">vs</div>}
        <div className="text-left">
          <span
            className={`text-sm font-bold ${isScore ? "text-lg" : ""}`}
            style={{ color: colorB }}
          >
            {isScore ? `${valueB}/100` : valueB}
          </span>
        </div>
      </div>
    </div>
  );
}

function CandidateComparison() {
  const [a, b] = CANDIDATES;

  return (
    <div className="space-y-6">
      {/* Candidate Headers */}
      <div className="grid grid-cols-2 gap-4">
        {[a, b].map((c) => (
          <Card key={c.id} className="border-none shadow-md overflow-hidden">
            <div className="h-2" style={{ backgroundColor: c.partyColor }} />
            <CardContent className="p-5 text-center">
              <div
                className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white text-xl font-black mb-3"
                style={{ backgroundColor: c.partyColor }}
              >
                {c.imageInitials}
              </div>
              <h3 className="font-bold text-base">{c.name}</h3>
              <Badge className="mt-1 text-white" style={{ backgroundColor: c.partyColor }}>
                {c.party}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">{c.state} State</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comparison Rows */}
      <Card className="border-none shadow-md">
        <CardContent className="p-6">
          <ComparisonBar label="Viability Score" valueA={a.strengthScore} valueB={b.strengthScore} colorA={a.partyColor} colorB={b.partyColor} isScore />
          <ComparisonBar label="Age" valueA={`${a.age} yrs`} valueB={`${b.age} yrs`} colorA={a.partyColor} colorB={b.partyColor} />
          <ComparisonBar label="Education" valueA={a.education.split(",")[0]} valueB={b.education.split(",")[0]} colorA={a.partyColor} colorB={b.partyColor} />
          <ComparisonBar label="Years of Experience" valueA={`${a.experience.length * 4}+ yrs`} valueB={`${b.experience.length * 4}+ yrs`} colorA={a.partyColor} colorB={b.partyColor} />
        </CardContent>
      </Card>

      {/* Key Policies Side-by-Side */}
      <div className="grid grid-cols-2 gap-4">
        {[a, b].map((c) => (
          <Card key={c.id} className="border-none shadow-md">
            <CardContent className="p-5">
              <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.partyColor }} />
                {c.name.split(" ")[0]}'s Key Policies
              </h4>
              <ul className="space-y-2">
                {c.keyPolicies.map((policy, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="mt-0.5" style={{ color: c.partyColor }}>✓</span>
                    {policy}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────

export default function PollsPage() {
  const [activeTab, setActiveTab] = useState<"polls" | "compare">("polls");

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-5">
          <h1 className="text-2xl font-bold text-green-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-green-600" />
            Political Intelligence Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live polls · Candidate comparisons · Real-time insights
          </p>
        </div>

        {/* Tab Bar */}
        <div className="container mx-auto px-6">
          <div className="flex gap-0 border-b-0">
            {(["polls", "compare"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors capitalize ${
                  activeTab === tab
                    ? "border-green-600 text-green-700"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "polls" ? "🗳️ Live Polls" : "⚔️ Candidate Compare"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {activeTab === "polls" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {SAMPLE_POLLS.map((poll) => (
              <PollCard key={poll.id} poll={poll} />
            ))}
          </div>
        )}

        {activeTab === "compare" && (
          <div className="max-w-2xl mx-auto">
            <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Osun 2026 Showdown:</strong> See how the frontrunners stack up on key metrics, policy positions, and political experience.
              </p>
            </div>
            <CandidateComparison />
          </div>
        )}
      </div>
    </div>
  );
}
