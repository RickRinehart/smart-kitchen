import React from "react";

// The account bar (trial countdown, Upgrade, Sign Out / Sign In). It used to float in the top-right corner of the
// screen (position: fixed), on top of the app's header, tab names and the install banner, so it hid whatever was
// underneath, including the banner's "Got it" button. It is now an ordinary slim row above the app: it can never
// cover anything, and it scrolls away with the page instead of following the finger.

function TrialCountdown({ daysLeft, onUpgrade }) {
  if (daysLeft <= 0) return null;
  // Colors come from the stylesheet (index.css) so they follow the light/dark theme the moment it is toggled:
  // normal, amber at 10 days or fewer, red at 3 days or fewer.
  const level = daysLeft <= 3 ? "urgent" : daysLeft <= 10 ? "warn" : "ok";
  return (
    <button type="button" className={"sk-trial sk-trial--" + level} onClick={onUpgrade}>
      {level === "urgent" ? "⚠️ " : "🕐 "}Trial — {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
    </button>
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
            <button className="sk-gold" onClick={onUpgrade}>Upgrade</button>
          )}
          <button className="sk-signout" onClick={onSignOut}>Sign Out</button>
        </>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {guestExtras}
          <button className="sk-gold" onClick={onSignIn}>Sign In</button>
        </div>
      )}
    </div>
  );
}
