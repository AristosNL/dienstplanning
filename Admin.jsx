/**
 * Admin.jsx
 *
 * Twee masterdata-secties:
 *   1. Vaardigheden  — label + categorie, gekoppeld aan medewerkers
 *   2. Activiteiten  — planbare blokken: naam, categorie, vereiste vaardigheid,
 *                      dagdelen, kleur, demand, importeerbaar
 *
 * Beide secties gebruiken ConfirmDialog met impact-check bij verwijderen.
 */

import { useState } from "react";
import {
  Settings, Plus, Pencil, Trash2, Check, X,
  Tag, CalendarClock, Sun, Sunset, DownloadCloud,
} from "lucide-react";
import { useApp, ACTIVITY_COLORS } from "./AppContext";
import ConfirmDialog from "./ConfirmDialog";

/* ── Design tokens ──────────────────────────────────────────────── */
const C = {
  brand:  "#1d4ed8", brandDk:"#1e3a8a", brandLt:"#eff6ff",
  ink:    "#0f172a", sub:"#475569", mute:"#94a3b8",
  line:   "#e2e8f0", panel:"#f8fafc", white:"#ffffff",
  ok:     "#16a34a", err:"#dc2626",
};

/* Categoriekleuren voor vaardigheden */
const CAT_COLORS = [
  { bg:"#dbeafe", ink:"#1e40af" }, { bg:"#dcfce7", ink:"#166534" },
  { bg:"#fef9c3", ink:"#854d0e" }, { bg:"#fae8ff", ink:"#86198f" },
  { bg:"#ffedd5", ink:"#9a3412" }, { bg:"#cffafe", ink:"#155e75" },
];
const catColor = (cats, cat) => CAT_COLORS[cats.indexOf(cat) % CAT_COLORS.length];

const ACT_CATS = ["Klinisch", "Secretarieel", "Opleiding"];
const PERIODS   = ["AM", "PM"];
const PERIOD_LABEL = { AM:"Ochtend", PM:"Middag" };

/* ════════════════════════════════════════════════════════════════
   VAARDIGHEDEN
   ════════════════════════════════════════════════════════════════ */

function SkillRow({ skill, cats, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(skill);
  const col = catColor(cats, skill.cat);

  const save   = () => { onSave(draft); setEditing(false); };
  const cancel = () => { setDraft(skill); setEditing(false); };

  if (editing) return (
    <tr style={{ background:C.brandLt }}>
      <td style={{ padding:"8px 12px" }}>
        <input autoFocus value={draft.label}
          onChange={e => setDraft(d => ({ ...d, label:e.target.value }))}
          style={{ width:"100%", border:`1px solid ${C.brand}`, borderRadius:5, padding:"4px 8px", fontSize:13 }}/>
      </td>
      <td style={{ padding:"8px 12px" }}>
        <input list={`cats-${skill.id}`} value={draft.cat}
          onChange={e => setDraft(d => ({ ...d, cat:e.target.value }))}
          placeholder="Categorie…"
          style={{ width:"100%", border:`1px solid ${C.brand}`, borderRadius:5, padding:"4px 8px", fontSize:13 }}/>
        <datalist id={`cats-${skill.id}`}>{cats.map(c => <option key={c} value={c}/>)}</datalist>
      </td>
      <td style={{ padding:"8px 12px" }}>
        <div style={{ display:"flex", gap:6 }}>
          <Btn primary onClick={save}><Check size={12}/> Opslaan</Btn>
          <Btn onClick={cancel}><X size={12}/></Btn>
        </div>
      </td>
    </tr>
  );

  return (
    <tr style={{ borderBottom:`1px solid ${C.line}` }}
        onMouseEnter={e => e.currentTarget.style.background=C.panel}
        onMouseLeave={e => e.currentTarget.style.background=C.white}>
      <td style={{ padding:"10px 12px", fontSize:13.5, color:C.ink, fontWeight:500 }}>{skill.label}</td>
      <td style={{ padding:"10px 12px" }}>
        <CatBadge bg={col.bg} ink={col.ink}>{skill.cat}</CatBadge>
      </td>
      <td style={{ padding:"10px 12px" }}>
        <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
          <Btn onClick={() => setEditing(true)}><Pencil size={12}/> Bewerken</Btn>
          <Btn danger onClick={onDelete}><Trash2 size={12}/></Btn>
        </div>
      </td>
    </tr>
  );
}

function NewSkillRow({ cats, onAdd, onCancel }) {
  const [draft, setDraft] = useState({ label:"", cat:cats[0]||"" });
  const add = () => { if (draft.label.trim() && draft.cat.trim()) onAdd(draft); };

  return (
    <tr style={{ background:"#f0fdf4", borderBottom:`1px solid ${C.line}` }}>
      <td style={{ padding:"8px 12px" }}>
        <input autoFocus value={draft.label} placeholder="Naam vaardigheid…"
          onChange={e => setDraft(d => ({ ...d, label:e.target.value }))}
          onKeyDown={e => e.key==="Enter" && add()}
          style={{ width:"100%", border:`1px solid ${C.ok}`, borderRadius:5, padding:"4px 8px", fontSize:13 }}/>
      </td>
      <td style={{ padding:"8px 12px" }}>
        <input list="new-skill-cats" value={draft.cat} placeholder="Categorie…"
          onChange={e => setDraft(d => ({ ...d, cat:e.target.value }))}
          onKeyDown={e => e.key==="Enter" && add()}
          style={{ width:"100%", border:`1px solid ${C.ok}`, borderRadius:5, padding:"4px 8px", fontSize:13 }}/>
        <datalist id="new-skill-cats">{cats.map(c => <option key={c} value={c}/>)}</datalist>
      </td>
      <td style={{ padding:"8px 12px" }}>
        <div style={{ display:"flex", gap:6 }}>
          <Btn ok onClick={add}><Plus size={12}/> Toevoegen</Btn>
          <Btn onClick={onCancel}><X size={12}/></Btn>
        </div>
      </td>
    </tr>
  );
}

/* ════════════════════════════════════════════════════════════════
   ACTIVITEITEN
   ════════════════════════════════════════════════════════════════ */

/*
 * Lege activiteit — alle velden die de dagplanning-engine nodig heeft.
 */
const emptyActivity = (colorIdx) => ({
  label:"", cat:"Klinisch", skillId:null,
  periods:["AM","PM"], colorIdx, fromImport:false, demand:1,
});

function ColorPicker({ value, onChange }) {
  return (
    <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
      {ACTIVITY_COLORS.map((c, i) => (
        <button key={i} onClick={() => onChange(i)}
          title={`Kleur ${i+1}`}
          style={{
            width:22, height:22, borderRadius:5,
            background:c.bg, border:`2px solid ${value===i ? c.ink : c.border}`,
            cursor:"pointer", outline: value===i ? `2px solid ${c.ink}` : "none",
            outlineOffset:1,
          }}/>
      ))}
    </div>
  );
}

function PeriodPicker({ value, onChange }) {
  return (
    <div style={{ display:"flex", gap:6 }}>
      {PERIODS.map(p => {
        const on = value.includes(p);
        return (
          <button key={p} onClick={() => onChange(on && value.length>1 ? value.filter(x=>x!==p) : [...new Set([...value,p])])}
            style={{
              display:"flex", alignItems:"center", gap:4,
              borderRadius:6, padding:"4px 10px", fontSize:12, fontWeight:600, cursor:"pointer",
              background: on ? C.brand : C.panel,
              color: on ? "#fff" : C.sub,
              border:`1px solid ${on ? C.brand : C.line}`,
            }}>
            {p==="AM" ? <Sun size={12}/> : <Sunset size={12}/>} {PERIOD_LABEL[p]}
          </button>
        );
      })}
    </div>
  );
}

/* Uitklapbare activiteitenkaart — compacte rij + bewerkbaar formulier */
function ActivityCard({ activity, skills, colorIdx, onSave, onDelete }) {
  const [open, setOpen]   = useState(false);
  const [draft, setDraft] = useState(activity);
  const [dirty, setDirty] = useState(false);

  const upd    = (f, v) => { setDraft(d => ({ ...d, [f]:v })); setDirty(true); };
  const save   = () => { onSave(draft); setDirty(false); setOpen(false); };
  const cancel = () => { setDraft(activity); setDirty(false); setOpen(false); };

  const col     = ACTIVITY_COLORS[draft.colorIdx ?? 0];
  const skill   = skills.find(s => s.id === draft.skillId);
  const periods = draft.periods || ["AM","PM"];

  return (
    <div style={{ borderRadius:10, overflow:"hidden", border:`1px solid ${C.line}`, background:C.white }}>
      {/* rij */}
      <div onClick={() => setOpen(o => !o)}
        style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
                 cursor:"pointer", userSelect:"none",
                 background: open ? C.brandLt : C.white }}>
        {/* kleurblokje */}
        <div style={{ width:14, height:32, borderRadius:3, background:col.bg,
                      border:`2px solid ${col.ink}`, flexShrink:0 }}/>
        <span style={{ fontWeight:700, fontSize:14, color:C.ink, flex:1, minWidth:100 }}>
          {draft.label || <span style={{color:C.mute}}>Naamloos</span>}
        </span>
        <CatBadge bg={col.bg} ink={col.ink}>{draft.cat}</CatBadge>
        <span style={{ fontSize:11.5, color:C.sub }}>
          {periods.map(p => PERIOD_LABEL[p]).join(" + ")}
        </span>
        {skill && <span style={{ fontSize:11.5, color:C.mute }}>→ {skill.label}</span>}
        {draft.fromImport && (
          <span title="Importeerbaar via Excel"
            style={{ display:"flex", alignItems:"center", gap:3,
                     fontSize:10.5, color:"#0891b2", fontWeight:600 }}>
            <DownloadCloud size={12}/> import
          </span>
        )}
        {draft.demand > 1 && (
          <span style={{ fontSize:11, color:C.mute }}>×{draft.demand}</span>
        )}
        {dirty && <span style={{ fontSize:11, color:C.warn, fontWeight:600 }}>● niet opgeslagen</span>}
        <span style={{ color:C.mute, fontSize:13 }}>{open ? "▲" : "▼"}</span>
      </div>

      {/* formulier */}
      {open && (
        <div style={{ padding:"14px 18px 18px", borderTop:`1px solid ${C.line}` }}>
          <div style={{ display:"grid", gap:14,
                        gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))" }}>
            <FormField label="Naam">
              <input value={draft.label} onChange={e => upd("label", e.target.value)}
                style={inputStyle}/>
            </FormField>

            <FormField label="Categorie">
              <select value={draft.cat} onChange={e => upd("cat", e.target.value)}
                style={inputStyle}>
                {ACT_CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </FormField>

            <FormField label="Vereiste vaardigheid">
              <select value={draft.skillId || ""} onChange={e => upd("skillId", e.target.value||null)}
                style={inputStyle}>
                <option value="">— geen vereiste —</option>
                {skills.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </FormField>

            <FormField label="Aantal personen (demand)">
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <input type="number" min={1} max={5} value={draft.demand}
                  onChange={e => upd("demand", Math.max(1, +e.target.value))}
                  style={{ ...inputStyle, width:64 }}/>
                <span style={{ color:C.mute, fontSize:12 }}>persoon/personen tegelijk</span>
              </div>
            </FormField>

            <FormField label="Dagdelen">
              <PeriodPicker value={periods} onChange={v => upd("periods", v)}/>
            </FormField>

            <FormField label="Kleur">
              <ColorPicker value={draft.colorIdx ?? 0} onChange={v => upd("colorIdx", v)}/>
            </FormField>

            <FormField label="Importeerbaar via Excel">
              <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
                <input type="checkbox" checked={draft.fromImport}
                  onChange={e => upd("fromImport", e.target.checked)}
                  style={{ width:16, height:16 }}/>
                <span style={{ fontSize:13, color:C.sub }}>
                  Deze activiteit kan vanuit Excel-import worden ingeladen
                </span>
              </label>
            </FormField>
          </div>

          <div style={{ display:"flex", gap:10, marginTop:16,
                        paddingTop:14, borderTop:`1px solid ${C.line}` }}>
            <Btn primary onClick={save}><Check size={13}/> Opslaan</Btn>
            <Btn onClick={cancel}><X size={13}/> Annuleren</Btn>
            <Btn danger onClick={onDelete} style={{ marginLeft:"auto" }}>
              <Trash2 size={13}/> Verwijderen
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   HOOFDCOMPONENT
   ════════════════════════════════════════════════════════════════ */

export default function Admin() {
  const {
    skills, addSkill, updateSkill, deleteSkill, skillUsage, skillActUsage,
    activities, addActivity, updateActivity, deleteActivity, activityUsage,
  } = useApp();

  /* vaardigheden state */
  const [addingSkill, setAddingSkill]   = useState(false);
  const [skillCatFilter, setSkillCat]   = useState("all");
  const [toDelSkill, setToDelSkill]     = useState(null);

  /* activiteiten state */
  const [toDelAct, setToDelAct]         = useState(null);
  const [actCatFilter, setActCat]       = useState("all");

  const skillCats = [...new Set(skills.map(s => s.cat))];
  const visSkills = skills.filter(s => skillCatFilter==="all" || s.cat===skillCatFilter);

  const actCats   = [...new Set(activities.map(a => a.cat))];
  const visActs   = activities.filter(a => actCatFilter==="all" || a.cat===actCatFilter);

  /* volgende vrije kleurindex voor nieuwe activiteit */
  const nextColorIdx = () => {
    const used = new Set(activities.map(a => a.colorIdx));
    for (let i = 0; i < ACTIVITY_COLORS.length; i++) if (!used.has(i)) return i;
    return activities.length % ACTIVITY_COLORS.length;
  };

  /* impact skill delete */
  const skillImpact = (s) => {
    const staff = skillUsage(s.id);
    const acts  = skillActUsage(s.id);
    const lines = [];
    if (staff.length) lines.push(`${staff.length} medewerker(s) hebben deze vaardigheid: ${staff.map(x=>x.name).join(", ")}.`);
    if (acts.length)  lines.push(`${acts.length} activiteit(en) vereisen deze vaardigheid: ${acts.map(x=>x.label).join(", ")}.`);
    if (lines.length) lines.push("De vaardigheid wordt automatisch losgekoppeld.");
    return lines;
  };

  /* impact activiteit delete */
  const actImpact = (a) => {
    const uses = activityUsage(a.id);
    if (!uses.length) return [];
    return [`Deze activiteit staat ingepland op ${uses.length} dag(en).`, "Die toewijzingen worden verwijderd."];
  };

  return (
    <div style={{ background:C.panel, minHeight:"100%", fontFamily:"ui-sans-serif, system-ui, sans-serif" }}>

      {/* ── header ── */}
      <div style={{ background:`linear-gradient(180deg,${C.brand} 0%,${C.brandDk} 100%)`,
                    color:"#fff", padding:"18px 22px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <Settings size={22}/>
          <h1 style={{ fontWeight:700, fontSize:19, letterSpacing:-0.2, margin:0 }}>Beheer</h1>
        </div>
        <p style={{ color:"#dbeafe", fontSize:12.5, marginTop:2, marginBottom:0 }}>
          Vaardigheden · activiteiten · masterdata
        </p>
      </div>

      <div style={{ padding:20, display:"flex", flexDirection:"column", gap:20 }}>

        {/* ══ VAARDIGHEDEN ══ */}
        <Section
          icon={<Tag size={15} color={C.brand}/>}
          title="Vaardigheden"
          count={skills.length}
          filters={skillCats}
          activeFilter={skillCatFilter}
          onFilter={setSkillCat}
          filterColors={(cat) => catColor(skillCats, cat)}
          action={!addingSkill && <Btn primary onClick={() => setAddingSkill(true)}><Plus size={13}/> Nieuwe vaardigheid</Btn>}
          footer="Vaardigheden koppelen medewerkers aan activiteiten. Een nieuwe categorie verschijnt automatisch in personeelsprofielen."
        >
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ borderBottom:`2px solid ${C.line}` }}>
                <Th w="45%">NAAM</Th><Th w="30%">CATEGORIE</Th><Th w="25%"/>
              </tr>
            </thead>
            <tbody>
              {addingSkill && (
                <NewSkillRow cats={skillCats} onAdd={s => { addSkill(s); setAddingSkill(false); setSkillCat("all"); }} onCancel={() => setAddingSkill(false)}/>
              )}
              {visSkills.length===0 && !addingSkill && (
                <tr><td colSpan={3} style={{ padding:28, textAlign:"center", color:C.mute, fontSize:13 }}>Geen vaardigheden gevonden.</td></tr>
              )}
              {visSkills.map(s => (
                <SkillRow key={s.id} skill={s} cats={skillCats}
                  onSave={updateSkill} onDelete={() => setToDelSkill(s)}/>
              ))}
            </tbody>
          </table>
        </Section>

        {/* ══ ACTIVITEITEN ══ */}
        <Section
          icon={<CalendarClock size={15} color={C.brand}/>}
          title="Activiteiten"
          count={activities.length}
          filters={ACT_CATS}
          activeFilter={actCatFilter}
          onFilter={setActCat}
          filterColors={() => ({ bg:C.brandLt, ink:C.brand })}
          action={
            activities.length < 10
              ? <Btn primary onClick={() => addActivity(emptyActivity(nextColorIdx()))}>
                  <Plus size={13}/> Nieuwe activiteit
                </Btn>
              : <span style={{ fontSize:12, color:C.mute }}>Maximum van 10 activiteiten bereikt</span>
          }
          footer={`${activities.length}/10 activiteiten. Elke activiteit krijgt een eigen kleur in de dagplanning.`}
        >
          <div style={{ display:"flex", flexDirection:"column", gap:6, padding:"8px 12px 12px" }}>
            {visActs.length===0 && (
              <p style={{ color:C.mute, fontSize:13, textAlign:"center", padding:20 }}>Geen activiteiten gevonden.</p>
            )}
            {visActs.map(a => (
              <ActivityCard key={a.id} activity={a} skills={skills}
                onSave={updateActivity}
                onDelete={() => setToDelAct(a)}/>
            ))}
          </div>
        </Section>
      </div>

      {/* ── Confirm: skill ── */}
      <ConfirmDialog
        open={!!toDelSkill}
        title="Vaardigheid verwijderen"
        description={toDelSkill ? `Weet je zeker dat je "${toDelSkill.label}" wilt verwijderen?` : ""}
        impact={toDelSkill ? skillImpact(toDelSkill) : []}
        onConfirm={() => { deleteSkill(toDelSkill.id); setToDelSkill(null); }}
        onCancel={() => setToDelSkill(null)}
      />

      {/* ── Confirm: activiteit ── */}
      <ConfirmDialog
        open={!!toDelAct}
        title="Activiteit verwijderen"
        description={toDelAct ? `Weet je zeker dat je "${toDelAct.label}" wilt verwijderen?` : ""}
        impact={toDelAct ? actImpact(toDelAct) : []}
        onConfirm={() => { deleteActivity(toDelAct.id); setToDelAct(null); }}
        onCancel={() => setToDelAct(null)}
      />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   GEDEELDE MICRO-COMPONENTS
   ════════════════════════════════════════════════════════════════ */

function Section({ icon, title, count, filters, activeFilter, onFilter,
                   filterColors, action, footer, children }) {
  return (
    <div style={{ borderRadius:12, overflow:"hidden", background:C.white, border:`1px solid ${C.line}` }}>
      {/* sectie-header */}
      <div style={{ padding:"13px 18px", borderBottom:`1px solid ${C.line}`,
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {icon}
          <h2 style={{ fontWeight:700, fontSize:15, color:C.ink, margin:0 }}>{title}</h2>
          <span style={{ background:C.brandLt, color:C.brand, borderRadius:99,
                         padding:"1px 8px", fontSize:11.5, fontWeight:700 }}>
            {count}
          </span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          {/* categorie-filter tabs */}
          <div style={{ display:"flex", gap:3, padding:3, borderRadius:7,
                        background:C.panel, border:`1px solid ${C.line}` }}>
            <FilterBtn active={activeFilter==="all"} onClick={() => onFilter("all")}>Alle</FilterBtn>
            {filters.map(f => {
              const col = filterColors(f);
              return (
                <FilterBtn key={f} active={activeFilter===f} onClick={() => onFilter(f)}
                  activeBg={col.bg} activeInk={col.ink}>
                  {f}
                </FilterBtn>
              );
            })}
          </div>
          {action}
        </div>
      </div>

      {/* inhoud */}
      {children}

      {/* footer */}
      {footer && (
        <div style={{ padding:"9px 16px", borderTop:`1px solid ${C.line}`, background:C.panel }}>
          <p style={{ fontSize:11.5, color:C.mute, margin:0 }}>{footer}</p>
        </div>
      )}
    </div>
  );
}

function FilterBtn({ active, onClick, children, activeBg, activeInk }) {
  return (
    <button onClick={onClick}
      style={{
        padding:"3px 10px", borderRadius:5, fontSize:12, fontWeight:600, cursor:"pointer", border:"none",
        background: active ? (activeBg || C.brand) : "transparent",
        color:      active ? (activeInk || "#fff") : C.sub,
      }}>
      {children}
    </button>
  );
}

function Btn({ children, onClick, primary, ok, danger, style: s }) {
  const bg  = primary ? C.brand : ok ? C.ok : danger ? C.err : "transparent";
  const col = (primary||ok||danger) ? "#fff" : C.sub;
  const bd  = danger ? "#fecaca" : C.line;
  return (
    <button onClick={onClick}
      style={{ display:"inline-flex", alignItems:"center", gap:5,
               borderRadius:6, padding:"5px 12px", fontSize:12, fontWeight:600,
               cursor:"pointer", background: bg, color: col,
               border: (primary||ok||danger) ? "none" : `1px solid ${bd}`,
               ...s }}>
      {children}
    </button>
  );
}

function Th({ children, w }) {
  return (
    <th style={{ textAlign:"left", padding:"8px 12px", fontSize:11.5,
                 fontWeight:700, color:C.mute, width:w }}>
      {children}
    </th>
  );
}

function CatBadge({ bg, ink, children }) {
  return (
    <span style={{ background:bg, color:ink, borderRadius:99,
                   padding:"2px 10px", fontSize:11.5, fontWeight:700 }}>
      {children}
    </span>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <label style={{ display:"block", fontSize:11.5, fontWeight:600,
                      color:C.sub, marginBottom:5 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width:"100%", borderRadius:6, border:`1px solid ${C.line}`,
  padding:"7px 10px", fontSize:13, boxSizing:"border-box",
};
