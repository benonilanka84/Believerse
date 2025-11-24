// components/Header.jsx
"use client";

import ProfileAvatar from "@/components/ProfileAvatar";

export default function Header() {
  return (
    <header
      style={{
        position: "fixed",
        top: 8,
        right: 16,
        zIndex: 999,
        background: "transparent",
      }}
    >
      <ProfileAvatar />
    </header>
  );
}
