"use client";
import Link from "next/link";
import "@/styles/globals.css";

export default function HomePage() {
  return (
    <div
      className="min-h-screen bg-cover bg-center flex flex-col items-center justify-center text-white"
      style={{ backgroundImage: "url('/cross-bg.jpg')" }}
    >
      {/* Header */}
      <h1 className="text-5xl font-extrabold tracking-wide text-center drop-shadow-lg">
        The{" "}
        <span className="text-[#d4af37]">B</span>
        elievers
        <span className="text-[#2e8b57]">e</span>
      </h1>

      <p className="text-lg mt-3 drop-shadow-lg">
        Welcome to The Believerse! Supabase Connected ✓
      </p>

      {/* Buttons */}
      <div className="mt-8 flex flex-col space-y-4">
        <Link
          href="/signup"
          className="bg-black/70 px-8 py-3 rounded-md text-white hover:bg-black/90 text-center"
        >
          Create New Account
        </Link>

        <Link
          href="/signin"
          className="bg-white/80 text-black px-8 py-3 rounded-md hover:bg-white text-center"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
