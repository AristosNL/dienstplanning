/**
 * AppContext.jsx — v4 — centrale masterdata + planning-state
 *
 * v4: volledige personeelslijst uit het weekrooster, met rollen,
 *     groepering en gekoppelde vaardigheden. Rol "huidtherapeut" +
 *     vaardigheid "huidtherapie" toegevoegd.
 */

import { createContext, useContext, useState } from "react";

const uuid  = () => crypto.randomUUID();
export const today = () => new Date().toISOString().slice(0, 10);

/* ── 10 zachte pastelkleuren ──────────────────────────────────── */
export const ACTIVITY_COLORS = [
  { bg:"#dbeafe", ink:"#1e40af", border:"#bfdbfe" },
  { bg:"#dcfce7", ink:"#166534", border:"#bbf7d0" },
  { bg:"#fef9c3", ink:"#854d0e", border:"#fef08a" },
  { bg:"#fae8ff", ink:"#86198f", border:"#f5d0fe" },
  { bg:"#ffedd5", ink:"#9a3412", border:"#fed7aa" },
  { bg:"#cffafe", ink:"#155e75", border:"#a5f3fc" },
  { bg:"#fce7f3", ink:"#9d174d", border:"#fbcfe8" },
  { bg:"#f0fdf4", ink:"#14532d", border:"#bbf7d0" },
  { bg:"#fff7ed", ink:"#7c2d12", border:"#fed7aa" },
  { bg:"#f1f5f9", ink:"#334155", border:"#cbd5e1" },
];

/* ── Groepen (volgorde = weergavevolgorde op Y-as, conform rooster) ── */
export const GROUPS = ["Secretariaat", "Assistenten", "Ondersteuning", "Artsen"];

/* ── Vaardigheden ─────────────────────────────────────────────── */
const INITIAL_SKILLS = [
  { id:"dienst_weekdag",   label:"Weekdagdienst",         cat:"Dienst" },
  { id:"dienst_weekend",   label:"Weekenddienst",          cat:"Dienst" },
  { id:"poli_cardiologie", label:"Poli cardiologie",       cat:"Klinisch" },
  { id:"poli_longen",      label:"Poli longen",            cat:"Klinisch" },
  { id:"echo",             label:"Echo",                   cat:"Klinisch" },
  { id:"bronchoscopie",    label:"Bronchoscopie",          cat:"Klinisch" },
  { id:"huidtherapie",     label:"Huidtherapie",           cat:"Klinisch" },
  { id:"brieven",          label:"Brieven / dictaat",      cat:"Secretarieel" },
  { id:"planning_sec",     label:"Planning secretariaat",  cat:"Secretarieel" },
  { id:"onderwijs",        label:"Onderwijs / supervisie", cat:"Opleiding" },
];

/* ── Activiteiten (korte code voor de dagplanning) ────────────── */
const INITIAL_ACTIVITIES = [
  { id:"act_a1",    code:"A1",      label:"Spreekkamer A1",        cat:"Klinisch",     skillId:null,              periods:["AM","PM"], colorIdx:0, fromImport:true,  demand:1 },
  { id:"act_a2",    code:"A2",      label:"Spreekkamer A2",        cat:"Klinisch",     skillId:null,              periods:["AM","PM"], colorIdx:1, fromImport:true,  demand:1 },
  { id:"act_b",     code:"B",       label:"Behandelkamer B",       cat:"Klinisch",     skillId:null,              periods:["AM","PM"], colorIdx:2, fromImport:true,  demand:1 },
  { id:"act_o",     code:"O",       label:"OK-assistentie",        cat:"Klinisch",     skillId:null,              periods:["AM","PM"], colorIdx:3, fromImport:false, demand:1 },
  { id:"act_poli",  code:"Poli",    label:"Polikliniek",           cat:"Klinisch",     skillId:"poli_cardiologie",periods:["AM","PM"], colorIdx:5, fromImport:true,  demand:1 },
  { id:"act_pbk",   code:"PBK",     label:"PBK",                   cat:"Klinisch",     skillId:null,              periods:["AM","PM"], colorIdx:4, fromImport:false, demand:1 },
  { id:"act_ok",    code:"OK",      label:"Operatiekamer",         cat:"Klinisch",     skillId:null,              periods:["AM","PM"], colorIdx:6, fromImport:false, demand:1 },
  { id:"act_cosm",  code:"Cosm",    label:"Cosmetisch spreekuur",  cat:"Klinisch",     skillId:null,              periods:["AM","PM"], colorIdx:7, fromImport:false, demand:1 },
  { id:"act_sprtel",code:"spr/tel", label:"Spreekuur / telefoon",  cat:"Secretarieel", skillId:null,              periods:["AM","PM"], colorIdx:9, fromImport:false, demand:1 },
  { id:"act_machtig",code:"machtig",label:"Machtigingen",          cat:"Secretarieel", skillId:null,              periods:["AM","PM"], colorIdx:8, fromImport:false, demand:1 },
  { id:"act_huidth",code:"huidth.", label:"Huidtherapie",          cat:"Klinisch",     skillId:"huidtherapie",    periods:["AM","PM"], colorIdx:1, fromImport:false, demand:1 },
  { id:"act_school",code:"school",  label:"School / opleiding",    cat:"Opleiding",    skillId:null,              periods:["AM","PM"], colorIdx:3, fromImport:false, demand:1 },
];

/* ── Medewerkers — volledige lijst uit het weekrooster ────────── */
/* rol/groep zoals opgegeven; vaardigheden zijn een inschatting,
   bij te stellen in Personeel. Contracturen/vrije dagen/vakanties
   bewust leeg gelaten (nog in te vullen). */
const S = (id, name, role, group, skills) => ({
  id, name, role, group, contractHours:36,
  fixedOff:[], preferOff:[], skills, absences:[],
});

const INITIAL_STAFF = [
  S("cora",    "Cora",         "secretaresse", "Secretariaat", ["brieven","planning_sec"]),

  S("wendy",   "Wendy",        "assistent",    "Assistenten",  ["poli_cardiologie","poli_longen","echo"]),
  S("mardy",   "Mardy",        "assistent",    "Assistenten",  ["poli_cardiologie","poli_longen","echo"]),
  S("celsey",  "Celsey",       "assistent",    "Assistenten",  ["poli_cardiologie","poli_longen"]),
  S("mariska", "Mariska",      "assistent",    "Assistenten",  ["poli_cardiologie","echo"]),
  S("maaike",  "Maaike",       "assistent",    "Assistenten",  ["poli_longen","echo"]),
  S("martine", "Martine",      "assistent",    "Assistenten",  ["poli_cardiologie","poli_longen"]),
  S("rolendis","Rolendis",     "assistent",    "Assistenten",  ["poli_cardiologie","echo"]),

  S("francis", "Francis",      "assistent",    "Ondersteuning",["poli_longen"]),
  S("anita",   "Anita",        "assistent",    "Ondersteuning",["poli_cardiologie"]),
  S("liesbeth","Liesbeth",     "pa_io",        "Ondersteuning",["poli_cardiologie","poli_longen","onderwijs"]),
  S("sanne",   "Sanne",        "huidtherapeut","Ondersteuning",["huidtherapie"]),

  S("citgez",  "Dr. Citgez",       "dokter",   "Artsen",       ["dienst_weekdag","dienst_weekend","poli_cardiologie","poli_longen","bronchoscopie","onderwijs"]),
  S("jippes",  "Dr. Jippes",       "dokter",   "Artsen",       ["dienst_weekdag","dienst_weekend","poli_cardiologie","poli_longen","bronchoscopie","onderwijs"]),
  S("dijkst",  "Dr. Dijksterhuis", "dokter",   "Artsen",       ["dienst_weekdag","dienst_weekend","poli_cardiologie","poli_longen","onderwijs"]),
];

/* ── Demo dagplanning (week 22-06-2026), nieuwe IDs ───────────── */
const WK = "2026-06-22";
const INITIAL_DAGPLANNING = {
  [`${WK}__cora__0__AM`]:   { activityId:"act_b",       source:"import" },
  [`${WK}__cora__0__PM`]:   { activityId:"act_machtig",  source:"import" },
  [`${WK}__wendy__0__AM`]:  { activityId:"act_a1",       source:"manual" },
  [`${WK}__wendy__0__PM`]:  { activityId:"act_a2",       source:"manual" },
  [`${WK}__jippes__0__AM`]: { activityId:"act_poli",     source:"import" },
  [`${WK}__sanne__2__AM`]:  { activityId:"act_huidth",   source:"import" },
  [`${WK}__sanne__2__PM`]:  { activityId:"act_huidth",   source:"import" },
};

const INITIAL_NOTES = {
  [WK]: [
    { id:"n1", dayIdx:0, time:"16:30", text:"Wendy kennismakingsgesprek stagiair" },
    { id:"n2", dayIdx:3, time:"",      text:"Ochtend gezamenlijk OK Jippes en Dijksterhuis" },
  ],
};

/* ── Dienst: week- en weekenddienst ───────────────────────────── */
/* week-keys voor de 4-weekse diensthorizon (ma-data) */
export const DIENST_WEEK_STARTS = ["2026-06-22","2026-06-29","2026-07-06","2026-07-13"];
const _dwd = (start, off) => { const d=new Date(start+"T00:00:00"); d.setDate(d.getDate()+off); return d.toISOString().slice(0,10); };

/* weekdienst = uitkomst CP-SAT engine (status OPTIMAL), per datum */
const WEEKDAY_SOLUTION = [
  ["dijkst","dijkst","dijkst","citgez","citgez"],
  ["citgez","jippes","jippes","jippes","jippes"],
  ["citgez","jippes","jippes","jippes","jippes"],
  ["dijkst","dijkst","dijkst","dijkst","citgez"],
];
const INITIAL_DIENST_WEEKDAY = (() => {
  const o = {};
  WEEKDAY_SOLUTION.forEach((row, w) =>
    row.forEach((sid, i) => { o[_dwd(DIENST_WEEK_STARTS[w], i)] = { staffId: sid, source: "auto" }; }));
  return o;
})();
const INITIAL_DIENST_WEEKEND = {};                          // handmatig, start leeg
const INITIAL_DIENST_CARRY = {                              // saldo-grootboek (apart!)
  weekday: { citgez:12, jippes:10, dijkst:11 },
  weekend: { citgez:4,  jippes:3,  dijkst:5  },
};

/* ── Context ──────────────────────────────────────────────────── */
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [skills,      setSkills]      = useState(INITIAL_SKILLS);
  const [staff,       setStaff]       = useState(INITIAL_STAFF);
  const [activities,  setActivities]  = useState(INITIAL_ACTIVITIES);
  const [dagplanning, setDagplanning] = useState(INITIAL_DAGPLANNING);
  const [notes,       setNotes]       = useState(INITIAL_NOTES);
  const [dienstWeekday, setDienstWeekday] = useState(INITIAL_DIENST_WEEKDAY);
  const [dienstWeekend, setDienstWeekend] = useState(INITIAL_DIENST_WEEKEND);
  const [dienstCarry]                     = useState(INITIAL_DIENST_CARRY);

  /* Skills CRUD */
  const addSkill    = (s)  => setSkills(p => [...p, { id:uuid(), ...s }]);
  const updateSkill = (u)  => setSkills(p => p.map(x => x.id===u.id ? u : x));
  const deleteSkill = (id) => {
    setSkills(p => p.filter(x => x.id!==id));
    setStaff(p => p.map(s => ({ ...s, skills: s.skills.filter(k => k!==id) })));
    setActivities(p => p.map(a => a.skillId===id ? { ...a, skillId:null } : a));
  };

  /* Activities CRUD */
  const addActivity    = (a)  => setActivities(p => [...p, { id:uuid(), code:"", demand:1, fromImport:false, periods:["AM","PM"], colorIdx:0, skillId:null, ...a }]);
  const updateActivity = (u)  => setActivities(p => p.map(x => x.id===u.id ? u : x));
  const deleteActivity = (id) => {
    setActivities(p => p.filter(x => x.id!==id));
    setDagplanning(p => {
      const next = { ...p };
      for (const k of Object.keys(next)) if (next[k]?.activityId === id) delete next[k];
      return next;
    });
  };

  /* Staff CRUD */
  const addStaff    = ()   => setStaff(p => [...p, {
    id:uuid(), name:"", role:"assistent", group:GROUPS[0], contractHours:36,
    fixedOff:[], preferOff:[], skills:[], absences:[],
  }]);
  const updateStaff = (u)  => setStaff(p => p.map(s => s.id===u.id ? u : s));
  const deleteStaff = (id) => {
    setStaff(p => p.filter(s => s.id!==id));
    setDagplanning(p => {
      const next = { ...p };
      for (const k of Object.keys(next)) if (k.split("__")[1] === id) delete next[k];
      return next;
    });
    setDienstWeekday(p => { const n={...p}; for (const k of Object.keys(n)) if (n[k]?.staffId===id) delete n[k]; return n; });
    setDienstWeekend(p => { const n={...p}; for (const k of Object.keys(n)) if (n[k]?.staffId===id) delete n[k]; return n; });
  };

  /* Dienst week/weekend */
  const setWeekdayDuty   = (date, val) => setDienstWeekday(p => ({ ...p, [date]: val }));
  const clearWeekdayDuty = (date)      => setDienstWeekday(p => { const n={...p}; delete n[date]; return n; });
  const setWeekendDuty   = (date, val) => setDienstWeekend(p => ({ ...p, [date]: val }));
  const clearWeekendDuty = (date)      => setDienstWeekend(p => { const n={...p}; delete n[date]; return n; });
  const weekdayDutyCount = (sid) => Object.values(dienstWeekday).filter(v => v?.staffId===sid).length;
  const weekendDutyCount = (sid) => Object.values(dienstWeekend).filter(v => v?.staffId===sid).length;

  /* Dagplanning */
  const setDagAssign   = (key, value) => setDagplanning(p => ({ ...p, [key]: value }));
  const clearDagAssign = (key)        => setDagplanning(p => { const n={...p}; delete n[key]; return n; });

  /* Notities per week */
  const addNote    = (wk, note)      => setNotes(p => ({ ...p, [wk]: [...(p[wk]||[]), { id:uuid(), ...note }] }));
  const updateNote = (wk, id, patch) => setNotes(p => ({ ...p, [wk]: (p[wk]||[]).map(n => n.id===id ? {...n,...patch} : n) }));
  const deleteNote = (wk, id)        => setNotes(p => ({ ...p, [wk]: (p[wk]||[]).filter(n => n.id!==id) }));

  /* Impact-helpers */
  const skillUsage     = (id) => staff.filter(s => s.skills.includes(id));
  const skillActUsage  = (id) => activities.filter(a => a.skillId===id);
  const activityUsage  = (id) => Object.values(dagplanning).filter(v => v?.activityId===id);
  const staffPlanUsage = (id) => Object.keys(dagplanning).filter(k => k.split("__")[1]===id);

  return (
    <AppContext.Provider value={{
      skills, addSkill, updateSkill, deleteSkill, skillUsage, skillActUsage,
      activities, addActivity, updateActivity, deleteActivity, activityUsage,
      staff, addStaff, updateStaff, deleteStaff, staffPlanUsage,
      dagplanning, setDagAssign, clearDagAssign,
      notes, addNote, updateNote, deleteNote,
      dienstWeekday, dienstWeekend, dienstCarry,
      setWeekdayDuty, clearWeekdayDuty, setWeekendDuty, clearWeekendDuty,
      weekdayDutyCount, weekendDutyCount,
      today,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
