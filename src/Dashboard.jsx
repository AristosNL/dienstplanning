/**
 * Dashboard.jsx — v1  ·  "wie werkt waar"
 *
 * Twee leesfilters over de dagplanning:
 *   - Per medewerker : iemands hele week in één oogopslag
 *   - Per activiteit : wie zit deze week waar (bv. wie doet Poli)
 *
 * Bewerken gebeurt op de Dagplanning-pagina; dit is puur overzicht.
 * Dienst (week/weekend) zit nog niet in de gedeelde state en telt hier
 * dus nog niet mee — volgt zodra die slice verhuist naar de context.
 */

import { useState } from "react";
import {
  LayoutDashboard, ChevronLeft, ChevronRight, User, Layers, Sun, Sunset, Stethoscope,
} from "lucide-react";
import { useApp, ACTIVITY_COLORS, GROUPS } from "./AppContext";

const VERSION = "v1";

const C = {
  brand:"#1d4ed8", brandDk:"#1e3a8a", brandLt:"#eff6ff",
  ink:"#0f172a", sub:"#475569", mute:"#94a3b8",
  line:"#e2e8f0", panel:"#f8fafc", white:"#ffffff",
};

const DAYS    = ["Maandag","Dinsdag","Woensdag","Donderdag","Vrijdag"];
const PERIODS = [["AM","Ochtend",Sun],["PM","Middag",Sunset]];
const STATUS  = {
  VRIJ:{ code:"Vrij", bg:"#ecfdf5", ink:"#047857", border:"#a7f3d0" },
  X:   { code:"x",    bg:"#f8fafc", ink:"#94a3b8", border:"#e2e8f0" },
};

const iso=(d)=>{const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),dy=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${dy}`;};
const addDays=(s,n)=>{const d=new Date(s+"T00:00:00");d.setDate(d.getDate()+n);return iso(d);};
const fmtNL=(s)=>s.split("-").reverse().join("-");
const fmtShort=(s)=>{const[,m,d]=s.split("-");return `${d}-${m}`;};
function mondayOf(s){const d=new Date(s+"T00:00:00");const wd=(d.getDay()+6)%7;d.setDate(d.getDate()-wd);return iso(d);}
function isoWeek(s){const d=new Date(s+"T00:00:00"),t=new Date(d.valueOf());const n=(d.getDay()+6)%7;t.setDate(t.getDate()-n+3);const f=new Date(t.getFullYear(),0,4);return 1+Math.round(((t-f)/86400000-3+((f.getDay()+6)%7))/7);}

export default function Dashboard() {
  const { staff, activities, dagplanning, dienstWeekday } = useApp();
  const [weekStart, setWeekStart] = useState(mondayOf(iso(new Date())));
  const [mode, setMode] = useState("staff"); // staff | activity
  const [selStaff, setSelStaff] = useState(staff[0]?.id || "");
  const [selAct, setSelAct]     = useState(activities[0]?.id || "");

  const weekKey = weekStart;
  const actById = Object.fromEntries(activities.map(a => [a.id, a]));
  const get = (sid, dayIdx, period) => dagplanning[`${weekKey}__${sid}__${dayIdx}__${period}`];

  return (
    <div style={{ background:C.panel, minHeight:"100%", fontFamily:"ui-sans-serif, system-ui, sans-serif" }}>
      {/* header */}
      <div style={{ background:`linear-gradient(180deg,${C.brand} 0%,${C.brandDk} 100%)`,
                    color:"#fff", padding:"18px 22px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <LayoutDashboard size={22}/>
          <h1 style={{ fontWeight:700, fontSize:19, letterSpacing:-0.2, margin:0 }}>Dashboard</h1>
          <span style={{ fontSize:11, color:"#93c5fd", marginLeft:4 }}>{VERSION}</span>
        </div>
        <p style={{ color:"#dbeafe", fontSize:12.5, marginTop:2, marginBottom:0 }}>
          Wie werkt waar — per medewerker of per activiteit
        </p>
      </div>

      <div style={{ padding:20 }}>
        {/* besturing */}
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16, flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <button onClick={()=>setWeekStart(addDays(weekStart,-7))} style={navBtn}><ChevronLeft size={16}/></button>
            <div style={{ textAlign:"center", minWidth:210 }}>
              <div style={{ fontWeight:700, fontSize:15, color:C.ink }}>{weekStart.slice(0,4)} — week {isoWeek(weekStart)}</div>
              <div style={{ fontSize:12, color:C.mute }}>{fmtNL(weekStart)} t/m {fmtNL(addDays(weekStart,4))}</div>
            </div>
            <button onClick={()=>setWeekStart(addDays(weekStart,7))} style={navBtn}><ChevronRight size={16}/></button>
            <button onClick={()=>setWeekStart(mondayOf(iso(new Date())))}
              style={{ ...navBtn, padding:"4px 12px", fontSize:12, fontWeight:600 }}>
              Deze week
            </button>
          </div>

          {/* modus-toggle */}
          <div style={{ marginLeft:"auto", display:"flex", gap:3, padding:3, borderRadius:8,
                        background:C.white, border:`1px solid ${C.line}` }}>
            <Toggle active={mode==="staff"}    onClick={()=>setMode("staff")}    Icon={User}>Per medewerker</Toggle>
            <Toggle active={mode==="activity"} onClick={()=>setMode("activity")} Icon={Layers}>Per activiteit</Toggle>
          </div>
        </div>

        {/* selector */}
        {mode==="staff" ? (
          <div style={{ marginBottom:14 }}>
            <select value={selStaff} onChange={e=>setSelStaff(e.target.value)}
              style={{ borderRadius:8, border:`1px solid ${C.line}`, padding:"8px 12px",
                       fontSize:14, fontWeight:600, color:C.ink, background:C.white, minWidth:220 }}>
              {GROUPS.map(g => {
                const members = staff.filter(s=>s.group===g);
                if (!members.length) return null;
                return (
                  <optgroup key={g} label={g}>
                    {members.map(s => <option key={s.id} value={s.id}>{s.name||"—"}</option>)}
                  </optgroup>
                );
              })}
            </select>
          </div>
        ) : (
          <div style={{ marginBottom:14, display:"flex", flexWrap:"wrap", gap:6 }}>
            {activities.map(a => {
              const col = ACTIVITY_COLORS[a.colorIdx ?? 0];
              const on = selAct===a.id;
              return (
                <button key={a.id} onClick={()=>setSelAct(a.id)}
                  style={{ display:"inline-flex", alignItems:"center", gap:6,
                           borderRadius:7, padding:"5px 11px", fontSize:12.5, fontWeight:700, cursor:"pointer",
                           background: on ? col.bg : C.white,
                           color: on ? col.ink : C.sub,
                           border:`1px solid ${on ? col.ink : C.line}` }}>
                  <span style={{ width:10, height:10, borderRadius:3, background:col.bg,
                                 border:`1.5px solid ${col.ink}` }}/>
                  {a.code || a.label}
                </button>
              );
            })}
          </div>
        )}

        {/* 5 dagkaarten */}
        <div style={{ display:"grid", gap:10, gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))" }}>
          {DAYS.map((day, dayIdx) => (
            <div key={day} style={{ background:C.white, border:`1px solid ${C.line}`, borderRadius:11, overflow:"hidden" }}>
              <div style={{ background:C.panel, borderBottom:`1px solid ${C.line}`, padding:"7px 12px" }}>
                <div style={{ fontWeight:700, fontSize:13, color:C.ink }}>{day}</div>
                <div style={{ fontSize:11, color:C.mute }}>{fmtShort(addDays(weekStart,dayIdx))}</div>
              </div>
              <div style={{ padding:"8px 10px", display:"flex", flexDirection:"column", gap:8 }}>
                {PERIODS.map(([pid, plabel, PIcon]) => (
                  <div key={pid}>
                    <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:10.5,
                                  color:C.mute, fontWeight:600, marginBottom:3 }}>
                      <PIcon size={11}/> {plabel}
                    </div>
                    {mode==="staff"
                      ? <StaffCell asg={get(selStaff, dayIdx, pid)} actById={actById}/>
                      : <ActivityCell
                          names={staff.filter(s => get(s.id, dayIdx, pid)?.activityId === selAct).map(s=>s.name)}/>}
                  </div>
                ))}
                {mode==="staff" && dienstWeekday[addDays(weekStart,dayIdx)]?.staffId === selStaff && (
                  <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:2,
                                background:"#eef2ff", color:"#4338ca", border:"1px solid #c7d2fe",
                                borderRadius:6, padding:"3px 8px", fontSize:11, fontWeight:700 }}>
                    <Stethoscope size={12}/> Weekdienst
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* cel in 'per medewerker': de activiteit van die persoon dat dagdeel */
function StaffCell({ asg, actById }) {
  if (!asg) return <Empty/>;
  if (asg.activityId==="VRIJ" || asg.activityId==="X") {
    const st = asg.activityId==="VRIJ" ? STATUS.VRIJ : STATUS.X;
    return <Pill bg={st.bg} ink={st.ink} border={st.border}>{st.code}</Pill>;
  }
  const a = actById[asg.activityId];
  if (!a) return <Empty/>;
  const col = ACTIVITY_COLORS[a.colorIdx ?? 0];
  return (
    <Pill bg={col.bg} ink={col.ink} border={col.border}>
      <strong>{a.code}</strong>
      <span style={{ fontWeight:500, opacity:.85, marginLeft:4, fontSize:11 }}>{a.label}</span>
    </Pill>
  );
}

/* cel in 'per activiteit': wie doet deze activiteit dat dagdeel */
function ActivityCell({ names }) {
  if (!names.length) return <Empty/>;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
      {names.map((n,i) => (
        <span key={i} style={{ background:C.brandLt, color:C.brand, borderRadius:5,
                               padding:"3px 8px", fontSize:12, fontWeight:600 }}>{n}</span>
      ))}
    </div>
  );
}

function Pill({ bg, ink, border, children }) {
  return (
    <div style={{ background:bg, color:ink, border:`1px solid ${border}`, borderRadius:6,
                  padding:"4px 8px", fontSize:12.5, display:"flex", alignItems:"baseline" }}>
      {children}
    </div>
  );
}
function Empty() {
  return <div style={{ border:`1.5px dashed ${C.line}`, borderRadius:6, padding:"4px 8px",
                       fontSize:12, color:"#cbd5e1" }}>—</div>;
}
function Toggle({ active, onClick, Icon, children }) {
  return (
    <button onClick={onClick}
      style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"6px 12px",
               borderRadius:6, fontSize:12.5, fontWeight:600, cursor:"pointer", border:"none",
               background: active ? C.brand : "transparent", color: active ? "#fff" : C.sub }}>
      <Icon size={14}/> {children}
    </button>
  );
}

const navBtn = {
  display:"inline-flex", alignItems:"center", justifyContent:"center",
  width:34, height:34, borderRadius:8, border:`1px solid ${C.line}`,
  background:C.white, color:C.sub, cursor:"pointer",
};
