import React, { useState, useEffect, useRef } from "react";

// New-user onboarding screens. Purely presentational: App.jsx decides WHEN to show each one and what
// the buttons do, so none of this touches data. Designed for seniors: large text, 60px+ buttons,
// brand colors only used as fills where contrast allows (gold is never used as text on cream).

const GREEN = "#1B3D2F";
const GOLD = "#C8963E";
const ON_GOLD = "#12291F";
const CREAM = "#F4F1EA";
const INK = "#12291F";
const MUTED = "#3D4B44";
const SAND = "#E9E2CE";
const LINE = "#D9D2BF";
const HEAD = "'Cormorant Garamond', Georgia, serif";
const BODY = "'Atkinson Hyperlegible', system-ui, -apple-system, 'Segoe UI', sans-serif";
const Z = 3100; // above the setup wizard (200), chat (1000) and the app's other modals (1000-1100)

export const QUICK_START_HREF = "/SmartKitchen_QuickStart.pdf";

const goldBtn = {
  display: "flex", alignItems: "center", justifyContent: "center", width: "100%", minHeight: 64,
  borderRadius: 16, border: "none", background: GOLD, color: ON_GOLD, fontFamily: BODY,
  fontSize: 22, fontWeight: 700, cursor: "pointer", boxSizing: "border-box", padding: "0 16px", textAlign: "center",
};
const outlineBtn = {
  display: "flex", alignItems: "center", justifyContent: "center", width: "100%", minHeight: 60,
  borderRadius: 16, border: "2px solid " + GREEN, background: "transparent", color: GREEN, fontFamily: BODY,
  fontSize: 22, fontWeight: 700, cursor: "pointer", boxSizing: "border-box", padding: "0 16px", textAlign: "center",
};
const disabledBtn = { ...goldBtn, background: "#DDD3B8", color: "#4A4A40", cursor: "not-allowed" };

const fullScreen = {
  position: "fixed", inset: 0, zIndex: Z, background: CREAM, overflowY: "auto",
  fontFamily: BODY, color: INK, WebkitOverflowScrolling: "touch", textAlign: "left", outline: "none",
};
const backdrop = {
  position: "fixed", inset: 0, zIndex: Z, background: "rgba(18,41,31,0.66)", overflowY: "auto",
  display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "24px 16px",
  fontFamily: BODY, color: INK, boxSizing: "border-box", WebkitOverflowScrolling: "touch", textAlign: "left",
};
const panel = {
  background: "#FFFFFF", borderRadius: 20, padding: "26px 22px 22px", width: "100%", maxWidth: 440,
  boxSizing: "border-box", margin: "auto 0", display: "flex", flexDirection: "column", gap: 16, textAlign: "left", outline: "none",
};

function CheckIcon({ size = 22, color = CREAM }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3.5"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="4 12 10 18 20 6" />
    </svg>
  );
}

// ───────────────────────────── 1. WELCOME SCREEN ─────────────────────────────
const WELCOME_STEPS = [
  ["Who is at your table", "Add each person, with any food restrictions or medications. Every plan stays safe for them."],
  ["What is in your kitchen", "Pick every cuisine your household cooks to load a starter set of protein, pantry, produce and dairy. Or scan a receipt or shelf, or type items in."],
  ["Build your first plan", "One tap gives you a week of dinners that fit your household and your pantry."],
  ["Meet your Kitchen Assistant", "Ask anything, any time, about food or about the app. Type it or say it out loud."],
];

export function WelcomeScreen({ onStart, onSkip, skipLabel = "Skip for now" }) {
  const rootRef = useRef(null);
  useEffect(() => { if (rootRef.current) rootRef.current.focus(); }, []);
  // The steps scroll; the two action buttons are pinned to the bottom so they are always visible,
  // even on a small phone where the four step cards are several screens tall.
  return (
    <div ref={rootRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="sk-welcome-title"
      style={{ ...fullScreen, overflowY: "hidden", display: "flex", flexDirection: "column" }}>
      <div data-scroll="welcome" style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        <div style={{ background: GREEN, padding: "40px 24px 32px" }}>
          <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "0.12em", color: GOLD }}>SMART KITCHEN</div>
            <h1 id="sk-welcome-title" style={{ margin: 0, fontFamily: HEAD, fontSize: 42, lineHeight: 1.05, fontWeight: 700, color: CREAM }}>
              Welcome. Let's set up your kitchen.
            </h1>
            <p style={{ margin: 0, fontSize: 20, lineHeight: 1.4, color: "#E6E0CF" }}>
              Four short steps, about five minutes. You can stop at any time.
            </p>
          </div>
        </div>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 24px 32px", display: "flex", flexDirection: "column", gap: 16 }}>
          {WELCOME_STEPS.map(([title, text], i) => (
            <div key={title} style={{ display: "flex", gap: 16, background: "#FFFFFF", border: "2px solid " + LINE, borderRadius: 16, padding: 20 }}>
              <div style={{ flex: "0 0 48px", width: 48, height: 48, borderRadius: 24, background: GOLD, color: ON_GOLD, fontSize: 26, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {i + 1}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.2, color: GREEN }}>{title}</div>
                <div style={{ fontSize: 20, lineHeight: 1.4, color: "#2B3A33" }}>{text}</div>
              </div>
            </div>
          ))}
          <div style={{ padding: 20, borderRadius: 16, background: SAND, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: GREEN }}>Why this matters</div>
            <div style={{ fontSize: 20, lineHeight: 1.4 }}>
              The more we know, the better it works. Your restrictions and medications are always respected, and meals are built from what you actually have.
            </div>
          </div>
          <div style={{ fontSize: 18, lineHeight: 1.4, color: MUTED, textAlign: "center", marginTop: 8 }}>
            You can come back to this anytime from the Help button.
          </div>
          <a href={QUICK_START_HREF} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 20, lineHeight: 1.4, textAlign: "center", fontWeight: 700, color: GREEN }}>
            Prefer paper? Open the Quick Start guide (PDF)
          </a>
        </div>
      </div>
      <div data-footer="welcome" style={{ flex: "0 0 auto", background: CREAM, borderTop: "2px solid " + LINE, padding: "12px 24px calc(12px + env(safe-area-inset-bottom, 0px))" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
          <button type="button" onClick={onStart} style={{ ...goldBtn, fontSize: 24 }}>Let's get started</button>
          <button type="button" onClick={onSkip} style={{ ...outlineBtn, minHeight: 56 }}>{skipLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────── 2. GETTING STARTED CARD ─────────────────────────────
// steps: [{id, title, done, caption, cta}]  (App computes `done` from the account's real data)
export function GettingStartedCard({ steps, onOpen, onHide }) {
  const doneCount = steps.filter((s) => s.done).length;
  const nextIdx = steps.findIndex((s) => !s.done);
  const rowBase = {
    display: "flex", alignItems: "center", gap: 14, width: "100%", minHeight: 72, padding: 12, borderRadius: 14,
    background: CREAM, border: "none", cursor: "pointer", textAlign: "left", fontFamily: BODY, boxSizing: "border-box",
  };
  const circle = (done) => (
    <div style={{ flex: "0 0 40px", width: 40, height: 40, borderRadius: 20, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center",
      background: done ? GREEN : "transparent", border: done ? "none" : "3px solid " + GREEN }}>
      {done ? <CheckIcon /> : null}
    </div>
  );
  const labels = (s) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
      <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2, color: GREEN }}>{s.title}</div>
      <div style={{ fontSize: 18, lineHeight: 1.3, color: MUTED }}>{s.caption}</div>
    </div>
  );
  return (
    <section aria-label="Getting started" style={{ background: "#FFFFFF", border: "2px solid " + GREEN, borderRadius: 20, padding: 20, margin: "0 0 18px", display: "flex", flexDirection: "column", gap: 16, fontFamily: BODY, color: INK, maxWidth: 640, boxSizing: "border-box", textAlign: "left" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
          <h2 style={{ margin: 0, fontFamily: HEAD, fontSize: 30, fontWeight: 700, color: GREEN }}>Getting started</h2>
          <div style={{ fontSize: 20, fontWeight: 700, color: MUTED, whiteSpace: "nowrap" }}>{doneCount} of {steps.length} done</div>
        </div>
        <div role="progressbar" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={doneCount} aria-label="Getting started progress"
          style={{ height: 14, borderRadius: 7, background: "#E3DDCB", overflow: "hidden" }}>
          <div style={{ width: (doneCount / steps.length) * 100 + "%", height: 14, background: GREEN }} />
        </div>
      </div>
      {steps.map((s, i) =>
        i === nextIdx ? (
          <div key={s.id} style={{ display: "flex", flexDirection: "column", gap: 12, padding: 14, borderRadius: 14, border: "3px solid " + GOLD, background: "#FFFBF1" }}>
            <button type="button" onClick={() => onOpen(s.id)} style={{ ...rowBase, background: "transparent", minHeight: 56, padding: 0 }}>
              {circle(false)}{labels(s)}
            </button>
            <button type="button" onClick={() => onOpen(s.id)} style={{ ...goldBtn, minHeight: 60 }}>{s.cta}</button>
          </div>
        ) : (
          <button key={s.id} type="button" onClick={() => onOpen(s.id)} style={rowBase}>
            {circle(s.done)}{labels(s)}
          </button>
        )
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button type="button" onClick={onHide} style={{ background: "transparent", border: "none", color: GREEN, fontFamily: BODY, fontSize: 20, fontWeight: 700, minHeight: 44, cursor: "pointer", padding: 0, textDecoration: "underline" }}>
          Hide this card
        </button>
        <div style={{ fontSize: 18, color: MUTED }}>Bring it back from Help</div>
      </div>
    </section>
  );
}

// ───────────────────────────── 3. GENTLE NUDGE ─────────────────────────────
export function ThinPlanNudge({ onAddMore, onBuildAnyway }) {
  const panelRef = useRef(null);
  useEffect(() => { if (panelRef.current) panelRef.current.focus(); }, []);
  return (
    <div style={backdrop}>
      <div ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="sk-nudge-title" style={panel}>
        <h2 id="sk-nudge-title" style={{ margin: 0, fontFamily: HEAD, fontSize: 36, lineHeight: 1.05, fontWeight: 700, color: GREEN }}>
          Add your proteins first
        </h2>
        <p style={{ margin: 0, fontSize: 20, lineHeight: 1.45 }}>
          A meal plan is built around the proteins you have, like chicken, beef or fish. Without any, it will be mostly a shopping list. Adding a few first gives you a much better plan.
        </p>
        <button type="button" onClick={onAddMore} style={goldBtn}>Add proteins first</button>
        <button type="button" onClick={onBuildAnyway} style={outlineBtn}>Build my plan anyway</button>
        <div style={{ fontSize: 18, lineHeight: 1.4, color: MUTED, textAlign: "center" }}>You can always add more later.</div>
      </div>
    </div>
  );
}

// ───────────────────────────── 4. FOUR WAYS TO FILL THE KITCHEN ─────────────────────────────
function Chip({ label, selected, onClick }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected}
      style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 48, padding: "0 16px", borderRadius: 24, boxSizing: "border-box", cursor: "pointer",
        fontFamily: BODY, fontSize: 20, fontWeight: 700,
        background: selected ? GREEN : "#FFFFFF", color: selected ? CREAM : GREEN, border: selected ? "2px solid " + GREEN : "2px solid " + GREEN }}>
      {selected ? <CheckIcon size={18} /> : null}{label}
    </button>
  );
}

function WayCard({ title, hint, onClick, icon }) {
  return (
    <button type="button" onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", minHeight: 96, padding: "14px 18px", background: "#FFFFFF", border: "2px solid " + LINE,
        borderRadius: 18, cursor: "pointer", textAlign: "left", fontFamily: BODY, boxSizing: "border-box" }}>
      <div style={{ flex: "0 0 56px", width: 56, height: 56, borderRadius: 28, background: GOLD, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.15, color: GREEN }}>{title}</div>
        <div style={{ fontSize: 18, lineHeight: 1.35, color: MUTED }}>{hint}</div>
      </div>
    </button>
  );
}

const iconProps = { width: 28, height: 28, viewBox: "0 0 24 24", fill: "none", stroke: ON_GOLD, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" };
const GlobeIcon = () => (<svg {...iconProps}><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><line x1="3" y1="12" x2="21" y2="12" /></svg>);
const ReceiptIcon = () => (<svg {...iconProps}><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="9" y1="12" x2="15" y2="12" /></svg>);
const CameraIcon = () => (<svg {...iconProps}><path d="M3 8h4l2-3h6l2 3h4v11H3z" /><circle cx="12" cy="13" r="3.5" /></svg>);
const PencilIcon = () => (<svg {...iconProps}><path d="M4 20l1-4L16 5l3 3L8 19z" /><line x1="14" y1="7" x2="17" y2="10" /></svg>);

const COLLAPSED_CUISINES = 8;

// cuisines: all options; selected: chosen ones; loadingCount: how many chosen cuisines are still being looked up;
// getStarterItems(): returns [{name, category, ...}] for the review list; onAddItems(items): App merges them into inventory.
export function KitchenChooser({ cuisines, selected, loadingCount, failedCount = 0, onRetry, getStarterItems, onToggleCuisine, onAddItems, onReceipt, onShelves, onType, onClose }) {
  const [view, setView] = useState("choose");
  const [items, setItems] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? cuisines : cuisines.filter((c, i) => i < COLLAPSED_CUISINES || selected.includes(c));
  const n = selected.length;
  const needsRetry = n > 0 && loadingCount === 0 && failedCount > 0;
  const ready = n > 0 && loadingCount === 0 && failedCount === 0;

  const openReview = () => {
    const list = (getStarterItems() || []).map((it) => ({ ...it, checked: false, qty: it.category === "Protein" ? 4 : 1 }));
    setItems(list);
    setView("review");
  };
  const checkedCount = items.filter((i) => i.checked).length;

  if (view === "review") {
    // Group by category (Protein first, then Pantry, Produce, Dairy, anything else after), nothing checked to
    // start: the person ticks what they really have, so plans are never built on food they do not own.
    const order = ["Protein", "Pantry", "Produce", "Dairy"]; // protein first: it is what a meal plan is built on
    const byCat = new Map();
    items.forEach((it, idx) => {
      const k = it.category || "Pantry";
      if (!byCat.has(k)) byCat.set(k, []);
      byCat.get(k).push(idx);
    });
    const groups = [...byCat.keys()]
      .sort((x, y) => ((order.indexOf(x) < 0 ? 99 : order.indexOf(x)) - (order.indexOf(y) < 0 ? 99 : order.indexOf(y))) || x.localeCompare(y))
      .map((name) => ({ name, idxs: byCat.get(name) }));
    const setGroup = (idxs, val) => {
      const set = new Set(idxs);
      setItems((prev) => prev.map((p, j) => (set.has(j) ? { ...p, checked: val } : p)));
    };
    const smallBtn = { minHeight: 44, padding: "0 14px", borderRadius: 22, border: "2px solid " + GREEN, background: "#FFFFFF", color: GREEN, fontFamily: BODY, fontSize: 18, fontWeight: 700, cursor: "pointer" };
    const stepBtn = { flex: "0 0 48px", width: 48, height: 48, borderRadius: 24, border: "2px solid " + GREEN, background: "#FFFFFF", color: GREEN, fontFamily: BODY, fontSize: 28, fontWeight: 700, lineHeight: 1, cursor: "pointer", padding: 0 };
    const stepQty = (j, d) => setItems((prev) => prev.map((p, k) => (k === j ? { ...p, qty: Math.max(1, Math.min(99, (parseInt(p.qty) || 1) + d)) } : p)));
    // The app's base CSS paints native checkboxes dark, which reads as "already ticked". Draw our own:
    // empty = white with a green border, ticked = solid green with a white check.
    const CHECK = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23F4F1EA' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='4 12 10 18 20 6'/%3E%3C/svg%3E\")";
    const boxStyle = (checked) => ({
      appearance: "none", WebkitAppearance: "none", MozAppearance: "none", width: 28, height: 28, flex: "0 0 28px", margin: 0, padding: 0,
      borderRadius: 6, boxSizing: "border-box", border: "3px solid " + GREEN, cursor: "pointer",
      backgroundColor: checked ? GREEN : "#FFFFFF", backgroundImage: checked ? CHECK : "none",
      backgroundRepeat: "no-repeat", backgroundPosition: "center", backgroundSize: "20px 20px",
    });
    return (
      <div style={{ ...backdrop, alignItems: "stretch", padding: 12 }}>
        <div role="dialog" aria-modal="true" aria-labelledby="sk-review-title"
          style={{ ...panel, maxWidth: 520, height: "100%", maxHeight: "100%", margin: "0 auto", padding: 0, gap: 0, overflow: "hidden" }}>
          <div style={{ flex: "0 0 auto", padding: "16px 16px 10px 20px", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <h2 id="sk-review-title" style={{ margin: 0, minWidth: 0, fontFamily: HEAD, fontSize: 34, lineHeight: 1.05, fontWeight: 700, color: GREEN }}>Check what you have</h2>
              <button type="button" onClick={() => setView("choose")} style={{ ...smallBtn, minHeight: 48, flex: "0 0 auto" }}>Back</button>
            </div>
            <div role="status" style={{ fontSize: 22, fontWeight: 700, color: GREEN }}>{checkedCount} of {items.length} checked</div>
          </div>
          <div data-scroll="review" style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch", borderTop: "2px solid " + LINE, borderBottom: "2px solid " + LINE }}>
            <p style={{ margin: 0, padding: "12px 20px", fontSize: 20, lineHeight: 1.35 }}>
              Tick each thing you have in your kitchen. Only ticked items are added.
            </p>
            {items.length === 0 ? (
              <div style={{ padding: 16, fontSize: 20 }}>No items found yet. Please go back and try again in a moment.</div>
            ) : groups.map((g) => {
              const inGroup = g.idxs.filter((j) => items[j].checked).length;
              return (
                <div key={g.name}>
                  <div style={{ position: "sticky", top: 0, zIndex: 1, background: SAND, padding: "10px 14px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8, borderTop: "1px solid " + LINE, borderBottom: "1px solid " + LINE }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: GREEN }}>{g.name} <span style={{ fontSize: 18, fontWeight: 400, color: MUTED }}>({inGroup} of {g.idxs.length})</span></div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button type="button" onClick={() => setGroup(g.idxs, true)} aria-label={"Select all " + g.name} style={smallBtn}>Select all</button>
                      <button type="button" onClick={() => setGroup(g.idxs, false)} aria-label={"Clear all " + g.name} style={smallBtn}>Clear</button>
                    </div>
                  </div>
                  {g.idxs.map((j) => {
                    const it = items[j];
                    const qty = parseInt(it.qty) || 1;
                    return (
                      <div key={it.id || it.name + j} style={{ borderBottom: "1px solid " + LINE, background: it.checked ? "#EEF4EE" : "#FFFFFF" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 14, minHeight: 56, padding: "8px 14px", cursor: "pointer", fontSize: 20 }}>
                          <input type="checkbox" checked={it.checked} onChange={(e) => setItems((prev) => prev.map((p, k) => (k === j ? { ...p, checked: e.target.checked } : p)))}
                            style={boxStyle(it.checked)} />
                          <span style={{ flex: 1, minWidth: 0 }}>{it.name}</span>
                        </label>
                        {it.checked && it.category === "Protein" ? (
                          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10, padding: "0 14px 12px 56px" }}>
                            <span style={{ fontSize: 18, color: MUTED }}>Portions (about 6 oz each):</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <button type="button" disabled={qty <= 1} onClick={() => stepQty(j, -1)} aria-label={"Fewer portions of " + it.name} style={{ ...stepBtn, opacity: qty <= 1 ? 0.4 : 1, cursor: qty <= 1 ? "not-allowed" : "pointer" }}>−</button>
                              <span aria-live="polite" style={{ minWidth: 40, textAlign: "center", fontSize: 26, fontWeight: 700, color: GREEN }}>{qty}</span>
                              <button type="button" onClick={() => stepQty(j, 1)} aria-label={"More portions of " + it.name} style={stepBtn}>+</button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
          <div style={{ flex: "0 0 auto", padding: "12px 20px calc(14px + env(safe-area-inset-bottom, 0px))" }}>
            <button type="button" disabled={checkedCount === 0} onClick={() => onAddItems(items.filter((i) => i.checked))} style={checkedCount === 0 ? disabledBtn : goldBtn}>
              {checkedCount === 0 ? "Check at least one item" : "Add " + checkedCount + (checkedCount === 1 ? " item" : " items") + " to my kitchen"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={backdrop}>
      <div role="dialog" aria-modal="true" aria-labelledby="sk-kitchen-title" style={{ ...panel, background: CREAM }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <h2 id="sk-kitchen-title" style={{ margin: 0, fontFamily: HEAD, fontSize: 38, lineHeight: 1.05, fontWeight: 700, color: GREEN }}>What is in your kitchen</h2>
          <button type="button" onClick={onClose} aria-label="Close" style={{ flex: "0 0 auto", minWidth: 48, minHeight: 48, borderRadius: 24, border: "2px solid " + GREEN, background: "transparent", color: GREEN, fontFamily: BODY, fontSize: 20, fontWeight: 700, cursor: "pointer", padding: "0 14px" }}>Close</button>
        </div>
        <p style={{ margin: 0, fontSize: 20, lineHeight: 1.4, color: "#2B3A33" }}>Choose any way to start. You can use more than one.</p>

        <div style={{ background: "#FFFFFF", border: "3px solid " + GOLD, borderRadius: 18, padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ flex: "0 0 56px", width: 56, height: 56, borderRadius: 28, background: GOLD, display: "flex", alignItems: "center", justifyContent: "center" }}><GlobeIcon /></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
              <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.15, color: GREEN }}>Pick your cuisines</div>
              <div style={{ fontSize: 18, lineHeight: 1.35, color: MUTED }}>Fastest way to fill the kitchen</div>
            </div>
          </div>
          <div style={{ fontSize: 20, lineHeight: 1.4 }}>
            Choose every cuisine your household cooks. Each one brings its own protein, pantry, produce and dairy.
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {shown.map((c) => <Chip key={c} label={c} selected={selected.includes(c)} onClick={() => onToggleCuisine(c)} />)}
            {!showAll && cuisines.length > shown.length ? (
              <button type="button" onClick={() => setShowAll(true)}
                style={{ minHeight: 48, padding: "0 16px", borderRadius: 24, border: "2px dashed " + GREEN, background: "#FFFFFF", color: GREEN, fontFamily: BODY, fontSize: 20, fontWeight: 700, cursor: "pointer" }}>
                + More cuisines
              </button>
            ) : null}
          </div>
          <button type="button" disabled={!ready && !needsRetry} onClick={needsRetry ? onRetry : openReview} style={ready || needsRetry ? goldBtn : disabledBtn}>
            {n === 0 ? "Choose a cuisine first" : loadingCount > 0 ? "Finding items…" : needsRetry ? "Some items did not load. Try again" : "Load starter set (" + n + (n === 1 ? " cuisine)" : " cuisines)")}
          </button>
          <div style={{ fontSize: 18, lineHeight: 1.4, color: MUTED }}>You will check off what you actually have before anything is added.</div>
        </div>

        <WayCard title="Scan a receipt" hint="Photograph your grocery receipt" onClick={onReceipt} icon={<ReceiptIcon />} />
        <WayCard title="Scan your shelves" hint="Photograph each pantry and refrigerator shelf" onClick={onShelves} icon={<CameraIcon />} />
        <WayCard title="Type items in" hint="Add things one at a time" onClick={onType} icon={<PencilIcon />} />

        <div style={{ padding: 18, borderRadius: 16, background: SAND, fontSize: 20, lineHeight: 1.4 }}>
          Everything you add can be changed later in the Settings tab.
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────── 5. HELP MENU ─────────────────────────────
export function HelpMenu({ onWelcome, onShowCard, onAssistant, onClose, cardHidden, showCardOption, showWelcomeOption = true }) {
  const panelRef = useRef(null);
  useEffect(() => { if (panelRef.current) panelRef.current.focus(); }, []);
  return (
    <div style={backdrop} onClick={onClose}>
      <div ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="sk-help-title" style={panel} onClick={(e) => e.stopPropagation()}>
        <h2 id="sk-help-title" style={{ margin: 0, fontFamily: HEAD, fontSize: 36, lineHeight: 1.05, fontWeight: 700, color: GREEN }}>Help</h2>
        {showWelcomeOption ? <button type="button" onClick={onWelcome} style={outlineBtn}>Show the welcome guide</button> : null}
        {showCardOption ? (
          <button type="button" onClick={onShowCard} style={outlineBtn}>{cardHidden ? "Show the Getting started card" : "Getting started card is showing"}</button>
        ) : null}
        <button type="button" onClick={onAssistant} style={outlineBtn}>Ask the Kitchen Assistant</button>
        <a href={QUICK_START_HREF} target="_blank" rel="noopener noreferrer"
          style={{ ...outlineBtn, textDecoration: "none" }}>Open the Quick Start guide (PDF)</a>
        <button type="button" onClick={onClose} style={goldBtn}>Close</button>
      </div>
    </div>
  );
}
