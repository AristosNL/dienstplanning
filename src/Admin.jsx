/**
 * Admin.jsx — v4
 *
 * Eén masterdata-sectie: activiteiten (planbare blokken + dienst-inzetbaarheid).
 * v4: vaardigheden vervallen. Activiteiten worden in Personeel aan medewerkers
 *     gekoppeld; hier beheer je naam/code/categorie/dagdelen/kleur en soort
 *     (dag of dienst). De koppel-telling is read-only.
 */

import { useState, Fragment } from "react";
import {
  Settings, Plus, Pencil, Trash2, Check, X,
  CalendarClock, Sun, Sunset, Users, Upload, FileText, AlertCircle, CheckCircle2,
} from "lucide-react";
import { useApp, ACTIVITY_COLORS } from "./AppContext";
import ConfirmDialog from "./ConfirmDialog";

const VERSION = "v4";

const C = {
  brand:"#1d4ed8", brandDk:"#1e3a8a", brandLt:"#eff6ff",
  ink:"#0f172a", sub:"#475569", mute:"#94a3b8",
  line:"#e2e8f0", panel:"#f8fafc", white:"#ffffff",
  ok:"#16a34a", err:"#dc2626", warn:"#d97706",
};

const ACT_CATS   = ["Huidtherapeut", "Arts", "PA", "DA", "Secretarieel", "Opleiding", "Dienst"];
const PERIODS    = ["AM", "PM"];
const PERIOD_LBL = { AM:"Ochtend", PM:"Middag" };
const KINDS = [
  { id:"dag",    label:"Dagplanning" },
  { id:"dienst", label:"Dienst (week/weekend)" },
];

/* ================================================================
   ACTIVITEITEN
   ================================================================ */

const emptyActivity = (colorIdx) => ({
  label:"", code:"", cat:"Klinisch", kind:"dag",
  periods:["AM","PM"], colorIdx, fromImport:false, demand:1,
});

function ColorPicker({ value, onChange }) {
  return (
    <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
      {ACTIVITY_COLORS.map((c, i) => (
        <button key={i} onClick={() => onChange(i)} title={`Kleur ${i+1}`}
          style={{
            width:22, height:22, borderRadius:5, cursor:"pointer",
            background:c.bg, border:`2px solid ${value===i ? c.ink : c.border}`,
            outline: value===i ? `2px solid ${c.ink}` : "none", outlineOffset:1,
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
          <button key={p}
            onClick={() => onChange(on && value.length>1 ? value.filter(x=>x!==p) : [...new Set([...value,p])])}
            style={{
              display:"flex", alignItems:"center", gap:4,
              borderRadius:6, padding:"4px 10px", fontSize:12, fontWeight:600, cursor:"pointer",
              background: on ? C.brand : C.panel, color: on ? "#fff" : C.sub,
              border:`1px solid ${on ? C.brand : C.line}`,
            }}>
            {p==="AM" ? <Sun size={12}/> : <Sunset size={12}/>} {PERIOD_LBL[p]}
          </button>
        );
      })}
    </div>
  );
}

function ActivityCard({ activity, linkedStaff, onSave, onDelete }) {
  const [open,  setOpen]  = useState(false);
  const [draft, setDraft] = useState(activity);
  const [dirty, setDirty] = useState(false);

  const upd    = (f,v) => { setDraft(d => ({...d,[f]:v})); setDirty(true); };
  const save   = () => { onSave(draft); setDirty(false); setOpen(false); };
  const cancel = () => { setDraft(activity); setDirty(false); setOpen(false); };

  const col      = ACTIVITY_COLORS[draft.colorIdx ?? 0];
  const isDienst = draft.kind === "dienst";

  return (
    <>
      <tr style={{ borderBottom: open ? "none" : `1px solid ${C.line}`,
                   background: open ? C.brandLt : C.white }}
          onMouseEnter={e => { if (!open) e.currentTarget.style.background=C.panel; }}
          onMouseLeave={e => { if (!open) e.currentTarget.style.background=C.white; }}>
        {/* kleur + code */}
        <td style={{ padding:"9px 12px", width:96 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:10, height:10, borderRadius:3, flexShrink:0,
                          background:col.bg, border:`2px solid ${col.ink}` }}/>
            {draft.code
              ? <span style={{ background:col.bg, color:col.ink, border:`1px solid ${col.ink}33`,
                               borderRadius:5, padding:"1px 6px", fontSize:11.5, fontWeight:800 }}>
                  {draft.code}
                </span>
              : <span style={{ color:C.mute, fontSize:11 }}>—</span>}
          </div>
        </td>
        {/* naam */}
        <td style={{ padding:"9px 12px", fontSize:13.5, fontWeight:600, color:C.ink }}>
          {draft.label || <span style={{color:C.mute}}>Naamloos</span>}
          {dirty && <span style={{ fontSize:10, color:C.warn, fontWeight:600, marginLeft:6 }}>●</span>}
        </td>
        {/* categorie */}
        <td style={{ padding:"9px 12px" }}>
          <CatBadge bg={col.bg} ink={col.ink}>{draft.cat}</CatBadge>
        </td>
        {/* soort */}
        <td style={{ padding:"9px 12px" }}>
          <span style={{ fontSize:11.5, fontWeight:700, borderRadius:99, padding:"2px 10px",
                         background: isDienst ? "#fae8ff" : "#dcfce7",
                         color: isDienst ? "#86198f" : "#166534" }}>
            {isDienst ? "Dienst" : "Dag"}
          </span>
        </td>
        {/* gekoppeld */}
        <td style={{ padding:"9px 12px", fontSize:12, color: linkedStaff.length ? C.sub : C.mute }}>
          {linkedStaff.length
            ? <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}>
                <Users size={12}/> {linkedStaff.length}
              </span>
            : <span style={{ color:C.line }}>vrij voor allen</span>}
        </td>
        {/* acties */}
        <td style={{ padding:"9px 12px" }}>
          <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
            <Btn onClick={() => setOpen(o=>!o)}>
              <Pencil size={12}/> {open ? "Sluiten" : "Bewerken"}
            </Btn>
            <Btn danger onClick={onDelete}><Trash2 size={12}/></Btn>
          </div>
        </td>
      </tr>
      {open && (
        <tr style={{ borderBottom:`1px solid ${C.line}` }}>
          <td colSpan={6} style={{ padding:"14px 18px 18px", background:C.brandLt }}>
            <div style={{ display:"grid", gap:14, gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))" }}>
              <FormField label="Code (kort, in de cel)">
                <input value={draft.code} onChange={e=>upd("code",e.target.value)}
                  placeholder="bv. A1, OK, Poli" maxLength={8} style={iStyle}/>
              </FormField>
              <FormField label="Naam (volledig)">
                <input value={draft.label} onChange={e=>upd("label",e.target.value)} style={iStyle}/>
              </FormField>
              <FormField label="Categorie">
                <select value={draft.cat} onChange={e=>upd("cat",e.target.value)} style={iStyle}>
                  {ACT_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FormField>
              <FormField label="Soort">
                <select value={draft.kind} onChange={e=>upd("kind",e.target.value)} style={iStyle}>
                  {KINDS.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}
                </select>
              </FormField>
              <FormField label="Aantal personen (demand)">
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <input type="number" min={1} max={5} value={draft.demand}
                    onChange={e=>upd("demand",Math.max(1,+e.target.value))}
                    style={{ ...iStyle, width:64 }}/>
                  <span style={{ color:C.mute, fontSize:12 }}>persoon/personen tegelijk</span>
                </div>
              </FormField>
              <FormField label="Dagdelen">
                <PeriodPicker value={draft.periods||["AM","PM"]} onChange={v=>upd("periods",v)}/>
              </FormField>
              <FormField label="Kleur">
                <ColorPicker value={draft.colorIdx??0} onChange={v=>upd("colorIdx",v)}/>
              </FormField>
              <FormField label="Importeerbaar via Excel">
                <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
                  <input type="checkbox" checked={draft.fromImport}
                    onChange={e=>upd("fromImport",e.target.checked)}
                    style={{ width:16, height:16 }}/>
                  <span style={{ fontSize:13, color:C.sub }}>
                    Deze activiteit kan vanuit Excel-import worden ingeladen
                  </span>
                </label>
              </FormField>
            </div>

            {/* gekoppelde medewerkers — read-only, beheer in Personeel */}
            <div style={{ marginTop:14, padding:"10px 12px", borderRadius:8,
                          background:C.white, border:`1px solid ${C.line}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                <Users size={13} color={C.brand}/>
                <span style={{ fontSize:12, fontWeight:700, color:C.sub }}>Gekoppelde medewerkers</span>
              </div>
              {linkedStaff.length ? (
                <p style={{ fontSize:12.5, color:C.ink, margin:0 }}>
                  {linkedStaff.map(s => s.name).join(", ")}.
                  <span style={{ color:C.mute }}> Alleen zij zijn op deze activiteit inzetbaar.</span>
                </p>
              ) : (
                <p style={{ fontSize:12.5, color:C.mute, margin:0 }}>
                  Niemand gekoppeld — vrij voor iedereen. Koppelen doe je per medewerker onder Personeel.
                </p>
              )}
            </div>

            <div style={{ display:"flex", gap:10, marginTop:16, paddingTop:14, borderTop:`1px solid ${C.line}` }}>
              <Btn primary onClick={save}><Check size={13}/> Opslaan</Btn>
              <Btn onClick={cancel}><X size={13}/> Annuleren</Btn>
              <Btn danger onClick={onDelete} style={{ marginLeft:"auto" }}><Trash2 size={13}/> Verwijderen</Btn>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ================================================================
   HOOFDCOMPONENT
   ================================================================ */

export default function Admin() {
  const {
    activities, addActivity, updateActivity, deleteActivity, activityUsage, activityStaff,
    requirements, setRequirements, clearRequirements, solverUrl,
  } = useApp();

  const [toDelAct,   setToDelAct] = useState(null);
  const [actCatFilter, setActCat] = useState("all");

  /* requirements import */
  const [okFile,       setOkFile]       = useState(null);
  const [pbkFile,      setPbkFile]      = useState(null);
  const [importStatus, setImportStatus] = useState(null); // null | "busy" | "ok" | "err"
  const [importMsg,    setImportMsg]    = useState("");

  const reqCount = Object.values(requirements)
    .reduce((n, v) => n + (v.AM?.length || 0) + (v.PM?.length || 0), 0);

  const handleImport = async () => {
    if (!okFile && !pbkFile) { setImportMsg("Selecteer minimaal één Excel-bestand."); setImportStatus("err"); return; }
    if (!solverUrl?.trim()) { setImportMsg("Stel eerst de solver-URL in (via Dienstplanning)."); setImportStatus("err"); return; }
    setImportStatus("busy"); setImportMsg("Bezig met verwerken…");
    try {
      const fd = new FormData();
      if (okFile)  fd.append("ok_file",  okFile);
      if (pbkFile) fd.append("pbk_file", pbkFile);
      const resp = await fetch(solverUrl.trim().replace(/\/$/, "") + "/parse-requirements", { method:"POST", body:fd });
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      const data = await resp.json();
      setRequirements(data.requirements);
      setImportStatus("ok");
      setImportMsg(`${data.count} vereisten geïmporteerd over ${Object.keys(data.requirements).length} datums.`);
    } catch (e) {
      setImportStatus("err");
      setImportMsg("Importeren mislukt. Draait de solver-service en klopt de URL?");
    }
  };

  const visActs = activities
    .filter(a => actCatFilter==="all" || a.cat===actCatFilter)
    .sort((a,b) => a.label.localeCompare(b.label, "nl"));

  const nextColorIdx = () => {
    const used = new Set(activities.map(a => a.colorIdx));
    for (let i = 0; i < ACTIVITY_COLORS.length; i++) if (!used.has(i)) return i;
    return activities.length % ACTIVITY_COLORS.length;
  };

  const actImpact = (a) => {
    const l = [];
    const u  = activityUsage(a.id);
    const st = activityStaff(a.id);
    if (u.length)  l.push(`Ingepland op ${u.length} dag(en). Die toewijzingen worden verwijderd.`);
    if (st.length) l.push(`Gekoppeld aan ${st.length} medewerker(s): ${st.map(x=>x.name).join(", ")}. Die koppeling vervalt.`);
    return l;
  };

  return (
    <div style={{ background:C.panel, minHeight:"100%", fontFamily:"ui-sans-serif, system-ui, sans-serif" }}>

      {/* header */}
      <div style={{ background:`linear-gradient(180deg,${C.brand} 0%,${C.brandDk} 100%)`,
                    color:"#fff", padding:"18px 22px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <Settings size={22}/>
          <h1 style={{ fontWeight:700, fontSize:19, letterSpacing:-0.2, margin:0 }}>Beheer</h1>
          <span style={{ fontSize:11, color:"#93c5fd", marginLeft:4 }}>{VERSION}</span>
        </div>
        <p style={{ color:"#dbeafe", fontSize:12.5, marginTop:2, marginBottom:0 }}>
          Activiteiten · masterdata
        </p>
      </div>

      <div style={{ padding:20, display:"flex", flexDirection:"column", gap:20 }}>

        {/* VEREISTEN IMPORTEREN */}
        <div style={{ borderRadius:12, background:C.white, border:`1px solid ${C.line}`, overflow:"hidden" }}>
          <div style={{ padding:"13px 18px", borderBottom:`1px solid ${C.line}`,
                        display:"flex", alignItems:"center", gap:8 }}>
            <Upload size={15} color={C.brand}/>
            <h2 style={{ fontWeight:700, fontSize:15, color:C.ink, margin:0 }}>
              Vereisten importeren
            </h2>
            {reqCount > 0 && (
              <span style={{ background:C.brandLt, color:C.brand, borderRadius:99,
                             padding:"1px 8px", fontSize:11.5, fontWeight:700 }}>
                {reqCount} actief
              </span>
            )}
          </div>
          <div style={{ padding:"16px 18px" }}>
            <p style={{ fontSize:12.5, color:C.sub, margin:"0 0 14px" }}>
              Upload het OK- en/of PBK-sessierooster (Excel). Doorgestreepte en overgedragen PLA-cellen
              worden automatisch uitgefilterd. De vereisten verschijnen als badges in de Dagplanning-koppen.
            </p>
            <div style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"flex-end" }}>
              <FormField label="OK-sessierooster (.xlsx)">
                <label style={{ display:"inline-flex", alignItems:"center", gap:8, cursor:"pointer",
                                padding:"6px 12px", borderRadius:7, border:`1.5px dashed ${C.line}`,
                                background:C.panel, fontSize:12.5, color: okFile ? C.brand : C.mute }}>
                  <FileText size={14}/>
                  {okFile ? okFile.name : "Kies bestand…"}
                  <input type="file" accept=".xlsx" style={{ display:"none" }}
                    onChange={e => setOkFile(e.target.files?.[0] || null)}/>
                </label>
              </FormField>
              <FormField label="PBK-sessierooster (.xlsx)">
                <label style={{ display:"inline-flex", alignItems:"center", gap:8, cursor:"pointer",
                                padding:"6px 12px", borderRadius:7, border:`1.5px dashed ${C.line}`,
                                background:C.panel, fontSize:12.5, color: pbkFile ? C.brand : C.mute }}>
                  <FileText size={14}/>
                  {pbkFile ? pbkFile.name : "Kies bestand…"}
                  <input type="file" accept=".xlsx" style={{ display:"none" }}
                    onChange={e => setPbkFile(e.target.files?.[0] || null)}/>
                </label>
              </FormField>
              <Btn primary onClick={handleImport} style={{ marginBottom:2 }}>
                {importStatus === "busy"
                  ? "Bezig…"
                  : <><Upload size={13}/> Verwerken &amp; importeren</>}
              </Btn>
              {reqCount > 0 && (
                <Btn danger onClick={() => { clearRequirements(); setImportStatus(null); setImportMsg(""); }}
                  style={{ marginBottom:2 }}>
                  <Trash2 size={13}/> Wis vereisten
                </Btn>
              )}
            </div>
            {importMsg && (
              <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:12,
                            padding:"8px 12px", borderRadius:8,
                            background: importStatus==="ok" ? "#f0fdf4" : importStatus==="err" ? "#fef2f2" : "#eff6ff",
                            border: `1px solid ${importStatus==="ok" ? "#bbf7d0" : importStatus==="err" ? "#fecaca" : "#bfdbfe"}` }}>
                {importStatus==="ok"  && <CheckCircle2 size={14} color="#16a34a"/>}
                {importStatus==="err" && <AlertCircle  size={14} color="#dc2626"/>}
                <span style={{ fontSize:12.5, color: importStatus==="ok" ? "#166534" : importStatus==="err" ? "#991b1b" : C.brand }}>
                  {importMsg}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ACTIVITEITEN */}
        <Section
          icon={<CalendarClock size={15} color={C.brand}/>}
          title="Activiteiten" count={activities.length}
          filters={ACT_CATS} activeFilter={actCatFilter} onFilter={setActCat}
          filterColors={() => ({ bg:C.brandLt, ink:C.brand })}
          action={
            <Btn primary onClick={() => addActivity(emptyActivity(nextColorIdx()))}>
              <Plus size={13}/> Nieuwe activiteit
            </Btn>
          }
          footer="Activiteiten zijn de planbare blokken. Koppel ze per medewerker onder Personeel; een activiteit zonder koppelingen staat vrij voor iedereen. Soort 'Dienst' bepaalt de inzetbaarheid voor week-/weekenddienst."
        >
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ borderBottom:`2px solid ${C.line}` }}>
                  <Th w="12%">CODE</Th>
                  <Th w="28%">NAAM</Th>
                  <Th w="16%">CATEGORIE</Th>
                  <Th w="12%">SOORT</Th>
                  <Th w="16%">GEKOPPELD</Th>
                  <Th w="16%"/>
                </tr>
              </thead>
              <tbody>
                {visActs.length===0 && (
                  <tr><td colSpan={6} style={{ padding:28, textAlign:"center", color:C.mute, fontSize:13 }}>
                    Geen activiteiten gevonden.
                  </td></tr>
                )}
                {visActs.map(a => (
                  <Fragment key={a.id}>
                    <ActivityCard activity={a} linkedStaff={activityStaff(a.id)}
                      onSave={updateActivity} onDelete={() => setToDelAct(a)}/>
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>

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

/* ================================================================
   GEDEELDE MICRO-COMPONENTS
   ================================================================ */

function Section({ icon, title, count, filters, activeFilter, onFilter,
                   filterColors, action, footer, children }) {
  return (
    <div style={{ borderRadius:12, overflow:"hidden", background:C.white, border:`1px solid ${C.line}` }}>
      <div style={{ padding:"13px 18px", borderBottom:`1px solid ${C.line}`,
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {icon}
          <h2 style={{ fontWeight:700, fontSize:15, color:C.ink, margin:0 }}>{title}</h2>
          <span style={{ background:C.brandLt, color:C.brand, borderRadius:99,
                         padding:"1px 8px", fontSize:11.5, fontWeight:700 }}>{count}</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          <div style={{ display:"flex", gap:3, padding:3, borderRadius:7,
                        background:C.panel, border:`1px solid ${C.line}` }}>
            <FilterBtn active={activeFilter==="all"} onClick={() => onFilter("all")}>Alle</FilterBtn>
            {filters.map(f => {
              const col = filterColors(f);
              return (
                <FilterBtn key={f} active={activeFilter===f} onClick={() => onFilter(f)}
                  activeBg={col.bg} activeInk={col.ink}>{f}</FilterBtn>
              );
            })}
          </div>
          {action}
        </div>
      </div>
      {children}
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
      style={{ padding:"3px 10px", borderRadius:5, fontSize:12, fontWeight:600,
               cursor:"pointer", border:"none",
               background: active ? (activeBg||C.brand) : "transparent",
               color:      active ? (activeInk||"#fff") : C.sub }}>
      {children}
    </button>
  );
}

function Btn({ children, onClick, primary, ok, danger, style:s }) {
  const bg  = primary ? C.brand : ok ? C.ok : danger ? C.err : "transparent";
  const col = (primary||ok||danger) ? "#fff" : C.sub;
  const bd  = danger ? "#fecaca" : C.line;
  return (
    <button onClick={onClick}
      style={{ display:"inline-flex", alignItems:"center", gap:5,
               borderRadius:6, padding:"5px 12px", fontSize:12, fontWeight:600,
               cursor:"pointer", background:bg, color:col,
               border:(primary||ok||danger) ? "none" : `1px solid ${bd}`, ...s }}>
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
                      color:C.sub, marginBottom:5 }}>{label}</label>
      {children}
    </div>
  );
}

const iStyle = {
  width:"100%", borderRadius:6, border:`1px solid ${C.line}`,
  padding:"7px 10px", fontSize:13, boxSizing:"border-box",
};
