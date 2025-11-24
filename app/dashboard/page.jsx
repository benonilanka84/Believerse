"use client";

import ProfileAvatar from "@/components/ProfileAvatar";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const user = supabase.auth.getUser(); // simplified, assuming logged in

  return (
    <div>
      {/* Avatar on Right */}
      <div style={{ position: "absolute", top: 20, right: 20 }}>
        <ProfileAvatar user={user?.data?.user} />
      </div>

      {/* Existing dashboard content stays EXACTLY AS YOU HAD IT */}
      <div className="dashboard-container">
        {/* Verse of the Day Section (You will later supply images/text) */}
        <section className="verse-section">
          <h2>Verse of the Day</h2>
          <p>Coming soon — share verses to WhatsApp & more.</p>
        </section>

        {/* All your existing sections remain untouched */}
      </div>
    </div>
  );
}
