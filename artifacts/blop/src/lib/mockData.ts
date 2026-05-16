export const members: Record<string, { id: string; name: string; avatarColor: string }> = {
  "1": { id: "1", name: "Alex (You)", avatarColor: "bg-emerald-500" },
  "2": { id: "2", name: "Marcus Chen", avatarColor: "bg-orange-400" },
  "3": { id: "3", name: "Priya Patel", avatarColor: "bg-amber-400" },
  "4": { id: "4", name: "Jake Torres", avatarColor: "bg-teal-500" },
  "5": { id: "5", name: "Sarah Kim", avatarColor: "bg-indigo-400" },
  "6": { id: "6", name: "Tom Walsh", avatarColor: "bg-rose-400" },
  "7": { id: "7", name: "Lisa Park", avatarColor: "bg-violet-500" },
  "8": { id: "8", name: "David Osei", avatarColor: "bg-orange-500" },
  "9": { id: "9", name: "Ana Costa", avatarColor: "bg-pink-400" },
};

export const groups = [
  { id: "g1", name: "Bali Escape",  memberIds: ["1", "2", "3", "4"], type: "trip" as const },
  { id: "g2", name: "April Home",   memberIds: ["1", "5", "6"],      type: "roommates" as const },
  { id: "g3", name: "Tokyo Trip",   memberIds: ["1", "7", "8", "9", "2"], type: "trip" as const },
];

export const categories: Record<string, { id: string; name: string; color: string }> = {
  c1: { id: "c1", name: "Dining",    color: "text-emerald-600 bg-emerald-100" },
  c2: { id: "c2", name: "Travel",    color: "text-blue-600 bg-blue-100" },
  c3: { id: "c3", name: "Stay",      color: "text-purple-600 bg-purple-100" },
  c4: { id: "c4", name: "Leisure",   color: "text-rose-600 bg-rose-100" },
  c5: { id: "c5", name: "Shopping",  color: "text-amber-600 bg-amber-100" },
  c6: { id: "c6", name: "Bills",     color: "text-slate-600 bg-slate-100" },
  c7: { id: "c7", name: "Health",    color: "text-pink-600 bg-pink-100" },
  c8: { id: "c8", name: "Other",     color: "text-muted-foreground bg-muted" },
};

export interface SeedExpense {
  id: string;
  groupId: string;
  title: string;
  amount: number;
  paidByMemberId: string;
  expenseDate: string;
  category: string;
  note?: string;
  receiptUrl?: string;
}

const RECEIPT_LOCAVORE =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="280" style="background:#fff;font-family:monospace">` +
    `<rect width="220" height="280" fill="#fff" stroke="#e2e8f0" stroke-width="1"/>` +
    `<text x="110" y="30" text-anchor="middle" font-size="13" font-weight="bold" fill="#1e293b">LOCAVORE UBUD</text>` +
    `<text x="110" y="46" text-anchor="middle" font-size="9" fill="#94a3b8">Jl. Dewi Sita, Ubud · 13 Jun 2026</text>` +
    `<line x1="18" y1="56" x2="202" y2="56" stroke="#e2e8f0"/>` +
    `<text x="18" y="74" font-size="10" fill="#475569">Tasting Menu x4</text><text x="202" y="74" text-anchor="end" font-size="10" fill="#475569">180.00</text>` +
    `<text x="18" y="90" font-size="10" fill="#475569">Wine Pairing x4</text><text x="202" y="90" text-anchor="end" font-size="10" fill="#475569">80.00</text>` +
    `<text x="18" y="106" font-size="10" fill="#475569">Service charge</text><text x="202" y="106" text-anchor="end" font-size="10" fill="#475569">20.00</text>` +
    `<line x1="18" y1="118" x2="202" y2="118" stroke="#e2e8f0"/>` +
    `<text x="18" y="138" font-size="13" font-weight="bold" fill="#0f172a">TOTAL</text>` +
    `<text x="202" y="138" text-anchor="end" font-size="13" font-weight="bold" fill="#0f172a">USD 280.00</text>` +
    `<text x="110" y="168" text-anchor="middle" font-size="9" fill="#94a3b8">Thank you for dining with us!</text>` +
    `</svg>`
  );

const RECEIPT_HOTEL_SHINJUKU =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="260" style="background:#fff;font-family:monospace">` +
    `<rect width="220" height="260" fill="#fff" stroke="#e2e8f0" stroke-width="1"/>` +
    `<text x="110" y="30" text-anchor="middle" font-size="13" font-weight="bold" fill="#1e293b">PARK HYATT TOKYO</text>` +
    `<text x="110" y="46" text-anchor="middle" font-size="9" fill="#94a3b8">Shinjuku Park Tower · 15–21 Mar 2026</text>` +
    `<line x1="18" y1="56" x2="202" y2="56" stroke="#e2e8f0"/>` +
    `<text x="18" y="74" font-size="10" fill="#475569">Deluxe Room · 6 nights</text><text x="202" y="74" text-anchor="end" font-size="10" fill="#475569">2200.00</text>` +
    `<text x="18" y="90" font-size="10" fill="#475569">Tax &amp; Fees</text><text x="202" y="90" text-anchor="end" font-size="10" fill="#475569">200.00</text>` +
    `<line x1="18" y1="102" x2="202" y2="102" stroke="#e2e8f0"/>` +
    `<text x="18" y="122" font-size="13" font-weight="bold" fill="#0f172a">TOTAL</text>` +
    `<text x="202" y="122" text-anchor="end" font-size="13" font-weight="bold" fill="#0f172a">USD 2400.00</text>` +
    `<text x="110" y="152" text-anchor="middle" font-size="9" fill="#94a3b8">Paid in full — receipt for your records</text>` +
    `</svg>`
  );

export const expenses: SeedExpense[] = [
  { id: "e1",  groupId: "g1", title: "Villa Rental",       amount: 1200, paidByMemberId: "2", expenseDate: "2026-06-12", category: "c3", note: "5 nights at Villa Ubud" },
  { id: "e2",  groupId: "g1", title: "Airport Taxi",        amount: 45,   paidByMemberId: "1", expenseDate: "2026-06-10", category: "c2" },
  { id: "e3",  groupId: "g1", title: "Snorkeling Tour",     amount: 320,  paidByMemberId: "3", expenseDate: "2026-06-13", category: "c4" },
  { id: "e4",  groupId: "g1", title: "Dinner at Locavore",  amount: 280,  paidByMemberId: "4", expenseDate: "2026-06-13", category: "c1", note: "Best restaurant in Ubud!", receiptUrl: RECEIPT_LOCAVORE },
  { id: "e5",  groupId: "g1", title: "Grocery Run",         amount: 95,   paidByMemberId: "1", expenseDate: "2026-06-14", category: "c1" },
  { id: "e6",  groupId: "g1", title: "Motorbike Rental",    amount: 60,   paidByMemberId: "2", expenseDate: "2026-06-11", category: "c2" },
  { id: "e7",  groupId: "g1", title: "Kecak Fire Dance",    amount: 80,   paidByMemberId: "3", expenseDate: "2026-06-15", category: "c4" },
  { id: "e8",  groupId: "g1", title: "Warung dinner",       amount: 55,   paidByMemberId: "4", expenseDate: "2026-06-14", category: "c1" },
  { id: "e9",  groupId: "g2", title: "April Rent",          amount: 900,  paidByMemberId: "5", expenseDate: "2026-04-01", category: "c6", note: "Split 3 ways" },
  { id: "e10", groupId: "g2", title: "Internet Bill",        amount: 60,   paidByMemberId: "6", expenseDate: "2026-04-01", category: "c6" },
  { id: "e11", groupId: "g2", title: "Grocery Haul",         amount: 150,  paidByMemberId: "1", expenseDate: "2026-04-05", category: "c1" },
  { id: "e12", groupId: "g2", title: "Cleaning Supplies",    amount: 30,   paidByMemberId: "5", expenseDate: "2026-04-10", category: "c5" },
  { id: "e13", groupId: "g2", title: "Electric Bill",        amount: 120,  paidByMemberId: "6", expenseDate: "2026-04-15", category: "c6" },
  { id: "e14", groupId: "g3", title: "Hotel Shinjuku",       amount: 2400, paidByMemberId: "7", expenseDate: "2026-03-15", category: "c3", note: "6 nights, paid upfront", receiptUrl: RECEIPT_HOTEL_SHINJUKU },
  { id: "e15", groupId: "g3", title: "Ramen Dinner",         amount: 180,  paidByMemberId: "8", expenseDate: "2026-03-16", category: "c1" },
  { id: "e16", groupId: "g3", title: "Shinkansen tickets",   amount: 600,  paidByMemberId: "2", expenseDate: "2026-03-17", category: "c2" },
  { id: "e17", groupId: "g3", title: "TeamLab Planets",      amount: 300,  paidByMemberId: "9", expenseDate: "2026-03-18", category: "c4" },
  { id: "e18", groupId: "g3", title: "Konbini run",          amount: 95,   paidByMemberId: "1", expenseDate: "2026-03-19", category: "c1" },
  { id: "e19", groupId: "g3", title: "Airport shuttle",      amount: 180,  paidByMemberId: "7", expenseDate: "2026-03-20", category: "c2" },
  { id: "e20", groupId: "g3", title: "Izakaya night",        amount: 220,  paidByMemberId: "8", expenseDate: "2026-03-18", category: "c1" },
];

export const settlements = [
  { id: "s1", groupId: "g1", fromMemberId: "1", toMemberId: "2", amount: 340.2 },
  { id: "s2", groupId: "g1", fromMemberId: "4", toMemberId: "3", amount: 85 },
  { id: "s3", groupId: "g2", fromMemberId: "5", toMemberId: "1", amount: 100 },
  { id: "s4", groupId: "g2", fromMemberId: "6", toMemberId: "1", amount: 80 },
];
