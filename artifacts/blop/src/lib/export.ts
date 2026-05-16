import type {
  Group, Member, Expense, SettlementPayment, MinimizedSettlement,
} from "./models";
import { categories } from "./mockData";
import { getCurrencySymbol } from "./utils";
import { format, parseISO } from "date-fns";

export interface MemberBalance {
  id:   string;
  name: string;
  paid: number;
  net:  number;
}

export interface ThemeColors {
  primaryHsl: string;
  accentHsl:  string;
  name:       string;
}

export interface ExportData {
  group:          Group;
  members:        Record<string, Member>;
  expenses:       Expense[];
  settlements:    SettlementPayment[];
  memberBalances: MemberBalance[];
  minimized:      MinimizedSettlement[];
  themeColors?:   ThemeColors;
  currencyCode?:  string;
}

// ── CSV ─────────────────────────────────────────────────────────────────────

function esc(v: string | number | undefined | null): string {
  if (v == null) return "";
  const s = String(v);
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

export function generateCSV(data: ExportData): { csv: string; filename: string } {
  const { group, members, expenses, settlements, memberBalances, minimized } = data;
  const cur  = group.defaultCurrency;
  const now  = format(new Date(), "yyyy-MM-dd");
  const active = expenses.filter((e) => !e.isDeleted);
  const total  = active.reduce((s, e) => s + e.amount, 0);

  const L = (row: (string | number | undefined | null)[]) => row.map(esc).join(",");

  const rows: string[] = [];

  rows.push(L(["Group", group.name]));
  rows.push(L(["Exported", now]));
  rows.push(L(["Currency", cur]));
  rows.push(L(["Members", group.memberIds.map((id) => members[id]?.name ?? id).join(" · ")]));
  rows.push(L(["Total Expenses", `${cur} ${total.toFixed(2)}`]));
  rows.push(L(["Expense Count", active.length]));
  rows.push("");

  rows.push("EXPENSES");
  rows.push(L(["Date", "Description", "Category", "Paid By", `Amount (${cur})`, "Note", "Receipt", "Split Type"]));
  for (const e of active) {
    rows.push(L([
      e.expenseDate,
      e.title,
      categories[e.category]?.name ?? e.category,
      members[e.paidByMemberId]?.name ?? e.paidByMemberId,
      e.amount.toFixed(2),
      e.note ?? "",
      e.receiptUrl ? "Yes" : "No",
      e.splitType,
    ]));
  }
  rows.push("");

  rows.push("SPLIT BREAKDOWN");
  rows.push(L(["Expense", "Member", `Share (${cur})`]));
  for (const e of active) {
    for (const p of e.participants) {
      rows.push(L([e.title, members[p.memberId]?.name ?? p.memberId, p.shareAmount.toFixed(2)]));
    }
  }
  rows.push("");

  rows.push("PAYMENTS & SETTLEMENTS");
  rows.push(L(["Date", "From", "To", `Amount (${cur})`, "Note", "Status"]));
  for (const s of settlements) {
    rows.push(L([
      format(parseISO(s.createdAt), "yyyy-MM-dd"),
      members[s.fromMemberId]?.name ?? s.fromMemberId,
      members[s.toMemberId]?.name  ?? s.toMemberId,
      s.amount.toFixed(2),
      s.note ?? "",
      s.isSettled ? "Settled" : "Unsettled",
    ]));
  }
  rows.push("");

  rows.push("FINAL BALANCES");
  rows.push(L(["Member", `Total Paid (${cur})`, `Net Balance (${cur})`]));
  for (const mb of memberBalances) {
    rows.push(L([mb.name, mb.paid.toFixed(2), (mb.net >= 0 ? "+" : "") + mb.net.toFixed(2)]));
  }
  rows.push("");

  rows.push("WHO OWES WHOM");
  if (minimized.length === 0) {
    rows.push("All settled up!");
  } else {
    rows.push(L(["From", "To", `Amount (${cur})`]));
    for (const m of minimized) {
      rows.push(L([
        members[m.fromMemberId]?.name ?? m.fromMemberId,
        members[m.toMemberId]?.name  ?? m.toMemberId,
        m.amount.toFixed(2),
      ]));
    }
  }

  const filename = `${group.name.replace(/[^a-z0-9]/gi, "_")}_${now}.csv`;
  return { csv: rows.join("\n"), filename };
}

export function downloadCSV(filename: string, csv: string): void {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── PDF via print window ─────────────────────────────────────────────────────

function avatar(name: string, color: string): string {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const bg = color || "#6b7280";
  return `<span class="av" style="background:${bg}">${initials}</span>`;
}

function pill(text: string, type: "cat" | "settled" | "pending"): string {
  const styles: Record<string, string> = {
    cat:     "background:#f3f4f6;color:#374151;",
    settled: "background:#dcfce7;color:#15803d;",
    pending: "background:#fef9c3;color:#92400e;",
  };
  return `<span class="pill" style="${styles[type] ?? styles.cat}">${text}</span>`;
}

function tableHTML(cols: string[], rows: (string | number)[][], alignRight: number[] = []): string {
  const th = cols.map((c, i) => `<th style="${alignRight.includes(i) ? "text-align:right" : ""}">${c}</th>`).join("");
  const tr = rows.map((r, ri) =>
    `<tr class="${ri % 2 === 1 ? "alt" : ""}">${r.map((c, i) => `<td style="${alignRight.includes(i) ? "text-align:right;font-variant-numeric:tabular-nums" : ""}">${c}</td>`).join("")}</tr>`,
  ).join("");
  return `<table><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>`;
}

export function openPrintWindow(data: ExportData): void {
  const { group, members, expenses, settlements, memberBalances, minimized, themeColors } = data;
  const curCode = data.currencyCode ?? group.defaultCurrency;
  const sym     = getCurrencySymbol(curCode);
  const now     = format(new Date(), "MMMM d, yyyy");
  const active  = expenses.filter((e) => !e.isDeleted);
  const total   = active.reduce((s, e) => s + e.amount, 0);
  const settled = settlements.filter((s) => s.isSettled).length;
  const memberNames = group.memberIds.map((id) => members[id]?.name ?? id);

  // ── Theme colors ──────────────────────────────────────────────────────────
  const primaryHsl = themeColors?.primaryHsl ?? "158 52% 24%";
  const accentHsl  = themeColors?.accentHsl  ?? "14 85% 62%";
  const themeName  = themeColors?.name ?? "Forest";
  const primaryCss = `hsl(${primaryHsl})`;
  const accentCss  = `hsl(${accentHsl})`;
  // Lighter tint for table alt rows (primary at 5% opacity on white)
  const primaryParts = primaryHsl.split(" ");
  const tintCss = `hsl(${primaryParts[0]} ${primaryParts[1]} 97%)`;
  const borderTintCss = `hsl(${primaryParts[0]} ${primaryParts[1]} 88%)`;

  // ── Currency formatter ────────────────────────────────────────────────────
  const fmt = (n: number) => `${sym}&thinsp;${n.toFixed(2)}`;
  const fmtNet = (net: number) => {
    if (net < -0.01) return `${sym}&thinsp;−${Math.abs(net).toFixed(2)}`;
    return `${sym}&thinsp;${net.toFixed(2)}`;
  };

  // ── Rows ──────────────────────────────────────────────────────────────────

  const expenseRows = active.map((e) => {
    const payer = members[e.paidByMemberId];
    const av    = payer ? avatar(payer.name, payer.avatarColor ?? "#6b7280") : "?";
    const cat   = pill(categories[e.category]?.name ?? e.category, "cat");
    return [
      `<span class="date">${format(parseISO(e.expenseDate), "MMM d")}</span>`,
      `<span class="title">${e.title}</span>${e.note ? `<br><span class="note">${e.note}</span>` : ""}`,
      cat,
      `<span class="payer">${av} ${payer?.name ?? "?"}</span>`,
      `<span class="amount">${fmt(e.amount)}</span>`,
    ];
  });

  const settlementRows = settlements.map((s) => {
    const from  = members[s.fromMemberId];
    const to    = members[s.toMemberId];
    const avF   = from ? avatar(from.name, from.avatarColor ?? "#6b7280") : "?";
    const avT   = to   ? avatar(to.name,   to.avatarColor   ?? "#6b7280") : "?";
    const badge = s.isSettled ? pill("Settled", "settled") : pill("Pending", "pending");
    return [
      `<span class="date">${format(parseISO(s.createdAt), "MMM d, yyyy")}</span>`,
      `<span class="payer">${avF} ${from?.name ?? "?"}</span>`,
      `<span class="payer">${avT} ${to?.name ?? "?"}</span>`,
      `<span class="amount">${fmt(s.amount)}</span>`,
      `<span class="note">${s.note ?? "—"}</span>`,
      badge,
    ];
  });

  const balanceRows = memberBalances.map((mb) => {
    const mem  = Object.values(members).find((m) => m.name === mb.name);
    const av   = mem ? avatar(mb.name, mem.avatarColor ?? "#6b7280") : avatar(mb.name, "#6b7280");
    const isPos = mb.net > 0.01;
    const isNeg = mb.net < -0.01;
    const cls   = isPos ? "pos" : isNeg ? "neg" : "zero";
    return [
      `<span class="payer">${av} ${mb.name}</span>`,
      `<span style="font-variant-numeric:tabular-nums">${fmt(mb.paid)}</span>`,
      `<span class="${cls}" style="font-variant-numeric:tabular-nums">${fmtNet(mb.net)}</span>`,
    ];
  });

  const whoOwes = minimized.map((m) => {
    const from = members[m.fromMemberId];
    const to   = members[m.toMemberId];
    const avF  = from ? avatar(from.name, from.avatarColor ?? "#6b7280") : "?";
    const avT  = to   ? avatar(to.name,   to.avatarColor   ?? "#6b7280") : "?";
    return `
      <div class="transfer-row">
        <div class="transfer-person">${avF} <span>${from?.name ?? "?"}</span></div>
        <div class="transfer-arrow">
          <span class="arrow-label">${fmt(m.amount)}</span>
          <span class="arrow-line">&#8594;</span>
        </div>
        <div class="transfer-person">${avT} <span>${to?.name ?? "?"}</span></div>
      </div>`;
  }).join("");

  // ── HTML ──────────────────────────────────────────────────────────────────

  const html = `<!DOCTYPE html>
<html lang="en"><head>
  <meta charset="UTF-8"/>
  <title>${group.name} — Expense Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',system-ui,-apple-system,sans-serif;font-size:12px;color:#1a1a1a;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}

    /* ── Header banner ── */
    .banner{background:${primaryCss};color:#fff;padding:0;display:flex;flex-direction:column}
    .banner-top{padding:28px 36px 20px;display:flex;align-items:flex-start;justify-content:space-between}
    .banner-brand{font-size:10px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,.4);margin-bottom:6px}
    .banner-title{font-size:26px;font-weight:800;letter-spacing:-.025em;line-height:1.15;color:#fff}
    .banner-sub{font-size:11px;color:rgba(255,255,255,.5);margin-top:4px}
    .banner-right{text-align:right;display:flex;flex-direction:column;gap:4px;flex-shrink:0;margin-left:20px}
    .banner-date{font-size:10px;color:rgba(255,255,255,.5);font-weight:500}
    .banner-cur{font-size:11px;font-weight:700;color:rgba(255,255,255,.75);letter-spacing:.06em;text-transform:uppercase;background:rgba(255,255,255,.12);padding:3px 10px;border-radius:99px;margin-top:4px;display:inline-block}
    .banner-theme{font-size:9px;color:rgba(255,255,255,.35);margin-top:2px;letter-spacing:.06em;text-transform:uppercase}
    .banner-stripe{height:4px;background:${accentCss};opacity:.85}

    /* ── Body wrapper ── */
    .body{padding:28px 36px}

    /* ── Stat cards ── */
    .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:26px}
    .stat{border:1.5px solid #ebebeb;border-radius:12px;padding:15px 16px;background:#fafafa}
    .stat .lbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#bbb}
    .stat .val{font-size:20px;font-weight:800;color:#1a1a1a;margin-top:5px;letter-spacing:-.02em;font-variant-numeric:tabular-nums;line-height:1}
    .stat.accent{background:${primaryCss};border-color:${primaryCss}}
    .stat.accent .lbl{color:rgba(255,255,255,.45)}
    .stat.accent .val{color:#fff}

    /* ── Members row ── */
    .members-bar{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:26px;padding:11px 16px;background:${tintCss};border-radius:10px;border:1.5px solid ${borderTintCss}}
    .members-lbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#bbb;flex-shrink:0;margin-right:4px}

    /* ── Section ── */
    .sec{margin-bottom:26px;page-break-inside:avoid}
    .sec-hdr{display:flex;align-items:center;gap:8px;margin-bottom:10px}
    .sec-hdr h2{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#bbb;white-space:nowrap}
    .sec-hdr::after{content:'';flex:1;height:1.5px;background:#f0f0f0}

    /* ── Table ── */
    table{width:100%;border-collapse:collapse;font-size:11.5px}
    th{padding:8px 10px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#bbb;border-bottom:2px solid #f0f0f0}
    td{padding:9px 10px;vertical-align:middle;border-bottom:1px solid #f5f5f5}
    tr.alt td{background:${tintCss}}
    tr:last-child td{border-bottom:none}

    /* ── Inline elements ── */
    .av{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;font-size:8px;font-weight:700;color:#fff;vertical-align:middle;margin-right:6px;flex-shrink:0}
    .payer{display:flex;align-items:center;white-space:nowrap;font-weight:500}
    .title{font-weight:600;color:#111}
    .date{color:#999;font-size:11px;white-space:nowrap}
    .note{font-size:10px;color:#bbb;margin-top:2px;display:block}
    .amount{font-weight:700;font-variant-numeric:tabular-nums;color:#111}
    .pill{display:inline-block;padding:2px 8px;border-radius:99px;font-size:9px;font-weight:700;letter-spacing:.04em;white-space:nowrap}
    .pos{color:#15803d;font-weight:700}
    .neg{color:#dc2626;font-weight:700}
    .zero{color:#bbb;font-weight:500}

    /* ── Who owes whom ── */
    .transfers{display:flex;flex-direction:column;gap:8px}
    .transfer-row{display:flex;align-items:center;gap:16px;padding:12px 16px;border-radius:12px;border:1.5px solid #f0f0f0;background:#fafafa}
    .transfer-person{display:flex;align-items:center;gap:7px;font-weight:600;font-size:12px;min-width:110px}
    .transfer-arrow{display:flex;flex-direction:column;align-items:center;flex:1}
    .arrow-label{font-size:11px;font-weight:700;color:${primaryCss};font-variant-numeric:tabular-nums;letter-spacing:.02em}
    .arrow-line{font-size:20px;color:#ddd;line-height:1;margin-top:2px}

    /* ── All settled ── */
    .all-settled{display:flex;align-items:center;gap:12px;padding:18px 20px;background:${tintCss};border:1.5px solid ${borderTintCss};border-radius:12px;color:${primaryCss};font-weight:700;font-size:13px}

    /* ── Footer ── */
    .ftr{margin-top:32px;padding-top:14px;border-top:1.5px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center}
    .ftr-brand{font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#ddd}
    .ftr-date{font-size:10px;color:#ccc}

    @media print{
      body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .banner{background:${primaryCss} !important}
      .stat.accent{background:${primaryCss} !important}
    }
  </style>
</head><body>
  <div class="banner">
    <div class="banner-top">
      <div>
        <div class="banner-brand">blop &middot; Expense Report</div>
        <div class="banner-title">${group.name}</div>
        <div class="banner-sub">${memberNames.length} member${memberNames.length !== 1 ? "s" : ""} &middot; ${active.length} expense${active.length !== 1 ? "s" : ""} &middot; ${now}</div>
      </div>
      <div class="banner-right">
        <div class="banner-cur">${curCode} &thinsp; ${sym}</div>
        <div class="banner-theme">${themeName} theme</div>
      </div>
    </div>
    <div class="banner-stripe"></div>
  </div>

  <div class="body">
    <div class="stats">
      <div class="stat accent">
        <div class="lbl">Total Spend</div>
        <div class="val">${sym}&thinsp;${total.toFixed(2)}</div>
      </div>
      <div class="stat">
        <div class="lbl">Expenses</div>
        <div class="val">${active.length}</div>
      </div>
      <div class="stat">
        <div class="lbl">Members</div>
        <div class="val">${memberNames.length}</div>
      </div>
      <div class="stat">
        <div class="lbl">Payments</div>
        <div class="val">${settled}<span style="font-size:13px;font-weight:500;color:#aaa"> / ${settlements.length}</span></div>
      </div>
    </div>

    <div class="members-bar">
      <span class="members-lbl">Members</span>
      ${memberNames.map((n) => {
        const m = Object.values(members).find((mm) => mm.name === n);
        return `<span style="display:inline-flex;align-items:center;gap:0">${avatar(n, m?.avatarColor ?? "#6b7280")}<span style="font-size:11px;font-weight:500;color:#444;margin-right:8px">${n}</span></span>`;
      }).join("")}
    </div>

    <div class="sec">
      <div class="sec-hdr"><h2>Expenses</h2></div>
      ${active.length === 0
        ? `<p style="color:#bbb;font-size:12px;padding:12px 0">No expenses recorded.</p>`
        : tableHTML(["Date","Description","Category","Paid by","Amount"], expenseRows, [4])}
    </div>

    ${settlements.length > 0 ? `
    <div class="sec">
      <div class="sec-hdr"><h2>Payments &amp; Settlements</h2></div>
      ${tableHTML(["Date","From","To","Amount","Note","Status"], settlementRows, [3])}
    </div>` : ""}

    <div class="sec">
      <div class="sec-hdr"><h2>Final Balances</h2></div>
      ${tableHTML(["Member","Total Paid","Net Balance"], balanceRows, [1,2])}
    </div>

    <div class="sec">
      <div class="sec-hdr"><h2>Who Owes Whom</h2></div>
      ${minimized.length > 0
        ? `<div class="transfers">${whoOwes}</div>`
        : `<div class="all-settled"><span style="font-size:20px">✓</span> All settled up &mdash; no pending payments.</div>`}
    </div>

    <div class="ftr">
      <span class="ftr-brand">blop</span>
      <span class="ftr-date">Generated ${now}</span>
    </div>
  </div>
</body></html>`;

  const win = window.open("", "_blank", "width=920,height=820");
  if (!win) { alert("Please allow pop-ups to export PDF."); return; }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.addEventListener("load", () => setTimeout(() => win.print(), 600));
}
