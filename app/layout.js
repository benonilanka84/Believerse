// app/layout.jsx
import "@/styles/globals.css";
import ProfileAvatar from "@/components/ProfileAvatar";
import { useEffect, useState } from "react";

export const metadata = {
  title: "The Believerse",
  description: "One Family in Christ",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div id="root-layout">
          <Header />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}

function Header() {
  // simple header - keep transparent so background shines through
  return (
    <header style={{ position: "fixed", top: 8, right: 16, zIndex: 1200 }}>
      <ProfileAvatar />
    </header>
  );
}
