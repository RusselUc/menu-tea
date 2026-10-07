"use client";
import { useEffect, useState } from "react";
import { Crown, Trash2, UserPlus } from "lucide-react";
import {
  OWNER_EMAILS,
  addAdminEmail,
  getAdminEmails,
  isOwnerEmail,
  normalizeEmail,
  removeAdminEmail,
} from "@/lib/admins";
import { useAdminAuth } from "../../session";

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
  amber: "#B45309",
  amberBg: "#FFFBEB",
};

const inputStyle: React.CSSProperties = {
  flex: 1, minWidth: 0, height: 38, borderRadius: 8, border: `1px solid ${T.border}`,
  background: T.bg, padding: "0 12px", fontSize: 13, color: T.text,
  outline: "none", fontFamily: "var(--font-poppins)", boxSizing: "border-box",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AccesosPage() {
  const { user } = useAdminAuth();
  const [emails, setEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const myEmail = user?.email ? normalizeEmail(user.email) : null;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function load() {
    try {
      setEmails(await getAdminEmails());
    } catch {
      showToast("No se pudo cargar la lista");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const normalized = normalizeEmail(newEmail);
  const alreadyListed = isOwnerEmail(normalized) || emails.includes(normalized);
  const canAdd = EMAIL_RE.test(normalized) && !alreadyListed && !saving;

  async function handleAdd() {
    if (!canAdd) return;
    setSaving(true);
    try {
      await addAdminEmail(normalized);
      setNewEmail("");
      await load();
      showToast("Acceso agregado");
    } catch {
      showToast("No se pudo agregar");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(email: string) {
    setConfirmRemove(null);
    try {
      await removeAdminEmail(email);
      await load();
      showToast("Acceso eliminado");
    } catch {
      showToast("No se pudo eliminar");
    }
  }

  return (
    <div style={{ padding: "28px 24px 32px", maxWidth: 640, margin: "0 auto", fontFamily: "var(--font-poppins)" }}>
      {toast && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          background: T.white, color: T.text, border: `1px solid ${T.border}`,
          padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600,
          zIndex: 100, boxShadow: "0 4px 24px rgba(0,0,0,0.1)", whiteSpace: "nowrap",
        }}>
          {toast}
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: T.text, letterSpacing: "-0.02em" }}>
          Accesos
        </h1>
        <p style={{ margin: "3px 0 0", fontSize: 13, color: T.muted }}>
          Cuentas de Google que pueden entrar al panel
        </p>
      </div>

      {/* Agregar */}
      <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 18px", marginBottom: 16 }}>
        <p style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: T.text }}>Dar acceso</p>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="correo@gmail.com"
            autoCapitalize="none"
            style={inputStyle}
          />
          <button
            onClick={handleAdd}
            disabled={!canAdd}
            style={{
              display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
              height: 38, padding: "0 14px", borderRadius: 8, border: "none",
              background: T.text, color: T.white, fontSize: 13, fontWeight: 600,
              cursor: canAdd ? "pointer" : "not-allowed", opacity: canAdd ? 1 : 0.45,
              fontFamily: "var(--font-poppins)",
            }}
          >
            <UserPlus size={15} />
            {saving ? "Agregando..." : "Agregar"}
          </button>
        </div>
        {normalized && alreadyListed && (
          <p style={{ margin: "8px 0 0", fontSize: 12, color: T.muted }}>Ese correo ya tiene acceso.</p>
        )}
      </div>

      {/* Lista */}
      <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
        {OWNER_EMAILS.map((email) => (
          <Row key={email} email={email} isMe={email === myEmail}>
            <span style={{
              display: "flex", alignItems: "center", gap: 4,
              fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
              color: T.amber, background: T.amberBg, padding: "3px 8px", borderRadius: 999,
            }}>
              <Crown size={11} /> DUEÑO
            </span>
          </Row>
        ))}

        {loading ? (
          <p style={{ margin: 0, padding: "16px 18px", fontSize: 13, color: T.mutedLight }}>Cargando...</p>
        ) : (
          emails
            .filter((e) => !isOwnerEmail(e))
            .map((email) => (
              <Row key={email} email={email} isMe={email === myEmail}>
                {confirmRemove === email ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => setConfirmRemove(null)} style={smallBtn(T.slate, T.secondary)}>
                      No
                    </button>
                    <button onClick={() => handleRemove(email)} style={smallBtn(T.rose, T.white)}>
                      Quitar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmRemove(email)}
                    disabled={email === myEmail}
                    title={email === myEmail ? "No puedes quitarte a ti mismo" : "Quitar acceso"}
                    style={{
                      background: "none", border: "none", padding: 6, display: "flex",
                      color: T.mutedLight, cursor: email === myEmail ? "not-allowed" : "pointer",
                      opacity: email === myEmail ? 0.35 : 1,
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </Row>
            ))
        )}
      </div>

      <p style={{ margin: "12px 4px 0", fontSize: 12, color: T.mutedLight, lineHeight: 1.5 }}>
        Los dueños se configuran en la variable <code>NEXT_PUBLIC_ADMIN_EMAILS</code> y no se pueden quitar desde aquí.
      </p>
    </div>
  );
}

function smallBtn(bg: string, color: string): React.CSSProperties {
  return {
    height: 30, padding: "0 12px", borderRadius: 7, border: "none",
    background: bg, color, fontSize: 12, fontWeight: 600, cursor: "pointer",
    fontFamily: "var(--font-poppins)",
  };
}

function Row({ email, isMe, children }: { email: string; isMe: boolean; children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      padding: "12px 18px", borderBottom: `1px solid ${T.slate}`,
    }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 500, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {email}
        </p>
        {isMe && <p style={{ margin: "1px 0 0", fontSize: 11, color: T.mutedLight }}>Tú</p>}
      </div>
      {children}
    </div>
  );
}
