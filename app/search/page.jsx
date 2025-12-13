"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState({ profiles: [], posts: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (query) performSearch();
  }, [query]);

  async function performSearch() {
    setLoading(true);
    
    // 1. Search People (Name or Church)
    const { data: people } = await supabase
      .from("profiles")
      .select("*")
      .or(`full_name.ilike.%${query}%,church.ilike.%${query}%`)
      .limit(5);

    // 2. Search Posts (Content or Title)
    const { data: posts } = await supabase
      .from("posts")
      .select("*, profiles(full_name)")
      .or(`content.ilike.%${query}%,title.ilike.%${query}%`)
      .limit(10);

    setResults({ profiles: people || [], posts: posts || [] });
    setLoading(false);
  }

  return (
    <div style={{ padding: "30px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ color: "#0b2e4a" }}>Results for "{query}"</h1>
      
      {loading ? <p>Searching the Believerse...</p> : (
        <>
          {/* PEOPLE RESULTS */}
          {results.profiles.length > 0 && (
            <div style={{ marginBottom: "30px" }}>
              <h3 style={{ borderBottom: "1px solid #ddd", paddingBottom: "10px", color: "#2e8b57" }}>👥 Believers</h3>
              <div style={{ display: "grid", gap: "10px" }}>
                {results.profiles.map(p => (
                  <Link key={p.id} href={`/chat?uid=${p.id}`} style={{ textDecoration: 'none', display: "flex", alignItems: "center", gap: "15px", padding: "15px", background: "white", borderRadius: "8px", border: "1px solid #eee" }}>
                    <img src={p.avatar_url || "/images/default-avatar.png"} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />
                    <div>
                      <div style={{ fontWeight: "bold", color: "#333" }}>{p.full_name}</div>
                      <div style={{ fontSize: "12px", color: "#666" }}>{p.church || "No Church listed"}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* POST RESULTS */}
          {results.posts.length > 0 && (
            <div>
              <h3 style={{ borderBottom: "1px solid #ddd", paddingBottom: "10px", color: "#d4af37" }}>📝 Posts</h3>
              <div style={{ display: "grid", gap: "15px" }}>
                {results.posts.map(p => (
                  <div key={p.id} style={{ padding: "20px", background: "white", borderRadius: "12px", border: "1px solid #eee" }}>
                    <div style={{ fontSize: "12px", color: "#2e8b57", fontWeight: "bold", marginBottom: "5px" }}>
                      {p.profiles?.full_name} • {p.type}
                    </div>
                    {p.title && <div style={{ fontWeight: "bold", marginBottom: "5px", color: "#0b2e4a" }}>{p.title}</div>}
                    <div style={{ color: "#555" }}>{p.content}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.profiles.length === 0 && results.posts.length === 0 && (
            <p style={{ color: "#666", marginTop: "20px" }}>No results found. Try a different keyword.</p>
          )}
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{padding:50, textAlign:'center'}}>Loading Search...</div>}>
      <SearchContent />
    </Suspense>
  );
}