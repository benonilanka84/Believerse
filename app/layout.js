// /app/layout.js
import "@/styles/globals.css";
import dynamic from "next/dynamic";
import React from "react";

const ProfileAvatar = dynamic(() => import("@/components/ProfileAvatar"), { ssr: false });

export const metadata = {
  title: "The Believerse",
  description: "The Believerse - community",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000 }}>
          <div style={{ display: "flex", justifyContent: "flex-end", padding: 18 }}>
            <ProfileAvatar />
          </div>
        </header>

        <main style={{ paddingTop: 84 }}>{children}</main>
      </body>
    </html>
  );
}
