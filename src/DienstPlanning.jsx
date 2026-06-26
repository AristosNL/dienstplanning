/**
 * DienstPlanning.jsx — v2
 *
 * Nu volledig op de gedeelde context:
 *  - artsen komen uit staff (skill dienst_weekdag / dienst_weekend)
 *  - week- en weekenddienst staan per datum in de context
 *  - saldo-grootboek apart voor week en weekend
 * Hetzelfde datamodel wordt door dashboard en urencheck meegelezen.
 */

import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, ReferenceLine, LabelList } from "recharts";
import { Bot, Hand, Upload, CalendarDays, Scale, RotateCcw, X, Play, Loader2, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { useApp, ACTIVITY_COLORS, ACT_WEEKDAY, ACT_WEEKEND } from "./AppContext";

const BRAND="#1d4ed8", BRAND_DK="#1e3a8a", INK="#0f172a", MUTE="#64748b", LINE="#e2e8f0", PANEL="#f8fafc";
const WD = ["ma","di","wo","do","vr"];
const fmt = (iso) => iso.split("-").reverse().join("-");
const addDays = (iso,n) => { const d=new Date(iso+"T00:00:00"); d.setDate(d.getDate()+n); const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),dy=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${dy}`; };
const mondayOf = (iso) => { const d=new Date(iso+"T00:00:00"); const wd=(d.getDay()+6)%7; d.setDate(d.getDate()-wd); const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),dy=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${dy}`; };
const localToday = () => { const n=new Date(); const y=n.getFullYear(),m=String(n.getMonth()+1).padStart(2,'0'),d=String(n.getDate()).padStart(2,'0'); return `${y}-${m}-${d}`; };
function isoWeek(iso){ const d=new Date(iso+"T00:00:00"),t=new Date(d.valueOf());const n=(d.getDay()+6)%7;t.setDate(t.getDate()-n+3);const f=new Date(t.getFullYear(),0,4);return 1+Math.round(((t-f)/86400000-3+((f.getDay()+6)%7))/7);}

const SourceTag = ({ kind }) => {
  const m = { auto:{Icon:Bot,c:"#2563eb"}, manual:{Icon:Hand,c:"#7c3aed"}, import:{Icon:Upload,c:"#0891b2"} }[kind];
  if (!m) return null;
  const { Icon, c } = m;
  return <Icon size={11} color={c} strokeWidth={2.4} />;
};

function FairnessChart({ title, data, colorById }) {
  if (!data.length) return null;
  const avg = data.reduce((a,b)=>a+b.total,0)/data.length;
  const spread = Math.max(...data.map(d=>d.total)) - Math.min(...data.map(d=>d.total));
  return (
    <div style={{ borderRadius:12, padding:16, background:"#fff", border:`1px solid ${LINE}` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:2 }}>
        <h3 style={{ color:INK, fontWeight:700, fontSize:14, margin:0 }}>{title}</h3>
        <span style={{ color: spread<=1 ? "#16a34a" : "#d97706", fontSize:12, fontWeight:600 }}>spread {spread}</span>
      </div>
      <p style={{ color:MUTE, fontSize:11, marginBottom:8 }}>cumulatief incl. saldo-grootboek · gemiddelde {avg.toFixed(1)}</p>
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={data} margin={{ top:14, right:8, left:-18, bottom:0 }}>
          <XAxis dataKey="name" tick={{ fontSize:11, fill:MUTE }} axisLine={false} tickLine={false} interval={0}/>
          <YAxis tick={{ fontSize:11, fill:MUTE }} axisLine={false} tickLine={false}/>
          <ReferenceLine y={avg} stroke={MUTE} strokeDasharray="4 4"/>
          <Bar dataKey="total" radius={[5,5,0,0]}>
            <LabelList dataKey="total" position="top" style={{ fontSize:11, fill:INK, fontWeight:600 }}/>
            {data.map(d => { const c=colorById[d.id]; return <Cell key={d.id} fill={c.bg} stroke={c.ink} strokeWidth={1}/>; })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const Th = ({ children, w }) => (
  <th style={{ color:MUTE, fontSize:11, fontWeight:600, textAlign:"center", padding:"6px 4px", width:w }}>{children}</th>
);

function exportICS(weekStarts, dienstWeekday, dienstWeekend, nameById) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AfdelingsPlan//NL",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  const addEvent = (dateStr, summary) => {
    const start = dateStr.replace(/-/g, "");
    const end   = addDays(dateStr, 1).replace(/-/g, "");
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:afdplan-${dateStr}-${summary.replace(/\s+/g, "")}@afdelingsplan`);
    lines.push(`DTSTART;VALUE=DATE:${start}`);
    lines.push(`DTEND;VALUE=DATE:${end}`);
    lines.push(`SUMMARY:${summary}`);
    lines.push("END:VEVENT");
  };

  for (const wkStart of weekStarts) {
    for (let i = 0; i < 5; i++) {
      const date = addDays(wkStart, i);
      const a = dienstWeekday[date];
      if (a) addEvent(date, `Weekdienst: ${nameById[a.staffId] || a.staffId}`);
    }
    for (const off of [5, 6]) {
      const date = addDays(wkStart, off);
      const a = dienstWeekend[date];
      if (a) addEvent(date, `Weekenddienst: ${nameById[a.staffId] || a.staffId}`);
    }
  }

  lines.push("END:VCALENDAR");

  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const el   = document.createElement("a");
  el.href     = url;
  el.download = "dienstplanning.ics";
  document.body.appendChild(el);
  el.click();
  document.body.removeChild(el);
  URL.revokeObjectURL(url);
}

export default function DienstPlanning() {
  const {
    staff, dienstWeekday, dienstWeekend, dienstCarry,
    setWeekdayDuty, clearWeekdayDuty,
    setWeekendPair, clearWeekendPair, weekdayDutyCount, weekendDutyCount,
    solverUrl, setSolverUrl,
  } = useApp();
  const [dragId, setDragId] = useState(null);
  const [solveStatus, setSolveStatus] = useState(null); // {state, msg}
  const [startWeek, setStartWeek] = useState(mondayOf(localToday()));
  const [weeks, setWeeks] = useState(4);

  const weekStarts = useMemo(
    () => Array.from({ length: weeks }, (_, i) => addDays(startWeek, i * 7)),
    [startWeek, weeks]
  );

  /* inzetbare artsen op basis van koppeling aan de dienst-activiteit */
  const weekdayDocs = staff.filter(s => s.activityIds?.includes(ACT_WEEKDAY));
  const weekendDocs = staff.filter(s => s.activityIds?.includes(ACT_WEEKEND));
  const nameById = Object.fromEntries(staff.map(s => [s.id, s.name]));

  /* kleur per arts (stabiel op index in weekendlijst) */
  const colorById = useMemo(() => {
    const o = {};
    weekendDocs.forEach((s, i) => { o[s.id] = ACTIVITY_COLORS[i % ACTIVITY_COLORS.length]; });
    weekdayDocs.forEach((s, i) => { if (!o[s.id]) o[s.id] = ACTIVITY_COLORS[i % ACTIVITY_COLORS.length]; });
    return o;
  }, [staff]);

  const onDropWeekend = (date) => {
    if (!dragId) return;
    setWeekendPair(date, { staffId: dragId, source: "manual" });
    setDragId(null);
  };
  const clearWeekend  = () => weekStarts.forEach(s => { clearWeekendDuty(addDays(s,5)); clearWeekendDuty(addDays(s,6)); });

  const generateWeekday = async () => {
    if (!solverUrl.trim()) { setSolveStatus({ state:"err", msg:"Vul eerst de solver-URL in." }); return; }
    setSolveStatus({ state:"busy", msg:"Bezig met berekenen…" });
    try {
      const doctors = weekdayDocs.map(s => ({
        id: s.id,
        carryIn: dienstCarry.weekday[s.id] || 0,
        fixedOff: s.fixedOff || [],
        preferOff: s.preferOff || [],
        absences: (s.absences || []).map(a => ({ from:a.from, to:a.to, type:a.type })),
      }));
      const body = { start: startWeek, weeks, doctors };
      const resp = await fetch(solverUrl.trim().replace(/\/$/, "") + "/solve-weekday", {
        method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(body),
      });
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      const data = await resp.json();
      if (!data.feasible) { setSolveStatus({ state:"err", msg:`Geen oplossing mogelijk (${data.status}).` }); return; }
      weekStarts.forEach(st => { for (let i=0;i<5;i++) clearWeekdayDuty(addDays(st, i)); });
      Object.entries(data.assignments).forEach(([date, sid]) => setWeekdayDuty(date, { staffId:sid, source:"auto" }));
      setSolveStatus({ state:"ok", msg:`Berekend — status ${data.status}.` });
    } catch (e) {
      setSolveStatus({ state:"err", msg:"Kon de solver niet bereiken. Draait de service en klopt de URL?" });
    }
  };

  const [chartYear, setChartYear] = useState(new Date().getFullYear());

  /* jaren waarvoor diensten bestaan + huidig jaar */
  const availableYears = [...new Set([
    new Date().getFullYear(),
    ...Object.keys(dienstWeekday).map(d => parseInt(d.slice(0,4))),
    ...Object.keys(dienstWeekend).map(d => parseInt(d.slice(0,4))),
  ])].sort();

  const yrStr = String(chartYear);
  const weekdayTotals = weekdayDocs.map(s => ({
    id:s.id, name:s.name,
    total: (dienstCarry.weekday[s.id]||0) +
      Object.entries(dienstWeekday)
        .filter(([date,v]) => v?.staffId===s.id && date.startsWith(yrStr)).length,
  }));
  const weekendTotals = weekendDocs.map(s => ({
    id:s.id, name:s.name,
    total: (dienstCarry.weekend[s.id]||0) +
      Object.entries(dienstWeekend)
        .filter(([date,v]) => v?.staffId===s.id && date.startsWith(yrStr)).length * 0.5,
  }));

  return (
    <div style={{ background:PANEL, minHeight:"100%", fontFamily:"ui-sans-serif, system-ui, sans-serif" }}>
      {/* header */}
      <div style={{ background:`linear-gradient(180deg, ${BRAND} 0%, ${BRAND_DK} 100%)`, color:"#fff", padding:"18px 22px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <CalendarDays size={22}/>
          <h1 style={{ fontWeight:700, fontSize:19, letterSpacing:-0.2, margin:0 }}>Dienstplanning</h1>
          <span style={{ fontSize:11, color:"#93c5fd", marginLeft:4 }}>v3</span>
        </div>
        <p style={{ color:"#dbeafe", fontSize:12.5, marginTop:2, marginBottom:0 }}>
          Weekdienst automatisch (CP-SAT) · weekenddienst handmatig · gescheiden saldi
        </p>
      </div>

      {/* periode-kiezer */}
      <div style={{ padding:"14px 20px 0", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
        <button onClick={()=>setStartWeek(addDays(startWeek, -7*weeks))} style={navBtn}><ChevronLeft size={16}/></button>
        <div style={{ textAlign:"center", minWidth:230 }}>
          <div style={{ fontWeight:700, fontSize:15, color:INK }}>
            week {isoWeek(startWeek)} — {isoWeek(weekStarts[weeks-1])} · {startWeek.slice(0,4)}
          </div>
          <div style={{ fontSize:12, color:MUTE }}>{fmt(startWeek)} t/m {fmt(addDays(weekStarts[weeks-1],4))}</div>
        </div>
        <button onClick={()=>setStartWeek(addDays(startWeek, 7*weeks))} style={navBtn}><ChevronRight size={16}/></button>
        <button onClick={()=>setStartWeek(mondayOf(localToday()))}
          style={{ ...navBtn, padding:"4px 36px", fontSize:12, fontWeight:600 }}>
          Deze week
        </button>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginLeft:8 }}>
          <label style={{ fontSize:12.5, color:MUTE }}>vanaf</label>
          <input type="date" value={startWeek} onChange={e=>e.target.value && setStartWeek(mondayOf(e.target.value))}
            style={{ borderRadius:6, border:`1px solid ${LINE}`, padding:"6px 8px", fontSize:12.5 }}/>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <label style={{ fontSize:12.5, color:MUTE }}>weken</label>
          <input type="number" min={1} max={26} value={weeks}
            onChange={e=>setWeeks(Math.min(26, Math.max(1, +e.target.value || 1)))}
            style={{ width:60, borderRadius:6, border:`1px solid ${LINE}`, padding:"6px 8px", fontSize:13 }}/>
        </div>
        <button
          onClick={() => exportICS(weekStarts, dienstWeekday, dienstWeekend, nameById)}
          style={{ marginLeft:"auto", display:"inline-flex", alignItems:"center", gap:6,
                   borderRadius:6, padding:"6px 12px", border:`1px solid ${LINE}`,
                   background:"#fff", color:MUTE, fontSize:12.5, fontWeight:600, cursor:"pointer" }}>
          <Download size={13}/> Exporteer ICS
        </button>
      </div>

      <div style={{ padding:20, display:"grid", gap:18, gridTemplateColumns:"minmax(0,1fr)" }}>
        {/* WEEKDIENST */}
        <section style={{ borderRadius:12, padding:16, background:"#fff", border:`1px solid ${LINE}` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12, gap:12, flexWrap:"wrap" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <Bot size={16} color={BRAND}/>
              <h2 style={{ color:INK, fontWeight:700, fontSize:15, margin:0 }}>Weekdienst</h2>
              <span style={{ color:MUTE, fontSize:11.5 }}>automatisch (CP-SAT) · {weekdayDocs.length} artsen</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
              <input value={solverUrl} onChange={e=>setSolverUrl(e.target.value)}
                placeholder="https://…solver-url"
                style={{ borderRadius:6, border:`1px solid ${LINE}`, padding:"6px 10px",
                         fontSize:12, width:220 }}/>
              <button onClick={generateWeekday} disabled={solveStatus?.state==="busy"}
                style={{ display:"inline-flex", alignItems:"center", gap:6, borderRadius:6,
                         padding:"6px 12px", background:BRAND, color:"#fff", border:"none",
                         fontSize:12.5, fontWeight:600, cursor:"pointer",
                         opacity: solveStatus?.state==="busy" ? .6 : 1 }}>
                {solveStatus?.state==="busy" ? <Loader2 size={13}/> : <Play size={13}/>}
                Genereer weekdienst
              </button>
            </div>
          </div>
          {solveStatus && (
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10, fontSize:12,
                          color: solveStatus.state==="err" ? "#dc2626" : solveStatus.state==="ok" ? "#16a34a" : MUTE }}>
              {solveStatus.state==="err" ? <AlertCircle size={13}/> : solveStatus.state==="ok" ? <CheckCircle2 size={13}/> : <Loader2 size={13}/>}
              {solveStatus.msg}
            </div>
          )}
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:560 }}>
              <thead>
                <tr style={{ borderBottom:`1px solid ${LINE}` }}>
                  <Th w={96}>week</Th>{WD.map(d => <Th key={d}>{d}</Th>)}
                </tr>
              </thead>
              <tbody>
                {weekStarts.map((start, w) => (
                  <tr key={w} style={{ borderBottom:`1px solid ${LINE}` }}>
                    <td style={{ padding:"7px 6px", fontSize:11.5, color:MUTE, whiteSpace:"nowrap" }}>
                      <span style={{ fontWeight:700, color:INK }}>wk {isoWeek(start)}</span><br/>{fmt(start)}
                    </td>
                    {WD.map((_, i) => {
                      const date = addDays(start, i);
                      const a = dienstWeekday[date];
                      const c = a ? (colorById[a.staffId] || ACTIVITY_COLORS[9]) : null;
                      return (
                        <td key={i} style={{ padding:4 }}>
                          <div style={{ borderRadius:6, minHeight:44, padding:"6px 2px",
                                        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                                        background: a ? c.bg : "#fff",
                                        border: a ? `1px solid ${c.ink}33` : `1.5px dashed ${LINE}`,
                                        color: a ? c.ink : MUTE }}>
                            <span style={{ fontWeight:600, fontSize:12.5, textAlign:"center", lineHeight:1.1 }}>
                              {a ? nameById[a.staffId] : "—"}
                            </span>
                            {a && <span style={{ marginTop:2 }}><SourceTag kind={a.source}/></span>}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ color:MUTE, fontSize:11, marginTop:8 }}>
            Uitkomst van de CP-SAT engine: vaste vrije dagen en cursusweken gerespecteerd, continuïteit en gelijke verdeling geoptimaliseerd.
          </p>
        </section>

        {/* WEEKENDDIENST */}
        <section style={{ borderRadius:12, padding:16, background:"#fff", border:`1px solid ${LINE}` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <Hand size={16} color="#7c3aed"/>
              <h2 style={{ color:INK, fontWeight:700, fontSize:15, margin:0 }}>Weekenddienst</h2>
              <span style={{ color:MUTE, fontSize:11.5 }}>sleep een naam naar een dag</span>
            </div>
            <button onClick={clearWeekend}
              style={{ display:"inline-flex", alignItems:"center", gap:6, borderRadius:6, padding:"6px 10px",
                       border:`1px solid ${LINE}`, color:MUTE, fontSize:12, fontWeight:600, background:"#fff", cursor:"pointer" }}>
              <RotateCcw size={13}/> leegmaken
            </button>
          </div>

          <div style={{ display:"grid", gap:14, gridTemplateColumns:"180px minmax(0,1fr)" }}>
            {/* tray */}
            <div>
              <p style={{ color:MUTE, fontSize:11, fontWeight:600, marginBottom:6 }}>
                BESCHIKBAAR ({weekendDocs.length})
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {weekendDocs.map(s => {
                  const c = colorById[s.id];
                  return (
                    <div key={s.id} draggable onDragStart={() => setDragId(s.id)}
                      style={{ background:c.bg, color:c.ink, border:`1px solid ${c.ink}22`,
                               borderRadius:6, padding:"7px 10px", fontWeight:600, fontSize:13,
                               cursor:"grab", userSelect:"none" }}>
                      {s.name}
                    </div>
                  );
                })}
                {weekendDocs.length===0 && (
                  <p style={{ color:MUTE, fontSize:12 }}>Geen artsen gekoppeld aan weekenddienst.</p>
                )}
              </div>
            </div>

            {/* grid */}
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", minWidth:340 }}>
                <thead>
                  <tr style={{ borderBottom:`1px solid ${LINE}` }}>
                    <Th w={96}>week</Th><Th>zaterdag</Th><Th>zondag</Th>
                  </tr>
                </thead>
                <tbody>
                  {weekStarts.map((start, w) => (
                    <tr key={w} style={{ borderBottom:`1px solid ${LINE}` }}>
                      <td style={{ padding:"7px 6px", fontSize:11.5, color:MUTE }}>
                        <span style={{ fontWeight:700, color:INK }}>wk {isoWeek(start)}</span>
                      </td>
                      {[5,6].map(off => {
                        const date = addDays(start, off);
                        const a = dienstWeekend[date];
                        const c = a ? (colorById[a.staffId] || ACTIVITY_COLORS[9]) : null;
                        return (
                          <td key={off} style={{ padding:4 }}>
                            <div onDragOver={e=>e.preventDefault()} onDrop={()=>onDropWeekend(date)}
                              style={{ minHeight:50, borderRadius:8, padding:5,
                                       border: a ? `1px solid ${c.ink}22` : `1.5px dashed ${LINE}`,
                                       background: a ? c.bg : "#fff",
                                       display:"flex", flexDirection:"column", justifyContent:"center" }}>
                              <span style={{ fontSize:10, color: a ? c.ink : MUTE, marginBottom:2 }}>{fmt(date)}</span>
                              {a ? (
                                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                                  <span style={{ fontWeight:600, fontSize:13, color:c.ink }}>{nameById[a.staffId]}</span>
                                  <span style={{ display:"flex", alignItems:"center", gap:6 }}>
                                    <SourceTag kind="manual"/>
                                    <button onClick={()=>clearWeekendPair(date)} style={{ lineHeight:0, color:c.ink }}>
                                      <X size={13}/>
                                    </button>
                                  </span>
                                </div>
                              ) : (
                                <span style={{ fontSize:11.5, color:"#94a3b8" }}>sleep hierheen</span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAIRNESS */}
        <section>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12, flexWrap:"wrap" }}>
            <Scale size={16} color={BRAND}/>
            <h2 style={{ color:INK, fontWeight:700, fontSize:15, margin:0 }}>Fairness — gescheiden saldi</h2>
            <div style={{ marginLeft:"auto", display:"flex", gap:4, padding:3, borderRadius:7,
                          background:"#f1f5f9", border:`1px solid ${LINE}` }}>
              {availableYears.map(yr => (
                <button key={yr} onClick={() => setChartYear(yr)}
                  style={{ padding:"3px 14px", borderRadius:5, fontSize:12, fontWeight:600,
                           cursor:"pointer", border:"none",
                           background: yr===chartYear ? BRAND : "transparent",
                           color:       yr===chartYear ? "#fff"  : MUTE }}>
                  {yr}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display:"grid", gap:14, gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))" }}>
            <FairnessChart title="Weekdienst" data={weekdayTotals} colorById={colorById}/>
            <FairnessChart title="Weekenddienst" data={weekendTotals} colorById={colorById}/>
          </div>
          <p style={{ color:MUTE, fontSize:11, marginTop:8 }}>
            Diensten in {chartYear} · carry-in is de historische startbalans vóór dit systeem · weekend telt 0,5 per dag.
          </p>
        </section>
      </div>
    </div>
  );
}

const navBtn = {
  display:"inline-flex", alignItems:"center", justifyContent:"center",
  width:34, height:34, borderRadius:8, border:`1px solid ${LINE}`,
  background:"#fff", color:MUTE, cursor:"pointer",
};
