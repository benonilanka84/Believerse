import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Admin client to bypass RLS and handle Auth deletion
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { userId, email, full_name } = await req.json();

    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 1. Trigger the Deletion Email FIRST while we still have the user's data
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/emails/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, full_name })
      });
    } catch (emailErr) {
      console.error("Graceful exit email failed to send, proceeding with deletion:", emailErr);
    }

    // 2. Delete User Profile from 'profiles' table
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) throw profileError;

    // 3. Delete User from Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (authError) throw authError;

    return NextResponse.json({ message: "Account successfully closed with grace." });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}