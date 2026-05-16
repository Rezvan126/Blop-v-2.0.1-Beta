export type GroupType = "trip" | "roommates" | "friends" | "couple" | "event";

/**
 * "local"   — created/modified on this device, never pushed
 * "pending" — queued for next sync push
 * "synced"  — server has the latest version
 * "failed"  — last push attempt failed; will retry on next online event
 */
export type SyncStatus = "local" | "synced" | "pending" | "failed";

export type SplitType = "equal" | "exact" | "percentage" | "shares";
export type EntityType = "group" | "member" | "expense" | "settlement";

export type ActionType =
  | "GROUP_CREATED"
  | "MEMBER_ADDED"
  | "MEMBER_REMOVED"
  | "MEMBER_JOINED"
  | "EXPENSE_CREATED"
  | "EXPENSE_EDITED"
  | "EXPENSE_DELETED"
  | "RECEIPT_ADDED"
  | "RECEIPT_REMOVED"
  | "PAYMENT_SETTLED"
  | "PAYMENT_UNSETTLED"
  | "GROUP_SYNCED"
  | "GROUP_SETTINGS_CHANGED";

export interface Group {
  id: string;
  name: string;
  type: GroupType;
  defaultCurrency: string;
  memberIds: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  /** When the server last accepted a push for this group */
  serverUpdatedAt?: string;
  isArchived: boolean;
  inviteCode: string;
  syncStatus: SyncStatus;
}

export interface Member {
  id: string;
  groupId?: string;
  name: string;
  avatarColor: string;
  email?: string;
  phone?: string;
  userId?: string;
  isMe?: boolean;
  joinedAt: string;
}

export interface ExpenseParticipant {
  memberId: string;
  shareAmount: number;
  percentage?: number;
  shares?: number;
  owesAmount: number;
}

export interface Expense {
  id: string;
  groupId: string;
  title: string;
  amount: number;
  currency: string;
  exchangeRateToGroupCurrency: number;
  amountInGroupCurrency: number;
  paidByMemberId: string;
  participants: ExpenseParticipant[];
  splitType: SplitType;
  category: string;
  note?: string;
  receiptUrl?: string;
  expenseDate: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
  isDeleted: boolean;
  syncStatus: SyncStatus;
}

export interface SettlementPayment {
  id: string;
  groupId: string;
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  currency: string;
  note?: string;
  isSettled: boolean;
  settledAt?: string;
  createdAt: string;
  createdBy: string;
  syncStatus?: SyncStatus;
}

export interface ActivityLog {
  id: string;
  groupId: string;
  actionType: ActionType;
  entityId: string;
  entityType: EntityType;
  message: string;
  oldValue?: unknown;
  newValue?: unknown;
  createdAt: string;
  createdBy: string;
}

export interface MinimizedSettlement {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
}

export interface AppSettings {
  currentUserId: string;
  currency: string;
  notificationsEnabled: boolean;
  hasOnboarded: boolean;
  userName: string;
}

/**
 * Full group state payload used for cloud sync and invite-code joining.
 * Sent from client → server on push, server → client on pull/join.
 */
export interface GroupSnapshotPayload {
  groupId: string;
  inviteCode: string;
  groupName: string;
  group: Group;
  members: Record<string, Member>;
  expenses: Record<string, Expense>;
  settlements: Record<string, SettlementPayment>;
  activity: ActivityLog[];
}
