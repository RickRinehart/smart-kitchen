// Smart Kitchen App v2.1 - April 26 2026
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
    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        getUserProfile(session.user.id).then(setUserProfile);
      }
      setAuthReady(true);
    });

    // Listen for auth changes
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

  function handleSignIn() {
    setAuthMode("signin");
    setShowAuthModal(true);
  }

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
  const isActive = userProfile?.subscription_status === "active";

  return (
    <>
      {/* Auth bar - shown above the app */}
      <div style={{
        position: "fixed", top: 0, right: "max(0px, calc((100vw - 1200px) / 2))", zIndex: 999,
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
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </span>
            {!isActive && tier === "free" && (
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

      {/* Main app */}
      <App />

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
          currentTier={tier}
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
