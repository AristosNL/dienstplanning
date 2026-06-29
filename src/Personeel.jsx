/**
 * Personeel.jsx
 *
 * State komt nu uit AppContext (gedeeld met Admin en straks DienstPlanning).
 * Delete gebruikt ConfirmDialog met impact-check.
 */

import { useState } from "react";
import {
  Users, Plus, Trash2, X, Check,
  ChevronDown, ChevronUp, Calendar, Clock,
  BookOpen, Star, AlertCircle
} from "lucide-react";
import { useApp, GROUPS } from "./AppContext";
import ConfirmDialog from "./ConfirmDialog";
import C from "./tokens";


const ROLES = [
  { id: "dokter",      label: "Dokter",        color: "#dbeafe", ink: "#1e40af" },
  { id: "assistent",   label: "Assistent",     color: "#dcfce7", ink: "#166534" },
  { id: "secretaresse",label: "Secretaresse",  color: "#fef9c3", ink: "#854d0e" },
  { id: "pa_io",       label: "PA io",         color: "#fae8ff", ink: "#86198f" },
  { id: "huidtherapeut",label:"Huidtherapeut", color: "#cffafe", ink: "#155e75" },
];
const roleById = Object.fromEntries(ROLES.map(r => [r.id, r]));
const DAYS = ["ma","di","wo","do","vr","za","zo"];

function RoleBadge({ roleId }) {
  const r = roleById[roleId] || ROLES[0];
  return (
    <span style={{ background:r.color, color:r.ink, borderRadius:99,
                   padding:"2px 10px", fontSize:11, fontWeight:700 }}>
      {r.label}
    </span>
  );
}

function DayPicker({ label, selected, onChange }) {
  return (
    <div>
      <p style={{ fontSize:12, fontWeight:600, color:C.sub, marginBottom:4 }}>{label}</p>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {DAYS.map(d => {
          const on = selected.includes(d);
          return (
            <button key={d} onClick={() => onChange(on ? selected.filter(x=>x!==d) : [...selected,d])}
              style={{ fontSize:12, fontWeight:600, borderRadius:6, padding:"3px 10px", cursor:"pointer",
                background: on ? C.brand : C.panel,
                color: on ? "#fff" : C.sub,
                border: `1px solid ${on ? C.brand : C.line}` }}>
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ActivityPicker({ selected, onChange, activities }) {
  const cats = [...new Set(activities.map(a => a.cat))];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {cats.map(cat => (
        <div key={cat}>
          <p style={{ fontSize:11, fontWeight:700, color:C.mute, marginBottom:5,
                      textTransform:"uppercase", letterSpacing:.5 }}>{cat}</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {activities.filter(a => a.cat === cat).map(a => {
              const on = selected.includes(a.id);
              return (
                <button key={a.id}
                  onClick={() => onChange(on ? selected.filter(x=>x!==a.id) : [...selected,a.id])}
                  style={{ fontSize:12, borderRadius:6, padding:"4px 10px", cursor:"pointer",
                    background: on ? C.brandLt : C.panel,
                    color: on ? C.brand : C.sub,
                    border: `1px solid ${on ? C.brand : C.line}`,
                    fontWeight: on ? 600 : 400 }}>
                  {on && <Check size={11} style={{ display:"inline", marginRight:4 }}/>}{a.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {activities.length === 0 && (
        <p style={{ color:C.mute, fontSize:12.5 }}>Geen activiteiten beschikbaar. Voeg ze toe via Beheer.</p>
      )}
    </div>
  );
}

function AbsenceList({ absences, onChange }) {
  const { today } = useApp();
  const add = () => onChange([...absences, {
    id: crypto.randomUUID(), type:"vakantie", from:today(), to:today(), label:""
  }]);
  const upd = (id, f, v) => onChange(absences.map(a => a.id===id ? {...a,[f]:v} : a));
  const del = (id) => onChange(absences.filter(a => a.id!==id));
  const ts = t => ({ vakantie:{bg:"#dbeafe",ink:"#1e40af"}, cursus:{bg:"#fef9c3",ink:"#854d0e"} }[t]);

  return (
    <div>
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {absences.length === 0 && (
          <p style={{ color:C.mute, fontSize:12.5 }}>Geen vakanties of cursussen ingepland.</p>
        )}
        {absences.map(a => {
          const { bg, ink } = ts(a.type);
          return (
            <div key={a.id} style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap",
                                     background:bg, border:`1px solid ${ink}22`,
                                     borderRadius:8, padding:"8px 10px" }}>
              <select value={a.type} onChange={e=>upd(a.id,"type",e.target.value)}
                style={{ background:"transparent", color:ink, border:`1px solid ${ink}44`,
                         borderRadius:4, padding:"2px 6px", fontSize:12, fontWeight:600 }}>
                <option value="vakantie">Vakantie</option>
                <option value="cursus">Cursus</option>
              </select>
              <input type="date" value={a.from} onChange={e=>upd(a.id,"from",e.target.value)}
                style={{ borderRadius:4, border:`1px solid ${C.line}`, padding:"2px 6px", fontSize:12 }}/>
              <span style={{ color:C.mute, fontSize:12 }}>t/m</span>
              <input type="date" value={a.to} onChange={e=>upd(a.id,"to",e.target.value)}
                style={{ borderRadius:4, border:`1px solid ${C.line}`, padding:"2px 6px", fontSize:12 }}/>
              <input value={a.label} onChange={e=>upd(a.id,"label",e.target.value)}
                placeholder="omschrijving"
                style={{ borderRadius:4, border:`1px solid ${C.line}`, padding:"2px 6px",
                         fontSize:12, flex:1, minWidth:80 }}/>
              <button onClick={()=>del(a.id)} style={{ color:C.err, lineHeight:0 }}>
                <Trash2 size={14}/>
              </button>
            </div>
          );
        })}
      </div>
      <button onClick={add}
        style={{ marginTop:8, display:"inline-flex", alignItems:"center", gap:6,
                 borderRadius:6, padding:"5px 12px", fontSize:12, fontWeight:600,
                 color:C.brand, border:`1px dashed ${C.brand}`, background:C.brandLt, cursor:"pointer" }}>
        <Plus size={13}/> Toevoegen
      </button>
    </div>
  );
}

function SectionTitle({ icon, children }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6, color:C.brand, fontWeight:700, fontSize:13 }}>
      {icon}{children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display:"block", fontSize:11.5, fontWeight:600, color:C.sub, marginBottom:4 }}>{label}</label>
      {children}
    </div>
  );
}

function StaffCard({ person, activities, onSave, onRequestDelete }) {
  const [open, setOpen]   = useState(false);
  const [draft, setDraft] = useState(person);
  const [dirty, setDirty] = useState(false);

  const upd = (f, v) => { setDraft(p => ({...p,[f]:v})); setDirty(true); };
  const save = () => { onSave(draft); setDirty(false); setOpen(false); };
  const discard = () => { setDraft(person); setDirty(false); setOpen(false); };

  const absWarn = draft.absences.some(a => a.from > a.to);

  return (
    <div style={{ borderRadius:12, overflow:"hidden", border:`1px solid ${C.line}`, background:C.white }}>
      {/* collapsed */}
      <div onClick={() => setOpen(o => !o)}
        style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px",
                 cursor:"pointer", userSelect:"none",
                 background: open ? C.brandLt : C.white }}>
        <div style={{ flex:1, display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
          <span style={{ fontWeight:700, fontSize:15, color:C.ink, minWidth:110 }}>
            {draft.name || <span style={{color:C.mute}}>Naamloos</span>}
          </span>
          <RoleBadge roleId={draft.role}/>
          <span style={{ fontSize:12, color:C.mute }}>{draft.contractHours}u/week</span>
          {draft.fixedOff.length > 0 && (
            <span style={{ fontSize:11, color:C.sub }}>Vrij: {draft.fixedOff.join(", ")}</span>
          )}
          {draft.absences.length > 0 && (
            <span style={{ fontSize:11, color:C.warn }}>{draft.absences.length} absentie(s)</span>
          )}
          {absWarn && <AlertCircle size={14} color={C.err}/>}
          {dirty && <span style={{ fontSize:11, color:C.warn, fontWeight:600 }}>● niet opgeslagen</span>}
        </div>
        {open ? <ChevronUp size={16} color={C.mute}/> : <ChevronDown size={16} color={C.mute}/>}
      </div>

      {/* expanded */}
      {open && (
        <div style={{ padding:"16px 20px 20px", borderTop:`1px solid ${C.line}` }}>
          <div style={{ display:"grid", gap:18, gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))" }}>
            <section>
              <SectionTitle icon={<Users size={14}/>}>Basisgegevens</SectionTitle>
              <div style={{ display:"flex", flexDirection:"column", gap:12, marginTop:8 }}>
                <Field label="Naam">
                  <input value={draft.name} onChange={e=>upd("name",e.target.value)}
                    style={{ width:"100%", borderRadius:6, border:`1px solid ${C.line}`,
                             padding:"7px 10px", fontSize:13, boxSizing:"border-box" }}/>
                </Field>
                <Field label="Rol">
                  <select value={draft.role} onChange={e=>upd("role",e.target.value)}
                    style={{ width:"100%", borderRadius:6, border:`1px solid ${C.line}`,
                             padding:"7px 10px", fontSize:13 }}>
                    {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                </Field>
                <Field label="Groep (rij-indeling dagplanning)">
                  <select value={draft.group || ""} onChange={e=>upd("group",e.target.value)}
                    style={{ width:"100%", borderRadius:6, border:`1px solid ${C.line}`,
                             padding:"7px 10px", fontSize:13 }}>
                    {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </Field>
                <Field label="Contracturen per week">
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <input type="number" min={4} max={40} step={4} value={draft.contractHours}
                      onChange={e=>upd("contractHours",+e.target.value)}
                      style={{ width:80, borderRadius:6, border:`1px solid ${C.line}`,
                               padding:"7px 10px", fontSize:13 }}/>
                    <span style={{ color:C.mute, fontSize:12 }}>uur / week</span>
                  </div>
                </Field>
              </div>
            </section>

            <section>
              <SectionTitle icon={<Calendar size={14}/>}>Vrije dagen</SectionTitle>
              <div style={{ display:"flex", flexDirection:"column", gap:14, marginTop:8 }}>
                <DayPicker
                  label="Vaste vrije dag(en) — hard, nooit inplannen"
                  selected={draft.fixedOff}
                  onChange={v=>upd("fixedOff",v)}/>
                <DayPicker
                  label="Voorkeur vrij — zacht, indien mogelijk vrijhouden"
                  selected={draft.preferOff}
                  onChange={v=>upd("preferOff",v)}/>
              </div>
            </section>

            <section style={{ gridColumn:"1/-1" }}>
              <SectionTitle icon={<BookOpen size={14}/>}>Vakanties &amp; cursussen</SectionTitle>
              <div style={{ marginTop:8 }}>
                <AbsenceList absences={draft.absences} onChange={v=>upd("absences",v)}/>
              </div>
            </section>

            <section style={{ gridColumn:"1/-1" }}>
              <SectionTitle icon={<Star size={14}/>}>Gekoppelde activiteiten</SectionTitle>
              <p style={{ fontSize:11.5, color:C.mute, margin:"4px 0 0" }}>
                Selecteer waar deze persoon op ingezet mag worden. Een activiteit zonder koppelingen staat vrij voor iedereen.
              </p>
              <div style={{ marginTop:8 }}>
                <ActivityPicker selected={draft.activityIds} onChange={v=>upd("activityIds",v)} activities={activities}/>
              </div>
            </section>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:20,
                        paddingTop:16, borderTop:`1px solid ${C.line}` }}>
            <button onClick={save}
              style={{ display:"inline-flex", alignItems:"center", gap:6, borderRadius:7,
                       padding:"8px 18px", background:C.brand, color:"#fff",
                       fontWeight:600, fontSize:13, cursor:"pointer", border:"none" }}>
              <Check size={14}/> Opslaan
            </button>
            <button onClick={discard}
              style={{ display:"inline-flex", alignItems:"center", gap:6, borderRadius:7,
                       padding:"8px 14px", border:`1px solid ${C.line}`, color:C.sub,
                       fontWeight:600, fontSize:13, cursor:"pointer", background:C.white }}>
              <X size={14}/> Annuleren
            </button>
            <button onClick={() => onRequestDelete(person)}
              style={{ marginLeft:"auto", display:"inline-flex", alignItems:"center", gap:6,
                       borderRadius:7, padding:"8px 14px", color:C.err,
                       fontWeight:600, fontSize:13, border:`1px solid #fecaca`,
                       background:"#fff1f2", cursor:"pointer" }}>
              <Trash2 size={14}/> Verwijderen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBar({ staff }) {
  const counts = Object.fromEntries(ROLES.map(r => [r.id, 0]));
  staff.forEach(s => counts[s.role]++);
  return (
    <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
      {ROLES.map(r => (
        <div key={r.id} style={{ display:"flex", alignItems:"center", gap:6,
                                  borderRadius:99, padding:"4px 12px",
                                  background:r.color, border:`1px solid ${r.ink}22` }}>
          <span style={{ fontWeight:700, fontSize:14, color:r.ink }}>{counts[r.id]}</span>
          <span style={{ fontSize:12, color:r.ink }}>{r.label}{counts[r.id]!==1?"s":""}</span>
        </div>
      ))}
    </div>
  );
}

export default function Personeel() {
  const { staff, activities, addStaff, updateStaff, deleteStaff, staffPlanUsage } = useApp();
  const [filter, setFilter]   = useState("all");
  const [search, setSearch]   = useState("");
  const [toDelete, setToDelete] = useState(null); // person object

  const handleDelete = (person) => {
    deleteStaff(person.id);
    setToDelete(null);
  };

  /* In de toekomst: check of medewerker ingepland staat in diensten/dagplanning.
     Nu: altijd lege impact (geen planning-state nog). */
  const deleteImpact = (person) => {
    const impacts = [];
    const planned = staffPlanUsage(person.id).length;
    if (planned > 0) impacts.push(`Ingepland in ${planned} dagplanning-cel(len). Die toewijzingen worden verwijderd.`);
    return impacts;
  };

  const visible = staff
    .filter(p => filter==="all" || p.role===filter)
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ background:C.panel, minHeight:"100%", fontFamily:"ui-sans-serif, system-ui, sans-serif" }}>
      <div style={{ background:`linear-gradient(180deg, ${C.brand} 0%, ${C.brandDk} 100%)`,
                    color:"#fff", padding:"18px 22px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <Users size={22}/>
          <h1 style={{ fontWeight:700, fontSize:19, letterSpacing:-0.2 }}>Personeelsbeheer</h1>
        </div>
        <p style={{ color:"#dbeafe", fontSize:12.5, marginTop:2 }}>
          Contracturen · vrije dagen · vakanties &amp; cursussen · activiteiten
        </p>
      </div>

      <div style={{ padding:20, display:"flex", flexDirection:"column", gap:16 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
          <StatBar staff={staff}/>
          <button onClick={addStaff}
            style={{ display:"inline-flex", alignItems:"center", gap:6, borderRadius:7,
                     padding:"8px 16px", background:C.brand, color:"#fff",
                     fontWeight:600, fontSize:13, border:"none", cursor:"pointer" }}>
            <Plus size={15}/> Nieuwe medewerker
          </button>
        </div>

        <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
          <div style={{ display:"flex", gap:4, padding:4, borderRadius:8,
                        background:C.white, border:`1px solid ${C.line}` }}>
            {[{id:"all",label:"Alle"},...ROLES].map(r => (
              <button key={r.id} onClick={() => setFilter(r.id)}
                style={{ padding:"4px 12px", borderRadius:6, fontSize:12, fontWeight:600,
                         cursor:"pointer", border:"none",
                         background: filter===r.id ? C.brand : "transparent",
                         color: filter===r.id ? "#fff" : C.sub }}>
                {r.label}{r.id!=="all" && "s"}
              </button>
            ))}
          </div>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Naam zoeken…"
            style={{ borderRadius:7, border:`1px solid ${C.line}`, padding:"7px 12px",
                     fontSize:13, background:C.white, flex:1, minWidth:160 }}/>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {visible.length === 0 && (
            <div style={{ borderRadius:12, padding:32, textAlign:"center",
                          background:C.white, border:`1px solid ${C.line}` }}>
              <p style={{ color:C.mute, fontSize:13 }}>Geen medewerkers gevonden.</p>
            </div>
          )}
          {visible.map(p => (
            <StaffCard
              key={p.id}
              person={p}
              activities={activities}
              onSave={updateStaff}
              onRequestDelete={setToDelete}
            />
          ))}
        </div>

        <div style={{ borderRadius:8, padding:"10px 14px", display:"flex", gap:8,
                      background:C.brandLt, border:`1px solid #bfdbfe` }}>
          <Clock size={15} color={C.brand} style={{ marginTop:1, flexShrink:0 }}/>
          <p style={{ fontSize:12, color:"#1e40af", margin:0 }}>
            <strong>Koppeling engine:</strong> elk personeelsrecord exporteert als{" "}
            <code>Staff(id, activityIds, fixedOff, preferOff, carry_in)</code>.
            Vakanties en cursussen worden omgezet naar{" "}
            <code>Avail.VACATION / Avail.COURSE</code> per datum.
          </p>
        </div>
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title="Medewerker verwijderen"
        description={toDelete ? `Weet je zeker dat je ${toDelete.name || "deze medewerker"} wilt verwijderen? Dit kan niet ongedaan worden gemaakt.` : ""}
        impact={toDelete ? deleteImpact(toDelete) : []}
        onConfirm={() => handleDelete(toDelete)}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
