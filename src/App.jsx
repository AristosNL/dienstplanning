import { useState } from "react";
import { Users, CalendarDays, Settings, CalendarRange, Clock, LayoutDashboard, Cloud, CloudOff, Loader2 } from "lucide-react";
import { AppProvider, useApp } from "./AppContext";
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

const C = { brandDk: "#1e3a8a" };

function CloudBadge() {
  const { cloud, loaded } = useApp();
  const map = {
    verbonden:  { Icon: Cloud,    txt: "Opgeslagen",  col: "#86efac" },
    verbinden:  { Icon: Loader2,  txt: "Verbinden…",  col: "#93c5fd" },
    fout:       { Icon: CloudOff, txt: "Cloud-fout",  col: "#fca5a5" },
    lokaal:     { Icon: CloudOff, txt: "Lokaal",      col: "#cbd5e1" },
  };
  const s = map[cloud] || map.lokaal;
  return (
    <span title={s.txt} style={{ marginLeft:"auto", display:"inline-flex", alignItems:"center", gap:6,
                                 color:s.col, fontSize:11.5, fontWeight:600 }}>
      <s.Icon size={13}/> {loaded ? s.txt : "Laden…"}
    </span>
  );
}

function Shell() {
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
        <CloudBadge/>
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

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
