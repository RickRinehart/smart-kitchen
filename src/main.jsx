// Smart Kitchen App v2.3 - May 2026
import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import AuthModal from "./AuthModal";
import { GuestViewerModal } from "./ViewerCodeManager";
import SubscriptionModal from "./SubscriptionModal";
import { supabase, getUserProfile, trialDaysRemaining, markTouchpoint, loadCloudData, saveCloudData, getViewerRole, isCloudDirty, ALL_LOCAL_STORAGE_KEYS, setCachedAccessToken, beaconSave, setActiveDataUser, isReconciledFor, localDataBelongsToSomeoneElse, claimLocalData, wipeLocalUserData } from "./supabaseClient";
import "./index.css";

// Run this the moment an account is signed in, BEFORE anything is loaded from or saved to the cloud.
// If this browser still holds ANOTHER account's data (the session was replaced by a confirmation link, or
// someone signed in on a phone where the previous account was never signed out), clear it so it can't be
// uploaded into -- or shown inside -- the new account. Guest data (built while signed out) and older,
// unlabelled data are kept and claimed, exactly as before. Returns true when data was cleared: the caller
// must reload so the app starts from the clean state instead of the old in-memory copy.
function takeOverLocalData(userId) {
  setActiveDataUser(userId);
  if (localDataBelongsToSomeoneElse(userId)) {
    wipeLocalUserData();
    claimLocalData(userId);
    return true;
  }
  claimLocalData(userId);
  return false;
}

// Welcome email: the SERVER sends it, once, and only after the person has actually confirmed their email.
// (It used to go out at sign-up, before confirmation, with a big "Open Smart Kitchen" button -- new people tapped it,
// landed on the app unconfirmed, tried to sign in, and got "Email not confirmed".) Only recently created accounts are
// asked about, and only once per device; the server also guarantees one email per account.
async function sendWelcomeIfNeeded(session) {
  try {
    const user = session && session.user;
    if (!user || !user.email_confirmed_at || !session.access_token) return;
    const created = Date.parse(user.created_at || "");
    if (!isNaN(created) && Date.now() - created > 45 * 86400000) return;
    const key = "sk_welcomeChecked_" + user.id;
    if (localStorage.getItem(key)) return;
    const r = await fetch("/api/send-welcome-email", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.access_token },
      body: JSON.stringify({ event: "trial_signup", tier: "solo" })
    });
    if (r.ok) localStorage.setItem(key, "1");
  } catch {}
}

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
      <button onClick={toggleText} title={isLarge ? "Normal Text" : "Large Text"} style={{background:isLarge?"#1B3D2F":"none",border:"1px solid #444",borderRadius:8,padding:"3px 8px",cursor:"pointer",fontSize:13,color:isLarge?"#fff":"#888"}}>{isLarge ? "Aa✓" : "Aa"}</button>
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
  const isDark = document.body.classList.contains("sk-dark");
  const bg = urgent ? "#fff0f0" : warning ? "#fff8ee" : isDark ? "#24523F" : "#f0f0f0";
  const border = urgent ? "1px solid #ffcccc" : warning ? "1px solid #f5d9b0" : isDark ? "1px solid #2f6a52" : "1px solid #ccc";
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
  title: { margin: "0 0 12px", fontSize: "20px", fontWeight: "700", color: "#1B3D2F" },
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

// First-visit welcome splash -- shown once per browser to any signed-out visitor before they see
// the app or the sign-in button, so a cold visitor (e.g. someone arriving via an insurance
// carrier's link, with no in-person pitch behind them) gets context instead of landing straight
// on a login screen. Deliberately generic for now -- a future version will accept the referring
// carrier (e.g. via a ?ref= link) and personalize this with carrier-provided intro copy; that's
// a separate, larger build. This version is the same content for every visitor.
function WelcomeSplash({ onGetStarted, onSignIn }) {
  // Same large-text preference the rest of the app uses (sk_seniorMode) -- respected here and
  // toggleable right on the splash, since this screen now sits in front of the pre-login bar
  // that normally carries that toggle.
  const large = (() => { try { return localStorage.getItem("sk_seniorMode") === "1"; } catch { return false; } })();
  const s = (n) => Math.round(n * (large ? 1.3 : 1));
  const toggleLarge = () => {
    try { localStorage.setItem("sk_seniorMode", large ? "0" : "1"); } catch {}
    window.location.reload();
  };
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1200, background: "#1B3D2F",
      display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 24,
      overflowY: "auto",
    }}>
      <button onClick={toggleLarge} title={large ? "Normal Text" : "Large Text"} style={{
        position: "fixed", top: 12, right: 12, background: large ? "#C8963E" : "transparent",
        border: "1px solid #C8963E88", borderRadius: 8, padding: "4px 10px", cursor: "pointer",
        fontSize: 14, color: large ? "#000" : "#C8963E", fontWeight: 700,
      }}>{large ? "Aa\u2713" : "Aa"}</button>
      <div style={{ maxWidth: 480, width: "100%", textAlign: "center", padding: "36px 0 20px" }}>
        <img src="/logo-lockup.jpg" alt="Smart Kitchen" style={{ width: s(160), maxWidth: "55%", height: "auto", borderRadius: 20, marginBottom: 20, boxShadow: "0 10px 36px rgba(0,0,0,0.5)" }}/>
        <div style={{ color: "#ffffff", fontSize: s(15), marginBottom: 28, opacity: 0.85 }}>
          Meal Planning Made Simple — For You and Your Family
        </div>

        <div style={{ color: "#ffffff", fontSize: s(15), lineHeight: 1.7, marginBottom: 24, textAlign: "left" }}>
          Smart Kitchen was built to answer one exhausting question every household knows:
          <em> "What's for dinner?"</em> It plans meals from what's already in your kitchen,
          tracks your groceries automatically, and can manage diabetic, low-sodium, and other
          special diets — enforced, not just suggested.
        </div>

        <div style={{ background: "#24523F", border: "1px solid #C8963E44", borderRadius: 12, padding: "16px 18px", marginBottom: 24, textAlign: "left" }}>
          <div style={{ color: "#C8963E", fontSize: s(11), fontWeight: 700, letterSpacing: "0.08em", marginBottom: 10 }}>WHAT TO EXPECT</div>
          {[
            "A full week of dinners, planned around what you already have",
            "Automatic dietary compliance for 19 medical conditions and diet plans",
            "Every household member gets their own profile and their own plate",
            "30 days free, full access — no credit card required to start",
          ].map(line => (
            <div key={line} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8, color: "#ffffff", fontSize: s(13.5), lineHeight: 1.5 }}>
              <span style={{ color: "#C8963E" }}>•</span><span>{line}</span>
            </div>
          ))}
        </div>

        <div style={{ color: "#AEB4CC", fontSize: s(12), lineHeight: 1.6, marginBottom: 28 }}>
          🔒 Your information is never sold or shared with third parties.
        </div>

        <button onClick={onGetStarted} style={{
          width: "100%", background: "#C8963E", border: "none", borderRadius: 12,
          padding: "16px", color: "#000", fontFamily: "'DM Sans', sans-serif", fontSize: s(17),
          fontWeight: 700, cursor: "pointer", marginBottom: 14,
        }}>
          Get Started — It's Free
        </button>
        <button onClick={onSignIn} style={{
          background: "transparent", border: "none", color: "#AEB4CC",
          fontSize: s(13), cursor: "pointer",
        }}>
          Already have an account? Sign In
        </button>

        <div style={{ color: "#5a6389", fontSize: 10, marginTop: 32 }}>
          RG Digital Labs, LLC &middot; Veteran-Owned &middot; Grand Rapids, Michigan
        </div>
      </div>
    </div>
  );
}

function Root() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showGuestViewer, setShowGuestViewer] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  // Shown once per browser to a signed-out visitor. Checked lazily so a returning visitor who
  // already clicked through (or an existing signed-in user) never sees it again on this device.
  const [showSplash, setShowSplash] = useState(() => {
    try {
      // Never interrupt an email-confirmation or password-reset redirect, or a guest viewer
      // who's already joined someone's household -- those people arrived with a specific purpose.
      // Modern Supabase email links use PKCE: the redirect carries a ?code= query param rather
      // than the old #access_token= hash fragment, so both forms need checking here.
      const h = window.location.hash || "";
      const q = window.location.search || "";
      if (h.includes("type=signup") || h.includes("type=recovery") || h.includes("access_token")) return false;
      if (q.includes("code=")) return false;
      if (localStorage.getItem("sk_guest_viewer")) return false;
      return localStorage.getItem("sk_seenSplash") !== "1";
    } catch { return true; }
  });
  const [viewerRole, setViewerRole] = useState(() => {
    // Check for guest viewer session in localStorage
    try {
      const guest = localStorage.getItem("sk_guest_viewer");
      if (guest) {
        const parsed = JSON.parse(guest);
        if (parsed?.ownerUserId) return { ...parsed, role: "guest_viewer", label: "Family" };
      }
    } catch(e) {}
    return null;
  });
  const [showTouchpoint, setShowTouchpoint] = useState(false);
  const [seniorBannerActive] = useState(() => {
    try { return localStorage.getItem("sk_seniorMode") === "1"; } catch { return false; }
  });
  const [authMode, setAuthMode] = useState("signup");
  const [authReady, setAuthReady] = useState(false);
  // Tracks whichever user.id this tab has already loaded cloud data for, so the SIGNED_IN
  // handler below can tell a genuine account switch (different id -- force an authoritative
  // cloud pull) apart from Supabase re-firing SIGNED_IN for the SAME already-active session
  // (a tab regaining focus, a token refresh, reconnecting after the phone locks -- all routine,
  // not a switch). Forcing the pull on every SIGNED_IN event, regardless of whether the user
  // actually changed, clobbers real in-progress local edits with a stale cloud snapshot the
  // moment one of those routine re-fires happens to land mid-edit.
  const activeUserIdRef = useRef(null);
  const loadStartedForRef = useRef(null);   // the account this page has already begun loading cloud data for

  useEffect(() => {
    // PKCE email-confirmation / password-reset return trip: Supabase's confirmation link
    // redirects here with ?code=XXXX in the query string. The email itself is already
    // confirmed server-side by that point regardless -- but the browser's own session is
    // never established until this code is explicitly exchanged for one. Without this, the
    // person is genuinely confirmed yet still shows up signed-out, landing back on Create
    // Account instead of either being signed in or sent to Sign In.
    const codeParams = new URLSearchParams(window.location.search);
    const authCode = codeParams.get("code");
    const codeExchange = authCode
      ? supabase.auth.exchangeCodeForSession(authCode).then(() => {
          window.history.replaceState({}, "", window.location.pathname);
        }).catch(() => {})
      : Promise.resolve();

    codeExchange.then(() => supabase.auth.getSession()).then(({ data: { session } }) => {
      if (session?.user) {
        // Another account's leftover data must be cleared before anything loads or uploads
        if (takeOverLocalData(session.user.id)) { window.location.reload(); return; }
        try { localStorage.setItem("sk_seenSplash", "1"); } catch {}
        setUser(session.user);
        activeUserIdRef.current = session.user.id;
        setCachedAccessToken(session.access_token);
        loadStartedForRef.current = session.user.id;
        sendWelcomeIfNeeded(session);
        // Check if this user is a viewer of someone else's account
        getViewerRole(session.user.id).then(role => {
          if (role) {
            setViewerRole(role);
            // Load the OWNER's cloud data instead
            loadCloudData(role.owner_user_id).then(loaded => {
              if (loaded) window.dispatchEvent(new Event("sk_cloud_loaded"));
            }).catch(() => {});
          } else {
            setViewerRole(null);
            // Load own cloud data
            loadCloudData(session.user.id).then(loaded => {
              if (loaded) window.dispatchEvent(new Event("sk_cloud_loaded"));
              // Only push local data up if something is genuinely local-only (e.g. a fresh
              // signup that had local data before ever syncing) -- chained after the load
              // settles, and dirty-gated, so this can't clobber the load we just did with a
              // stale pre-load snapshot the way an unconditional fixed-delay save could.
              setTimeout(() => {
                if (isCloudDirty()) saveCloudData(session.user.id).catch(() => {});
              }, 1500);
            }).catch(() => {
              // Load failed -- fall back to pushing local data so at least something persists.
              saveCloudData(session.user.id).catch(() => {});
            });
          }
        }).catch(() => {});
        getUserProfile(session.user.id).then(setUserProfile);
      }
      setAuthReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        if (takeOverLocalData(session.user.id)) { window.location.reload(); return; }
        setUser(session.user);
        setCachedAccessToken(session.access_token);
        getUserProfile(session.user.id).then(setUserProfile);
        sendWelcomeIfNeeded(session);
        // Only treat this as a genuine account switch -- and only then force an authoritative
        // cloud pull -- when the signed-in user is actually different from whoever this tab
        // already had active. Supabase also fires SIGNED_IN for routine same-account re-auth
        // (tab regaining focus, token refresh, reconnecting after the phone locks), and forcing
        // an overwrite on every one of those clobbers real in-progress local edits with a stale
        // cloud snapshot whenever one lands mid-edit. For a same-user re-fire, skip the pull
        // entirely -- there is nothing to reconcile, the tab is already showing this account's
        // current state.
        const isSwitch = activeUserIdRef.current !== null && activeUserIdRef.current !== session.user.id;
        activeUserIdRef.current = session.user.id;
        // A routine same-account re-fire (focus, token refresh) does nothing. But a FRESH sign-in on a page that
        // hasn't loaded this account yet MUST load it too. It used to load only on a live account switch, so after
        // a sign-out (which clears the phone and reloads the page) the next sign-in loaded nothing, the app showed
        // an empty kitchen, and then uploaded that emptiness over the real cloud data.
        if (!isSwitch && (isReconciledFor(session.user.id) || loadStartedForRef.current === session.user.id)) return;
        loadStartedForRef.current = session.user.id;
        getViewerRole(session.user.id).then(role => {
          if (role) {
            setViewerRole(role);
            loadCloudData(role.owner_user_id, true).then(loaded => {
              if (loaded) window.dispatchEvent(new Event("sk_cloud_loaded"));
            }).catch(() => {});
          } else {
            setViewerRole(null);
            loadCloudData(session.user.id, true).then(loaded => {
              if (loaded) window.dispatchEvent(new Event("sk_cloud_loaded"));
            }).catch(() => {});
          }
        }).catch(() => {});
      } else if (event === 'USER_UPDATED') {
        setUser(session.user);
        setCachedAccessToken(session.access_token);
        getUserProfile(session.user.id).then(setUserProfile);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserProfile(null);
        setCachedAccessToken(null);
        setActiveDataUser(null);
        activeUserIdRef.current = null;
        loadStartedForRef.current = null;
      } else if (event === 'TOKEN_REFRESHED') {
        setCachedAccessToken(session?.access_token || null);
      }
    });

    const params = new URLSearchParams(window.location.search);
    if (params.get("subscription") === "success") {
      const tier = params.get("tier");
      if (tier) setUserProfile(p => ({ ...p, tier }));
      window.history.replaceState({}, "", window.location.pathname);
    }

    // Save to cloud when tab becomes hidden -- only if something actually changed here since
    // the last sync, so simply switching away from a tab that has nothing new doesn't blindly
    // re-push a stale snapshot over top of a fresher save from another device.
    const handleVisibility = () => {
      if (document.visibilityState === "hidden" && isCloudDirty()) {
        // Fire both: sendBeacon is the one that actually survives the tab being suspended or
        // killed a moment later, which is the exact scenario a normal fetch()-based save can't
        // reliably handle on mobile. The regular saveCloudData attempt is kept alongside it for
        // the common case where the tab isn't torn down (just switched away from, still fully
        // alive) -- no reason not to let both try.
        supabase.auth.getUser().then(({data}) => {
          if (data?.user) {
            saveCloudData(data.user.id).catch(()=>{});
            beaconSave(data.user.id);
          }
        });
      }
    };
document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  // pagehide fires specifically when the page is being torn down (closed, navigated away from,
  // or backgrounded in a way the OS may not resume) -- this is the actual moment a beacon needs
  // to fire for the "closed the app" scenario, and it can't wait on an async getUser() lookup the
  // way the visibility handler above does, since the page may not survive long enough for that to
  // resolve. Kept as its own effect (re-registered whenever the signed-in user changes) so it
  // always closes over the current user, without touching the auth-subscription effect above.
  useEffect(() => {
    if (!user) return;
    const handlePageHide = () => {
      if (isCloudDirty()) beaconSave(user.id);
    };
    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, [user]);

  // Real periodic auto-save, matching what the Cloud Sync settings text has always claimed but
  // never actually did -- a genuine safety net for a session left open and idle, independent of
  // the app-switch and page-teardown saves above.
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      if (isCloudDirty()) saveCloudData(user.id).catch(() => {});
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  // Load guest viewer data on startup (no account needed)
  useEffect(() => {
    try {
      const guest = localStorage.getItem("sk_guest_viewer");
      if (guest) {
        const parsed = JSON.parse(guest);
        if (parsed?.ownerUserId) {
          loadCloudData(parsed.ownerUserId).then(loaded => {
            if (loaded) window.dispatchEvent(new Event("sk_cloud_loaded"));
          }).catch(() => {});
        }
      }
    } catch(e) {}
  }, []);

  // Auto-save to cloud every 5 minutes when signed in -- but only if something local actually
  // changed since the last sync. This was the main source of devices fighting each other: an
  // idle device's timer would fire on schedule regardless of whether it had any new data,
  // silently re-pushing its own stale copy over a fresher save another device had just made.
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      if (isCloudDirty()) saveCloudData(user.id).catch(() => {});
    }, 300 * 1000); // Every 5 minutes
    return () => clearInterval(interval);
  }, [user]);

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
    // Flush any unsaved local changes to the cloud BEFORE clearing anything. Clearing local
    // data first (as this used to do) can permanently destroy edits that were never synced --
    // this must never happen again, so a failed save blocks the destructive part of sign-out
    // entirely rather than proceeding anyway.
    if (user) {
      const saved = await saveCloudData(user.id).catch(() => false);
      if (!saved) {
        const proceedAnyway = window.confirm(
          "We couldn't save your latest changes to the cloud (check your connection). " +
          "Signing out now will lose anything not yet saved. Sign out anyway?"
        );
        if (!proceedAnyway) return;
      }
    }
    await supabase.auth.signOut();
    // Clear all locally-cached app data so this account's information can never bleed into
    // whoever signs in next on this same browser/device.
    try{ALL_LOCAL_STORAGE_KEYS.forEach(k=>localStorage.removeItem(k));}catch{}
    setUser(null);
    setUserProfile(null);
    window.location.reload();
  }

  // Admin bypass — always full access
  const isAdmin = user && ADMIN_EMAILS.includes(user.email?.toLowerCase());

  const tier = isAdmin ? "medical" : (userProfile?.tier || "free");
  const trialEndsAt = userProfile?.trial_ends_at || null;
  const inTrial = !isAdmin && trialEndsAt && new Date(trialEndsAt) > new Date();
  const effectiveTier = isAdmin ? "medical" : (inTrial ? "medical" : tier);
  const isActive = isAdmin || userProfile?.subscription_status === "active" || inTrial;
  const daysLeft = trialDaysRemaining(trialEndsAt);

  const can = {
    unlimitedRecipes:    isAdmin || ["solo", "couple", "family", "medical"].includes(effectiveTier),
    sevenDayPlan:        isAdmin || ["solo", "couple", "family", "medical"].includes(effectiveTier),
    busyNightFlag:       isAdmin || ["solo", "couple", "family", "medical"].includes(effectiveTier),
    calendarIntegration: isAdmin || ["solo", "couple", "family", "medical"].includes(effectiveTier),
    multipleProfiles:    isAdmin || ["couple", "family", "medical"].includes(effectiveTier),
    familyRecipes:       isAdmin || ["solo", "couple", "family", "medical"].includes(effectiveTier),
    printRecipe:         isAdmin || ["solo", "couple", "family", "medical"].includes(effectiveTier),
    wildHarvest:         isAdmin || ["family", "medical"].includes(effectiveTier),
    homeHarvest:         isAdmin || ["family", "medical"].includes(effectiveTier),
    adaptiveLearning:    isAdmin || ["solo", "couple", "family", "medical"].includes(effectiveTier),
    medicalCompliance:   isAdmin || effectiveTier === "medical",
    temporaryDiets:      isAdmin || effectiveTier === "medical",
    cloudSync:           isAdmin || ["solo", "couple", "family", "medical"].includes(effectiveTier),
    // Separate a-la-carte add-on -- independent of tier, purchasable by any tier including free.
    // Included during the 30-day trial too (trial unlocks everything, same as effectiveTier="medical"
    // does for tier-gated features) -- since this isn't part of the tier system, it needs its own
    // explicit inTrial check to behave consistently with the rest of the trial experience.
    smarterWayToShop:    isAdmin || inTrial || !!userProfile?.smarter_way_to_shop_addon,
  };

  const tierLabel = isAdmin
    ? "Admin"
    : inTrial
      ? "Full Access (30-Day Trial)"
      : effectiveTier.charAt(0).toUpperCase() + effectiveTier.slice(1);

  function handleUpgrade() {
    setShowTouchpoint(false);
    if (!user) { setAuthMode("signup"); setShowAuthModal(true); }
    else setShowSubModal(true);
  }

  function dismissSplash(nextAction) {
    try { localStorage.setItem("sk_seenSplash", "1"); } catch {}
    setShowSplash(false);
    if (nextAction) nextAction();
  }

  // First-visit gate: a signed-out visitor who hasn't seen this yet gets ONLY the splash --
  // nothing else in the tree below (App, the sign-in button, any modal) renders until they
  // click through. A signed-in user, or anyone who's already dismissed it on this device, skips
  // straight past this and sees the app exactly as before.
  if (showSplash && !authReady) {
    // Session check still in flight -- hold on a blank brand-colored screen rather than flashing
    // either the app or the splash at someone who may turn out to be signed in.
    return <div style={{ position: "fixed", inset: 0, background: "#1B3D2F" }} />;
  }
  if (!user && showSplash) {
    return (
      <WelcomeSplash
        onGetStarted={() => dismissSplash(() => {
          // A new visitor lands on the app's own setup wizard, whose first step is a welcome +
          // "Create Free Account" that leads into the trial signup form -- the better path: it
          // echoes the address the confirmation went to (catches typos), reminds them to check
          // spam, sets the trial metadata, and sends the welcome email. Only fall back to the
          // generic sign-up modal if that wizard has already been completed on this device
          // (so it won't appear and the visitor would otherwise have no obvious way to sign up).
          let wizardWillShow = true;
          try { wizardWillShow = localStorage.getItem("sk_setupDone") !== "1"; } catch {}
          if (!wizardWillShow) { setAuthMode("signup"); setShowAuthModal(true); }
        })}
        onSignIn={() => dismissSplash(() => { setAuthMode("signin"); setShowAuthModal(true); })}
      />
    );
  }

  return (
    <>
      {/* Auth / trial bar */}
      <div style={{
        position: "fixed", top: seniorBannerActive ? 54 : 0, right: 0, zIndex: 999,
        display: "flex", alignItems: "center", gap: "4px", padding: "4px 6px",
        maxWidth: "200px", flexWrap: "nowrap", overflow: "hidden",
      }}>
        {user ? (
          <>
            <span style={{
              fontSize: "9px", color: "#888", whiteSpace: "nowrap", overflow: "hidden", maxWidth: "60px", textOverflow: "ellipsis", display: "none",
              background: document.body.classList.contains("sk-dark") ? "#24523F" : "#f0f0f0", padding: "3px 6px",
              borderRadius: "10px", border: document.body.classList.contains("sk-dark") ? "1px solid #2f6a52" : "1px solid #ccc"
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
            <button onClick={() => setShowSignOutConfirm(true)} style={{
              fontSize: "11px", padding: "4px 8px", borderRadius: "10px",
              border: "1px solid #444", background: "transparent",
              color: "#888", cursor: "pointer"
            }}>Sign Out</button>
          </>
        ) : (
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <AccessibilityToggles />
            <button onClick={() => { setAuthMode("signin"); setShowAuthModal(true); }} style={{
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
        viewerRole={viewerRole}
        isAdmin={isAdmin}
        onShowGuestViewer={() => { setShowAuthModal(false); setShowGuestViewer(true); }}
      />

      {showSignOutConfirm && (
        <div
          style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:4000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
          onClick={() => setShowSignOutConfirm(false)}
        >
          <div
            style={{background:"var(--sk-card)",border:"1px solid var(--sk-border)",borderRadius:16,padding:"24px 22px",maxWidth:340,width:"100%",textAlign:"center",boxShadow:"0 10px 36px rgba(0,0,0,0.5)"}}
            onClick={e => e.stopPropagation()}
          >
            <div style={{fontFamily:"'Cormorant Garamond', serif",fontSize:24,fontWeight:700,color:"var(--sk-text)",marginBottom:8}}>Sign out?</div>
            <div style={{fontFamily:"'DM Sans', sans-serif",fontSize:14,color:"var(--sk-muted)",lineHeight:1.5,marginBottom:20}}>
              Your latest changes are saved to the cloud first, so nothing is lost. You'll need to sign in again to come back.
            </div>
            <div style={{display:"flex",gap:10}}>
              <button
                onClick={() => setShowSignOutConfirm(false)}
                style={{flex:1,padding:"14px",borderRadius:10,border:"none",background:"#c8963e",color:"#10261c",fontSize:16,fontWeight:700,cursor:"pointer"}}
              >Cancel</button>
              <button
                onClick={() => { setShowSignOutConfirm(false); handleSignOut(); }}
                style={{flex:1,padding:"14px",borderRadius:10,border:"1px solid var(--sk-border-light)",background:"transparent",color:"var(--sk-text)",fontSize:16,fontWeight:600,cursor:"pointer"}}
              >Sign Out</button>
            </div>
          </div>
        </div>
      )}

      {/* Touchpoint pop-up */}
      {showTouchpoint && inTrial && (
        <TouchpointModal
          daysLeft={daysLeft}
          onUpgrade={handleUpgrade}
          onDismiss={() => setShowTouchpoint(false)}
        />
      )}

      {showGuestViewer && (
        <GuestViewerModal
          onClose={() => setShowGuestViewer(false)}
          onJoined={(ownerUserId) => {
            setShowGuestViewer(false);
            // Store guest session in localStorage
            localStorage.setItem("sk_guest_viewer", JSON.stringify({ ownerUserId, joined: Date.now() }));
            window.location.reload();
          }}
        />
      )}
      {showAuthModal && (
        <AuthModal
          initialMode={authMode}
          onClose={() => setShowAuthModal(false)}
          onShowGuestViewer={() => { setShowAuthModal(false); setShowGuestViewer(true); }}
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
          currentTier={inTrial ? null : effectiveTier}
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

