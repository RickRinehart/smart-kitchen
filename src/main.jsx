// Smart Kitchen App v2.2 - May 2026
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import AuthModal from "./AuthModal";
import SubscriptionModal from "./SubscriptionModal";
import { supabase, getUserProfile } from "./supabaseClient";
import "./index.css";

function Root() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
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

    // Handle return from Stripe checkout
    const params = new URLSearchParams(window.location.search);
    if (params.get("subscription") === "success") {
      const tier = params.get("tier");
      if (tier) setUserProfile(p => ({ ...p, tier }));
      window.history.replaceState({}, "", window.location.pathname);
    }

    return () => subscription.unsubscribe();
  }, []);

  function handleSignUp() {
    setAuthMode("signup");
    setShowAuthModal(true);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
  }

  const tier = userProfile?.tier || "free";
  const trialEndsAt = userProfile?.trial_ends_at || null;
  const inTrial = trialEndsAt && new Date(trialEndsAt) > new Date();
  const effectiveTier = inTrial ? (tier || "family") : tier;
  const isActive = userProfile?.subscription_status === "active" || inTrial;

  // Feature gates passed into App
  const can = {
    unlimitedRecipes:    ["solo", "family", "medical"].includes(effectiveTier),
    sevenDayPlan:        ["solo", "family", "medical"].includes(effectiveTier),
    busyNightFlag:       ["solo", "family", "medical"].includes(effectiveTier),
    calendarIntegration: ["solo", "family", "medical"].includes(effectiveTier),
    multipleProfiles:    ["family", "medical"].includes(effectiveTier),
    medicalCompliance:   effectiveTier === "medical",
    temporaryDiets:      effectiveTier === "medical",
  };

  const tierLabel = inTrial
    ? effectiveTier.charAt(0).toUpperCase() + effectiveTier.slice(1) + " (Trial)"
    : effectiveTier.charAt(0).toUpperCase() + effectiveTier.slice(1);

  return (
    <>
      {/* Auth bar */}
      <div style={{
        position: "fixed", top: 0, right: "max(12px, calc((100vw - 1140px) / 2))", zIndex: 999,
        display: "flex", alignItems: "center", gap: "8px",
        padding: "6px 12px",
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
            {!isActive && effectiveTier === "free" && (
              <button onClick={() => setShowSubModal(true)} style={{
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
          <button onClick={handleSignUp} style={{
            fontSize: "12px", padding: "5px 14px", borderRadius: "12px",
            border: "none", background: "#c8963e", color: "#fff",
            cursor: "pointer", fontWeight: "700"
          }}>Sign In</button>
        )}
      </div>

      {/* Main app — tier and gates passed as props */}
      <App
        tier={effectiveTier}
        can={can}
        onUpgrade={() => {
          if (!user) {
            setAuthMode("signup");
            setShowAuthModal(true);
          } else {
            setShowSubModal(true);
          }
        }}
      />

      {/* Modals */}
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
