"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/supabase";
import ProfileAvatar from "@/components/ProfileAvatar";

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUserEmail(data.user.email);
      else window.location.href = "/";
    });
  }, []);

  return (
    <div className="dashboard-page">

      {/* Avatar only on Dashboard */}
      <div className="top-right">
        <ProfileAvatar />
      </div>

      <h2>Welcome, {userEmail}</h2>

      <p className="verse">
        “The Lord is my shepherd; I shall not want.” — Psalm 23:1
      </p>

      {/* Your dashboard features stay the same */}
    </div>
  );
}
