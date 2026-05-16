import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Wallet,
  ShoppingCart,
  Coffee,
  Car,
  Home,
  Zap,
  Heart,
  MoreHorizontal,
  X,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

// ─── Font loader ──────────────────────────────────────────────────────────────
function FontLoader() {
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Geist:wght@300;400;500&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);
  return null;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "food", label: "Food & Drink", Icon: Coffee, color: "#f97316" },
  { id: "shopping", label: "Shopping", Icon: ShoppingCart, color: "#a78bfa" },
  { id: "transport", label: "Transport", Icon: Car, color: "#22d3ee" },
  { id: "housing", label: "Housing", Icon: Home, color: "#4ade80" },
  { id: "utilities", label: "Utilities", Icon: Zap, color: "#fbbf24" },
  { id: "health", label: "Health", Icon: Heart, color: "#f43f5e" },
  { id: "other", label: "Other", Icon: MoreHorizontal, color: "#94a3b8" },
];

const MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

type Transaction = {
  id: string;
  title: string;
  amount: number;
  category: string;
  type: "expense" | "income";
  date: string;
  note: string;
};

type Category = {
  id: string;
  label: string;
  Icon: React.ElementType;
  color: string;
};

type CatBreakdown = Category & { amount: number };

function getCat(id: string): Category {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[6];
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function today() {
  return new Date().toISOString().split("T")[0];
}

// ─── Donut chart (pure SVG) ───────────────────────────────────────────────────
function DonutChart({ data, total }: { data: CatBreakdown[]; total: number }) {
  const size = 180;
  const r = 70;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  const slices = useMemo(() => {
    let cumulative = 0;
    return data.map((d) => {
      const pct = total > 0 ? d.amount / total : 0;
      const offset = circumference * (1 - cumulative);
      const dash = circumference * pct;
      cumulative += pct;
      return { ...d, dash, offset };
    });
  }, [data, total, circumference]);

  if (total === 0) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <div
          className="w-36 h-36 rounded-full border-4 border-white/5 flex items-center justify-center"
        >
          <span
            className="text-xs text-neutral-600"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            no data
          </span>
        </div>
      </div>
    );
  }

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1a1a2e" strokeWidth={18} />
      {slices.map((s) => (
        <circle
          key={s.id}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={s.color}
          strokeWidth={18}
          strokeDasharray={`${s.dash} ${circumference - s.dash}`}
          strokeDashoffset={s.offset}
          strokeLinecap="butt"
          style={{ transition: "stroke-dasharray 0.5s ease" }}
        />
      ))}
    </svg>
  );
}

// ─── Add Expense Modal ────────────────────────────────────────────────────────
function AddModal({ onClose, onAdd }: { onClose: () => void; onAdd: (tx: Transaction) => void }) {
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "food",
    type: "expense",
    date: today(),
    note: "",
  });
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.title.trim()) return setError("Title is required.");
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      return setError("Enter a valid amount.");
    setError("");
    onAdd({
      id: Date.now().toString(),
      title: form.title.trim(),
      amount: parseFloat(form.amount),
      category: form.category,
      type: form.type,
      date: form.date,
      note: form.note.trim(),
    });
    onClose();
  };

  const inputCls =
    "w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/8 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-green-400/40 transition-all duration-200";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 20 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md rounded-2xl border border-white/10 p-6 relative"
        style={{ background: "#0e0e16" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-lg font-bold text-white"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Add Transaction
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:text-white hover:bg-white/8 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Type toggle */}
        <div className="flex gap-2 mb-5 p-1 rounded-xl bg-white/[0.03] border border-white/5">
          {["expense", "income"].map((t) => (
            <button
              key={t}
              onClick={() => set("type", t)}
              className={`flex-1 py-2.5 rounded-lg text-xs font-semibold capitalize transition-all duration-200 ${
                form.type === t
                  ? t === "expense"
                    ? "bg-red-500/15 text-red-400 border border-red-500/20"
                    : "bg-green-400/15 text-green-400 border border-green-400/20"
                  : "text-neutral-600 hover:text-neutral-400"
              }`}
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {t === "expense" ? "− Expense" : "+ Income"}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Title (e.g. Swiggy order)"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            className={inputCls}
            style={{ fontFamily: "'Geist', sans-serif" }}
          />
          <input
            type="number"
            placeholder="Amount (₹)"
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
            className={inputCls}
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          />

          {/* Category */}
          <div className="relative">
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className={inputCls + " appearance-none pr-10 cursor-pointer"}
              style={{
                fontFamily: "'Geist', sans-serif",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id} style={{ background: "#0e0e16" }}>
                  {c.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
            />
          </div>

          <input
            type="date"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
            className={inputCls}
            style={{ fontFamily: "'JetBrains Mono', monospace", colorScheme: "dark" }}
          />
          <input
            type="text"
            placeholder="Note (optional)"
            value={form.note}
            onChange={(e) => set("note", e.target.value)}
            className={inputCls}
            style={{ fontFamily: "'Geist', sans-serif" }}
          />

          {error && (
            <p
              className="text-xs text-red-400"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              ⚠ {error}
            </p>
          )}

          <button
            onClick={submit}
            className="mt-1 py-3.5 rounded-xl font-semibold text-sm text-black flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all"
            style={{
              background: "linear-gradient(135deg, #4ade80, #22d3ee)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <Plus size={15} />
            Add Transaction
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Transaction row ──────────────────────────────────────────────────────────
function TxRow({ tx, onDelete }: { tx: Transaction; onDelete: (id: string) => void }) {
  const cat = getCat(tx.category);
  const d = new Date(tx.date);
  const dateStr = `${d.getDate()} ${MONTHS[d.getMonth()]}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16, height: 0 }}
      transition={{ duration: 0.22 }}
      className="group flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-white/[0.03] transition-colors duration-200"
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${cat.color}15`, border: `1px solid ${cat.color}25` }}
      >
        <cat.Icon size={15} style={{ color: cat.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-sm text-white truncate"
          style={{ fontFamily: "'Geist', sans-serif", fontWeight: 500 }}
        >
          {tx.title}
        </p>
        <p
          className="text-[11px] text-neutral-600"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {cat.label} · {dateStr}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`text-sm font-semibold ${
            tx.type === "income" ? "text-green-400" : "text-red-400"
          }`}
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {tx.type === "income" ? "+" : "−"}
          {fmt(tx.amount)}
        </span>
        <button
          onClick={() => onDelete(tx.id)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-700 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all duration-200"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, amount, type, icon: Icon, sub }: {
  label: string;
  amount: number;
  type: "balance" | "income" | "expense";
  icon: React.ElementType;
  sub?: string;
}) {
  const colors = {
    balance: { text: "text-white", accent: "#4ade80", bg: "rgba(74,222,128,0.06)" },
    income: { text: "text-green-400", accent: "#4ade80", bg: "rgba(74,222,128,0.06)" },
    expense: { text: "text-red-400", accent: "#f43f5e", bg: "rgba(244,63,94,0.06)" },
  };
  const c = colors[type] || colors.balance;

  return (
    <div
      className="flex-1 min-w-0 p-5 rounded-2xl border border-white/5"
      style={{ background: c.bg, borderColor: `${c.accent}15` }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-[10px] text-neutral-500 uppercase tracking-widest"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {label}
        </span>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${c.accent}15` }}
        >
          <Icon size={13} style={{ color: c.accent }} />
        </div>
      </div>
      <p
        className={`text-2xl font-bold ${c.text} leading-none mb-1`}
        style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
      >
        {fmt(amount)}
      </p>
      {sub !== undefined && (
        <p
          className="text-[11px] text-neutral-600"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function ExpenseTracker() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem("et_transactions");
      return saved ? JSON.parse(saved) : DEMO_DATA;
    } catch {
      return DEMO_DATA;
    }
  });
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("all"); // all | expense | income
  const [activeMonth, setActiveMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  // Persist
  useEffect(() => {
    localStorage.setItem("et_transactions", JSON.stringify(transactions));
  }, [transactions]);

  const addTransaction = (tx: Transaction) => setTransactions((prev) => [tx, ...prev]);
  const deleteTransaction = (id: string) =>
    setTransactions((prev) => prev.filter((t) => t.id !== id));

  // Filtered by month
  const monthTx = useMemo(
    () => transactions.filter((t) => t.date.startsWith(activeMonth)),
    [transactions, activeMonth]
  );

  const totalIncome = useMemo(
    () => monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
    [monthTx]
  );
  const totalExpense = useMemo(
    () => monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    [monthTx]
  );
  const balance = totalIncome - totalExpense;

  // Category breakdown for donut
  const catBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    monthTx
      .filter((t: Transaction) => t.type === "expense")
      .forEach((t: Transaction) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    return CATEGORIES.filter((c) => map[c.id]).map((c) => ({
      ...c,
      amount: map[c.id],
    }));
  }, [monthTx]);

  // Display list
  const displayTx = useMemo(
    () =>
      filter === "all"
        ? monthTx
        : monthTx.filter((t) => t.type === filter),
    [monthTx, filter]
  );

  // Month label
  const [yr, mo] = activeMonth.split("-");
  const monthLabel = `${MONTHS[parseInt(mo) - 1]} ${yr}`;

  // Month nav
  const prevMonth = () => {
    const d = new Date(`${activeMonth}-01`);
    d.setMonth(d.getMonth() - 1);
    setActiveMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };
  const nextMonth = () => {
    const d = new Date(`${activeMonth}-01`);
    d.setMonth(d.getMonth() + 1);
    const now = new Date();
    if (
      d.getFullYear() > now.getFullYear() ||
      (d.getFullYear() === now.getFullYear() && d.getMonth() > now.getMonth())
    )
      return;
    setActiveMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  return (
    <>
      <FontLoader />
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #07070f; color: #f5f5f5; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #07070f; }
        ::-webkit-scrollbar-thumb { background: rgba(74,222,128,0.2); border-radius: 3px; }
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; }
      `}</style>

      <div
        className="min-h-screen"
        style={{ background: "#07070f", fontFamily: "'Geist', sans-serif" }}
      >
        {/* ── Header ── */}
        <header className="border-b border-white/5 px-6 md:px-10 h-16 flex items-center justify-between sticky top-0 z-40"
          style={{ background: "rgba(7,7,15,0.85)", backdropFilter: "blur(12px)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#4ade80,#22d3ee)" }}
            >
              <Wallet size={15} className="text-black" />
            </div>
            <span
              className="font-bold text-white text-base"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              SpendLens
            </span>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-black transition-all hover:-translate-y-0.5 active:scale-95"
            style={{
              background: "linear-gradient(135deg,#4ade80,#22d3ee)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <Plus size={14} />
            Add
          </button>
        </header>

        <main className="max-w-5xl mx-auto px-4 md:px-8 py-8 flex flex-col gap-6">

          {/* ── Month nav ── */}
          <div className="flex items-center justify-between">
            <h1
              className="text-2xl md:text-3xl font-bold text-white"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              {monthLabel}
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="w-9 h-9 rounded-xl border border-white/8 flex items-center justify-center text-neutral-400 hover:text-white hover:border-white/20 transition-all text-sm"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                ‹
              </button>
              <button
                onClick={nextMonth}
                className="w-9 h-9 rounded-xl border border-white/8 flex items-center justify-center text-neutral-400 hover:text-white hover:border-white/20 transition-all text-sm"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                ›
              </button>
            </div>
          </div>

          {/* ── Stat cards ── */}
          <div className="flex gap-4 flex-wrap">
            <StatCard
              label="Balance"
              amount={balance}
              type="balance"
              icon={Wallet}
              sub={`${monthTx.length} transactions`}
            />
            <StatCard
              label="Income"
              amount={totalIncome}
              type="income"
              icon={ArrowUpRight}
            />
            <StatCard
              label="Expenses"
              amount={totalExpense}
              type="expense"
              icon={ArrowDownRight}
            />
          </div>

          {/* ── Body grid ── */}
          <div className="grid md:grid-cols-[1fr_260px] gap-5">

            {/* ── Transactions ── */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.015] overflow-hidden">
              {/* Filter bar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <h2
                  className="text-sm font-semibold text-white"
                  style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                >
                  Transactions
                </h2>
                <div className="flex gap-1.5">
                  {["all", "expense", "income"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1 rounded-lg text-[10px] uppercase tracking-widest transition-all duration-200 ${
                        filter === f
                          ? "bg-white/8 text-white"
                          : "text-neutral-600 hover:text-neutral-400"
                      }`}
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* List */}
              <div className="px-2 py-2 max-h-[480px] overflow-y-auto">
                <AnimatePresence mode="popLayout">
                  {displayTx.length === 0 ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-20 text-neutral-700"
                    >
                      <Wallet size={32} className="mb-3 opacity-40" />
                      <p
                        className="text-sm"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        No transactions yet
                      </p>
                    </motion.div>
                  ) : (
                    displayTx.map((tx) => (
                      <TxRow key={tx.id} tx={tx} onDelete={deleteTransaction} />
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ── Sidebar: chart + breakdown ── */}
            <div className="flex flex-col gap-4">
              {/* Donut */}
              <div className="rounded-2xl border border-white/5 bg-white/[0.015] p-5">
                <h3
                  className="text-xs text-neutral-500 uppercase tracking-widest mb-5"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  By Category
                </h3>
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <DonutChart data={catBreakdown} total={totalExpense} />
                    {totalExpense > 0 && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span
                          className="text-[10px] text-neutral-600 uppercase tracking-widest"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          spent
                        </span>
                        <span
                          className="text-sm font-bold text-white"
                          style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                        >
                          {fmt(totalExpense)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Legend */}
                <div className="flex flex-col gap-2">
                  {catBreakdown.map((c) => (
                    <div key={c.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: c.color }}
                        />
                        <span
                          className="text-xs text-neutral-500 truncate max-w-[100px]"
                          style={{ fontFamily: "'Geist', sans-serif" }}
                        >
                          {c.label}
                        </span>
                      </div>
                      <span
                        className="text-xs text-neutral-300"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {totalExpense > 0
                          ? Math.round((c.amount / totalExpense) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                  ))}
                  {catBreakdown.length === 0 && (
                    <p
                      className="text-xs text-neutral-700 text-center py-2"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      no expenses this month
                    </p>
                  )}
                </div>
              </div>

              {/* Quick tip */}
              <div className="rounded-2xl border border-green-400/10 bg-green-400/[0.03] p-4">
                <p
                  className="text-[10px] text-green-400/60 uppercase tracking-widest mb-1"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Tip
                </p>
                <p
                  className="text-xs text-neutral-500 leading-relaxed"
                  style={{ fontFamily: "'Geist', sans-serif" }}
                >
                  Hover a transaction and click{" "}
                  <Trash2 size={10} className="inline text-red-400" /> to delete
                  it. Data is saved locally in your browser.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ── Modal ── */}
      <AnimatePresence>
        {showModal && (
          <AddModal onClose={() => setShowModal(false)} onAdd={addTransaction} />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Demo seed data ───────────────────────────────────────────────────────────
const now = new Date();
const y = now.getFullYear();
const m = String(now.getMonth() + 1).padStart(2, "0");

const DEMO_DATA = [
  { id: "d1", title: "Salary", amount: 45000, category: "other", type: "income", date: `${y}-${m}-01`, note: "" },
  { id: "d2", title: "Swiggy order", amount: 340, category: "food", type: "expense", date: `${y}-${m}-03`, note: "" },
  { id: "d3", title: "Electricity bill", amount: 1200, category: "utilities", type: "expense", date: `${y}-${m}-05`, note: "" },
  { id: "d4", title: "Amazon shopping", amount: 2499, category: "shopping", type: "expense", date: `${y}-${m}-07`, note: "" },
  { id: "d5", title: "Ola ride", amount: 180, category: "transport", type: "expense", date: `${y}-${m}-09`, note: "" },
  { id: "d6", title: "Freelance payment", amount: 12000, category: "other", type: "income", date: `${y}-${m}-10`, note: "" },
  { id: "d7", title: "Zomato", amount: 520, category: "food", type: "expense", date: `${y}-${m}-11`, note: "" },
  { id: "d8", title: "Rent", amount: 8500, category: "housing", type: "expense", date: `${y}-${m}-01`, note: "" },
  { id: "d9", title: "Gym membership", amount: 1500, category: "health", type: "expense", date: `${y}-${m}-01`, note: "" },
  { id: "d10", title: "Coffee shop", amount: 280, category: "food", type: "expense", date: `${y}-${m}-13`, note: "" },
];