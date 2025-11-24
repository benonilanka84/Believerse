"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ProfileAvatar({ user }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Generate initials like "BL"
  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0].toUpperCase())
        .join("")
    : "U";

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/"); // redirect to sign-in page
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Avatar Circle */}
      <div
        onClick={() => setOpen(!open)}
        style={styles.avatar}
      >
        {initials}
      </div>

      {open && (
        <div style={styles.dropdown}>
          <button style={styles.item} onClick={() => router.push("/profile")}>
            Edit Profile
          </button>

          <button style={styles.item} onClick={() => router.push("/settings")}>
            Settings
          </button>

          <button style={styles.item} onClick={() => router.push("/terms")}>
            Terms & Conditions
          </button>

          <hr style={{ margin: "8px 0", opacity: 0.4 }} />

          <button style={styles.logout} onClick={handleLogout}>
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  avatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "#0b2e4a",
    color: "white",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    fontWeight: "700",
    userSelect: "none",
    fontSize: "16px",
  },
  dropdown: {
    position: "absolute",
    right: 0,
    marginTop: "8px",
    background: "white",
    borderRadius: "10px",
    padding: "8px",
    width: "180px",
    boxShadow: "0 8px 25px rgba(0,0,0,0.18)",
    zIndex: 20,
  },
  item: {
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "10px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
  },
  logout: {
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "10px",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#b22",
    fontWeight: "600",
    fontSize: "14px",
  },
};
