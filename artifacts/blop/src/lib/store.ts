import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  calculateNetBalances,
  minimizeSettlements,
  buildEqualSplits,
} from "./calculations";
import { getCurrencySymbol, parseTimestamp } from "./utils";
import { getCurrentUid } from "./firebase";
import {
  members as seedMembers,
  groups as seedGroups,
  expenses as seedExpenses,
} from "./mockData";
import type {
  Group,
  Member,
  Expense,
  ExpenseParticipant,
  SettlementPayment,
  ActivityLog,
  ActionType,
  AppSettings,
  MinimizedSettlement,
  SplitType,
  GroupType,
  SyncStatus,
  GroupSnapshotPayload,
} from "./models";

export type {
  Group,
  Member,
  Expense,
  ExpenseParticipant,
  SettlementPayment,
  ActivityLog,
  ActionType,
  AppSettings,
  MinimizedSettlement,
  SplitType,
  GroupType,
  SyncStatus,
  GroupSnapshotPayload,
};

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function inviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

const DEFAULT_AVATAR_COLORS = [
  "bg-emerald-500", "bg-orange-400", "bg-amber-400", "bg-teal-500",
  "bg-indigo-400", "bg-rose-400", "bg-violet-500", "bg-orange-500",
  "bg-pink-400", "bg-sky-500", "bg-lime-500", "bg-red-400",
];

function pickAvatarColor(index: number) {
  return DEFAULT_AVATAR_COLORS[index % DEFAULT_AVATAR_COLORS.length];
}

export interface AddExpenseData {
  title: string;
  amount: number;
  currency?: string;
  paidByMemberId: string;
  expenseDate: string;
  category: string;
  note?: string;
  splitType: SplitType;
  participants?: ExpenseParticipant[];
  receiptUrl?: string;
}

interface BlopStore {
  members: Record<string, Member>;
  groups: Record<string, Group>;
  expenses: Record<string, Expense>;
  settlements: Record<string, SettlementPayment>;
  activity: ActivityLog[];
  settings: AppSettings;
  groupMeIds: Record<string, string>;
  _seeded: boolean;

  seed(): void;
  updateSettings(patch: Partial<AppSettings>): void;
  setGroupMe(groupId: string, memberId: string): void;
  getGroupMeId(groupId: string): string;
  createGroup(name: string, memberNames: string[], type?: GroupType, currency?: string): string;
  updateGroup(id: string, patch: Partial<Pick<Group, "name" | "isArchived" | "defaultCurrency" | "type">>): void;
  addMemberToGroup(groupId: string, name: string): string;
  removeMemberFromGroup(groupId: string, memberId: string): void;
  addExpense(groupId: string, data: AddExpenseData): string;
  editExpense(expenseId: string, data: Partial<AddExpenseData>): void;
  deleteExpense(expenseId: string): void;
  restoreExpense(expenseId: string): void;
  recordSettlement(
    groupId: string,
    fromMemberId: string,
    toMemberId: string,
    amount: number,
    method?: string,
    note?: string
  ): void;
  toggleSettlement(settlementId: string): void;
  exportData(): string;
  importData(json: string): { ok: boolean; error?: string };

  getGroupMembers(groupId: string): Member[];
  getGroupExpenses(groupId: string, includeDeleted?: boolean): Expense[];
  getGroupBalances(groupId: string): Record<string, number>;
  getGroupSettlements(groupId: string): SettlementPayment[];
  getMinimizedSettlements(groupId: string): MinimizedSettlement[];
  getGroupTotal(groupId: string): number;
  getUserBalance(groupId: string): number;
  getGroupActivity(groupId: string): ActivityLog[];
  getAllGroups(): Group[];
  getAllSettlementsForUser(): SettlementPayment[];

  setSyncStatus(groupId: string, status: SyncStatus): void;
  getGroupSnapshot(groupId: string): GroupSnapshotPayload;
  importGroupSnapshot(snapshot: GroupSnapshotPayload): void;
  joinGroupByCode(code: string): Promise<{ ok: boolean; groupId?: string; error?: string }>;
}

function makeActivity(
  createdBy: string,
  partial: Omit<ActivityLog, "id" | "createdAt" | "createdBy">
): ActivityLog {
  return { ...partial, id: uid(), createdAt: new Date().toISOString(), createdBy };
}

export const useBlopStore = create<BlopStore>()(
  persist(
    (set, get) => ({
      members: {},
      groups: {},
      expenses: {},
      settlements: {},
      activity: [],
      groupMeIds: {},
      settings: {
        currentUserId: "user-me",
        currency: "USD",
        notificationsEnabled: true,
        hasOnboarded: false,
        userName: "Alex",
      },
      _seeded: false,

      seed() {
        if (get()._seeded) return;
        
        // Disable seed data injection for real/authenticated users unless explicitly enabled
        if (import.meta.env.VITE_SEED_DATA !== "true") {
          set({ _seeded: true });
          return;
        }

        const { settings } = get();
        const currentUserId = settings.currentUserId;
        const remapId = (id: string) => (id === "1" ? currentUserId : id);
        const now = new Date().toISOString();

        const members: Record<string, Member> = {};
        for (const [id, m] of Object.entries(seedMembers)) {
          if (id === "1") continue;
          members[id] = {
            id,
            name: m.name,
            avatarColor: m.avatarColor,
            joinedAt: now,
          };
        }
        members[currentUserId] = {
          id: currentUserId,
          name: settings.userName || "Alex",
          avatarColor: "bg-emerald-500",
          joinedAt: now,
        };

        const groups: Record<string, Group> = {};
        for (const g of seedGroups) {
          groups[g.id] = {
            id: g.id,
            name: g.name,
            type: g.type,
            defaultCurrency: "USD",
            memberIds: g.memberIds.map(remapId),
            createdBy: currentUserId,
            createdAt: now,
            updatedAt: now,
            isArchived: false,
            inviteCode: inviteCode(),
            syncStatus: "local",
          };
        }

        const expenses: Record<string, Expense> = {};
        for (const e of seedExpenses) {
          const grp = groups[e.groupId];
          const remappedPayerId = remapId(e.paidByMemberId);
          const participants = buildEqualSplits(
            e.amount,
            grp?.memberIds ?? [],
            remappedPayerId
          );
          const expCreatedAt = `${e.expenseDate}T09:00:00.000Z`;
          expenses[e.id] = {
            id: e.id,
            groupId: e.groupId,
            title: e.title,
            amount: e.amount,
            currency: "USD",
            exchangeRateToGroupCurrency: 1,
            amountInGroupCurrency: e.amount,
            paidByMemberId: remappedPayerId,
            participants,
            splitType: "equal",
            category: e.category,
            note: e.note,
            receiptUrl: e.receiptUrl,
            expenseDate: e.expenseDate,
            createdAt: expCreatedAt,
            updatedAt: expCreatedAt,
            createdBy: remappedPayerId,
            isDeleted: false,
            syncStatus: "local",
          };
        }

        const activity: ActivityLog[] = seedExpenses.map((e, i) => ({
          id: `seed-act-${i}`,
          groupId: e.groupId,
          actionType: "EXPENSE_CREATED" as ActionType,
          entityId: e.id,
          entityType: "expense" as const,
          message: `Added "${e.title}"`,
          newValue: { title: e.title, amount: e.amount },
          createdAt: `${e.expenseDate}T0${i % 9}:00:00.000Z`,
          createdBy: remapId(e.paidByMemberId),
        }));

        const groupMeIds: Record<string, string> = {};
        for (const g of seedGroups) {
          groupMeIds[g.id] = currentUserId;
        }

        set({
          members,
          groups,
          expenses,
          activity,
          groupMeIds,
          _seeded: true,
          settings: { ...get().settings, hasOnboarded: true },
        });
      },

      updateSettings(patch) {
        set((s) => ({ settings: { ...s.settings, ...patch } }));
      },

      setGroupMe(groupId, memberId) {
        set((s) => ({ groupMeIds: { ...s.groupMeIds, [groupId]: memberId } }));
      },

      getGroupMeId(groupId) {
        const { groupMeIds, settings } = get();
        return groupMeIds[groupId] ?? settings.currentUserId;
      },

      createGroup(name, memberNames, type = "friends", currency = "USD") {
        const { settings, groups: allGroups } = get();

        // Check for duplicate group names (soft warning, or just handle gracefully)
        const isDuplicateGroup = Object.values(allGroups).some(g => g.name.toLowerCase() === name.toLowerCase());
        
        // Filter out empty names and handle duplicates in the initial list
        const uniqueMemberNames = Array.from(new Set(memberNames.map(n => n.trim()).filter(Boolean)));
        
        const id = "g-" + uid();
        const currentUser: Member = {
          id: settings.currentUserId,
          name: settings.userName,
          avatarColor: "bg-emerald-500",
          joinedAt: new Date().toISOString(),
        };
        const newMembers: Member[] = uniqueMemberNames.map((n, i) => ({
          id: "m-" + uid() + i,
          name: n,
          avatarColor: pickAvatarColor(i + 1),
          joinedAt: new Date().toISOString(),
        }));
        const allMemberIds = [settings.currentUserId, ...newMembers.map((m) => m.id)];
        const memberMap: Record<string, Member> = {};
        memberMap[currentUser.id] = currentUser;
        newMembers.forEach((m) => { memberMap[m.id] = m; });

        const now = new Date().toISOString();
        const group: Group = {
          id,
          name,
          type,
          defaultCurrency: currency,
          memberIds: allMemberIds,
          createdBy: settings.currentUserId,
          createdAt: now,
          updatedAt: now,
          isArchived: false,
          inviteCode: inviteCode(),
          syncStatus: "local",
        };

        const act = makeActivity(settings.currentUserId, {
          groupId: id,
          actionType: "GROUP_CREATED",
          entityId: id,
          entityType: "group",
          message: `Created group "${name}"`,
          newValue: { name, type },
        });

        set((s) => ({
          groups: { ...s.groups, [id]: group },
          members: { ...s.members, ...memberMap },
          groupMeIds: { ...s.groupMeIds, [id]: settings.currentUserId },
          activity: [act, ...s.activity],
        }));
        return id;
      },

      updateGroup(id, patch) {
        set((s) => ({
          groups: {
            ...s.groups,
            [id]: { ...s.groups[id], ...patch, updatedAt: new Date().toISOString() },
          },
        }));
      },

      addMemberToGroup(groupId, name) {
        const { settings, groups, getGroupMembers } = get();
        const group = groups[groupId];
        if (!group) return "";

        const trimmedName = name.trim();
        if (!trimmedName) return "";

        // Prevent duplicate names within the same group
        const existingMembers = getGroupMembers(groupId);
        if (existingMembers.some(m => m.name.toLowerCase() === trimmedName.toLowerCase())) {
          return "EXISTS"; // Special return to indicate duplicate
        }

        const id = "m-" + uid();
        const color = pickAvatarColor(group.memberIds.length);
        const member: Member = {
          id,
          name,
          avatarColor: color,
          joinedAt: new Date().toISOString(),
        };
        const act = makeActivity(settings.currentUserId, {
          groupId,
          actionType: "MEMBER_ADDED",
          entityId: id,
          entityType: "member",
          message: `Added "${name}" to the group`,
          newValue: { name },
        });
        set((s) => ({
          members: { ...s.members, [id]: member },
          groups: {
            ...s.groups,
            [groupId]: {
              ...group,
              memberIds: [...group.memberIds, id],
              updatedAt: new Date().toISOString(),
            },
          },
          activity: [act, ...s.activity],
        }));
        return id;
      },

      removeMemberFromGroup(groupId, memberId) {
        const { settings, groups, members, expenses } = get();
        const group = groups[groupId];
        if (!group) return;

        // Check if member is a payer for any non-deleted expense in this group
        const hasExpenses = Object.values(expenses).some(
          (e) => e.groupId === groupId && e.paidByMemberId === memberId && !e.isDeleted
        );
        if (hasExpenses) return; // Prevent removal if they are a payer

        const memberName = members[memberId]?.name ?? "Member";
        const act = makeActivity(settings.currentUserId, {
          groupId,
          actionType: "MEMBER_REMOVED",
          entityId: memberId,
          entityType: "member",
          message: `Removed "${memberName}" from the group`,
          oldValue: { name: memberName },
        });
        set((s) => ({
          groups: {
            ...s.groups,
            [groupId]: {
              ...group,
              memberIds: group.memberIds.filter((id) => id !== memberId),
              updatedAt: new Date().toISOString(),
            },
          },
          activity: [act, ...s.activity],
        }));
      },

      addExpense(groupId, data) {
        const { settings, groups } = get();
        const group = groups[groupId];
        if (!group) return "";
        const id = "e-" + uid();
        const now = new Date().toISOString();

        // Always trust data.participants when provided (respects member exclusions).
        // Only fall back to full-group equal split if no participants were passed at all.
        const participants =
          data.participants && data.participants.length > 0
            ? data.participants
            : buildEqualSplits(data.amount, group.memberIds, data.paidByMemberId);

        const expense: Expense = {
          id,
          groupId,
          title: data.title,
          amount: data.amount,
          currency: data.currency ?? group.defaultCurrency,
          exchangeRateToGroupCurrency: 1,
          amountInGroupCurrency: data.amount,
          paidByMemberId: data.paidByMemberId,
          participants,
          splitType: data.splitType,
          category: data.category,
          note: data.note,
          receiptUrl: data.receiptUrl,
          expenseDate: data.expenseDate,
          createdAt: now,
          updatedAt: now,
          createdBy: settings.currentUserId,
          isDeleted: false,
          syncStatus: "local",
        };

        const acts: ActivityLog[] = [];
        acts.push(
          makeActivity(settings.currentUserId, {
            groupId,
            actionType: "EXPENSE_CREATED",
            entityId: id,
            entityType: "expense",
            message: `Added "${data.title}"`,
            newValue: { title: data.title, amount: data.amount },
          })
        );
        if (data.receiptUrl) {
          acts.push(
            makeActivity(settings.currentUserId, {
              groupId,
              actionType: "RECEIPT_ADDED",
              entityId: id,
              entityType: "expense",
              message: `Receipt attached to "${data.title}"`,
            })
          );
        }

        set((s) => ({
          expenses: { ...s.expenses, [id]: expense },
          activity: [...acts, ...s.activity],
        }));
        return id;
      },

      editExpense(expenseId, data) {
        const { settings, expenses } = get();
        const expense = expenses[expenseId];
        if (!expense) return;
        const now = new Date().toISOString();

        let participants = expense.participants;
        if (
          data.amount !== undefined ||
          data.splitType !== undefined ||
          data.paidByMemberId !== undefined
        ) {
          const { groups } = get();
          const group = groups[expense.groupId];
          const newSplitType = data.splitType ?? expense.splitType;
          const newAmount = data.amount ?? expense.amount;
          const newPayer = data.paidByMemberId ?? expense.paidByMemberId;
          if (group && (newSplitType === "equal" || expense.splitType === "equal")) {
            participants = buildEqualSplits(newAmount, group.memberIds, newPayer);
          } else if (data.amount !== undefined && expense.amount > 0) {
            const scale = data.amount / expense.amount;
            const scaled = expense.participants.map((p) => ({
              ...p,
              shareAmount: Math.round(p.shareAmount * scale * 100) / 100,
              owesAmount: p.memberId === newPayer ? 0 : Math.round(p.shareAmount * scale * 100) / 100,
            }));
            const sumShares = scaled.reduce((s, p) => s + p.shareAmount, 0);
            const diff = Math.round((data.amount - sumShares) * 100) / 100;
            if (Math.abs(diff) > 0 && scaled.length > 0) {
              scaled[scaled.length - 1] = {
                ...scaled[scaled.length - 1],
                shareAmount: Math.round((scaled[scaled.length - 1].shareAmount + diff) * 100) / 100,
              };
            }
            participants = scaled;
          }
        }
        if (data.participants) {
          participants = data.participants;
        }

        // BUG-04 fix: compute receipt-change flags BEFORE constructing `updated`
        // so the receiptUrl can be explicitly cleared when the user removes it.
        const wasDeleted = data.receiptUrl === undefined && expense.receiptUrl !== undefined;
        const wasAdded   = data.receiptUrl !== undefined && expense.receiptUrl === undefined;

        const updated: Expense = {
          ...expense,
          ...(data.title !== undefined && { title: data.title }),
          ...(data.amount !== undefined && {
            amount: data.amount,
            amountInGroupCurrency: data.amount,
          }),
          ...(data.paidByMemberId !== undefined && { paidByMemberId: data.paidByMemberId }),
          ...(data.expenseDate !== undefined && { expenseDate: data.expenseDate }),
          ...(data.category !== undefined && { category: data.category }),
          ...(data.note !== undefined && { note: data.note }),
          // When wasDeleted: spread { receiptUrl: undefined } to explicitly clear the field.
          // When new URL provided: spread the new value. Otherwise: leave unchanged.
          ...((data.receiptUrl !== undefined || wasDeleted) && { receiptUrl: data.receiptUrl }),
          ...(data.splitType !== undefined && { splitType: data.splitType }),
          participants,
          updatedAt: now,
          updatedBy: settings.currentUserId,
        };
        let actionType: ActionType = "EXPENSE_EDITED";
        if (wasDeleted) actionType = "RECEIPT_REMOVED";
        else if (wasAdded) actionType = "RECEIPT_ADDED";

        const act = makeActivity(settings.currentUserId, {
          groupId: expense.groupId,
          actionType,
          entityId: expenseId,
          entityType: "expense",
          message:
            actionType === "RECEIPT_ADDED"
              ? `Receipt attached to "${expense.title}"`
              : actionType === "RECEIPT_REMOVED"
              ? `Receipt removed from "${expense.title}"`
              : `Edited "${expense.title}"`,
          oldValue: { title: expense.title, amount: expense.amount },
          newValue: { title: updated.title, amount: updated.amount },
        });

        set((s) => ({
          expenses: { ...s.expenses, [expenseId]: updated },
          activity: [act, ...s.activity],
        }));
      },

      deleteExpense(expenseId) {
        const { settings, expenses } = get();
        const expense = expenses[expenseId];
        if (!expense) return;
        const act = makeActivity(settings.currentUserId, {
          groupId: expense.groupId,
          actionType: "EXPENSE_DELETED",
          entityId: expenseId,
          entityType: "expense",
          message: `Deleted "${expense.title}"`,
          oldValue: { title: expense.title, amount: expense.amount },
          newValue: { title: expense.title, amount: expense.amount },
        });
        set((s) => ({
          expenses: {
            ...s.expenses,
            [expenseId]: {
              ...expense,
              isDeleted: true,
              updatedAt: new Date().toISOString(),
              updatedBy: settings.currentUserId,
            },
          },
          activity: [act, ...s.activity],
        }));
      },

      restoreExpense(expenseId) {
        const { settings, expenses } = get();
        const expense = expenses[expenseId];
        if (!expense || !expense.isDeleted) return;
        const act = makeActivity(settings.currentUserId, {
          groupId: expense.groupId,
          actionType: "EXPENSE_EDITED",
          entityId: expenseId,
          entityType: "expense",
          message: `Restored "${expense.title}"`,
          oldValue: { title: expense.title, amount: expense.amount },
          newValue: { title: expense.title, amount: expense.amount },
        });
        set((s) => ({
          expenses: {
            ...s.expenses,
            [expenseId]: {
              ...expense,
              isDeleted: false,
              updatedAt: new Date().toISOString(),
              updatedBy: settings.currentUserId,
            },
          },
          activity: [act, ...s.activity],
        }));
      },

      recordSettlement(groupId, fromMemberId, toMemberId, amount, method, note) {
        const { settings, members, groups } = get();
        const group = groups[groupId];
        const id = "s-" + uid();
        const now = new Date().toISOString();
        const record: SettlementPayment = {
          id,
          groupId,
          fromMemberId,
          toMemberId,
          amount,
          currency: group?.defaultCurrency ?? "USD",
          note,
          isSettled: true,
          settledAt: now,
          createdAt: now,
          createdBy: settings.currentUserId,
        };
        const fromName = members[fromMemberId]?.name ?? fromMemberId;
        const toName = members[toMemberId]?.name ?? toMemberId;
        const sym = getCurrencySymbol(group?.defaultCurrency ?? "USD");
        const act = makeActivity(settings.currentUserId, {
          groupId,
          actionType: "PAYMENT_SETTLED",
          entityId: id,
          entityType: "settlement",
          message: `${fromName} paid ${toName} ${sym}${amount.toFixed(2)}${method ? ` via ${method}` : ""}${note ? ` — ${note}` : ""}`,
          newValue: { amount, fromMemberId, toMemberId, method },
        });
        set((s) => ({
          settlements: { ...s.settlements, [id]: record },
          activity: [act, ...s.activity],
        }));
      },

      toggleSettlement(settlementId) {
        const { settings, settlements, members, groups } = get();
        const s = settlements[settlementId];
        if (!s) return;
        const wasSettled = s.isSettled;
        const fromName = members[s.fromMemberId]?.name ?? "?";
        const toName   = members[s.toMemberId]?.name ?? "?";
        const sym = getCurrencySymbol(groups[s.groupId]?.defaultCurrency ?? "USD");
        const act = makeActivity(settings.currentUserId, {
          groupId: s.groupId,
          actionType: wasSettled ? "PAYMENT_UNSETTLED" : "PAYMENT_SETTLED",
          entityId: settlementId,
          entityType: "settlement",
          message: wasSettled
            ? `${fromName}'s payment to ${toName} marked as unpaid`
            : `${fromName} paid ${toName} ${sym}${s.amount.toFixed(2)}`,
          newValue: { isSettled: !wasSettled },
        });
        set((state) => ({
          settlements: {
            ...state.settlements,
            [settlementId]: {
              ...s,
              isSettled: !s.isSettled,
              settledAt: wasSettled ? undefined : new Date().toISOString(),
            },
          },
          activity: [act, ...state.activity],
        }));
      },

      exportData() {
        const { members, groups, expenses, settlements, activity, settings, groupMeIds } = get();
        return JSON.stringify(
          {
            version: 2,
            exportedAt: new Date().toISOString(),
            members,
            groups,
            expenses,
            settlements,
            activity,
            settings,
            groupMeIds,
          },
          null,
          2
        );
      },

      importData(json) {
        try {
          const data = JSON.parse(json);
          if (!data.version || !data.members || !data.groups || !data.expenses) {
            return { ok: false, error: "Invalid backup file format." };
          }
          set({
            members: data.members ?? {},
            groups: data.groups ?? {},
            expenses: data.expenses ?? {},
            settlements: data.settlements ?? {},
            activity: data.activity ?? [],
            groupMeIds: data.groupMeIds ?? {},
            settings: data.settings ?? get().settings,
            _seeded: true,
          });
          return { ok: true };
        } catch {
          return { ok: false, error: "Could not read the backup file." };
        }
      },

      getGroupMembers(groupId) {
        const { groups, members } = get();
        const group = groups[groupId];
        if (!group) return [];
        const meId = get().getGroupMeId(groupId);
        return group.memberIds
          .map((id) => {
            const m = members[id];
            if (!m) return null;
            return { ...m, isMe: id === meId };
          })
          .filter(Boolean) as Member[];
      },

      getGroupExpenses(groupId, includeDeleted = false) {
        const { expenses } = get();
        return Object.values(expenses)
          .filter(
            (e) => e.groupId === groupId && (includeDeleted || !e.isDeleted)
          )
          .sort(
            (a, b) =>
              new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime()
          );
      },

      getGroupBalances(groupId) {
        const { groups, settlements } = get();
        const group = groups[groupId];
        if (!group) return {};
        const expenses = get().getGroupExpenses(groupId); // already filters isDeleted
        const groupSettlements = Object.values(settlements).filter(
          (s) => s.groupId === groupId
        );
        return calculateNetBalances(expenses, group.memberIds, groupSettlements);
      },

      getGroupSettlements(groupId) {
        const { settlements } = get();
        return Object.values(settlements)
          .filter((s) => s.groupId === groupId)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      },

      getMinimizedSettlements(groupId) {
        const balances = get().getGroupBalances(groupId);
        return minimizeSettlements(balances);
      },

      getGroupTotal(groupId) {
        return get().getGroupExpenses(groupId).reduce((s, e) => s + e.amount, 0);
      },

      getUserBalance(groupId) {
        const meId = get().getGroupMeId(groupId);
        const balances = get().getGroupBalances(groupId);
        return balances[meId] ?? 0;
      },

      getGroupActivity(groupId) {
        return get()
          .activity.filter((a) => a.groupId === groupId)
          .sort(
            (a, b) =>
              parseTimestamp(b.createdAt) - parseTimestamp(a.createdAt)
          );
      },

      getAllGroups() {
        return Object.values(get().groups).filter((g) => !g.isArchived);
      },

      getAllSettlementsForUser() {
        const { settings, settlements } = get();
        return Object.values(settlements).filter(
          (s) =>
            s.fromMemberId === settings.currentUserId ||
            s.toMemberId === settings.currentUserId
        );
      },

      // ── Sync ────────────────────────────────────────────────────────────

      setSyncStatus(groupId, status) {
        const g = get().groups[groupId];
        if (!g || g.syncStatus === status) return;
        set((s) => ({
          groups: {
            ...s.groups,
            [groupId]: { ...s.groups[groupId], syncStatus: status },
          },
        }));
      },

      getGroupSnapshot(groupId) {
        const { groups, members, expenses, settlements, activity } = get();
        const group = groups[groupId];
        if (!group) throw new Error(`Group ${groupId} not found`);

        const groupMembers: Record<string, Member> = {};
        for (const mid of group.memberIds) {
          if (members[mid]) groupMembers[mid] = members[mid];
        }

        const groupExpenses: Record<string, Expense> = {};
        for (const [id, e] of Object.entries(expenses)) {
          if (e.groupId === groupId) groupExpenses[id] = e;
        }

        const groupSettlements: Record<string, SettlementPayment> = {};
        for (const [id, s] of Object.entries(settlements)) {
          if (s.groupId === groupId) groupSettlements[id] = s;
        }

        return {
          groupId,
          inviteCode: group.inviteCode.toUpperCase(),
          groupName:  group.name,
          group,
          members:     groupMembers,
          expenses:    groupExpenses,
          settlements: groupSettlements,
          activity:    activity.filter((a) => a.groupId === groupId),
        };
      },

      importGroupSnapshot(snapshot) {
        const {
          expenses:    localExp,
          settlements: localSet,
          activity:    localAct,
          groups:      localGroups,
          members:     localMembers,
        } = get();

        // Expenses: last updatedAt wins
        const mergedExpenses = { ...localExp };
        for (const [id, e] of Object.entries(snapshot.expenses)) {
          const local = localExp[id];
          if (!local || new Date(e.updatedAt) >= new Date(local.updatedAt)) {
            mergedExpenses[id] = { ...e, syncStatus: "synced" as SyncStatus };
          }
        }

        // Settlements: add server records we don't have; never overwrite local
        const mergedSettlements = { ...localSet };
        for (const [id, s] of Object.entries(snapshot.settlements)) {
          if (!localSet[id]) mergedSettlements[id] = s;
        }

        // Activity: union by id, sorted descending
        const actMap = new Map(localAct.map((a) => [a.id, a]));
        for (const a of snapshot.activity) {
          if (!actMap.has(a.id)) actMap.set(a.id, a);
        }
        const mergedActivity = [...actMap.values()].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // Members: add new, keep local if exists
        const mergedMembers = { ...localMembers };
        for (const [id, m] of Object.entries(snapshot.members)) {
          if (!localMembers[id]) mergedMembers[id] = m;
        }

        // Group: add/update, mark synced
        const existingGroup = localGroups[snapshot.groupId];
        const mergedGroups = { ...localGroups };
        
        // Preserve local memberIds if the server snapshot has fewer members, to prevent destructive sync
        const existingMemberIds = existingGroup?.memberIds || [];
        const snapMemberIds = snapshot.group.memberIds || [];
        const mergedMemberIds = snapshot.group.memberIds && snapshot.group.memberIds.length > 0
          ? Array.from(new Set([...existingMemberIds, ...snapMemberIds]))
          : existingMemberIds;

        mergedGroups[snapshot.groupId] = {
          ...existingGroup,
          ...snapshot.group,
          memberIds: mergedMemberIds,
          syncStatus: "synced" as SyncStatus,
        };

        set({
          expenses:    mergedExpenses,
          settlements: mergedSettlements,
          activity:    mergedActivity,
          members:     mergedMembers,
          groups:      mergedGroups,
        });
      },

      async joinGroupByCode(code) {
        try {
          // Resolve invite code via Firestore
          const { lookupInvite, pullGroupFromCloud, joinGroupCloud } = await import("./cloudSync");
          const invite = await lookupInvite(code.toUpperCase());
          if (!invite) return { ok: false, error: "Invite key not found." };

          const snapshot = await pullGroupFromCloud(invite.groupId);
          if (!snapshot) return { ok: false, error: "Could not load group data from the server." };

          // Join the group in Firestore FIRST before local state updates
          const joinSuccess = await joinGroupCloud(invite.groupId);
          if (!joinSuccess) return { ok: false, error: "Could not join group. Please try again." };

          get().importGroupSnapshot(snapshot);

          // Add current user as a new member in this group
          const { settings } = get();
          const newMemberId = "m-" + uid();
          const newMember: Member = {
            id:          newMemberId,
            name:        settings.userName || "Me",
            avatarColor: "bg-emerald-500",
            joinedAt:    new Date().toISOString(),
          };
          const joinAct = makeActivity(settings.currentUserId, {
            groupId:    snapshot.groupId,
            actionType: "MEMBER_JOINED",
            entityId:   newMemberId,
            entityType: "member",
            message:    `${settings.userName || "Someone"} joined the group`,
            newValue:   { name: settings.userName },
          });

          set((s) => {
            const existing = s.groups[snapshot.groupId];
            return {
              members: { ...s.members, [newMemberId]: newMember },
              groups:  {
                ...s.groups,
                [snapshot.groupId]: {
                  ...existing,
                  memberIds:  [...(existing?.memberIds ?? []), newMemberId],
                  syncStatus: "pending" as SyncStatus,
                },
              },
              groupMeIds: { ...s.groupMeIds, [snapshot.groupId]: newMemberId },
              activity:   [joinAct, ...s.activity],
            };
          });

          return { ok: true, groupId: snapshot.groupId };
        } catch {
          return { ok: false, error: "Network error — are you connected?" };
        }
      },
    }),
    {
      name: "blop-store-v3",
      partialize: (state) => ({
        members: state.members,
        groups: state.groups,
        expenses: state.expenses,
        settlements: state.settlements,
        activity: state.activity,
        settings: state.settings,
        groupMeIds: state.groupMeIds,
        _seeded: state._seeded,
      }),
    }
  )
);
