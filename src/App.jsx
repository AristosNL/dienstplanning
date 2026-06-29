import { useState, useEffect } from "react";
import {
  Users, Settings, CalendarRange, Clock, LayoutDashboard,
  Cloud, CloudOff, Loader2, LogOut, CalendarDays,
} from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { AppProvider, useApp } from "./AppContext";
import { auth, firebaseReady } from "./firebase";
import T from "./tokens";
import Login from "./Login";
import Personeel from "./Personeel";
import DienstPlanning from "./DienstPlanning";
import DagPlanning from "./DagPlanning";
import Urencheck from "./Urencheck";
import Dashboard from "./Dashboard";
import Admin from "./Admin";

/* Planning tabs (dagelijks gebruik) */
const NAV_MAIN = [
  { id:"dag",       label:"Dagplanning",    Icon:CalendarRange },
  { id:"dienst",    label:"Dienstplanning", Icon:CalendarDays  },
  { id:"dashboard", label:"Dashboard",      Icon:LayoutDashboard },
  { id:"uren",      label:"Urencheck",      Icon:Clock },
];
/* Beheer tabs (minder frequent) */
const NAV_ADMIN = [
  { id:"personeel", label:"Personeel", Icon:Users    },
  { id:"admin",     label:"Beheer",    Icon:Settings },
];

function CloudBadge() {
  const { cloud, loaded } = useApp();
  const map = {
    verbonden: { Icon:Cloud,    txt:"Opgeslagen", col:"#86efac" },
    verbinden: { Icon:Loader2,  txt:"Verbinden…", col:"#b07bba" },
    fout:      { Icon:CloudOff, txt:"Cloud-fout", col:"#fca5a5" },
    lokaal:    { Icon:CloudOff, txt:"Lokaal",      col:T.sidebarMute },
  };
  const s = map[cloud] || map.lokaal;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:6,
                   color:s.col, fontSize:T.szXxs, fontWeight:600 }}>
      <s.Icon size={12}/> {loaded ? s.txt : "Laden…"}
    </span>
  );
}

function SidebarItem({ item, active, onClick, muted }) {
  const { Icon, label } = item;
  return (
    <button onClick={onClick}
      style={{
        display:"flex", alignItems:"center", gap:10,
        width:"100%", padding:"10px 14px", margin:"1px 0",
        background: active ? T.sidebarActive : "transparent",
        color: active ? "#fff" : muted ? T.sidebarMute : T.sidebarItem,
        borderLeft: active ? `3px solid ${T.sidebarAccent}` : "3px solid transparent",
        border:"none", borderRadius:0, cursor:"pointer",
        fontSize:T.szSm, fontWeight: active ? 600 : 400,
        textAlign:"left", transition:"background .12s",
      }}>
      <Icon size={16} style={{ flexShrink:0 }}/>
      {label}
    </button>
  );
}

function Shell({ user }) {
  const [page, setPage] = useState("dag");

  return (
    <div style={{ display:"flex", minHeight:"100vh",
                  fontFamily:T.fontBody, background:T.panel }}>

      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <nav style={{ width:200, flexShrink:0, background:T.sidebarBg,
                    display:"flex", flexDirection:"column",
                    position:"sticky", top:0, height:"100vh" }}>

        {/* Logo */}
        <div style={{ padding:"18px 16px 14px",
                      borderBottom:`1px solid ${T.sidebarBd}` }}>
          <div style={{ fontSize:13, fontWeight:700, color:"#e9d5ef",
                        letterSpacing:.3 }}>AfdelingsPlan</div>
          <div style={{ fontSize:T.szXxs, color:T.sidebarMute, marginTop:2 }}>
            SKB Winterswijk
          </div>
        </div>

        {/* Planning navigatie */}
        <div style={{ padding:"10px 0", flex:1 }}>
          {NAV_MAIN.map(item => (
            <SidebarItem key={item.id} item={item}
              active={page===item.id} onClick={() => setPage(item.id)}/>
          ))}

          {/* Separator */}
          <div style={{ height:1, background:T.sidebarBd, margin:"10px 14px" }}/>

          {/* Beheer navigatie */}
          {NAV_ADMIN.map(item => (
            <SidebarItem key={item.id} item={item}
              active={page===item.id} onClick={() => setPage(item.id)} muted/>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding:"12px 14px", borderTop:`1px solid ${T.sidebarBd}`,
                      display:"flex", flexDirection:"column", gap:8 }}>
          <CloudBadge/>
          {user && (
            <>
              <div style={{ fontSize:T.szXxs, color:T.sidebarMute,
                            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {user.email}
              </div>
              <button onClick={() => signOut(auth)}
                style={{ display:"inline-flex", alignItems:"center", gap:6,
                         background:"transparent", border:`1px solid ${T.sidebarBd}`,
                         color:T.sidebarItem, borderRadius:T.radius,
                         padding:"5px 10px", fontSize:T.szXxs, fontWeight:500,
                         cursor:"pointer", width:"100%" }}>
                <LogOut size={12}/> Uitloggen
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── MAIN CONTENT ────────────────────────────────────── */}
      <div style={{ flex:1, overflow:"auto", minWidth:0 }}>
        {page==="dashboard" && <Dashboard/>}
        {page==="dag"       && <DagPlanning/>}
        {page==="dienst"    && <DienstPlanning/>}
        {page==="uren"      && <Urencheck/>}
        {page==="personeel" && <Personeel/>}
        {page==="admin"     && <Admin/>}
      </div>
    </div>
  );
}

function Splash() {
  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center",
                  justifyContent:"center", background:T.sidebarBg }}>
      <Loader2 size={28} color={T.brandMid}/>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    if (!firebaseReady) { setUser(null); return; }
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return unsub;
  }, []);

  if (!firebaseReady) return <AppProvider><Shell user={null}/></AppProvider>;
  if (user === undefined) return <Splash/>;
  if (!user) return <Login/>;
  return <AppProvider><Shell user={user}/></AppProvider>;
}
