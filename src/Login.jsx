/**
 * Login.jsx — inlogscherm (e-mail + wachtwoord)
 *
 * Accounts maak je aan in de Firebase-console (Authentication → Users).
 * De app biedt geen zelf-registratie; alleen inloggen en wachtwoord resetten.
 */

import { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "./firebase";
import { CalendarDays, LogIn, Loader2, AlertCircle, MailCheck } from "lucide-react";

const C = {
  brand:"#1d4ed8", brandDk:"#1e3a8a", ink:"#0f172a", sub:"#475569",
  mute:"#94a3b8", line:"#e2e8f0", panel:"#f8fafc", err:"#dc2626", ok:"#16a34a",
};

const ERR_NL = {
  "auth/invalid-email": "Ongeldig e-mailadres.",
  "auth/invalid-credential": "E-mailadres of wachtwoord onjuist.",
  "auth/user-not-found": "Geen account met dit e-mailadres.",
  "auth/wrong-password": "Wachtwoord onjuist.",
  "auth/too-many-requests": "Te veel pogingen. Probeer het later opnieuw.",
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [pw, setPw]       = useState("");
  const [busy, setBusy]   = useState(false);
  const [err, setErr]     = useState("");
  const [info, setInfo]   = useState("");

  const submit = async () => {
    setErr(""); setInfo("");
    if (!email || !pw) { setErr("Vul e-mail en wachtwoord in."); return; }
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pw);
      // onAuthStateChanged in App.jsx pikt de rest op
    } catch (e) {
      setErr(ERR_NL[e.code] || "Inloggen mislukt. Controleer je gegevens.");
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    setErr(""); setInfo("");
    if (!email) { setErr("Vul eerst je e-mailadres in om te resetten."); return; }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfo("Reset-mail verstuurd. Check je inbox.");
    } catch (e) {
      setErr(ERR_NL[e.code] || "Kon geen reset-mail versturen.");
    }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
                  background:`linear-gradient(135deg, ${C.brand} 0%, ${C.brandDk} 100%)`,
                  fontFamily:"ui-sans-serif, system-ui, sans-serif", padding:16 }}>
      <div style={{ width:"100%", maxWidth:380, background:"#fff", borderRadius:16,
                    boxShadow:"0 24px 60px rgba(0,0,0,0.25)", overflow:"hidden" }}>
        {/* kop */}
        <div style={{ padding:"28px 28px 18px", textAlign:"center" }}>
          <div style={{ display:"inline-flex", alignItems:"center", justifyContent:"center",
                        width:54, height:54, borderRadius:14, background:C.brand, marginBottom:12 }}>
            <CalendarDays size={26} color="#fff"/>
          </div>
          <h1 style={{ fontSize:20, fontWeight:800, color:C.ink, margin:0 }}>AfdelingsPlan</h1>
          <p style={{ fontSize:13, color:C.mute, marginTop:4 }}>Log in om verder te gaan</p>
        </div>

        {/* formulier */}
        <div style={{ padding:"0 28px 24px", display:"flex", flexDirection:"column", gap:12 }}>
          <div>
            <label style={lbl}>E-mailadres</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&submit()} autoComplete="username"
              placeholder="naam@ziekenhuis.nl" style={inp}/>
          </div>
          <div>
            <label style={lbl}>Wachtwoord</label>
            <input type="password" value={pw} onChange={e=>setPw(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&submit()} autoComplete="current-password"
              placeholder="••••••••" style={inp}/>
          </div>

          {err && (
            <div style={{ display:"flex", alignItems:"center", gap:6, color:C.err, fontSize:12.5 }}>
              <AlertCircle size={14}/> {err}
            </div>
          )}
          {info && (
            <div style={{ display:"flex", alignItems:"center", gap:6, color:C.ok, fontSize:12.5 }}>
              <MailCheck size={14}/> {info}
            </div>
          )}

          <button onClick={submit} disabled={busy}
            style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8,
                     background:C.brand, color:"#fff", border:"none", borderRadius:9,
                     padding:"11px 16px", fontSize:14, fontWeight:700, cursor:"pointer",
                     opacity: busy ? .7 : 1, marginTop:4 }}>
            {busy ? <Loader2 size={16}/> : <LogIn size={16}/>}
            Inloggen
          </button>

          <button onClick={reset}
            style={{ background:"none", border:"none", color:C.sub, fontSize:12,
                     cursor:"pointer", marginTop:2 }}>
            Wachtwoord vergeten?
          </button>
        </div>
      </div>
    </div>
  );
}

const lbl = { display:"block", fontSize:12, fontWeight:600, color:C.sub, marginBottom:5 };
const inp = { width:"100%", borderRadius:9, border:`1px solid ${C.line}`, padding:"10px 12px",
              fontSize:14, boxSizing:"border-box", background:C.panel };
