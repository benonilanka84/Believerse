'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function HomePage() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    const check = async () => {
      const { data, error } = await supabase.from("profiles").select("*")

      if (error) {
        setMessage("Connected to Supabase, but no data found.");
      } else {
        setMessage("Welcome to The Believerse! Supabase Connected ✔");
      }
    };

    check();
  }, []);

  return (
    <main style={{ textAlign: "center", paddingTop: "50px" }}>
      <h1 style={{ fontSize: "32px" }}>The Believerse</h1>
      <p style={{ fontSize: "18px", marginTop: "10px" }}>{message}</p>

      <a href="/signup" 
        style={{
          display: "inline-block",
          marginTop: "20px",
          padding: "10px 20px",
          background: "#333",
          color: "#fff",
          borderRadius: "8px",
          textDecoration: "none",
        }}>
        Create New Account
      </a>
    </main>
  );
}
