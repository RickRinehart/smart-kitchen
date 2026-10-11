import React from "react";

// The account bar (trial countdown, Upgrade, Sign Out / Sign In). It used to float in the top-right corner of the
// screen (position: fixed), on top of the app's header, tab names and the install banner, so it hid whatever was
// underneath, including the banner's "Got it" button. It is now an ordinary slim row above the app: it can never
// cover anything, and it scrolls away with the page instead of following the finger.

function TrialCountdown({ daysLeft, onUpgrade }) {
  if (daysLeft <= 0) return null;
  const urgent = daysLeft <= 3;
  const warning = daysLeft <= 10;
  const color = urgent ? "#cc0000" : warning ? "#e07b39" : "#888";
  const isDark = document.body.classList.contains("sk-dark");
  const bg = urgent ? "#fff0f0" : warning ? "#fff8ee" : isDark ? "#24523F" : "#f0f0f0";
  const border = urgent ? "1px solid #ffcccc" : warning ? "1px solid #f5d9b0" : isDark ? "1px solid #2f6a52" : "1px solid #ccc";
  return (
    <span style={{
      fontSize: "11px", color, background: bg,
      padding: "3px 8px", borderRadius: "10px", border,
      fontWeight: urgent ? "700" : "600", cursor: "pointer", whiteSpace: "nowrap",
    }} onClick={onUpgrade}>
      {urgent ? "⚠️ " : "🕐 "}Trial — {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
    </span>
  );
}

// guestExtras: the pre-sign-in accessibility toggles (they live in main.jsx), shown next to Sign In.
export function TopBar({ user, isAdmin, inTrial, daysLeft, isActive, effectiveTier, onUpgrade, onSignOut, onSignIn, guestExtras = null }) {
  return (
    <div data-topbar="account" style={{
      display: "flex", justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap",
      gap: "6px", padding: "6px 10px", boxSizing: "border-box", width: "100%",
    }}>
      {user ? (
        <>
          {inTrial && !isAdmin && <TrialCountdown daysLeft={daysLeft} onUpgrade={onUpgrade} />}
          {!isActive && !isAdmin && effectiveTier === "free" && (
            <button onClick={onUpgrade} style={{
              fontSize: "11px", padding: "4px 10px", borderRadius: "12px",
              border: "none", background: "#c8963e", color: "#fff",
              cursor: "pointer", fontWeight: "700",
            }}>Upgrade</button>
          )}
          <button onClick={onSignOut} style={{
            fontSize: "11px", padding: "4px 8px", borderRadius: "10px",
            border: "1px solid #444", background: "transparent",
            color: "#888", cursor: "pointer",
          }}>Sign Out</button>
        </>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {guestExtras}
          <button onClick={onSignIn} style={{
            fontSize: "12px", padding: "5px 14px", borderRadius: "12px",
            border: "none", background: "#c8963e", color: "#fff",
            cursor: "pointer", fontWeight: "700",
          }}>Sign In</button>
        </div>
      )}
    </div>
  );
}
