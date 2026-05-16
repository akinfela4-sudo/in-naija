export type Party = "APC" | "PDP" | "LP" | "NNPP" | "OTHER";

export interface StateResult {
  id: string;
  name: string;
  cx: number;
  cy: number;
  zone: string;
  winner: Party;
  totalVotes: number;
  results: Record<Party, number>;
}

export const PARTY_COLORS: Record<Party, string> = {
  APC: "#16a34a", // Green
  PDP: "#dc2626", // Red
  LP: "#f59e0b", // Amber
  NNPP: "#2563eb", // Blue
  OTHER: "#6b7280", // Gray
};

export const PARTY_FULL_NAMES: Record<Party, string> = {
  APC: "All Progressives Congress",
  PDP: "People's Democratic Party",
  LP: "Labour Party",
  NNPP: "New Nigeria Peoples Party",
  OTHER: "Other Parties",
};

// Simplified grid coordinates for the 36 states + FCT
// (cx, cy) represents (column, row) in a 10x9 schematic grid
export const NIGERIA_STATES: StateResult[] = [
  // North-West
  { id: "KB", name: "Kebbi", cx: 1, cy: 1, zone: "North-West", winner: "APC", totalVotes: 510000, results: { APC: 320000, PDP: 150000, LP: 10000, NNPP: 5000, OTHER: 25000 } },
  { id: "SK", name: "Sokoto", cx: 2, cy: 0, zone: "North-West", winner: "APC", totalVotes: 480000, results: { APC: 280000, PDP: 170000, LP: 5000, NNPP: 5000, OTHER: 20000 } },
  { id: "ZM", name: "Zamfara", cx: 2, cy: 1, zone: "North-West", winner: "APC", totalVotes: 420000, results: { APC: 290000, PDP: 110000, LP: 5000, NNPP: 5000, OTHER: 10000 } },
  { id: "KT", name: "Katsina", cx: 3, cy: 0, zone: "North-West", winner: "APC", totalVotes: 950000, results: { APC: 510000, PDP: 420000, LP: 10000, NNPP: 5000, OTHER: 5000 } },
  { id: "KN", name: "Kano", cx: 4, cy: 1, zone: "North-West", winner: "NNPP", totalVotes: 1800000, results: { APC: 520000, PDP: 130000, LP: 30000, NNPP: 1000000, OTHER: 120000 } },
  { id: "KD", name: "Kaduna", cx: 3, cy: 2, zone: "North-West", winner: "PDP", totalVotes: 1200000, results: { APC: 450000, PDP: 600000, LP: 100000, NNPP: 20000, OTHER: 30000 } },
  { id: "JI", name: "Jigawa", cx: 5, cy: 0, zone: "North-West", winner: "APC", totalVotes: 800000, results: { APC: 430000, PDP: 320000, LP: 10000, NNPP: 20000, OTHER: 20000 } },

  // North-East
  { id: "YO", name: "Yobe", cx: 6, cy: 0, zone: "North-East", winner: "APC", totalVotes: 350000, results: { APC: 210000, PDP: 120000, LP: 5000, NNPP: 5000, OTHER: 10000 } },
  { id: "BO", name: "Borno", cx: 7, cy: 0, zone: "North-East", winner: "APC", totalVotes: 450000, results: { APC: 380000, PDP: 40000, LP: 10000, NNPP: 10000, OTHER: 10000 } },
  { id: "BA", name: "Bauchi", cx: 6, cy: 1, zone: "North-East", winner: "PDP", totalVotes: 850000, results: { APC: 400000, PDP: 420000, LP: 10000, NNPP: 10000, OTHER: 10000 } },
  { id: "GO", name: "Gombe", cx: 7, cy: 1, zone: "North-East", winner: "APC", totalVotes: 420000, results: { APC: 250000, PDP: 150000, LP: 5000, NNPP: 5000, OTHER: 10000 } },
  { id: "AD", name: "Adamawa", cx: 8, cy: 2, zone: "North-East", winner: "PDP", totalVotes: 680000, results: { APC: 200000, PDP: 450000, LP: 10000, NNPP: 10000, OTHER: 10000 } },
  { id: "TR", name: "Taraba", cx: 7, cy: 3, zone: "North-East", winner: "PDP", totalVotes: 450000, results: { APC: 150000, PDP: 250000, LP: 30000, NNPP: 5000, OTHER: 15000 } },

  // North-Central
  { id: "NI", name: "Niger", cx: 2, cy: 2, zone: "North-Central", winner: "APC", totalVotes: 750000, results: { APC: 450000, PDP: 250000, LP: 30000, NNPP: 10000, OTHER: 10000 } },
  { id: "KW", name: "Kwara", cx: 1, cy: 3, zone: "North-Central", winner: "APC", totalVotes: 480000, results: { APC: 320000, PDP: 140000, LP: 10000, NNPP: 5000, OTHER: 5000 } },
  { id: "NS", name: "Nasarawa", cx: 4, cy: 3, zone: "North-Central", winner: "LP", totalVotes: 520000, results: { APC: 180000, PDP: 150000, LP: 180000, NNPP: 5000, OTHER: 5000 } },
  { id: "KO", name: "Kogi", cx: 3, cy: 4, zone: "North-Central", winner: "APC", totalVotes: 450000, results: { APC: 280000, PDP: 140000, LP: 10000, NNPP: 5000, OTHER: 15000 } },
  { id: "PL", name: "Plateau", cx: 5, cy: 2, zone: "North-Central", winner: "LP", totalVotes: 1000000, results: { APC: 320000, PDP: 180000, LP: 480000, NNPP: 10000, OTHER: 10000 } },
  { id: "BE", name: "Benue", cx: 5, cy: 4, zone: "North-Central", winner: "APC", totalVotes: 720000, results: { APC: 350000, PDP: 120000, LP: 230000, NNPP: 5000, OTHER: 15000 } },
  { id: "FC", name: "FCT Abuja", cx: 4, cy: 2, zone: "North-Central", winner: "LP", totalVotes: 450000, results: { APC: 100000, PDP: 70000, LP: 270000, NNPP: 5000, OTHER: 5000 } },

  // South-West
  { id: "OY", name: "Oyo", cx: 1, cy: 4, zone: "South-West", winner: "APC", totalVotes: 850000, results: { APC: 480000, PDP: 250000, LP: 80000, NNPP: 10000, OTHER: 30000 } },
  { id: "OS", name: "Osun", cx: 2, cy: 4, zone: "South-West", winner: "APC", totalVotes: 720000, results: { APC: 380000, PDP: 300000, LP: 20000, NNPP: 5000, OTHER: 15000 } },
  { id: "EK", name: "Ekiti", cx: 2, cy: 3, zone: "South-West", winner: "APC", totalVotes: 320000, results: { APC: 210000, PDP: 90000, LP: 10000, NNPP: 2000, OTHER: 8000 } },
  { id: "ON", name: "Ondo", cx: 3, cy: 5, zone: "South-West", winner: "APC", totalVotes: 520000, results: { APC: 380000, PDP: 120000, LP: 10000, NNPP: 2000, OTHER: 8000 } },
  { id: "OG", name: "Ogun", cx: 1, cy: 5, zone: "South-West", winner: "APC", totalVotes: 620000, results: { APC: 350000, PDP: 130000, LP: 90000, NNPP: 5000, OTHER: 45000 } },
  { id: "LA", name: "Lagos", cx: 1, cy: 6, zone: "South-West", winner: "LP", totalVotes: 1200000, results: { APC: 570000, PDP: 70000, LP: 580000, NNPP: 10000, OTHER: 30000 } },

  // South-South
  { id: "ED", name: "Edo", cx: 3, cy: 6, zone: "South-South", winner: "LP", totalVotes: 580000, results: { APC: 150000, PDP: 90000, LP: 330000, NNPP: 5000, OTHER: 5000 } },
  { id: "DE", name: "Delta", cx: 3, cy: 7, zone: "South-South", winner: "LP", totalVotes: 650000, results: { APC: 120000, PDP: 160000, LP: 350000, NNPP: 5000, OTHER: 15000 } },
  { id: "BY", name: "Bayelsa", cx: 3, cy: 8, zone: "South-South", winner: "PDP", totalVotes: 250000, results: { APC: 60000, PDP: 130000, LP: 50000, NNPP: 2000, OTHER: 8000 } },
  { id: "RI", name: "Rivers", cx: 4, cy: 8, zone: "South-South", winner: "APC", totalVotes: 550000, results: { APC: 230000, PDP: 80000, LP: 170000, NNPP: 5000, OTHER: 65000 } },
  { id: "AK", name: "Akwa Ibom", cx: 5, cy: 8, zone: "South-South", winner: "PDP", totalVotes: 520000, results: { APC: 150000, PDP: 220000, LP: 130000, NNPP: 5000, OTHER: 15000 } },
  { id: "CR", name: "Cross River", cx: 6, cy: 7, zone: "South-South", winner: "LP", totalVotes: 420000, results: { APC: 130000, PDP: 90000, LP: 180000, NNPP: 5000, OTHER: 15000 } },

  // South-East
  { id: "EN", name: "Enugu", cx: 5, cy: 6, zone: "South-East", winner: "LP", totalVotes: 480000, results: { APC: 10000, PDP: 15000, LP: 440000, NNPP: 5000, OTHER: 10000 } },
  { id: "AB", name: "Abia", cx: 6, cy: 6, zone: "South-East", winner: "LP", totalVotes: 380000, results: { APC: 10000, PDP: 20000, LP: 340000, NNPP: 2000, OTHER: 8000 } },
  { id: "EB", name: "Ebonyi", cx: 6, cy: 5, zone: "South-East", winner: "LP", totalVotes: 320000, results: { APC: 40000, PDP: 20000, LP: 250000, NNPP: 2000, OTHER: 8000 } },
  { id: "IM", name: "Imo", cx: 5, cy: 7, zone: "South-East", winner: "LP", totalVotes: 450000, results: { APC: 60000, PDP: 30000, LP: 350000, NNPP: 2000, OTHER: 8000 } },
  { id: "AN", name: "Anambra", cx: 4, cy: 6, zone: "South-East", winner: "LP", totalVotes: 620000, results: { APC: 5000, PDP: 9000, LP: 590000, NNPP: 1000, OTHER: 15000 } },
];

export function getPartyStats() {
  const stats: Record<Party, { states: number; totalVotes: number }> = {
    APC: { states: 0, totalVotes: 0 },
    PDP: { states: 0, totalVotes: 0 },
    LP: { states: 0, totalVotes: 0 },
    NNPP: { states: 0, totalVotes: 0 },
    OTHER: { states: 0, totalVotes: 0 },
  };

  NIGERIA_STATES.forEach((state) => {
    stats[state.winner].states += 1;
    (Object.entries(state.results) as [Party, number][]).forEach(([party, votes]) => {
      stats[party].totalVotes += votes;
    });
  });

  return stats;
}
