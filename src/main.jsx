// Smart Kitchen App v2.3 - May 2026
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import AuthModal from "./AuthModal";
import SubscriptionModal from "./SubscriptionModal";
import { supabase, getUserProfile, trialDaysRemaining, markTouchpoint } from "./supabaseClient";
import "./index.css";

// Pre-auth accessibility toggles shown next to Sign In button
function AccessibilityToggles() {
  const [isLight, setIsLight] = React.useState(() => {
    try { return localStorage.getItem("sk_darkMode") === "0"; } catch { return false; }
  });
  const [isLarge, setIsLarge] = React.useState(() => {
    try { return localStorage.getItem("sk_seniorMode") === "1"; } catch { return false; }
  });
  const toggleTheme = () => {
    const next = !isLight;
    setIsLight(next);
    try { localStorage.setItem("sk_darkMode", next ? "0" : "1"); } catch {}
    document.body.classList.toggle("sk-light", next);
    document.body.classList.toggle("sk-dark", !next);
  };
  const toggleText = () => {
    const next = !isLarge;
    setIsLarge(next);
    try { localStorage.setItem("sk_seniorMode", next ? "1" : "0"); } catch {}
    window.location.reload();
  };
  return (
    <>
      <button onClick={toggleTheme} title={isLight ? "Dark Mode" : "Light Mode"} style={{background:"none",border:"1px solid #444",borderRadius:8,padding:"3px 8px",cursor:"pointer",fontSize:13,color:"#888"}}>{isLight ? "🌙" : "☀️"}</button>
      <button onClick={toggleText} title={isLarge ? "Normal Text" : "Large Text"} style={{background:isLarge?"#1a2344":"none",border:"1px solid #444",borderRadius:8,padding:"3px 8px",cursor:"pointer",fontSize:13,color:isLarge?"#fff":"#888"}}>{isLarge ? "Aa✓" : "Aa"}</button>
    </>
  );
}

// Admin emails — always get full access regardless of tier
const ADMIN_EMAILS = ["thesmartkitchenapp@gmail.com", "michiganrvvacations@gmail.com"];

function TrialCountdown({ daysLeft, onUpgrade }) {
  if (daysLeft <= 0) return null;
  const urgent = daysLeft <= 3;
  const warning = daysLeft <= 10;
  const color = urgent ? "#cc0000" : warning ? "#e07b39" : "#888";
  const bg = urgent ? "#fff0f0" : warning ? "#fff8ee" : "#1e1e2e";
  const border = urgent ? "1px solid #ffcccc" : warning ? "1px solid #f5d9b0" : "1px solid #333";
  return (
    <span style={{
      fontSize: "11px", color, background: bg,
      padding: "3px 8px", borderRadius: "10px", border,
      fontWeight: urgent ? "700" : "600", cursor: "pointer"
    }} onClick={onUpgrade}>
      {urgent ? "⚠️ " : "🕐 "}Trial — {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
    </span>
  );
}

function TouchpointModal({ daysLeft, onUpgrade, onDismiss, onRetentionChat }) {
  const [retentionMode, setRetentionMode] = useState(false);
  const [retentionInput, setRetentionInput] = useState("");
  const [retentionSent, setRetentionSent] = useState(false);

  async function sendRetentionResponse(response) {
    // Email retention response to admin
    try {
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "thesmartkitchenapp@gmail.com",
          subject: `Smart Kitchen — Day 5 Retention Response`,
          body: `A trial user responded to the Day 5 retention check-in:\n\n"${response}"\n\nDays remaining: ${daysLeft}`
        })
      });
    } catch (e) { /* silent fail */ }
    setRetentionSent(true);
    setTimeout(onDismiss, 2000);
  }

  if (daysLeft === 5 && !retentionMode && !retentionSent) {
    // Day 5 — retention conversation
    return (
      <div style={modalStyles.overlay}>
        <div style={modalStyles.box}>
          <div style={modalStyles.icon}>💬</div>
          <h3 style={modalStyles.title}>Quick question before your trial ends</h3>
          <p style={modalStyles.body}>
            You have <strong>5 days left</strong> in your free trial. Before you decide,
            we'd love to know — is there anything about Smart Kitchen that hasn't clicked,
            or something that would make it more useful for your family?
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "16px 0" }}>
            {[
              "It's a bit expensive for us right now",
              "I'm not sure I'll use it enough",
              "I haven't had time to explore it fully",
              "It doesn't quite do what I need",
              "I'm ready to upgrade!"
            ].map(opt => (
              <button key={opt} style={modalStyles.optionBtn}
                onClick={() => sendRetentionResponse(opt)}>
                {opt}
              </button>
            ))}
          </div>
          <button style={modalStyles.textBtn} onClick={() => setRetentionMode(true)}>
            Something else — let me type it
          </button>
          <button style={modalStyles.dismissBtn} onClick={onDismiss}>Maybe later</button>
        </div>
      </div>
    );
  }

  if (retentionMode) {
    return (
      <div style={modalStyles.overlay}>
        <div style={modalStyles.box}>
          <h3 style={modalStyles.title}>Tell us more</h3>
          <textarea
            style={modalStyles.textarea}
            placeholder="What would make Smart Kitchen work better for your family?"
            value={retentionInput}
            onChange={e => setRetentionInput(e.target.value)}
            rows={4}
          />
          <button style={modalStyles.upgradeBtn}
            onClick={() => sendRetentionResponse(retentionInput)}
            disabled={!retentionInput.trim()}>
            Send Feedback
          </button>
          <button style={modalStyles.dismissBtn} onClick={onDismiss}>Cancel</button>
        </div>
      </div>
    );
  }

  if (retentionSent) {
    return (
      <div style={modalStyles.overlay}>
        <div style={modalStyles.box}>
          <div style={modalStyles.icon}>🙏</div>
          <h3 style={modalStyles.title}>Thank you!</h3>
          <p style={modalStyles.body}>Your feedback helps us build a better app for families like yours.</p>
        </div>
      </div>
    );
  }

  // Days 15, 10, and daily reminders
  const messages = {
    15: { icon: "🎉", title: "Halfway through your trial!", body: "You've got 15 days left to explore everything Smart Kitchen has to offer. Meal planning, receipt scanning, dietary profiles — have you tried it all?" },
    10: { icon: "📅", title: "10 days left in your trial", body: "Families on Smart Kitchen save time every week with automatic meal planning and smart shopping lists. Ready to make it permanent?" },
  };
  const msg = messages[daysLeft] || {
    icon: daysLeft <= 3 ? "⚠️" : "🕐",
    title: daysLeft === 1 ? "Last day of your trial!" : `${daysLeft} days left in your trial`,
    body: daysLeft <= 3
      ? "Your trial ends very soon. Upgrade now to keep your meal plans, inventory, and family profiles."
      : "Your free trial is winding down. Choose a plan to keep full access to Smart Kitchen."
  };

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.box}>
        <div style={modalStyles.icon}>{msg.icon}</div>
        <h3 style={modalStyles.title}>{msg.title}</h3>
        <p style={modalStyles.body}>{msg.body}</p>
        <button style={modalStyles.upgradeBtn} onClick={onUpgrade}>See Plans & Upgrade</button>
        <button style={modalStyles.dismissBtn} onClick={onDismiss}>Remind me later</button>
      </div>
    </div>
  );
}

const modalStyles = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1100, padding: "16px"
  },
  box: {
    background: "#fff", borderRadius: "16px", padding: "32px",
    width: "100%", maxWidth: "440px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    textAlign: "center"
  },
  icon: { fontSize: "40px", marginBottom: "12px" },
  title: { margin: "0 0 12px", fontSize: "20px", fontWeight: "700", color: "#1a2344" },
  body: { margin: "0 0 20px", fontSize: "15px", color: "#555", lineHeight: "1.5" },
  upgradeBtn: {
    display: "block", width: "100%", padding: "14px", borderRadius: "8px",
    border: "none", background: "#c8963e", color: "#fff",
    fontSize: "15px", fontWeight: "700", cursor: "pointer", marginBottom: "10px"
  },
  optionBtn: {
    display: "block", width: "100%", padding: "12px 16px", borderRadius: "8px",
    border: "1px solid #ddd", background: "#f8f8f8", color: "#333",
    fontSize: "14px", cursor: "pointer", textAlign: "left"
  },
  textBtn: {
    background: "none", border: "none", color: "#c8963e",
    fontSize: "14px", cursor: "pointer", fontWeight: "600",
    marginBottom: "10px", display: "block", width: "100%"
  },
  dismissBtn: {
    background: "none", border: "none", color: "#999",
    fontSize: "13px", cursor: "pointer", marginTop: "4px"
  },
  textarea: {
    width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd",
    fontSize: "14px", resize: "vertical", boxSizing: "border-box", marginBottom: "12px"
  }
};

function Root() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [showTouchpoint, setShowTouchpoint] = useState(false);
  const [authMode, setAuthMode] = useState("signup");
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        getUserProfile(session.user.id).then(setUserProfile);
      }
      setAuthReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        getUserProfile(session.user.id).then(setUserProfile);
      } else {
        setUser(null);
        setUserProfile(null);
      }
    });

    const params = new URLSearchParams(window.location.search);
    if (params.get("subscription") === "success") {
      const tier = params.get("tier");
      if (tier) setUserProfile(p => ({ ...p, tier }));
      window.history.replaceState({}, "", window.location.pathname);
    }

    return () => subscription.unsubscribe();
  }, []);

  // Check touchpoints whenever profile loads
  useEffect(() => {
    if (!userProfile || !user) return;
    const isAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase());
    if (isAdmin) return; // Never show touchpoints to admin
    if (userProfile.subscription_status === "active") return; // Already subscribed

    const daysLeft = trialDaysRemaining(userProfile.trial_ends_at);
    if (daysLeft <= 0) return;

    const touchpoints = userProfile.trial_touchpoints || {};
    const today = new Date().toDateString();

    // Which touchpoint fires?
    let key = null;
    if (daysLeft === 15 && !touchpoints["day15"]) key = "day15";
    else if (daysLeft === 10 && !touchpoints["day10"]) key = "day10";
    else if (daysLeft === 5 && !touchpoints["day5"]) key = "day5";
    else if (daysLeft <= 4 && daysLeft >= 1 && touchpoints[`daily_${today}`] === undefined) key = `daily_${today}`;

    if (key) {
      // Small delay so app renders first
      setTimeout(() => {
        setShowTouchpoint(true);
        markTouchpoint(user.id, key);
      }, 2000);
    }
  }, [userProfile, user]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
  }

  // Admin bypass — always full access
  const isAdmin = user && ADMIN_EMAILS.includes(user.email?.toLowerCase());

  const tier = isAdmin ? "medical" : (userProfile?.tier || "free");
  const trialEndsAt = userProfile?.trial_ends_at || null;
  const inTrial = !isAdmin && trialEndsAt && new Date(trialEndsAt) > new Date();
  const effectiveTier = isAdmin ? "medical" : (inTrial ? (tier === "free" ? "family" : tier) : tier);
  const isActive = isAdmin || userProfile?.subscription_status === "active" || inTrial;
  const daysLeft = trialDaysRemaining(trialEndsAt);

  const can = {
    unlimitedRecipes:    isAdmin || ["solo", "family", "medical"].includes(effectiveTier),
    sevenDayPlan:        isAdmin || ["family", "medical"].includes(effectiveTier),
    busyNightFlag:       isAdmin || ["solo", "family", "medical"].includes(effectiveTier),
    calendarIntegration: isAdmin || ["solo", "family", "medical"].includes(effectiveTier),
    multipleProfiles:    isAdmin || ["family", "medical"].includes(effectiveTier),
    medicalCompliance:   isAdmin || effectiveTier === "medical",
    temporaryDiets:      isAdmin || effectiveTier === "medical",
  };

  const tierLabel = isAdmin
    ? "Admin"
    : inTrial
      ? effectiveTier.charAt(0).toUpperCase() + effectiveTier.slice(1) + " (Trial)"
      : effectiveTier.charAt(0).toUpperCase() + effectiveTier.slice(1);

  function handleUpgrade() {
    setShowTouchpoint(false);
    if (!user) { setAuthMode("signup"); setShowAuthModal(true); }
    else setShowSubModal(true);
  }

  return (
    <>
      {/* Auth / trial bar */}
      <div style={{
        position: "fixed", top: 0, right: "max(12px, calc((100vw - 1140px) / 2))", zIndex: 999,
        display: "flex", alignItems: "center", gap: "8px", padding: "6px 12px",
      }}>
        {user ? (
          <>
            <span style={{
              fontSize: "11px", color: "#888",
              background: "#1e1e2e", padding: "3px 8px",
              borderRadius: "10px", border: "1px solid #333"
            }}>
              {tierLabel}
            </span>

            {/* Trial countdown — always visible when in trial */}
            {inTrial && !isAdmin && (
              <TrialCountdown daysLeft={daysLeft} onUpgrade={handleUpgrade} />
            )}

            {!isActive && !isAdmin && effectiveTier === "free" && (
              <button onClick={handleUpgrade} style={{
                fontSize: "11px", padding: "4px 10px", borderRadius: "12px",
                border: "none", background: "#c8963e", color: "#fff",
                cursor: "pointer", fontWeight: "700"
              }}>Upgrade</button>
            )}
            <button onClick={handleSignOut} style={{
              fontSize: "11px", padding: "4px 8px", borderRadius: "10px",
              border: "1px solid #444", background: "transparent",
              color: "#888", cursor: "pointer"
            }}>Sign Out</button>
          </>
        ) : (
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <AccessibilityToggles />
            <button onClick={() => { setAuthMode("signup"); setShowAuthModal(true); }} style={{
              fontSize: "12px", padding: "5px 14px", borderRadius: "12px",
              border: "none", background: "#c8963e", color: "#fff",
              cursor: "pointer", fontWeight: "700"
            }}>Sign In</button>
          </div>
        )}
      </div>

      <App
        tier={effectiveTier}
        can={can}
        onUpgrade={handleUpgrade}
        user={user}
      />

      {/* Touchpoint pop-up */}
      {showTouchpoint && inTrial && (
        <TouchpointModal
          daysLeft={daysLeft}
          onUpgrade={handleUpgrade}
          onDismiss={() => setShowTouchpoint(false)}
        />
      )}

      {showAuthModal && (
        <AuthModal
          initialMode={authMode}
          onClose={() => setShowAuthModal(false)}
          onSuccess={(u) => {
            setUser(u);
            setShowAuthModal(false);
            getUserProfile(u.id).then(setUserProfile);
          }}
        />
      )}
      {showSubModal && user && (
        <SubscriptionModal
          user={user}
          currentTier={effectiveTier}
          onClose={() => setShowSubModal(false)}
          onSubscribed={(t) => {
            setUserProfile(p => ({ ...p, tier: t }));
            setShowSubModal(false);
          }}
        />
      )}
    </>
  );
}

createRoot(document.getElementById("root")).render(<Root />);

