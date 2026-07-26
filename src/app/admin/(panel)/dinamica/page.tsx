"use client";
import { useEffect, useState } from "react";
import {
  ExpressDynamic,
  ExpressParticipant,
  ExpressQuestion,
  QuestionType,
  createDynamic,
  deactivateDynamic,
  deleteDynamic,
  getDynamic,
  getDynamics,
  getParticipants,
  resetWinners,
  setActiveDynamic,
  setParticipantCoupon,
  updateDynamic,
} from "@/lib/express";
import { uploadMenuImageSupabase } from "@/lib/supabase";
import { Coupon, getCouponStatusLabel, getCoupons } from "@/lib/coupons";
import Link from "next/link";
import { MessageCircle } from "lucide-react";

const T = {
  bg: "#F8FAFC",
  white: "#FFFFFF",
  border: "#E2E8F0",
  text: "#0F172A",
  secondary: "#334155",
  muted: "#64748B",
  mutedLight: "#94A3B8",
  slate: "#F1F5F9",
  rose: "#E11D48",
  roseBg: "#FFF1F2",
  roseBorder: "#FECDD3",
  green: "#059669",
  greenBg: "#ECFDF5",
  greenBorder: "#A7F3D0",
  olive: "#65A30D",
  oliveBg: "#F7FEE7",
  oliveBorder: "#BEF264",
};

function newQuestion(): ExpressQuestion {
  return {
    id: crypto.randomUUID(),
    text: "",
    type: "multiple",
    options: ["", ""],
    correctIndex: 0,
  };
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

// Misma normalizacion que registerParticipant() en src/lib/express.ts, solo
// para mostrar aqui si una respuesta abierta calificada quedo correcta.
function normalizeAnswerText(s: string) {
  return s.trim().toUpperCase();
}

const COUPON_STATUS_STYLE: Record<ReturnType<typeof getCouponStatusLabel>, { bg: string; border: string; color: string }> = {
  VIGENTE: { bg: T.greenBg, border: T.greenBorder, color: T.green },
  PROGRAMADO: { bg: T.roseBg, border: T.roseBorder, color: T.rose },
  EXPIRADO: { bg: T.slate, border: T.border, color: T.mutedLight },
  AGOTADO: { bg: T.slate, border: T.border, color: T.mutedLight },
  DESACTIVADO: { bg: T.slate, border: T.border, color: T.muted },
};

function couponSummary(c: Coupon): string {
  if (c.discountType === "fixed") return `-$${c.discountValue}`;
  if (c.discountType === "percentage") return `-${c.discountValue}%`;
  return `${c.maxFreeItems ?? 1} gratis`;
}

function couponHeadline(c: Coupon): string {
  if (c.discountType === "fixed") return `$${c.discountValue} de descuento`;
  if (c.discountType === "percentage") return `${c.discountValue}% de descuento`;
  const n = c.maxFreeItems ?? 1;
  return `${n} bebida${n !== 1 ? "s" : ""} gratis`;
}

function formatCouponDate(ms: number): string {
  return new Date(ms).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

export default function DinamicaExpressPage() {
  const [view, setView] = useState<"list" | "edit">("list");
  const [dynamics, setDynamics] = useState<ExpressDynamic[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const [current, setCurrent] = useState<ExpressDynamic | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<ExpressQuestion[]>([]);
  const [questionImageFiles, setQuestionImageFiles] = useState<Record<string, File>>({});
  const [questionImagePreviews, setQuestionImagePreviews] = useState<Record<string, string>>({});
  const [maxWinners, setMaxWinners] = useState("");
  const [showClaimButton, setShowClaimButton] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [participants, setParticipants] = useState<ExpressParticipant[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [expandedParticipantId, setExpandedParticipantId] = useState<string | null>(null);
  const [couponPickerId, setCouponPickerId] = useState<string | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);

  useEffect(() => { loadList(); }, []);

  function showToast(msg: string, duration = 2500) {
    setToast(msg);
    setTimeout(() => setToast(null), duration);
  }

  async function loadList() {
    setLoadingList(true);
    const list = await getDynamics();
    setDynamics(list);
    setLoadingList(false);
  }

  async function openEdit(dynamic: ExpressDynamic) {
    setCurrent(dynamic);
    setTitle(dynamic.title);
    setDescription(dynamic.description ?? "");
    setQuestions(dynamic.questions.length ? dynamic.questions : [newQuestion()]);
    setQuestionImageFiles({});
    setQuestionImagePreviews(
      Object.fromEntries(dynamic.questions.filter((q) => q.imageUrl).map((q) => [q.id, q.imageUrl as string]))
    );
    setMaxWinners(dynamic.maxWinners ? String(dynamic.maxWinners) : "");
    setShowClaimButton(dynamic.showClaimButton ?? true);
    setView("edit");
    setParticipantsLoading(true);
    getParticipants(dynamic.id).then((p) => {
      setParticipants(p);
      setParticipantsLoading(false);
    });
    setCouponsLoading(true);
    getCoupons().then((c) => {
      setCoupons(c);
      setCouponsLoading(false);
    });
  }

  async function handleCreate() {
    const id = await createDynamic({ title: "Nueva dinámica", description: "", questions: [] });
    await loadList();
    const created = await getDynamics();
    const found = created.find((d) => d.id === id);
    if (found) openEdit(found);
  }

  function goBack() {
    setView("list");
    setCurrent(null);
    setParticipants([]);
    loadList();
  }

  function updateQuestion(id: string, patch: Partial<ExpressQuestion>) {
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }

  function setQuestionType(id: string, type: QuestionType) {
    updateQuestion(id, type === "multiple"
      ? { type, options: ["", ""], correctIndex: 0, correctAnswer: undefined }
      : { type, options: undefined, correctIndex: undefined });
  }

  function addOption(id: string) {
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, options: [...(q.options ?? []), ""] } : q)));
  }

  function updateOption(id: string, optIdx: number, value: string) {
    setQuestions((qs) => qs.map((q) => {
      if (q.id !== id) return q;
      const options = [...(q.options ?? [])];
      options[optIdx] = value;
      return { ...q, options };
    }));
  }

  function removeOption(id: string, optIdx: number) {
    setQuestions((qs) => qs.map((q) => {
      if (q.id !== id) return q;
      const options = (q.options ?? []).filter((_, i) => i !== optIdx);
      const correctIndex = q.correctIndex === optIdx ? 0 : q.correctIndex;
      return { ...q, options, correctIndex };
    }));
  }

  function addQuestion() {
    setQuestions((qs) => [...qs, newQuestion()]);
  }

  function removeQuestion(id: string) {
    setQuestions((qs) => qs.filter((q) => q.id !== id));
    setQuestionImageFiles((prev) => { const next = { ...prev }; delete next[id]; return next; });
    setQuestionImagePreviews((prev) => { const next = { ...prev }; delete next[id]; return next; });
  }

  function handleQuestionImageChange(id: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setQuestionImageFiles((prev) => ({ ...prev, [id]: file }));
    setQuestionImagePreviews((prev) => ({ ...prev, [id]: URL.createObjectURL(file) }));
  }

  function handleRemoveQuestionImage(id: string) {
    setQuestionImageFiles((prev) => { const next = { ...prev }; delete next[id]; return next; });
    setQuestionImagePreviews((prev) => { const next = { ...prev }; delete next[id]; return next; });
    updateQuestion(id, { imageUrl: undefined });
  }

  const canSave =
    title.trim().length > 0 &&
    questions.length > 0 &&
    questions.every((q) =>
      q.text.trim().length > 0 &&
      (q.type === "open" || ((q.options ?? []).filter((o) => o.trim().length > 0).length >= 2))
    );

  async function handleSave() {
    if (!current || !canSave || saving) return;
    setSaving(true);
    const uploadedUrls: Record<string, string> = {};
    for (const [qId, file] of Object.entries(questionImageFiles)) {
      uploadedUrls[qId] = await uploadMenuImageSupabase(file, `express/${current.id}`, qId);
    }
    const cleaned: ExpressQuestion[] = questions.map((q) => {
      const imageUrl = uploadedUrls[q.id] ?? q.imageUrl;
      if (q.type === "open") {
        const correctAnswer = q.correctAnswer?.trim();
        return { id: q.id, text: q.text.trim(), type: "open", ...(imageUrl ? { imageUrl } : {}), ...(correctAnswer ? { correctAnswer } : {}) };
      }
      const trimmedOptions = (q.options ?? []).map((o) => o.trim());
      const correctText = trimmedOptions[q.correctIndex ?? 0];
      const options = trimmedOptions.filter((o) => o.length > 0);
      const correctIndex = Math.max(0, options.indexOf(correctText));
      return { id: q.id, text: q.text.trim(), type: "multiple", options, correctIndex, ...(imageUrl ? { imageUrl } : {}) };
    });
    const parsedMax = maxWinners.trim().length > 0 ? Math.max(1, parseInt(maxWinners, 10)) : undefined;
    const wasActive = current.active;
    await updateDynamic(current.id, {
      title: title.trim(),
      description: description.trim(),
      questions: cleaned,
      maxWinners: parsedMax ?? null,
      showClaimButton,
    });
    setQuestionImageFiles({});
    // Se relee de Firestore porque updateDynamic() puede concluir la dinámica
    // sola si el nuevo maxWinners ya fue alcanzado por el winnersCount actual
    // (ej. se te olvidó ponerle límite y ya lleva 3 ganadores) — así el admin
    // ve de inmediato que se cerró, sin tener que refrescar la página.
    const refreshed = await getDynamic(current.id);
    setSaving(false);
    if (refreshed) {
      setCurrent(refreshed);
      if (wasActive && !refreshed.active) {
        showToast("Cambios guardados — la dinámica se cerró sola: ya se había alcanzado el nuevo cupo de ganadores", 4500);
      } else {
        showToast("Cambios guardados");
      }
    } else {
      showToast("Cambios guardados");
    }
  }

  async function handleToggleActive() {
    if (!current) return;
    setActivating(true);
    if (current.active) {
      await deactivateDynamic(current.id);
      setCurrent({ ...current, active: false });
    } else {
      await setActiveDynamic(current.id);
      setCurrent({ ...current, active: true });
    }
    setActivating(false);
  }

  async function handleResetWinners() {
    if (!current || resetting) return;
    setResetting(true);
    await resetWinners(current.id);
    setCurrent({ ...current, winnersCount: 0, concludedAt: null });
    setResetting(false);
    showToast("Contador de ganadores reiniciado");
  }

  function sendCouponWhatsApp(p: ExpressParticipant, c: Coupon) {
    const msg = encodeURIComponent(
      `¡Hola ${p.name.trim()}! 🎉 Ganaste en la dinámica "${current?.title ?? ""}" de Té Sueño.\n\n` +
      `🎁 Tu premio: ${couponHeadline(c)}\n` +
      `Código: ${c.code}\n` +
      `Válido hasta ${formatCouponDate(c.endDate)}`
    );
    window.open(`https://wa.me/52${p.phone}?text=${msg}`, "_blank");
  }

  function findCouponByCode(code: string): Coupon | undefined {
    return coupons.find((c) => c.code === code || c.id === code);
  }

  async function handleSelectCoupon(p: ExpressParticipant, c: Coupon) {
    await setParticipantCoupon(p.id, c.code);
    setParticipants((prev) => prev.map((x) => (x.id === p.id ? { ...x, couponCode: c.code } : x)));
    sendCouponWhatsApp(p, c);
    setCouponPickerId(null);
  }

  async function handleDelete() {
    if (!current) return;
    if (!confirm(`¿Eliminar "${current.title}"? Esta acción no se puede deshacer.`)) return;
    await deleteDynamic(current.id);
    goBack();
  }

  return (
    <div style={{ padding: "28px 24px 32px", maxWidth: 640, margin: "0 auto", fontFamily: "var(--font-poppins)" }}>
      {toast && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          background: T.white, color: T.text, border: `1px solid ${T.border}`,
          padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600,
          zIndex: 100, boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
          maxWidth: "calc(100vw - 32px)", width: "max-content", textAlign: "center",
        }}>
          {toast}
        </div>
      )}

      {view === "list" && (
        <>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: T.text, letterSpacing: "-0.02em" }}>
                Dinámica Express
              </h1>
              <p style={{ margin: "3px 0 0", fontSize: 13, color: T.muted }}>
                Preguntas de cultura general para tus clientes
              </p>
            </div>
            <button
              onClick={handleCreate}
              style={{
                height: 38, padding: "0 16px", borderRadius: 9, border: "none",
                background: T.text, color: T.white, fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "var(--font-poppins)", flexShrink: 0,
              }}
            >
              + Nueva
            </button>
          </div>

          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
            {loadingList ? (
              <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                {[1, 2].map((i) => <div key={i} style={{ height: 60, borderRadius: 8, background: T.slate }} />)}
              </div>
            ) : dynamics.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 13, color: T.mutedLight }}>
                  Aún no has creado ninguna dinámica
                </p>
              </div>
            ) : (
              dynamics.map((d, idx) => (
                <button
                  key={d.id}
                  onClick={() => openEdit(d)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                    gap: 12, padding: "14px 20px", background: "transparent",
                    border: "none", borderBottom: idx < dynamics.length - 1 ? `1px solid ${T.border}` : "none",
                    cursor: "pointer", textAlign: "left", fontFamily: "var(--font-poppins)",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{d.title || "Sin título"}</span>
                      {d.active && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, background: T.greenBg, color: T.green,
                          border: `1px solid ${T.greenBorder}`, borderRadius: 4, padding: "1px 6px",
                        }}>
                          ACTIVA
                        </span>
                      )}
                      {!d.active && d.concludedAt && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, background: T.roseBg, color: T.rose,
                          border: `1px solid ${T.roseBorder}`, borderRadius: 4, padding: "1px 6px",
                        }}>
                          CONCLUIDA
                        </span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: T.mutedLight }}>
                      {d.questions.length} pregunta{d.questions.length !== 1 ? "s" : ""}
                      {d.maxWinners ? ` · ${d.winnersCount}/${d.maxWinners} ganadores` : ""} · {formatDate(d.createdAt)}
                    </p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.mutedLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              ))
            )}
          </div>
        </>
      )}

      {view === "edit" && current && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <button
              onClick={goBack}
              style={{
                width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                border: `1px solid ${T.border}`, background: T.white,
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 12, color: T.muted, fontWeight: 500 }}>Dinámica Express</p>
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.text, letterSpacing: "-0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {current.title || "Sin título"}
              </h1>
            </div>
          </div>

          {/* Activación */}
          <div style={{
            background: current.active ? T.greenBg : T.white, border: `1px solid ${current.active ? T.greenBorder : T.border}`,
            borderRadius: 12, padding: "14px 18px", marginBottom: 12,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          }}>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: current.active ? T.green : T.text }}>
                {current.active ? "Activa para los clientes" : current.concludedAt ? "Concluida automáticamente" : "No está activa"}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: T.muted }}>
                {current.active
                  ? "Los clientes pueden verla en /dinamica"
                  : current.concludedAt
                  ? "Se alcanzó el máximo de ganadores configurado"
                  : "Actívala para que aparezca en /dinamica"}
              </p>
            </div>
            <button
              onClick={handleToggleActive}
              disabled={activating}
              style={{
                height: 34, padding: "0 14px", borderRadius: 8, flexShrink: 0,
                border: `1px solid ${current.active ? T.roseBorder : T.border}`,
                background: current.active ? T.roseBg : T.text,
                color: current.active ? T.rose : T.white,
                fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-poppins)",
                opacity: activating ? 0.6 : 1,
              }}
            >
              {current.active ? "Desactivar" : "Activar"}
            </button>
          </div>

          {/* Límite de ganadores */}
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 20px", marginBottom: 12 }}>
            <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Máximo de ganadores
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <input
                type="number"
                min={1}
                value={maxWinners}
                onChange={(e) => setMaxWinners(e.target.value)}
                placeholder="Sin límite"
                style={{
                  width: 110, height: 36, borderRadius: 8, border: `1px solid ${T.border}`,
                  background: T.bg, padding: "0 12px", fontSize: 13, color: T.text,
                  outline: "none", fontFamily: "var(--font-poppins)", boxSizing: "border-box",
                }}
              />
              <span style={{ fontSize: 12, color: T.muted }}>
                {current.winnersCount} ganador{current.winnersCount !== 1 ? "es" : ""} hasta ahora
              </span>
            </div>
            <p style={{ margin: "0 0 10px", fontSize: 10.5, color: T.mutedLight }}>
              Al llegar a este número de ganadores, la dinámica se desactiva sola. Déjalo vacío para no poner límite.
            </p>
            {current.winnersCount > 0 && (
              <button
                onClick={handleResetWinners}
                disabled={resetting}
                style={{
                  border: "none", background: "transparent", color: T.muted,
                  fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-poppins)",
                  padding: 0, textDecoration: "underline",
                }}
              >
                {resetting ? "Reiniciando..." : "Reiniciar contador de ganadores"}
              </button>
            )}
          </div>

          {/* Botón de reclamo automático */}
          <div style={{
            background: T.white, border: `1px solid ${T.border}`, borderRadius: 12,
            padding: "16px 20px", marginBottom: 12,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          }}>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.text }}>
                Botón para reclamar premio
              </p>
              <p style={{ margin: "3px 0 0", fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>
                {showClaimButton
                  ? "El ganador ve un botón para reclamar su premio por WhatsApp de inmediato."
                  : "El ganador no ve ningún botón — ustedes deciden cuándo contactarlo para entregar el premio."}
              </p>
            </div>
            <button
              onClick={() => setShowClaimButton((v) => !v)}
              role="switch"
              aria-checked={showClaimButton}
              style={{
                width: 44, height: 26, borderRadius: 999, flexShrink: 0, border: "none", cursor: "pointer",
                background: showClaimButton ? T.olive : T.border,
                position: "relative", transition: "background 0.2s",
              }}
            >
              <span style={{
                position: "absolute", top: 3, left: showClaimButton ? 21 : 3,
                width: 20, height: 20, borderRadius: "50%", background: T.white,
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.2s",
              }} />
            </button>
          </div>

          {/* Título y descripción */}
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 20px", marginBottom: 12 }}>
            <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Título
            </p>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Dinámica Express de la semana"
              style={{
                width: "100%", height: 38, borderRadius: 8, border: `1px solid ${T.border}`,
                background: T.bg, padding: "0 12px", fontSize: 14, color: T.text,
                outline: "none", fontFamily: "var(--font-poppins)", boxSizing: "border-box", marginBottom: 14,
              }}
            />
            <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Descripción (opcional)
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instrucciones cortas para el cliente"
              rows={2}
              style={{
                width: "100%", borderRadius: 8, border: `1px solid ${T.border}`,
                background: T.bg, padding: "10px 12px", fontSize: 13, color: T.text,
                outline: "none", fontFamily: "var(--font-poppins)", resize: "vertical", boxSizing: "border-box",
              }}
            />
          </div>

          {/* Preguntas */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
            {questions.map((q, qIdx) => (
              <div key={q.id} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: T.mutedLight }}>PREGUNTA {qIdx + 1}</p>
                  {questions.length > 1 && (
                    <button
                      onClick={() => removeQuestion(q.id)}
                      style={{ border: "none", background: "transparent", color: T.rose, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-poppins)" }}
                    >
                      Eliminar
                    </button>
                  )}
                </div>

                <input
                  value={q.text}
                  onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                  placeholder="Escribe la pregunta"
                  style={{
                    width: "100%", height: 38, borderRadius: 8, border: `1px solid ${T.border}`,
                    background: T.bg, padding: "0 12px", fontSize: 13, color: T.text,
                    outline: "none", fontFamily: "var(--font-poppins)", boxSizing: "border-box", marginBottom: 10,
                  }}
                />

                <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                  {(["multiple", "open"] as QuestionType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setQuestionType(q.id, t)}
                      style={{
                        flex: 1, height: 32, borderRadius: 7,
                        border: `1px solid ${q.type === t ? T.text : T.border}`,
                        background: q.type === t ? T.text : T.white,
                        color: q.type === t ? T.white : T.muted,
                        fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-poppins)",
                      }}
                    >
                      {t === "multiple" ? "Opción múltiple" : "Respuesta abierta"}
                    </button>
                  ))}
                </div>

                {q.type === "multiple" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {(q.options ?? []).map((opt, optIdx) => (
                      <div key={optIdx} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button
                          onClick={() => updateQuestion(q.id, { correctIndex: optIdx })}
                          title="Marcar como correcta"
                          style={{
                            width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                            border: `1.5px solid ${q.correctIndex === optIdx ? T.olive : T.border}`,
                            background: q.correctIndex === optIdx ? T.oliveBg : T.white,
                            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                          }}
                        >
                          {q.correctIndex === optIdx && (
                            <div style={{ width: 9, height: 9, borderRadius: "50%", background: T.olive }} />
                          )}
                        </button>
                        <input
                          value={opt}
                          onChange={(e) => updateOption(q.id, optIdx, e.target.value)}
                          placeholder={`Opción ${optIdx + 1}`}
                          style={{
                            flex: 1, height: 34, borderRadius: 7, border: `1px solid ${T.border}`,
                            background: T.bg, padding: "0 10px", fontSize: 12.5, color: T.text,
                            outline: "none", fontFamily: "var(--font-poppins)", boxSizing: "border-box",
                          }}
                        />
                        {(q.options ?? []).length > 2 && (
                          <button
                            onClick={() => removeOption(q.id, optIdx)}
                            style={{ border: "none", background: "transparent", color: T.mutedLight, fontSize: 16, cursor: "pointer", flexShrink: 0, lineHeight: 1 }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => addOption(q.id)}
                      style={{
                        alignSelf: "flex-start", border: "none", background: "transparent",
                        color: T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer",
                        fontFamily: "var(--font-poppins)", padding: "4px 0",
                      }}
                    >
                      + Agregar opción
                    </button>
                    <p style={{ margin: "2px 0 0", fontSize: 10.5, color: T.mutedLight }}>
                      Toca el círculo para marcar la respuesta correcta
                    </p>
                  </div>
                )}

                {q.type === "open" && (
                  <div>
                    <input
                      value={q.correctAnswer ?? ""}
                      onChange={(e) => updateQuestion(q.id, { correctAnswer: e.target.value })}
                      placeholder="Respuesta correcta (opcional)"
                      style={{
                        width: "100%", height: 34, borderRadius: 7, border: `1px solid ${T.border}`,
                        background: T.bg, padding: "0 10px", fontSize: 12.5, color: T.text,
                        outline: "none", fontFamily: "var(--font-poppins)", boxSizing: "border-box",
                      }}
                    />
                    <p style={{ margin: "6px 0 0", fontSize: 10.5, color: T.mutedLight }}>
                      Si la defines, esta pregunta calificará sola: se compara sin distinguir mayúsculas/minúsculas, pero la ortografía debe coincidir exactamente. Déjala vacía para solo recolectar la respuesta sin calificarla.
                    </p>
                  </div>
                )}

                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.slate}` }}>
                  <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Imagen (opcional)
                  </p>
                  {questionImagePreviews[q.id] ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <img
                        src={questionImagePreviews[q.id]}
                        alt=""
                        style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover", border: `1px solid ${T.border}`, flexShrink: 0 }}
                      />
                      <label style={{ fontSize: 12, fontWeight: 600, color: T.text, cursor: "pointer", fontFamily: "var(--font-poppins)" }}>
                        Cambiar
                        <input type="file" accept="image/*" onChange={(e) => handleQuestionImageChange(q.id, e)} style={{ display: "none" }} />
                      </label>
                      <button
                        onClick={() => handleRemoveQuestionImage(q.id)}
                        style={{ border: "none", background: "transparent", color: T.rose, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-poppins)" }}
                      >
                        Quitar
                      </button>
                    </div>
                  ) : (
                    <label style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      height: 32, padding: "0 12px", borderRadius: 7,
                      border: `1px dashed ${T.border}`, color: T.muted, fontSize: 12, fontWeight: 600,
                      cursor: "pointer", fontFamily: "var(--font-poppins)",
                    }}>
                      + Agregar imagen
                      <input type="file" accept="image/*" onChange={(e) => handleQuestionImageChange(q.id, e)} style={{ display: "none" }} />
                    </label>
                  )}
                </div>
              </div>
            ))}

            <button
              onClick={addQuestion}
              style={{
                height: 40, borderRadius: 9, border: `1px dashed ${T.border}`,
                background: T.white, color: T.muted, fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "var(--font-poppins)",
              }}
            >
              + Agregar pregunta
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            style={{
              width: "100%", height: 44, borderRadius: 9, border: "none",
              background: !canSave || saving ? T.slate : T.text,
              color: !canSave || saving ? T.mutedLight : T.white,
              fontSize: 14, fontWeight: 600, cursor: !canSave || saving ? "not-allowed" : "pointer",
              fontFamily: "var(--font-poppins)", marginBottom: 24,
            }}
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>

          {/* Participantes */}
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.text }}>Participantes</p>
              <span style={{ fontSize: 12, color: T.mutedLight }}>{participants.length}</span>
            </div>
            {participantsLoading ? (
              <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                {[1, 2].map((i) => <div key={i} style={{ height: 40, borderRadius: 8, background: T.slate }} />)}
              </div>
            ) : participants.length === 0 ? (
              <div style={{ padding: "24px 20px", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 12.5, color: T.mutedLight }}>Aún no hay participantes</p>
              </div>
            ) : (
              participants.map((p, idx) => {
                const expanded = expandedParticipantId === p.id;
                return (
                  <div key={p.id} style={{ borderBottom: idx < participants.length - 1 ? `1px solid ${T.border}` : "none" }}>
                    <button
                      onClick={() => setExpandedParticipantId(expanded ? null : p.id)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                        padding: "12px 20px", background: "transparent", border: "none", cursor: "pointer",
                        textAlign: "left", fontFamily: "var(--font-poppins)",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.text }}>{p.name}</p>
                        <p style={{ margin: "1px 0 0", fontSize: 11.5, color: T.mutedLight }}>
                          {p.phone} · {formatDate(p.timestamp)}
                        </p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        {p.totalGraded > 0 && (
                          <span style={{ fontSize: 11.5, color: T.muted }}>{p.correctCount}/{p.totalGraded}</span>
                        )}
                        {p.won && (
                          <span style={{
                            fontSize: 10, fontWeight: 700, background: T.oliveBg, color: T.olive,
                            border: `1px solid ${T.oliveBorder}`, borderRadius: 4, padding: "1px 6px",
                          }}>
                            GANÓ
                          </span>
                        )}
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.mutedLight} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                          style={{ flexShrink: 0, transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                    </button>

                    {p.won && (
                      <div style={{ padding: "0 20px 14px" }}>
                        {p.couponCode ? (
                          <div style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                            background: T.oliveBg, border: `1px solid ${T.oliveBorder}`, borderRadius: 8, padding: "7px 12px",
                          }}>
                            <span style={{ fontSize: 11.5, fontWeight: 600, color: T.olive }}>
                              Cupón enviado: {p.couponCode}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const coupon = findCouponByCode(p.couponCode as string);
                                if (coupon) sendCouponWhatsApp(p, coupon);
                                else showToast("No se encontró ese cupón — puede que se haya eliminado");
                              }}
                              style={{
                                border: "none", background: "transparent", color: T.olive,
                                fontSize: 11.5, fontWeight: 700, cursor: "pointer",
                                fontFamily: "var(--font-poppins)", textDecoration: "underline", padding: 0,
                              }}
                            >
                              Reenviar
                            </button>
                          </div>
                        ) : couponPickerId === p.id ? (
                          <div style={{
                            background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8,
                            padding: 10, display: "flex", flexDirection: "column", gap: 6,
                          }}>
                            {couponsLoading ? (
                              <p style={{ margin: "4px 0", fontSize: 12, color: T.mutedLight, textAlign: "center" }}>
                                Cargando cupones...
                              </p>
                            ) : coupons.length === 0 ? (
                              <div style={{ padding: "6px 4px", textAlign: "center" }}>
                                <p style={{ margin: "0 0 6px", fontSize: 12, color: T.mutedLight }}>
                                  Aún no has creado ningún cupón.
                                </p>
                                <Link
                                  href="/admin/cupones"
                                  style={{ fontSize: 12, fontWeight: 600, color: T.rose, textDecoration: "underline" }}
                                >
                                  Crear un cupón →
                                </Link>
                              </div>
                            ) : (
                              <div style={{ maxHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 5 }}>
                                {coupons.map((c) => {
                                  const status = getCouponStatusLabel(c);
                                  const style = COUPON_STATUS_STYLE[status];
                                  return (
                                    <button
                                      key={c.id}
                                      type="button"
                                      onClick={() => handleSelectCoupon(p, c)}
                                      style={{
                                        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                                        height: 40, padding: "0 10px", borderRadius: 7,
                                        border: `1px solid ${T.border}`, background: T.white,
                                        cursor: "pointer", fontFamily: "var(--font-poppins)", textAlign: "left",
                                      }}
                                    >
                                      <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                                        <span style={{ fontSize: 12.5, fontWeight: 700, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                          {c.code}
                                        </span>
                                        <span style={{
                                          fontSize: 9.5, fontWeight: 700, borderRadius: 4, padding: "1px 5px", flexShrink: 0,
                                          background: style.bg, color: style.color, border: `1px solid ${style.border}`,
                                        }}>
                                          {status}
                                        </span>
                                      </span>
                                      <span style={{ fontSize: 12, fontWeight: 700, color: T.olive, flexShrink: 0 }}>
                                        {couponSummary(c)}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => setCouponPickerId(null)}
                              style={{
                                height: 30, borderRadius: 7,
                                border: `1px solid ${T.border}`, background: T.white, color: T.muted,
                                fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-poppins)",
                              }}
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setCouponPickerId(p.id)}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 6,
                              height: 30, padding: "0 12px", borderRadius: 7,
                              border: `1px solid ${T.oliveBorder}`, background: T.oliveBg, color: T.olive,
                              fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-poppins)",
                            }}
                          >
                            <MessageCircle size={13} />
                            Enviar cupón por WhatsApp
                          </button>
                        )}
                      </div>
                    )}

                    {expanded && (
                      <div style={{ padding: "0 20px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                        {current.questions.map((q, qIdx) => {
                          const a = p.answers.find((ans) => ans.questionId === q.id);
                          const rawValue = a?.value ?? "";
                          const displayValue = q.type === "multiple"
                            ? (q.options ?? [])[Number(rawValue)] ?? "(sin responder)"
                            : rawValue || "(sin responder)";
                          const isGraded = q.type === "multiple" || !!q.correctAnswer?.trim();
                          const isCorrect = q.type === "multiple"
                            ? Number(rawValue) === q.correctIndex
                            : isGraded && normalizeAnswerText(rawValue) === normalizeAnswerText(q.correctAnswer ?? "");
                          return (
                            <div key={q.id} style={{ background: T.bg, borderRadius: 8, padding: "10px 12px" }}>
                              <p style={{ margin: "0 0 4px", fontSize: 11.5, fontWeight: 600, color: T.mutedLight }}>
                                {qIdx + 1}. {q.text}
                              </p>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <p style={{ margin: 0, fontSize: 13, color: T.text, flex: 1 }}>{displayValue}</p>
                                {isGraded && (
                                  <span style={{
                                    fontSize: 10, fontWeight: 700, borderRadius: 4, padding: "1px 6px", flexShrink: 0,
                                    background: isCorrect ? T.oliveBg : T.roseBg,
                                    color: isCorrect ? T.olive : T.rose,
                                    border: `1px solid ${isCorrect ? T.oliveBorder : T.roseBorder}`,
                                  }}>
                                    {isCorrect ? "CORRECTA" : "INCORRECTA"}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={handleDelete}
            style={{
              width: "100%", height: 38, borderRadius: 9,
              border: `1px solid ${T.roseBorder}`, background: T.roseBg, color: T.rose,
              fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-poppins)",
            }}
          >
            Eliminar dinámica
          </button>
        </>
      )}
    </div>
  );
}
