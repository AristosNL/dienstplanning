/**
 * Urencheck.jsx — v1
 *
 * Geplande uren per medewerker vs. contracturen, per week.
 * Leest dagplanning-toewijzingen uit de context: elk gevuld dagdeel
 * (behalve "Vrij" en "x") telt als gewerkte tijd.
 *
 * Aanname: 1 dagdeel = instelbaar aantal uren (default 4 → volle dag 8u).
 * Dienst (week/weekend) telt hier nog niet mee; dat is een aparte slice.
 */

import { useState } from "react";
import {
  Clock, ChevronLeft, ChevronRight, AlertTriangle, Check, Minus,
} from "lucide-react";
import { useApp, GROUPS } from "./AppContext";

const VERSION = "v1";

const C = {
  brand:"#1d4ed8", brandDk:"#1e3a8a", brandLt:"#eff6ff",
  ink:"#0f172a", sub:"#475569", mute:"#94a3b8",
  line:"#e2e8f0", panel:"#f8fafc", white:"#ffffff",
  ok:"#16a34a", okBg:"#f0fdf4", warn:"#d97706", warnBg:"#fffbeb",
  err:"#dc2626", errBg:"#fef2f2",
};

/* date helpers */
const iso = (d) => d.toISOString().slice(0,10);
const addDays = (s,n) => { const d=new Date(s+"T00:00:00"); d.setDate(d.getDate()+n); return iso(d); };
const fmtNL = (s) => s.split("-").reverse().join("-");
function mondayOf(s){ const d=new Date(s+"T00:00:00"); const wd=(d.getDay()+6)%7; d.setDate(d.getDate()-wd); return iso(d); }
function isoWeek(s){
  const d=new Date(s+"T00:00:00"), t=new Date(d.valueOf());
  const n=(d.getDay()+6)%7; t.setDate(t.getDate()-n+3);
  const f=new Date(t.getFullYear(),0,4);
  return 1+Math.round(((t-f)/86400000 - 3 + ((f.getDay()+6)%7))/7);
}

/* statusbepaling t.o.v. contract */
function statusOf(planned, contract, slack) {
  if (Math.abs(planned - contract) <= slack) return "ok";
  return planned < contract ? "under" : "over";
}
const STATUS_STYLE = {
  ok:    { c:C.ok,   bg:C.okBg,   label:"op contract", Icon:Check },
  under: { c:C.warn, bg:C.warnBg, label:"onderbezet",  Icon:Minus },
  over:  { c:C.err,  bg:C.errBg,  label:"overbezet",   Icon:AlertTriangle },
};

/* dubbele balk: contract als spoor, gepland als vulling (+ overschot) */
function HoursBar({ planned, contract }) {
  const max = Math.max(contract, planned, 1);
  const pctContract = (contract / max) * 100;
  const pctPlanned  = (Math.min(planned, contract) / max) * 100;
  const pctOver     = (Math.max(planned - contract, 0) / max) * 100;
  return (
    <div style={{ position:"relative", height:18, background:C.panel,
                  borderRadius:5, overflow:"hidden", border:`1px solid ${C.line}` }}>
      {/* contract-markering */}
      <div style={{ position:"absolute", left:`${pctContract}%`, top:0, bottom:0,
                    width:2, background:C.sub, zIndex:2 }} title={`contract ${contract}u`}/>
      {/* gepland binnen contract */}
      <div style={{ position:"absolute", left:0, top:0, bottom:0,
                    width:`${pctPlanned}%`, background:"#93c5fd" }}/>
      {/* overschot boven contract */}
      {pctOver > 0 && (
        <div style={{ position:"absolute", left:`${pctContract}%`, top:0, bottom:0,
                      width:`${pctOver}%`, background:"#fca5a5" }}/>
      )}
    </div>
  );
}

export default function Urencheck() {
  const { staff, dagplanning, dienstWeekday, dienstWeekend } = useApp();
  const [weekStart, setWeekStart] = useState(mondayOf(new Date().toISOString().slice(0, 10)));
  const [hoursPerDagdeel, setHpd] = useState(4);

  const weekKey = weekStart;

  /* tel gewerkte dagdelen per medewerker in deze week */
  const workedDagdelen = (sid) => {
    let n = 0;
    for (const [k, v] of Object.entries(dagplanning)) {
      const [wk, kid] = k.split("__");
      if (wk === weekKey && kid === sid && v && v.activityId !== "VRIJ" && v.activityId !== "X") n++;
    }
    return n;
  };

  /* dienst-tellingen binnen deze week (informatief, geen uren-aanname) */
  const weekDates    = [0,1,2,3,4].map(i => addDays(weekStart,i));
  const weekendDates = [5,6].map(i => addDays(weekStart,i));
  const dutyCount = (sid) => {
    const wd = weekDates.filter(d => dienstWeekday[d]?.staffId === sid).length;
    const we = weekendDates.filter(d => dienstWeekend[d]?.staffId === sid).length;
    return { wd, we };
  };

  const rows = staff.map(s => {
    const dd        = workedDagdelen(s.id);
    const planned   = dd * hoursPerDagdeel;
    const contract  = s.contractHours || 0;
    const status    = statusOf(planned, contract, hoursPerDagdeel);
    return { ...s, dd, planned, contract, status, diff: planned - contract, duty: dutyCount(s.id) };
  });

  const grouped = GROUPS
    .map(g => ({ group:g, members: rows.filter(r => r.group === g) }))
    .filter(g => g.members.length > 0);
  const ungrouped = rows.filter(r => !GROUPS.includes(r.group));
  if (ungrouped.length) grouped.push({ group:"Overig", members:ungrouped });

  const totals = {
    planned:  rows.reduce((a,r)=>a+r.planned,0),
    contract: rows.reduce((a,r)=>a+r.contract,0),
    under:    rows.filter(r=>r.status==="under").length,
    over:     rows.filter(r=>r.status==="over").length,
  };

  return (
    <div style={{ background:C.panel, minHeight:"100%", fontFamily:"ui-sans-serif, system-ui, sans-serif" }}>
      {/* header */}
      <div style={{ background:`linear-gradient(180deg,${C.brand} 0%,${C.brandDk} 100%)`,
                    color:"#fff", padding:"18px 22px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <Clock size={22}/>
          <h1 style={{ fontWeight:700, fontSize:19, letterSpacing:-0.2, margin:0 }}>Urencheck</h1>
          <span style={{ fontSize:11, color:"#93c5fd", marginLeft:4 }}>{VERSION}</span>
        </div>
        <p style={{ color:"#dbeafe", fontSize:12.5, marginTop:2, marginBottom:0 }}>
          Geplande uren vs. contracturen per week
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
            <button onClick={()=>setWeekStart(mondayOf(new Date().toISOString().slice(0,10)))}
              style={{ ...navBtn, padding:"4px 12px", fontSize:12, fontWeight:600 }}>
              Deze week
            </button>
          </div>
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8 }}>
            <label style={{ fontSize:12.5, color:C.sub }}>Uren per dagdeel</label>
            <input type="number" min={1} max={6} step={0.5} value={hoursPerDagdeel}
              onChange={e=>setHpd(Math.max(1,+e.target.value))}
              style={{ width:64, borderRadius:6, border:`1px solid ${C.line}`, padding:"6px 8px", fontSize:13 }}/>
          </div>
        </div>

        {/* samenvatting */}
        <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:16 }}>
          <SummaryCard label="Totaal gepland" value={`${totals.planned} u`} />
          <SummaryCard label="Totaal contract" value={`${totals.contract} u`} />
          <SummaryCard label="Onderbezet" value={totals.under} c={C.warn} />
          <SummaryCard label="Overbezet" value={totals.over} c={C.err} />
        </div>

        {/* tabel */}
        <div style={{ borderRadius:12, overflow:"hidden", border:`1px solid ${C.line}`, background:C.white }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ borderBottom:`2px solid ${C.line}`, background:C.panel }}>
                <Th>Medewerker</Th>
                <Th align="center">Dagdelen</Th>
                <Th align="center">Diensten</Th>
                <Th align="center">Gepland</Th>
                <Th align="center">Contract</Th>
                <Th align="center">Verschil</Th>
                <Th w="28%">Bezetting</Th>
                <Th align="center">Status</Th>
              </tr>
            </thead>
            <tbody>
              {grouped.map(({ group, members }) => (
                <Group key={group} group={group} members={members} />
              ))}
            </tbody>
          </table>
        </div>

        <p style={{ fontSize:11.5, color:C.mute, marginTop:10 }}>
          Gebaseerd op de dagplanning van deze week ({hoursPerDagdeel} u per dagdeel). "Vrij" en "x" tellen als 0 uur.
          Week- en weekenddiensten zijn hier nog niet meegerekend.
        </p>
      </div>
    </div>
  );
}

function Group({ group, members }) {
  return (
    <>
      <tr>
        <td colSpan={8} style={{ background:C.brandLt, color:C.brand, fontWeight:700,
                                 fontSize:11.5, letterSpacing:.5, padding:"5px 12px",
                                 textTransform:"uppercase" }}>{group}</td>
      </tr>
      {members.map(r => {
        const st = STATUS_STYLE[r.status];
        return (
          <tr key={r.id} style={{ borderTop:`1px solid ${C.line}` }}>
            <td style={{ padding:"9px 12px", fontSize:13.5, fontWeight:600, color:C.ink }}>
              {r.name || <span style={{color:C.mute}}>—</span>}
            </td>
            <td style={{ padding:"9px 12px", textAlign:"center", fontSize:13, color:C.sub }}>{r.dd}</td>
            <td style={{ padding:"9px 12px", textAlign:"center", fontSize:12, color:C.sub }}>
              {r.duty.wd === 0 && r.duty.we === 0
                ? <span style={{ color:"#cbd5e1" }}>—</span>
                : <span>{r.duty.wd > 0 && `${r.duty.wd}× week`}{r.duty.wd>0 && r.duty.we>0 && " · "}{r.duty.we > 0 && `${r.duty.we}× we`}</span>}
            </td>
            <td style={{ padding:"9px 12px", textAlign:"center", fontSize:13, fontWeight:700, color:C.ink }}>{r.planned} u</td>
            <td style={{ padding:"9px 12px", textAlign:"center", fontSize:13, color:C.sub }}>{r.contract} u</td>
            <td style={{ padding:"9px 12px", textAlign:"center", fontSize:13, fontWeight:700,
                         color: r.diff===0 ? C.sub : r.diff<0 ? C.warn : C.err }}>
              {r.diff>0?"+":""}{r.diff} u
            </td>
            <td style={{ padding:"9px 12px" }}><HoursBar planned={r.planned} contract={r.contract}/></td>
            <td style={{ padding:"9px 12px", textAlign:"center" }}>
              <span style={{ display:"inline-flex", alignItems:"center", gap:4,
                             background:st.bg, color:st.c, borderRadius:99,
                             padding:"2px 10px", fontSize:11, fontWeight:700 }}>
                <st.Icon size={11}/> {st.label}
              </span>
            </td>
          </tr>
        );
      })}
    </>
  );
}

function SummaryCard({ label, value, c }) {
  return (
    <div style={{ background:C.white, border:`1px solid ${C.line}`, borderRadius:10,
                  padding:"12px 16px", minWidth:130 }}>
      <div style={{ fontSize:11.5, color:C.mute, fontWeight:600 }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:800, color:c||C.ink, marginTop:2 }}>{value}</div>
    </div>
  );
}

function Th({ children, align, w }) {
  return (
    <th style={{ textAlign: align||"left", padding:"9px 12px", fontSize:11.5,
                 fontWeight:700, color:C.mute, width:w }}>{children}</th>
  );
}

const navBtn = {
  display:"inline-flex", alignItems:"center", justifyContent:"center",
  width:34, height:34, borderRadius:8, border:`1px solid ${C.line}`,
  background:C.white, color:C.sub, cursor:"pointer",
};
