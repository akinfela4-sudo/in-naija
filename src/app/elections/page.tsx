"use client";

import { useState } from "react";
import {
  NIGERIA_STATES,
  PARTY_COLORS,
  PARTY_FULL_NAMES,
  getPartyStats,
  type StateResult,
  type Party,
} from "@/lib/data/nigeria-states";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CELL_SIZE = 56;
const CELL_GAP = 6;
const GRID_COLS = 10;
const GRID_ROWS = 9;

function formatVotes(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

function getWinPercent(state: StateResult) {
  return ((state.results[state.winner] / state.totalVotes) * 100).toFixed(1);
}

export default function ElectionMap() {
  const [selected, setSelected] = useState<StateResult | null>(null);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const partyStats = getPartyStats();

  const svgWidth = GRID_COLS * (CELL_SIZE + CELL_GAP);
  const svgHeight = GRID_ROWS * (CELL_SIZE + CELL_GAP);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                🇳🇬 Nigeria Election Intelligence Map
              </h1>
              <p className="text-sm text-zinc-400 mt-1">
                Presidential Election Results · All 36 States + FCT
              </p>
            </div>
            <Badge className="bg-green-600 text-sm px-3 py-1">LIVE DATA</Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Map Area */}
          <div className="xl:col-span-8">
            {/* Party Legend */}
            <div className="flex flex-wrap gap-3 mb-6">
              {(Object.entries(PARTY_COLORS) as [Party, string][]).map(([party, color]) => (
                <div key={party} className="flex items-center gap-2 bg-zinc-800 rounded-full px-3 py-1">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
                  <span className="text-xs font-bold text-zinc-200">{party}</span>
                  <span className="text-xs text-zinc-500">{partyStats[party].states} states</span>
                </div>
              ))}
            </div>

            {/* Schematic Tile Map */}
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full"
                style={{ maxHeight: 520 }}
              >
                {NIGERIA_STATES.map((state) => {
                  const x = state.cx * (CELL_SIZE + CELL_GAP);
                  const y = state.cy * (CELL_SIZE + CELL_GAP);
                  const isSelected = selected?.id === state.id;
                  const isHoveredZone = hoveredZone === state.zone;
                  const color = PARTY_COLORS[state.winner];
                  const opacity = hoveredZone && !isHoveredZone ? 0.3 : 1;

                  return (
                    <g key={state.id} style={{ opacity, cursor: "pointer" }}>
                      <rect
                        x={x}
                        y={y}
                        width={CELL_SIZE}
                        height={CELL_SIZE}
                        rx={8}
                        fill={color}
                        fillOpacity={isSelected ? 1 : 0.8}
                        stroke={isSelected ? "#ffffff" : "transparent"}
                        strokeWidth={isSelected ? 3 : 0}
                        className="transition-all duration-150"
                        onClick={() => setSelected(isSelected ? null : state)}
                        onMouseEnter={() => setHoveredZone(state.zone)}
                        onMouseLeave={() => setHoveredZone(null)}
                      />
                      {/* State abbreviation */}
                      <text
                        x={x + CELL_SIZE / 2}
                        y={y + CELL_SIZE / 2 - 4}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={10}
                        fontWeight="800"
                        fill="white"
                        style={{ pointerEvents: "none", userSelect: "none" }}
                      >
                        {state.id.length > 2 ? state.id.slice(0, 2) : state.id}
                      </text>
                      {/* Win percentage */}
                      <text
                        x={x + CELL_SIZE / 2}
                        y={y + CELL_SIZE / 2 + 10}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={8}
                        fill="rgba(255,255,255,0.8)"
                        style={{ pointerEvents: "none", userSelect: "none" }}
                      >
                        {getWinPercent(state)}%
                      </text>
                    </g>
                  );
                })}
              </svg>
              <p className="text-xs text-zinc-600 text-center mt-3">
                Click any state tile to view detailed results · Hover to highlight geopolitical zone
              </p>
            </div>
          </div>

          {/* Sidebar: Stats + State Detail */}
          <div className="xl:col-span-4 space-y-5">
            {/* National Summary */}
            <Card className="bg-zinc-900 border-zinc-800 text-white">
              <CardContent className="p-5">
                <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-400 mb-4">
                  National Tally
                </h3>
                <div className="space-y-3">
                  {(Object.entries(partyStats) as [Party, { states: number; totalVotes: number }][])
                    .sort((a, b) => b[1].states - a[1].states)
                    .map(([party, stats]) => {
                      const totalAllVotes = Object.values(partyStats).reduce(
                        (s, p) => s + p.totalVotes, 0
                      );
                      const pct = ((stats.totalVotes / totalAllVotes) * 100).toFixed(1);
                      return (
                        <div key={party}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-bold" style={{ color: PARTY_COLORS[party] }}>
                              {party}
                            </span>
                            <span className="text-zinc-300">
                              {stats.states} states · {formatVotes(stats.totalVotes)} votes
                            </span>
                          </div>
                          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: PARTY_COLORS[party],
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            {/* State Detail Card */}
            {selected ? (
              <Card className="bg-zinc-900 border-zinc-800 text-white">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-black">{selected.name}</h3>
                      <p className="text-xs text-zinc-400">{selected.zone} · {formatVotes(selected.totalVotes)} total votes</p>
                    </div>
                    <Badge
                      style={{ backgroundColor: PARTY_COLORS[selected.winner] }}
                      className="text-white font-bold"
                    >
                      {selected.winner} WINS
                    </Badge>
                  </div>

                  <div className="space-y-2.5">
                    {(Object.entries(selected.results) as [Party, number][])
                      .sort((a, b) => b[1] - a[1])
                      .map(([party, votes]) => {
                        const pct = ((votes / selected.totalVotes) * 100).toFixed(1);
                        const isWinner = party === selected.winner;
                        return (
                          <div key={party}>
                            <div className="flex justify-between text-xs mb-1">
                              <span
                                className={`font-bold ${isWinner ? "" : "text-zinc-400"}`}
                                style={{ color: isWinner ? PARTY_COLORS[party] : undefined }}
                              >
                                {party} {isWinner && "🏆"}
                              </span>
                              <span className="text-zinc-300">
                                {formatVotes(votes)} ({pct}%)
                              </span>
                            </div>
                            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: PARTY_COLORS[party],
                                  opacity: isWinner ? 1 : 0.4,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  <div className="mt-4 pt-4 border-t border-zinc-800">
                    <p className="text-xs text-zinc-500">
                      {PARTY_FULL_NAMES[selected.winner]} won {selected.name} State with{" "}
                      <strong className="text-white">{getWinPercent(selected)}%</strong> of the vote.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-zinc-800/50 border-zinc-700 border-dashed text-white">
                <CardContent className="p-6 text-center">
                  <p className="text-4xl mb-3">🗺️</p>
                  <p className="text-sm text-zinc-400">
                    Click any state on the map to see detailed election results.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Zone Filter Guide */}
            <Card className="bg-zinc-900 border-zinc-800 text-white">
              <CardContent className="p-4">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
                  Geopolitical Zones
                </p>
                {["North-West", "North-East", "North-Central", "South-West", "South-South", "South-East"].map((zone) => {
                  const zoneStates = NIGERIA_STATES.filter((s) => s.zone === zone);
                  const dominantParty = (Object.entries(
                    zoneStates.reduce((acc, s) => {
                      acc[s.winner] = (acc[s.winner] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).sort((a, b) => b[1] - a[1])[0]?.[0] || "APC") as Party;

                  return (
                    <button
                      key={zone}
                      onMouseEnter={() => setHoveredZone(zone)}
                      onMouseLeave={() => setHoveredZone(null)}
                      onClick={() => setHoveredZone(hoveredZone === zone ? null : zone)}
                      className="w-full flex items-center justify-between py-1.5 hover:bg-zinc-800 rounded px-2 transition-colors"
                    >
                      <span className="text-xs text-zinc-300">{zone}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500">{zoneStates.length} states</span>
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: PARTY_COLORS[dominantParty] }}
                        />
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
