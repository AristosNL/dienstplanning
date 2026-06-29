/**
 * ConfirmDialog.jsx
 *
 * Herbruikbare bevestigingsdialoog voor het verwijderen van masterdata.
 * Toont altijd:
 *   - wat er verwijderd wordt
 *   - welke impact dat heeft (impact-prop: lijst van strings)
 *   - een rode waarschuwing als er impact is
 *
 * Gebruik:
 *   <ConfirmDialog
 *     open={!!toDelete}
 *     title="Medewerker verwijderen"
 *     description="Weet je zeker dat je Citgez wilt verwijderen?"
 *     impact={["Ingepland in 4 diensten in juni"]}   // optioneel
 *     onConfirm={() => { doDelete(); setToDelete(null); }}
 *     onCancel={() => setToDelete(null)}
 *   />
 */

import { AlertTriangle, Trash2, X } from "lucide-react";
import C from "./tokens";


export default function ConfirmDialog({ open, title, description, impact = [], onConfirm, onCancel }) {
  if (!open) return null;

  const hasImpact = impact.length > 0;

  return (
    /* overlay */
    <div
      onClick={onCancel}
      style={{
        position:"fixed", inset:0, zIndex:1000,
        background:C.overlay,
        display:"flex", alignItems:"center", justifyContent:"center",
        padding:16,
      }}>
      {/* dialog */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:C.white, borderRadius:14, width:"100%", maxWidth:440,
          boxShadow:"0 20px 60px rgba(0,0,0,0.18)",
          overflow:"hidden",
        }}>
        {/* header */}
        <div style={{ padding:"18px 20px 14px", borderBottom:`1px solid ${C.line}`, display:"flex", alignItems:"flex-start", gap:12 }}>
          <div style={{ background:C.errLt, borderRadius:8, padding:8, flexShrink:0 }}>
            <Trash2 size={18} color={C.err} />
          </div>
          <div style={{ flex:1 }}>
            <h2 style={{ fontWeight:700, fontSize:15, color:C.ink, margin:0 }}>{title}</h2>
            <p style={{ color:C.sub, fontSize:13, marginTop:4, lineHeight:1.5 }}>{description}</p>
          </div>
          <button onClick={onCancel} style={{ color:C.sub, lineHeight:0, flexShrink:0 }}>
            <X size={18} />
          </button>
        </div>

        {/* impact */}
        {hasImpact && (
          <div style={{ padding:"12px 20px", background:C.warnLt, borderBottom:`1px solid ${C.warnBd}` }}>
            <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
              <AlertTriangle size={15} color={C.warn} style={{ flexShrink:0, marginTop:1 }} />
              <div>
                <p style={{ fontWeight:700, fontSize:12.5, color:"#92400e", marginBottom:5 }}>
                  Dit heeft gevolgen voor:
                </p>
                <ul style={{ margin:0, padding:"0 0 0 14px" }}>
                  {impact.map((line, i) => (
                    <li key={i} style={{ fontSize:12.5, color:"#78350f", lineHeight:1.6 }}>{line}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* footer */}
        <div style={{ padding:"14px 20px", display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              padding:"8px 18px", borderRadius:8, fontSize:13, fontWeight:600,
              border:`1px solid ${C.line}`, color:C.sub, background:C.white, cursor:"pointer",
            }}>
            Annuleren
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding:"8px 18px", borderRadius:8, fontSize:13, fontWeight:600,
              background:C.err, color:"#fff", border:"none", cursor:"pointer",
            }}>
            Definitief verwijderen
          </button>
        </div>
      </div>
    </div>
  );
}
