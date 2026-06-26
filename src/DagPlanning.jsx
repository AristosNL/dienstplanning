/**
 * DagPlanning.jsx — v1
 *
 * Weekrooster: medewerkers (gegroepeerd) op de Y-as, 5 dagen × ochtend/middag
 * op de X-as. Eén activiteit per cel, erin gesleept vanuit het palet.
 *
 * - sleep een activiteit (of "Vrij" / "x") naar een cel
 * - inzetbaarheidscheck: vaste vrije dag / vakantie / vaardigheid / dagdeel
 *   → harde conflicten krijgen een rode rand (handmatig overrulen mag wél,
 *     maar wordt zichtbaar gemarkeerd); voorkeur-vrij is een zachte hint
 * - klik het kruisje om een cel te legen
 * - bron-vlag per cel (import / handmatig / auto)
 * - Bijzonderheden: vrije notities per week
 */

import { useState, useEffect, Fragment } from "react";
import {
  CalendarDays, ChevronLeft, ChevronRight, Bot, Hand, Upload,
  AlertTriangle, X, Plus, Trash2, StickyNote, Sun, Sunset,
} from "lucide-react";
import { useApp, ACTIVITY_COLORS, GROUPS } from "./AppContext";

const VERSION = "v1";

const C = {
  brand:"#1d4ed8", brandDk:"#1e3a8a", brandLt:"#eff6ff",
  ink:"#0f172a", sub:"#475569", mute:"#94a3b8",
  line:"#e2e8f0", panel:"#f8fafc", white:"#ffffff",
  err:"#dc2626", warn:"#d97706",
};

const DAYS    = ["Maandag","Dinsdag","Woensdag","Donderdag","Vrijdag"];
const DAYS_SH = ["ma","di","wo","do","vr"];
const PERIODS = ["AM","PM"];
const PER_LBL = { AM:"Mo", PM:"Mi" };       // ochtend / middag, zoals in het papieren rooster
const WD_MAP  = ["zo","ma","di","wo","do","vr","za"]; // JS getDay → code
const FIXED_DAY_IDX = { ma:0, di:1, wo:2, do:3, vr:4 }; // fixedOff code → dagIdx (za/zo niet in grid)

/* speciale niet-activiteit statussen */
const STATUS = {
  VRIJ: { code:"vrij", label:"Vrij",         bg:"#ecfdf5", ink:"#047857", border:"#a7f3d0" },
  X:    { code:"x",    label:"Niet werkzaam", bg:"#f8fafc", ink:"#94a3b8", border:"#e2e8f0" },
};

/* ── date helpers ─────────────────────────────────────────────── */
const iso = (d) => d.toISOString().slice(0,10);
const addDays = (isoStr, n) => { const d = new Date(isoStr+"T00:00:00"); d.setDate(d.getDate()+n); return iso(d); };
const fmtNL = (isoStr) => isoStr.split("-").reverse().join("-");
const fmtShort = (isoStr) => { const [,m,d]=isoStr.split("-"); return `${d}-${m}`; };

function mondayOf(isoStr) {
  const d = new Date(isoStr+"T00:00:00");
  const wd = (d.getDay()+6)%7; // ma=0
  d.setDate(d.getDate()-wd);
  return iso(d);
}
function isoWeek(isoStr) {
  const d = new Date(isoStr+"T00:00:00");
  const t = new Date(d.valueOf());
  const dayN = (d.getDay()+6)%7;
  t.setDate(t.getDate()-dayN+3);
  const firstThu = new Date(t.getFullYear(),0,4);
  const diff = (t - firstThu) / 86400000;
  return 1 + Math.round((diff - 3 + ((firstThu.getDay()+6)%7))/7);
}

/* ── inzetbaarheidscheck ──────────────────────────────────────── */
/* Person-centric: iemand met een lege activityIds-lijst is vrij inzetbaar
   op alles. Heeft iemand WEL koppelingen, dan is elke andere activiteit
   een hard conflict. */
function checkEmployability(staff, dateStr, period, activity) {
  const hard = [];
  const soft = [];
  const wd = WD_MAP[new Date(dateStr+"T00:00:00").getDay()];

  if (staff.fixedOff?.includes(wd)) hard.push("Vaste vrije dag");
  for (const a of staff.absences||[]) {
    if (dateStr >= a.from && dateStr <= a.to) {
      hard.push(a.type === "cursus" ? "Cursus" : "Vakantie");
      break;
    }
  }
  if (activity && (staff.activityIds?.length > 0) && !staff.activityIds.includes(activity.id)) {
    hard.push("Activiteit niet gekoppeld aan persoon");
  }
  if (activity?.periods && !activity.periods.includes(period)) {
    hard.push(`Niet in ${period==="AM" ? "ochtend" : "middag"}`);
  }
  if (staff.preferOff?.includes(wd)) soft.push("Voorkeur vrij");

  return { ok: hard.length === 0, hard, soft };
}

/* ── bron-vlag ────────────────────────────────────────────────── */
function SourceIcon({ source }) {
  const m = {
    auto:   { Icon:Bot,    c:"#2563eb" },
    manual: { Icon:Hand,   c:"#7c3aed" },
    import: { Icon:Upload, c:"#0891b2" },
  }[source] || {};
  if (!m.Icon) return null;
  const { Icon, c } = m;
  return <Icon size={10} color={c} strokeWidth={2.4} style={{ flexShrink:0 }} />;
}

/* ── palet-chip ───────────────────────────────────────────────── */
function PaletteChip({ label, bg, ink, border, onDragStart }) {
  return (
    <div draggable onDragStart={onDragStart}
      style={{ background:bg, color:ink, border:`1px solid ${border||ink+"33"}`,
               borderRadius:6, padding:"4px 10px", fontSize:12, fontWeight:700,
               cursor:"grab", userSelect:"none", whiteSpace:"nowrap" }}>
      {label}
    </div>
  );
}

/* ── één cel ──────────────────────────────────────────────────── */
function Cell({ assignment, conflict, soft, activity, onDrop, onClear }) {
  const [hover, setHover] = useState(false);

  let bg = C.white, ink = C.mute, border = C.line, content = null, dashed = true;

  if (assignment) {
    dashed = false;
    if (assignment.activityId === "VRIJ" || assignment.activityId === "X") {
      const st = assignment.activityId === "VRIJ" ? STATUS.VRIJ : STATUS.X;
      bg = st.bg; ink = st.ink; border = st.border; content = st.code;
    } else if (activity) {
      const col = ACTIVITY_COLORS[activity.colorIdx ?? 0];
      bg = col.bg; ink = col.ink; border = col.border; content = activity.code || "?";
    }
  }

  return (
    <td style={{ padding:2, height:34 }}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onDragOver={(e)=>e.preventDefault()}
        onDrop={onDrop}
        title={conflict ? `Conflict: ${conflict}` : soft ? `Let op: ${soft}` : (activity?.label || "")}
        style={{
          position:"relative", height:"100%", minWidth:55,
          borderRadius:5, background:bg,
          border: conflict ? `2px solid ${C.err}` : dashed ? `1.5px dashed ${C.line}` : `1px solid ${border}`,
          display:"flex", alignItems:"center", justifyContent:"center", gap:3,
          fontSize:11.5, fontWeight:700, color:ink, cursor:"default",
        }}>
        {content}
        {conflict && <AlertTriangle size={10} color={C.err} style={{ position:"absolute", top:1, left:2 }} />}
        {soft && !conflict && <span style={{ position:"absolute", top:0, left:3, color:C.warn, fontSize:12, lineHeight:1 }}>•</span>}
        {assignment && <span style={{ position:"absolute", bottom:1, right:2 }}><SourceIcon source={assignment.source} /></span>}
        {assignment && hover && (
          <button onClick={onClear}
            style={{ position:"absolute", top:1, right:1, lineHeight:0, color:ink,
                     background:bg, borderRadius:3 }}>
            <X size={11} />
          </button>
        )}
      </div>
    </td>
  );
}

/* ── Bijzonderheden ───────────────────────────────────────────── */
function Notes({ weekKey }) {
  const { notes, addNote, deleteNote } = useApp();
  const list = notes[weekKey] || [];
  const [day, setDay]   = useState(0);
  const [time, setTime] = useState("");
  const [text, setText] = useState("");

  const add = () => { if (text.trim()) { addNote(weekKey, { dayIdx:day, time, text:text.trim() }); setText(""); setTime(""); } };

  return (
    <div style={{ borderRadius:12, background:C.white, border:`1px solid ${C.line}`, padding:16, marginTop:16 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
        <StickyNote size={15} color={C.brand}/>
        <h3 style={{ fontWeight:700, fontSize:14, color:C.ink, margin:0 }}>Bijzonderheden</h3>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:10 }}>
        {list.length === 0 && <p style={{ color:C.mute, fontSize:12.5, margin:0 }}>Nog geen bijzonderheden voor deze week.</p>}
        {list.map(n => (
          <div key={n.id} style={{ display:"flex", alignItems:"center", gap:8, fontSize:12.5,
                                    background:C.panel, borderRadius:7, padding:"6px 10px" }}>
            <span style={{ fontWeight:700, color:C.brand, minWidth:30 }}>{DAYS_SH[n.dayIdx]}</span>
            {n.time && <span style={{ color:C.sub, fontWeight:600 }}>{n.time}</span>}
            <span style={{ color:C.ink, flex:1 }}>{n.text}</span>
            <button onClick={() => deleteNote(weekKey, n.id)} style={{ color:C.err, lineHeight:0 }}>
              <Trash2 size={13}/>
            </button>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
        <select value={day} onChange={e=>setDay(+e.target.value)}
          style={{ borderRadius:6, border:`1px solid ${C.line}`, padding:"6px 8px", fontSize:12.5 }}>
          {DAYS.map((d,i) => <option key={i} value={i}>{d}</option>)}
        </select>
        <input value={time} onChange={e=>setTime(e.target.value)} placeholder="tijd (optioneel)"
          style={{ borderRadius:6, border:`1px solid ${C.line}`, padding:"6px 8px", fontSize:12.5, width:120 }}/>
        <input value={text} onChange={e=>setText(e.target.value)} placeholder="bijzonderheid…"
          onKeyDown={e=>e.key==="Enter"&&add()}
          style={{ borderRadius:6, border:`1px solid ${C.line}`, padding:"6px 8px", fontSize:12.5, flex:1, minWidth:160 }}/>
        <button onClick={add}
          style={{ display:"inline-flex", alignItems:"center", gap:5, background:C.brand, color:"#fff",
                   border:"none", borderRadius:6, padding:"6px 12px", fontSize:12.5, fontWeight:600, cursor:"pointer" }}>
          <Plus size={13}/> Toevoegen
        </button>
      </div>
    </div>
  );
}

/* ── Hoofdcomponent ───────────────────────────────────────────── */
export default function DagPlanning() {
  const { staff, activities, dagplanning, setDagAssign, clearDagAssign } = useApp();
  const [weekStart, setWeekStart] = useState(mondayOf(new Date().toISOString().slice(0, 10)));
  const [drag, setDrag] = useState(null); // { type:"activity"|"status", id }

  /* alleen dag-activiteiten in palet/grid; dienst-activiteiten horen hier niet */
  const dagActs = activities.filter(a => a.kind !== "dienst");
  const actById = Object.fromEntries(activities.map(a => [a.id, a]));

  /* auto-fill "VRIJ" voor vaste vrije dagen; cleanup verouderde auto-entries */
  useEffect(() => {
    staff.forEach(s => {
      for (let dayIdx = 0; dayIdx < 5; dayIdx++) {
        const wd = WD_MAP[new Date(addDays(weekStart, dayIdx) + "T00:00:00").getDay()];
        const isFixed = s.fixedOff?.includes(wd);
        PERIODS.forEach(period => {
          const k = `${weekStart}__${s.id}__${dayIdx}__${period}`;
          const existing = dagplanning[k];
          if (isFixed && !existing) {
            setDagAssign(k, { activityId: "VRIJ", source: "auto" });
          } else if (!isFixed && existing?.activityId === "VRIJ" && existing?.source === "auto") {
            clearDagAssign(k); // vaste vrije dag is verwijderd → verouderde entry opruimen
          }
        });
      }
    });
  }, [weekStart, staff]); // eslint-disable-line react-hooks/exhaustive-deps
  const weekKey = weekStart;
  const dateOf  = (dayIdx) => addDays(weekStart, dayIdx);
  const keyOf   = (sid, dayIdx, period) => `${weekKey}__${sid}__${dayIdx}__${period}`;

  const handleDrop = (sid, dayIdx, period) => {
    if (!drag) return;
    const activityId = drag.type === "status" ? drag.id : drag.id;
    setDagAssign(keyOf(sid, dayIdx, period), { activityId, source:"manual" });
    setDrag(null);
  };

  /* groepen met hun medewerkers, in vaste volgorde */
  const grouped = GROUPS
    .map(g => ({ group:g, members: staff.filter(s => s.group === g) }))
    .filter(g => g.members.length > 0);
  // medewerkers zonder (bekende) groep onderaan
  const ungrouped = staff.filter(s => !GROUPS.includes(s.group));
  if (ungrouped.length) grouped.push({ group:"Overig", members:ungrouped });

  const colCount = 5 * 2;

  return (
    <div style={{ background:C.panel, minHeight:"100%", fontFamily:"ui-sans-serif, system-ui, sans-serif" }}>

      {/* header */}
      <div style={{ background:`linear-gradient(180deg,${C.brand} 0%,${C.brandDk} 100%)`,
                    color:"#fff", padding:"18px 22px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <CalendarDays size={22}/>
          <h1 style={{ fontWeight:700, fontSize:19, letterSpacing:-0.2, margin:0 }}>Dagelijkse planning</h1>
          <span style={{ fontSize:11, color:"#93c5fd", marginLeft:4 }}>{VERSION}</span>
        </div>
        <p style={{ color:"#dbeafe", fontSize:12.5, marginTop:2, marginBottom:0 }}>
          Medewerkers × dagdelen · sleep activiteiten in de cellen
        </p>
      </div>

      <div style={{ padding:"20px 4px" }}>

        {/* weeknavigatie */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
          <button onClick={() => setWeekStart(addDays(weekStart,-7))}
            style={navBtn}><ChevronLeft size={16}/></button>
          <div style={{ textAlign:"center", minWidth:230 }}>
            <div style={{ fontWeight:700, fontSize:15, color:C.ink }}>
              {weekStart.slice(0,4)} — week {isoWeek(weekStart)}
            </div>
            <div style={{ fontSize:12, color:C.mute }}>
              {fmtNL(weekStart)} t/m {fmtNL(addDays(weekStart,4))}
            </div>
          </div>
          <button onClick={() => setWeekStart(addDays(weekStart,7))}
            style={navBtn}><ChevronRight size={16}/></button>
          <button onClick={() => setWeekStart(mondayOf(new Date().toISOString().slice(0,10)))}
            style={{ ...navBtn, padding:"4px 12px", fontSize:12, fontWeight:600 }}>
            Deze week
          </button>
        </div>

        {/* palet */}
        <div style={{ position:"sticky", top:0, zIndex:5, background:C.panel,
                      padding:"6px 0 12px", marginBottom:4 }}>
          <p style={{ fontSize:11, fontWeight:700, color:C.mute, marginBottom:6, letterSpacing:.5 }}>
            PALET — sleep naar een cel
          </p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {dagActs.map(a => {
              const col = ACTIVITY_COLORS[a.colorIdx ?? 0];
              return (
                <PaletteChip key={a.id} label={a.code || a.label} bg={col.bg} ink={col.ink} border={col.border}
                  onDragStart={() => setDrag({ type:"activity", id:a.id })}/>
              );
            })}
            <span style={{ width:1, background:C.line, margin:"0 4px" }}/>
            <PaletteChip label={STATUS.VRIJ.label} bg={STATUS.VRIJ.bg} ink={STATUS.VRIJ.ink} border={STATUS.VRIJ.border}
              onDragStart={() => setDrag({ type:"status", id:"VRIJ" })}/>
            <PaletteChip label={STATUS.X.label} bg={STATUS.X.bg} ink={STATUS.X.ink} border={STATUS.X.border}
              onDragStart={() => setDrag({ type:"status", id:"X" })}/>
          </div>
        </div>

        {/* grid */}
        <div style={{ overflowX:"auto", borderRadius:12, border:`1px solid ${C.line}`, background:C.white }}>
          <table style={{ borderCollapse:"separate", borderSpacing:0, minWidth:912 }}>
            <thead>
              {/* dagen */}
              <tr>
                <th rowSpan={2} style={{ ...stickyName, ...thBase, zIndex:3, textAlign:"left",
                                         padding:"8px 12px", verticalAlign:"bottom" }}>
                  Medewerker
                </th>
                {DAYS.map((d,i) => (
                  <th key={d} colSpan={2} style={{ ...thBase, textAlign:"center", padding:"7px 4px",
                                                   borderLeft:`2px solid ${C.line}` }}>
                    <div style={{ fontWeight:700, fontSize:12.5, color:C.ink }}>{d}</div>
                    <div style={{ fontSize:10.5, color:C.mute }}>{fmtShort(dateOf(i))}</div>
                  </th>
                ))}
              </tr>
              {/* dagdelen */}
              <tr>
                {DAYS.map((d,i) => PERIODS.map(p => (
                  <th key={d+p} style={{ ...thBase, padding:"3px 4px", fontSize:10, color:C.sub,
                                         borderLeft: p==="AM" ? `2px solid ${C.line}` : "none" }}>
                    <span style={{ display:"inline-flex", alignItems:"center", gap:2 }}>
                      {p==="AM" ? <Sun size={10}/> : <Sunset size={10}/>}{PER_LBL[p]}
                    </span>
                  </th>
                )))}
              </tr>
            </thead>
            <tbody>
              {grouped.map(({ group, members }) => (
                <Fragment key={"g_"+group}>
                  {/* groepskop */}
                  <tr>
                    <td colSpan={1+colCount}
                      style={{ background:C.brandLt, color:C.brand, fontWeight:700, fontSize:11.5,
                               letterSpacing:.5, padding:"5px 12px", textTransform:"uppercase",
                               position:"sticky", left:0 }}>
                      {group}
                    </td>
                  </tr>
                  {members.map(s => (
                    <tr key={s.id}>
                      <td style={{ ...stickyName, padding:"4px 12px", fontSize:13, fontWeight:600,
                                   color:C.ink, borderTop:`1px solid ${C.line}` }}>
                        {s.name || <span style={{color:C.mute}}>—</span>}
                      </td>
                      {DAYS.map((d,dayIdx) => PERIODS.map(period => {
                        const k = keyOf(s.id, dayIdx, period);
                        const asg = dagplanning[k];
                        const act = asg && asg.activityId!=="VRIJ" && asg.activityId!=="X" ? actById[asg.activityId] : null;
                        let conflict = "", soft = "";
                        if (asg && act) {
                          const r = checkEmployability(s, dateOf(dayIdx), period, act);
                          conflict = r.hard.join(", ");
                          soft = r.soft.join(", ");
                        }
                        return (
                          <td key={k} style={{ borderLeft: period==="AM" ? `2px solid ${C.line}` : "none",
                                               borderTop:`1px solid ${C.line}` }}>
                            <Cell
                              assignment={asg}
                              activity={act}
                              conflict={conflict}
                              soft={soft}
                              onDrop={() => handleDrop(s.id, dayIdx, period)}
                              onClear={() => clearDagAssign(k)}
                            />
                          </td>
                        );
                      }))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* legenda */}
        <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginTop:10, fontSize:11.5, color:C.sub }}>
          <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}><Upload size={12} color="#0891b2"/> import</span>
          <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}><Hand size={12} color="#7c3aed"/> handmatig</span>
          <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}><Bot size={12} color="#2563eb"/> automatisch</span>
          <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}><AlertTriangle size={12} color={C.err}/> hard conflict (vrije dag / vakantie / koppeling)</span>
          <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}><span style={{ color:C.warn, fontSize:15, lineHeight:1 }}>•</span> voorkeur vrij</span>
        </div>

        {/* bijzonderheden */}
        <Notes weekKey={weekKey}/>
      </div>
    </div>
  );
}

const navBtn = {
  display:"inline-flex", alignItems:"center", justifyContent:"center",
  width:34, height:34, borderRadius:8, border:`1px solid ${C.line}`,
  background:C.white, color:C.sub, cursor:"pointer",
};
const thBase = { background:C.panel, borderBottom:`1px solid ${C.line}`, position:"sticky", top:0, zIndex:2 };
const stickyName = { position:"sticky", left:0, background:C.white, zIndex:2, minWidth:155, borderRight:`2px solid ${C.line}` };
