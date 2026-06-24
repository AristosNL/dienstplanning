import { useState, useEffect } from "react";
import {
  Users, CalendarDays, Settings, CalendarRange, Clock, LayoutDashboard,
  Cloud, CloudOff, Loader2, LogOut,
} from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { AppProvider, useApp } from "./AppContext";
import { auth, firebaseReady } from "./firebase";
import Login from "./Login";
import Personeel from "./Personeel";
import DienstPlanning from "./DienstPlanning";
import DagPlanning from "./DagPlanning";
import Urencheck from "./Urencheck";
import Dashboard from "./Dashboard";
import Admin from "./Admin";

const NAV = [
  { id: "dashboard", label: "Dashboard",     Icon: LayoutDashboard },
  { id: "dag",       label: "Dagplanning",    Icon: CalendarRange },
  { id: "dienst",    label: "Dienstplanning", Icon: CalendarDays },
  { id: "uren",      label: "Urencheck",      Icon: Clock },
  { id: "personeel", label: "Personeel",      Icon: Users },
  { id: "admin",     label: "Beheer",         Icon: Settings },
];

const C = { brandDk: "#1e3a8a", brand: "#1d4ed8" };

function CloudBadge() {
  const { cloud, loaded } = useApp();
  const map = {
    verbonden: { Icon: Cloud,    txt: "Opgeslagen", col: "#86efac" },
    verbinden: { Icon: Loader2,  txt: "Verbinden…", col: "#93c5fd" },
    fout:      { Icon: CloudOff, txt: "Cloud-fout", col: "#fca5a5" },
    lokaal:    { Icon: CloudOff, txt: "Lokaal",     col: "#cbd5e1" },
  };
  const s = map[cloud] || map.lokaal;
  return (
    <span title={s.txt} style={{ display:"inline-flex", alignItems:"center", gap:6,
                                 color:s.col, fontSize:11.5, fontWeight:600 }}>
      <s.Icon size={13}/> {loaded ? s.txt : "Laden…"}
    </span>
  );
}

function Shell({ user }) {
  const [page, setPage] = useState("dashboard");

  return (
    <div style={{ display:"flex", flexDirection:"column", minHeight:"100vh",
                  fontFamily:"ui-sans-serif, system-ui, sans-serif" }}>
      <nav style={{ background:C.brandDk, display:"flex", alignItems:"center",
                    gap:4, padding:"0 16px", minHeight:44, flexShrink:0, flexWrap:"wrap" }}>
        <span style={{ color:"#93c5fd", fontSize:12, fontWeight:700,
                       letterSpacing:1, marginRight:12, textTransform:"uppercase" }}>
          AfdelingsPlan
        </span>
        {NAV.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setPage(id)}
            style={{
              display:"inline-flex", alignItems:"center", gap:6,
              padding:"0 14px", height:44, fontSize:13, fontWeight:600,
              color: page===id ? "#fff" : "#93c5fd",
              borderBottom: page===id ? "2px solid #fff" : "2px solid transparent",
              background:"transparent", cursor:"pointer", border:"none",
            }}>
            <Icon size={15}/>{label}
          </button>
        ))}
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:14 }}>
          <CloudBadge/>
          {user && (
            <>
              <span style={{ color:"#bfdbfe", fontSize:11.5 }}>{user.email}</span>
              <button onClick={() => signOut(auth)} title="Uitloggen"
                style={{ display:"inline-flex", alignItems:"center", gap:5, background:"transparent",
                         border:"1px solid #3b5bb5", color:"#bfdbfe", borderRadius:6,
                         padding:"4px 10px", fontSize:11.5, fontWeight:600, cursor:"pointer" }}>
                <LogOut size={12}/> Uitloggen
              </button>
            </>
          )}
        </div>
      </nav>

      <div style={{ flex:1, overflow:"auto" }}>
        {page === "dashboard" && <Dashboard />}
        {page === "dag"       && <DagPlanning />}
        {page === "dienst"    && <DienstPlanning />}
        {page === "uren"      && <Urencheck />}
        {page === "personeel" && <Personeel />}
        {page === "admin"     && <Admin />}
      </div>
    </div>
  );
}

function Splash() {
  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
                  background:"#f8fafc", color:C.brand }}>
      <Loader2 size={28}/>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = bezig, null = uitgelogd

  useEffect(() => {
    if (!firebaseReady) { setUser(null); return; }
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return unsub;
  }, []);

  // Zonder Firebase-config: lokaal draaien zonder login
  if (!firebaseReady) return <AppProvider><Shell user={null}/></AppProvider>;

  if (user === undefined) return <Splash/>;
  if (!user) return <Login/>;

  return (
    <AppProvider>
      <Shell user={user}/>
    </AppProvider>
  );
}
