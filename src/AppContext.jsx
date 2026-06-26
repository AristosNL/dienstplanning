/**
 * AppContext.jsx — v5 — centrale masterdata + planning-state
 *
 * v5: vaardigheden vervallen volledig. Activiteiten worden nu rechtstreeks
 *     aan personeelsleden gekoppeld via staff.activityIds. Een activiteit is
 *     vrij voor iedereen zolang niemand eraan gekoppeld is; zodra >=1 persoon
 *     gekoppeld is, mogen alleen die personen ingepland worden.
 *     Week-/weekenddienst zijn nu activiteiten met kind:"dienst".
 */

import { createContext, useContext, useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, firebaseReady } from "./firebase";

const uuid  = () => crypto.randomUUID();
export const today = () => new Date().toISOString().slice(0, 10);

/* vaste ids voor de twee dienst-activiteiten (DienstPlanning filtert hierop) */
export const ACT_WEEKDAY = "act_dienst_weekdag";
export const ACT_WEEKEND = "act_dienst_weekend";

/* -- 10 zachte pastelkleuren ----------------------------------- */
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

/* -- Groepen (volgorde = weergavevolgorde op Y-as, conform rooster) -- */
export const GROUPS = ["Secretariaat", "Assistenten", "Ondersteuning", "Artsen"];

/* -- Activiteiten ---------------------------------------------- */
/* kind:"dag"    -> planbaar blok in de dagplanning (verschijnt in palet)
   kind:"dienst" -> dienst-inzetbaarheid (week/weekend), niet in dag-palet */
const INITIAL_ACTIVITIES = [
  { id:ACT_WEEKDAY, code:"Wd",      label:"Weekdienst",            cat:"Dienst",       kind:"dienst", periods:["AM","PM"], colorIdx:0, fromImport:false, demand:1 },
  { id:ACT_WEEKEND, code:"We",      label:"Weekenddienst",         cat:"Dienst",       kind:"dienst", periods:["AM","PM"], colorIdx:6, fromImport:false, demand:1 },

  { id:"act_a1",    code:"A1",      label:"Spreekkamer A1",        cat:"Huidtherapeut",     kind:"dag", periods:["AM","PM"], colorIdx:0, fromImport:true,  demand:1 },
  { id:"act_a2",    code:"A2",      label:"Spreekkamer A2",        cat:"Huidtherapeut",     kind:"dag", periods:["AM","PM"], colorIdx:1, fromImport:true,  demand:1 },
  { id:"act_b",     code:"B",       label:"Behandelkamer B",       cat:"Huidtherapeut",     kind:"dag", periods:["AM","PM"], colorIdx:2, fromImport:true,  demand:1 },
  { id:"act_o",     code:"O",       label:"OK-assistentie",        cat:"Huidtherapeut",     kind:"dag", periods:["AM","PM"], colorIdx:3, fromImport:false, demand:1 },
  { id:"act_poli",  code:"Poli",    label:"Polikliniek",           cat:"Huidtherapeut",     kind:"dag", periods:["AM","PM"], colorIdx:5, fromImport:true,  demand:1 },
  { id:"act_pbk",   code:"PBK",     label:"PBK",                   cat:"Huidtherapeut",     kind:"dag", periods:["AM","PM"], colorIdx:4, fromImport:false, demand:1 },
  { id:"act_ok",    code:"OK",      label:"Operatiekamer",         cat:"Huidtherapeut",     kind:"dag", periods:["AM","PM"], colorIdx:6, fromImport:false, demand:1 },
  { id:"act_cosm",  code:"Cosm",    label:"Cosmetisch spreekuur",  cat:"Huidtherapeut",     kind:"dag", periods:["AM","PM"], colorIdx:7, fromImport:false, demand:1 },
  { id:"act_sprtel",code:"spr/tel", label:"Spreekuur / telefoon",  cat:"Secretarieel", kind:"dag", periods:["AM","PM"], colorIdx:9, fromImport:false, demand:1 },
  { id:"act_machtig",code:"machtig",label:"Machtigingen",          cat:"Secretarieel", kind:"dag", periods:["AM","PM"], colorIdx:8, fromImport:false, demand:1 },
  { id:"act_huidth",code:"huidth.", label:"Huidtherapie",          cat:"Huidtherapeut",     kind:"dag", periods:["AM","PM"], colorIdx:1, fromImport:false, demand:1 },
  { id:"act_school",code:"school",  label:"School / opleiding",    cat:"Opleiding",    kind:"dag", periods:["AM","PM"], colorIdx:3, fromImport:false, demand:1 },
];

/* -- Medewerkers ----------------------------------------------- */
/* activityIds = activiteiten waaraan deze persoon gekoppeld is.
   Leeg laten = inzetbaar op alle vrije (ongekoppelde) activiteiten. */
const S = (id, name, role, group, activityIds=[]) => ({
  id, name, role, group, contractHours:36,
  fixedOff:[], preferOff:[], activityIds, absences:[],
});

const INITIAL_STAFF = [
  S("cora",    "Cora",         "secretaresse", "Secretariaat"),

  S("wendy",   "Wendy",        "assistent",    "Assistenten"),
  S("mardy",   "Mardy",        "assistent",    "Assistenten"),
  S("celsey",  "Celsey",       "assistent",    "Assistenten"),
  S("mariska", "Mariska",      "assistent",    "Assistenten"),
  S("maaike",  "Maaike",       "assistent",    "Assistenten"),
  S("martine", "Martine",      "assistent",    "Assistenten"),
  S("rolendis","Rolendis",     "assistent",    "Assistenten"),

  S("francis", "Francis",      "assistent",    "Ondersteuning"),
  S("anita",   "Anita",        "assistent",    "Ondersteuning"),
  S("liesbeth","Liesbeth",     "pa_io",        "Ondersteuning"),
  S("sanne",   "Sanne",        "huidtherapeut","Ondersteuning", ["act_huidth"]),

  S("citgez",  "Dr. Citgez",       "dokter",   "Artsen", [ACT_WEEKDAY, ACT_WEEKEND]),
  S("jippes",  "Dr. Jippes",       "dokter",   "Artsen", [ACT_WEEKDAY, ACT_WEEKEND]),
  S("dijkst",  "Dr. Dijksterhuis", "dokter",   "Artsen", [ACT_WEEKDAY, ACT_WEEKEND]),
];

/* -- Demo dagplanning (week 22-06-2026) ------------------------ */
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

/* -- Dienst: week- en weekenddienst ---------------------------- */
export const DIENST_WEEK_STARTS = ["2026-06-22","2026-06-29","2026-07-06","2026-07-13"];
const _dwd = (start, off) => { const d=new Date(start+"T00:00:00"); d.setDate(d.getDate()+off); return d.toISOString().slice(0,10); };

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
const INITIAL_DIENST_WEEKEND = {};
const INITIAL_DIENST_CARRY = {
  weekday: { citgez:12, jippes:10, dijkst:11 },
  weekend: { citgez:4,  jippes:3,  dijkst:5  },
};

/* -- Migratie: oude masterdata (met skills) -> nieuw model ----- */
const SKILL_TO_ACT = {
  dienst_weekdag: ACT_WEEKDAY,
  dienst_weekend: ACT_WEEKEND,
  huidtherapie:   "act_huidth",
};
function migrateStaff(list) {
  return (list || []).map(s => {
    if (Array.isArray(s.activityIds)) return s;            // al nieuw model
    const activityIds = (s.skills || [])
      .map(k => SKILL_TO_ACT[k]).filter(Boolean);
    const { skills, ...rest } = s;
    return { ...rest, activityIds };
  });
}
function migrateActivities(list) {
  return (list || []).map(a => {
    const { skillId, ...rest } = a;
    const kind = a.kind || (a.id === ACT_WEEKDAY || a.id === ACT_WEEKEND ? "dienst" : "dag");
    const cat  = a.cat === "Klinisch" ? "Huidtherapeut" : a.cat;
    return { ...rest, kind, cat };
  });
}

/* -- Context --------------------------------------------------- */
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [staff,       setStaff]       = useState(INITIAL_STAFF);
  const [activities,  setActivities]  = useState(INITIAL_ACTIVITIES);
  const [dagplanning, setDagplanning] = useState(INITIAL_DAGPLANNING);
  const [notes,       setNotes]       = useState(INITIAL_NOTES);
  const [dienstWeekday, setDienstWeekday] = useState(INITIAL_DIENST_WEEKDAY);
  const [dienstWeekend, setDienstWeekend] = useState(INITIAL_DIENST_WEEKEND);
  const [dienstCarry, setDienstCarry]     = useState(INITIAL_DIENST_CARRY);
  const [solverUrl,   setSolverUrl]       = useState("");
  const [loaded,      setLoaded]          = useState(false);
  const [cloud,       setCloud]           = useState(firebaseReady ? "verbinden" : "lokaal");

  /* Activities CRUD */
  const addActivity    = (a)  => setActivities(p => [...p, { id:uuid(), code:"", demand:1, fromImport:false, periods:["AM","PM"], colorIdx:0, kind:"dag", ...a }]);
  const updateActivity = (u)  => setActivities(p => p.map(x => x.id===u.id ? u : x));
  const deleteActivity = (id) => {
    setActivities(p => p.filter(x => x.id!==id));
    setStaff(p => p.map(s => s.activityIds?.includes(id)
      ? { ...s, activityIds: s.activityIds.filter(a => a!==id) } : s));
    setDagplanning(p => {
      const next = { ...p };
      for (const k of Object.keys(next)) if (next[k]?.activityId === id) delete next[k];
      return next;
    });
  };

  /* Staff CRUD */
  const addStaff    = ()   => setStaff(p => [...p, {
    id:uuid(), name:"", role:"assistent", group:GROUPS[0], contractHours:36,
    fixedOff:[], preferOff:[], activityIds:[], absences:[],
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

  /* weekenddienst: altijd za+zo als één atomaire state-update behandelen */
  const _wePair = (date) => {
    const isSat = new Date(date + "T00:00:00").getDay() === 6;
    const other = new Date(date + "T00:00:00");
    other.setDate(other.getDate() + (isSat ? 1 : -1));
    return other.toISOString().slice(0, 10);
  };
  const setWeekendDuty    = (date, val) => setDienstWeekend(p => ({ ...p, [date]: val }));
  const setWeekendPair    = (date, val) => { const pair=_wePair(date); setDienstWeekend(p => ({ ...p, [date]: val, [pair]: val })); };
  const clearWeekendDuty  = (date)      => setDienstWeekend(p => { const n={...p}; delete n[date]; return n; });
  const clearWeekendPair  = (date)      => { const pair=_wePair(date); setDienstWeekend(p => { const n={...p}; delete n[date]; delete n[pair]; return n; }); };

  const weekdayDutyCount = (sid) => Object.values(dienstWeekday).filter(v => v?.staffId===sid).length;
  /* tel 0,5 per weekenddag (za=0,5 + zo=0,5 = 1,0 per volledig weekend) */
  const weekendDutyCount = (sid) =>
    Object.values(dienstWeekend).filter(v => v?.staffId === sid).length * 0.5;

  /* Dagplanning */
  const setDagAssign   = (key, value) => setDagplanning(p => ({ ...p, [key]: value }));
  const clearDagAssign = (key)        => setDagplanning(p => { const n={...p}; delete n[key]; return n; });

  /* Notities per week */
  const addNote    = (wk, note)      => setNotes(p => ({ ...p, [wk]: [...(p[wk]||[]), { id:uuid(), ...note }] }));
  const updateNote = (wk, id, patch) => setNotes(p => ({ ...p, [wk]: (p[wk]||[]).map(n => n.id===id ? {...n,...patch} : n) }));
  const deleteNote = (wk, id)        => setNotes(p => ({ ...p, [wk]: (p[wk]||[]).filter(n => n.id!==id) }));

  /* Impact-helpers */
  const activityUsage  = (id) => Object.values(dagplanning).filter(v => v?.activityId===id);
  const activityStaff  = (id) => staff.filter(s => s.activityIds?.includes(id));
  const staffPlanUsage = (id) => Object.keys(dagplanning).filter(k => k.split("__")[1]===id);

  /* -- Firestore: laden bij start ---------------------------- */
  useEffect(() => {
    if (!firebaseReady || !db) { setLoaded(true); return; }
    (async () => {
      try {
        const md = await getDoc(doc(db, "appdata", "masterdata"));
        if (md.exists()) {
          const d = md.data();
          if (d.staff) setStaff(migrateStaff(d.staff));
          if (d.activities) setActivities(migrateActivities(d.activities));
        }
        const pl = await getDoc(doc(db, "appdata", "planning"));
        if (pl.exists()) {
          const d = pl.data();
          setDagplanning(d.dagplanning || {});
          setNotes(d.notes || {});
          setDienstWeekday(d.dienstWeekday || {});
          setDienstWeekend(d.dienstWeekend || {});
          if (d.dienstCarry) setDienstCarry(d.dienstCarry);
        }
        const st = await getDoc(doc(db, "appdata", "settings"));
        if (st.exists() && st.data().solverUrl) setSolverUrl(st.data().solverUrl);
        setCloud("verbonden");
      } catch (e) {
        console.error("Laden uit Firestore mislukt:", e);
        setCloud("fout");
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  /* -- Firestore: opslaan bij wijziging (gedebounced) -------- */
  const save = (id, data) => {
    if (!firebaseReady || !db) return;
    setDoc(doc(db, "appdata", id), data)
      .then(() => setCloud("verbonden"))
      .catch((e) => { console.error("Opslaan mislukt:", e); setCloud("fout"); });
  };
  useEffect(() => {
    if (!loaded || !firebaseReady) return;
    const t = setTimeout(() => save("masterdata", { staff, activities }), 600);
    return () => clearTimeout(t);
  }, [staff, activities, loaded]);
  useEffect(() => {
    if (!loaded || !firebaseReady) return;
    const t = setTimeout(() => save("planning", { dagplanning, notes, dienstWeekday, dienstWeekend, dienstCarry }), 600);
    return () => clearTimeout(t);
  }, [dagplanning, notes, dienstWeekday, dienstWeekend, dienstCarry, loaded]);
  useEffect(() => {
    if (!loaded || !firebaseReady) return;
    const t = setTimeout(() => save("settings", { solverUrl }), 600);
    return () => clearTimeout(t);
  }, [solverUrl, loaded]);

  return (
    <AppContext.Provider value={{
      activities, addActivity, updateActivity, deleteActivity, activityUsage, activityStaff,
      staff, addStaff, updateStaff, deleteStaff, staffPlanUsage,
      dagplanning, setDagAssign, clearDagAssign,
      notes, addNote, updateNote, deleteNote,
      dienstWeekday, dienstWeekend, dienstCarry,
      setWeekdayDuty, clearWeekdayDuty, setWeekendDuty, clearWeekendDuty,
      setWeekendPair, clearWeekendPair,
      weekdayDutyCount, weekendDutyCount,
      solverUrl, setSolverUrl,
      loaded, cloud, firebaseReady,
      today,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
