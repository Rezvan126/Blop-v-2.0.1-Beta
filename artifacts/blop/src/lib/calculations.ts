import type {
  Expense,
  ExpenseParticipant,
  MinimizedSettlement,
  SettlementPayment,
} from "./models";

export type { MinimizedSettlement };

/**
 * Step 1 — paidAmount[m]  = Σ expense.amountInGroupCurrency  where payer === m
 * Step 2 — owedShare[m]   = Σ participant.shareAmount        where participant === m
 * Step 3 — netBalance[m]  = paidAmount[m] - owedShare[m]
 *
 * Positive → member should receive money
 * Negative → member owes money
 * Zero     → member is settled
 *
 * Step 4 — settled SettlementPayments adjust balances:
 *   fromMember paid real money → balance increases (debt reduced)
 *   toMember   received money  → balance decreases (credit reduced)
 *
 * Only expenses with isDeleted === false are passed in by callers.
 * Only settlements with isSettled === true affect balances.
 */
export function calculateNetBalances(
  expenses: Expense[],
  memberIds: string[],
  settlements: SettlementPayment[] = []
): Record<string, number> {
  const balances: Record<string, number> = {};
  memberIds.forEach((id) => { balances[id] = 0; });

  // ── Expenses ──────────────────────────────────────────────────────────────
  for (const expense of expenses) {
    if (!expense.participants || expense.participants.length === 0) continue;
    const totalShare = expense.participants.reduce((s, p) => s + p.shareAmount, 0);
    if (totalShare === 0) continue;

    // Payer gets credit for the full amount they fronted
    balances[expense.paidByMemberId] =
      (balances[expense.paidByMemberId] ?? 0) + expense.amountInGroupCurrency;

    // Each participant is debited their share
    for (const participant of expense.participants) {
      if (memberIds.includes(participant.memberId)) {
        balances[participant.memberId] =
          (balances[participant.memberId] ?? 0) - participant.shareAmount;
      }
    }
  }

  // ── Settled payments ───────────────────────────────────────────────────────
  // A confirmed payment reduces the debt of the payer and the credit of the receiver.
  for (const s of settlements) {
    if (!s.isSettled) continue;
    if (memberIds.includes(s.fromMemberId)) {
      balances[s.fromMemberId] = (balances[s.fromMemberId] ?? 0) + s.amount;
    }
    if (memberIds.includes(s.toMemberId)) {
      balances[s.toMemberId] = (balances[s.toMemberId] ?? 0) - s.amount;
    }
  }

  return balances;
}

/**
 * Greedy debt-minimization: match debtors to creditors until all balances are zero.
 * Minimizes the number of transfers needed to settle a group.
 *
 * Example:
 *   Ali +7000, Sara -3500, Hamza -3500
 *   → Sara pays Ali 3500, Hamza pays Ali 3500  (2 payments)
 */
export function minimizeSettlements(
  balances: Record<string, number>
): MinimizedSettlement[] {
  const creditors: { memberId: string; amount: number }[] = [];
  const debtors:   { memberId: string; amount: number }[] = [];

  for (const [memberId, amount] of Object.entries(balances)) {
    const rounded = Math.round(amount * 100) / 100;
    if (rounded >  0.01) creditors.push({ memberId, amount: rounded });
    if (rounded < -0.01) debtors.push({   memberId, amount: Math.abs(rounded) });
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements: MinimizedSettlement[] = [];
  let ci = 0, di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const credit = creditors[ci];
    const debt   = debtors[di];
    const amount = Math.min(credit.amount, debt.amount);

    if (amount > 0.01) {
      settlements.push({
        fromMemberId: debt.memberId,
        toMemberId:   credit.memberId,
        amount: Math.round(amount * 100) / 100,
      });
    }

    credit.amount -= amount;
    debt.amount   -= amount;
    if (credit.amount < 0.01) ci++;
    if (debt.amount   < 0.01) di++;
  }

  return settlements;
}

/**
 * Equal split — distributes totalAmount evenly across memberIds.
 * Penny-level rounding: first (remainder) participants get 1 extra cent.
 */
export function buildEqualSplits(
  amount: number,
  memberIds: string[],
  paidByMemberId: string
): ExpenseParticipant[] {
  if (memberIds.length === 0) return [];
  const n         = memberIds.length;
  const totalCents = Math.round(amount * 100);
  const baseCents  = Math.floor(totalCents / n);
  const remainder  = totalCents - baseCents * n;

  return memberIds.map((id, i) => {
    const shareAmount = (baseCents + (i < remainder ? 1 : 0)) / 100;
    return {
      memberId: id,
      shareAmount,
      owesAmount: id === paidByMemberId ? 0 : shareAmount,
    };
  });
}

/**
 * Exact split — user supplies each participant's share directly.
 * Caller must ensure amounts sum to the total.
 */
export function buildExactSplits(
  exactAmounts: Record<string, number>,
  paidByMemberId: string
): ExpenseParticipant[] {
  return Object.entries(exactAmounts).map(([memberId, shareAmount]) => ({
    memberId,
    shareAmount,
    owesAmount: memberId === paidByMemberId ? 0 : shareAmount,
  }));
}

/**
 * Percentage split — shareAmount = totalAmount × (pct / 100).
 * Last participant absorbs rounding residual so sum equals total exactly.
 */
export function buildPercentageSplits(
  amount: number,
  percentages: Record<string, number>,
  paidByMemberId: string
): ExpenseParticipant[] {
  const entries = Object.entries(percentages);
  if (entries.length === 0) return [];

  const totalCents = Math.round(amount * 100);
  let allocated = 0;

  return entries.map(([memberId, percentage], i) => {
    let shareCents: number;
    if (i === entries.length - 1) {
      shareCents = totalCents - allocated;
    } else {
      shareCents = Math.round(totalCents * (percentage / 100));
      allocated += shareCents;
    }
    const shareAmount = shareCents / 100;
    return {
      memberId,
      shareAmount,
      percentage,
      owesAmount: memberId === paidByMemberId ? 0 : shareAmount,
    };
  });
}

/**
 * Shares/weight split — shareAmount = totalAmount × (memberShares / totalShares).
 * Last participant absorbs rounding residual so sum equals total exactly.
 */
export function buildSharesSplits(
  amount: number,
  sharesMap: Record<string, number>,
  paidByMemberId: string
): ExpenseParticipant[] {
  const totalShares = Object.values(sharesMap).reduce((s, v) => s + v, 0);
  if (totalShares === 0) return [];

  const entries    = Object.entries(sharesMap);
  const totalCents = Math.round(amount * 100);
  let allocated    = 0;

  return entries.map(([memberId, shares], i) => {
    let shareCents: number;
    if (i === entries.length - 1) {
      shareCents = totalCents - allocated;
    } else {
      shareCents = Math.round(totalCents * (shares / totalShares));
      allocated += shareCents;
    }
    const shareAmount = shareCents / 100;
    return {
      memberId,
      shareAmount,
      shares,
      owesAmount: memberId === paidByMemberId ? 0 : shareAmount,
    };
  });
}
