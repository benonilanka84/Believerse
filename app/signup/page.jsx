"use client";
import { useState } from "react";
import "@/styles/globals.css";
import { supabase } from "@/lib/supabaseClient";

export default function SignupPage() {
  const [loading, setLoading] = useState(false);

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.target);
    const first = form.get("first_name");
    const last = form.get("last_name");
    const username = form.get("username");
    const email = form.get("email");
    const password = form.get("password");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first, last, username },
      },
    });

    setLoading(false);
    if (error) alert(error.message);
    else alert("Account created! Please check your email.");
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center"
      style={{ backgroundImage: "url('/cross-bg.jpg')" }}
    >
      <form
        onSubmit={handleSignup}
        className="bg-white/20 backdrop-blur-md p-8 rounded-xl w-full max-w-md text-white"
      >
        <h2 className="text-3xl font-bold mb-4">Create a new account</h2>

        <div className="grid grid-cols-2 gap-3">
          <input name="first_name" placeholder="First name" className="input" required />
          <input name="last_name" placeholder="Last name" className="input" required />
        </div>

        <input name="username" placeholder="Choose a username" className="input mt-3" required />
        <input name="email" placeholder="Email address" className="input mt-3" required />
        <input name="password" type="password" className="input mt-3" placeholder="New password (min 8 chars)" required />

        <div className="mt-3 space-y-2 text-sm">
          <label><input type="checkbox" required /> I agree to The Believerse Terms & Conditions.</label>
          <label><input type="checkbox" required /> I will only post Christian content.</label>
        </div>

        <button
          type="submit"
          className="bg-green-600 w-full py-2 rounded-md mt-4 hover:bg-green-700 font-semibold"
        >
          {loading ? "Signing up…" : "Sign Up"}
        </button>

        <p className="mt-3 text-sm">
          Already have an account? <a href="/signin" className="underline">Sign in</a>
        </p>
      </form>
    </div>
  );
}
