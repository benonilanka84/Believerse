"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [identifier, setIdentifier] = useState(""); // Can be email OR username
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    setMsg("");

    let emailToUse = identifier;

    // Req #3: Username Login Logic
    if (!identifier.includes("@")) {
      // It's likely a username, fetch the email first
      const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', identifier)
        .single();
      
      if (error || !data) {
        setMsg("Username not found.");
        setLoading(false);
        return;
      }
      emailToUse = data.email;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password: password,
    });

    if (error) {
      setMsg(error.message);
    } else {
      router.push("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div style={{minHeight:"100vh", display:"flex", background:"url('/images/cross-bg.jpg') center/cover no-repeat", position:"relative"}}>
      <div style={{position:"absolute", inset:0, background:"rgba(0,0,0,0.4)"}} />
      
      <div style={{position:"relative", zIndex:1, width:"100%", maxWidth:"1400px", margin:"0 auto", padding:"40px", display:"grid", gridTemplateColumns:"1fr 480px", gap:"60px", alignItems:"center"}}>
        
        {/* Req #1: Moved Verse/Title UP */}
        <div style={{color:"white", textAlign:"center", marginTop:"-50px"}}>
          <div style={{fontSize:"18px", fontStyle:"italic", marginBottom:"20px"}}>
            "I can do all things through Christ..." — Phil 4:13
          </div>
          <h1 style={{fontSize:"72px", fontWeight:"800", margin:0, lineHeight:1}}>
            The <span style={{color:"#d4af37"}}>B</span>elievers<span style={{color:"#2e8b57"}}>e</span>
          </h1>
          <div style={{fontSize:"24px", marginTop:"10px"}}>One Family in Christ.</div>
        </div>

        {/* Login Form */}
        <div style={{background:"rgba(255,255,255,0.98)", borderRadius:"24px", padding:"40px"}}>
          <h2 style={{textAlign:"center", color:"#0b2e4a"}}>Welcome Back</h2>
          
          <div style={{marginBottom:"15px"}}>
            <label style={{display:"block", fontSize:"14px", fontWeight:"600"}}>Email or Username</label>
            <input type="text" value={identifier} onChange={e => setIdentifier(e.target.value)} style={{width:"100%", padding:"12px", borderRadius:"8px", border:"1px solid #ccc"}} placeholder="email@example.com or username" />
          </div>

          <div style={{marginBottom:"20px"}}>
            <label style={{display:"block", fontSize:"14px", fontWeight:"600"}}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{width:"100%", padding:"12px", borderRadius:"8px", border:"1px solid #ccc"}} />
          </div>

          <button onClick={handleLogin} disabled={loading} style={{width:"100%", padding:"14px", background:"#2e8b57", color:"white", border:"none", borderRadius:"12px", fontWeight:"bold", cursor:"pointer"}}>
            {loading ? "Signing in..." : "Sign In"}
          </button>

          {/* Social Auth Placeholders (Req #2) */}
          <div style={{textAlign:'center', marginTop:'20px'}}>
            <p style={{fontSize:'12px', color:'#666'}}>Or sign in with</p>
            <div style={{display:'flex', gap:'10px', justifyContent:'center'}}>
              <button style={{padding:'10px 20px', border:'1px solid #ddd', background:'white', borderRadius:'8px', cursor:'pointer'}}>Google</button>
              <button style={{padding:'10px 20px', border:'1px solid #ddd', background:'white', borderRadius:'8px', cursor:'pointer'}}>Microsoft</button>
            </div>
          </div>

          {msg && <p style={{color:'red', textAlign:'center', marginTop:'10px'}}>{msg}</p>}
          
          <div style={{textAlign:"center", marginTop:"20px"}}>
            <Link href="/signup" style={{color:"#2d6be3", fontWeight:"bold"}}>Create New Account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}