"use client";
import { useEffect, useState } from "react";
import { Check, Trash2, UserPlus } from "lucide-react";
import {
  AdminUser,
  OWNER_EMAILS,
  approveAdminUser,
  deleteAdminUser,
  grantAdminAccess,
  isOwnerEmail,
  normalizeEmail,
  subscribeToAdminUsers,
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
  green: "#059669",
  greenBg: "#ECFDF5",
};

const inputStyle: React.CSSProperties = {
  flex: 1, minWidth: 0, height: 38, borderRadius: 8, border: `1px solid ${T.border}`,
  background: T.bg, padding: "0 12px", fontSize: 13, color: T.text,
  outline: "none", fontFamily: "var(--font-poppins)", boxSizing: "border-box",
};

const sectionLabel: React.CSSProperties = {
  margin: "0 4px 8px", fontSize: 11, fontWeight: 600, color: T.muted,
  textTransform: "uppercase", letterSpacing: "0.04em",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function AccesosPage() {
  const { user } = useAdminAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const myEmail = user?.email ? normalizeEmail(user.email) : null;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  useEffect(
    () =>
      subscribeToAdminUsers(
        (list) => {
          setUsers(list.filter((u) => !isOwnerEmail(u.email)));
          setLoading(false);
        },
        () => {
          setLoading(false);
          showToast("No se pudo cargar la lista");
        }
      ),
    []
  );

  const pending = users.filter((u) => u.status === "pending");
  const approved = users.filter((u) => u.status === "approved");

  const normalized = normalizeEmail(newEmail);
  const existing = users.find((u) => u.email === normalized);
  const alreadyAdmin = isOwnerEmail(normalized) || existing?.status === "approved";
  const canAdd = EMAIL_RE.test(normalized) && !alreadyAdmin && !saving;

  async function handleAdd() {
    if (!canAdd || !myEmail) return;
    setSaving(true);
    try {
      await grantAdminAccess(normalized, myEmail);
      setNewEmail("");
      showToast("Acceso otorgado");
    } catch {
      showToast("No se pudo agregar");
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove(email: string) {
    if (!myEmail) return;
    try {
      await approveAdminUser(email, myEmail);
      showToast("Acceso otorgado");
    } catch {
      showToast("No se pudo aprobar");
    }
  }

  async function handleDelete(email: string) {
    setConfirmDelete(null);
    try {
      await deleteAdminUser(email);
      showToast("Usuario eliminado");
    } catch {
      showToast("No se pudo eliminar");
    }
  }

  function deleteControls(email: string, label: string) {
    if (confirmDelete === email) {
      return (
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setConfirmDelete(null)} style={smallBtn(T.slate, T.secondary)}>No</button>
          <button onClick={() => handleDelete(email)} style={smallBtn(T.rose, T.white)}>{label}</button>
        </div>
      );
    }
    const isMe = email === myEmail;
    return (
      <button
        onClick={() => setConfirmDelete(email)}
        disabled={isMe}
        title={isMe ? "No puedes eliminarte a ti mismo" : "Eliminar"}
        style={{
          background: "none", border: "none", padding: 6, display: "flex",
          color: T.mutedLight, cursor: isMe ? "not-allowed" : "pointer", opacity: isMe ? 0.35 : 1,
        }}
      >
        <Trash2 size={16} />
      </button>
    );
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

      {/* Solicitudes pendientes */}
      <p style={sectionLabel}>
        Solicitudes pendientes {pending.length > 0 && `· ${pending.length}`}
      </p>
      <div style={{ ...card, marginBottom: 20 }}>
        {loading ? (
          <Empty>Cargando...</Empty>
        ) : pending.length === 0 ? (
          <Empty>Nadie está esperando acceso. Cuando alguien inicie sesión con Google aparecerá aquí.</Empty>
        ) : (
          pending.map((u) => (
            <Row key={u.email} user={u} subtitle={`Solicitó ${formatDate(u.createdAt)}`}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {confirmDelete !== u.email && (
                  <button onClick={() => handleApprove(u.email)} style={{ ...smallBtn(T.green, T.white), display: "flex", alignItems: "center", gap: 4 }}>
                    <Check size={14} /> Dar acceso
                  </button>
                )}
                {deleteControls(u.email, "Eliminar")}
              </div>
            </Row>
          ))
        )}
      </div>

      {/* Con acceso */}
      <p style={sectionLabel}>Con acceso</p>
      <div style={{ ...card, marginBottom: 16 }}>
        {OWNER_EMAILS.map((email) => (
          <Row key={email} user={{ email }} subtitle={email === myEmail ? "Tú" : undefined}>
            {null}
          </Row>
        ))}
        {approved.map((u) => (
          <Row
            key={u.email}
            user={u}
            subtitle={u.email === myEmail ? "Tú" : u.approvedBy ? `Aprobado por ${u.approvedBy}` : undefined}
          >
            {deleteControls(u.email, "Quitar")}
          </Row>
        ))}
      </div>

      {/* Agregar a mano */}
      <div style={{ ...card, padding: "16px 18px" }}>
        <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: T.text }}>Dar acceso por correo</p>
        <p style={{ margin: "0 0 10px", fontSize: 12, color: T.muted }}>
          Para alguien que todavía no ha iniciado sesión.
        </p>
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
        {normalized && alreadyAdmin && (
          <p style={{ margin: "8px 0 0", fontSize: 12, color: T.muted }}>Ese correo ya tiene acceso.</p>
        )}
      </div>

      <p style={{ margin: "12px 4px 0", fontSize: 12, color: T.mutedLight, lineHeight: 1.5 }}>
        Si eliminas a alguien y vuelve a iniciar sesión, aparecerá otra vez como solicitud pendiente.
      </p>
    </div>
  );
}

const card: React.CSSProperties = {
  background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden",
};

function smallBtn(bg: string, color: string): React.CSSProperties {
  return {
    height: 30, padding: "0 12px", borderRadius: 7, border: "none",
    background: bg, color, fontSize: 12, fontWeight: 600, cursor: "pointer",
    fontFamily: "var(--font-poppins)", whiteSpace: "nowrap",
  };
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: 0, padding: "16px 18px", fontSize: 13, color: T.mutedLight, lineHeight: 1.5 }}>{children}</p>;
}

function Row({
  user,
  subtitle,
  children,
}: {
  user: Pick<AdminUser, "email"> & Partial<Pick<AdminUser, "name" | "photoURL">>;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      padding: "12px 18px", borderBottom: `1px solid ${T.slate}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        {user.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.photoURL} alt="" width={32} height={32} referrerPolicy="no-referrer" style={{ borderRadius: "50%", flexShrink: 0 }} />
        ) : (
          <div style={{
            width: 32, height: 32, borderRadius: "50%", background: T.slate, color: T.muted, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600,
          }}>
            {(user.name || user.email).charAt(0).toUpperCase()}
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          {user.name && (
            <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.name}
            </p>
          )}
          <p style={{ margin: 0, fontSize: user.name ? 12 : 13.5, fontWeight: user.name ? 400 : 500, color: user.name ? T.muted : T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.email}
          </p>
          {subtitle && <p style={{ margin: "1px 0 0", fontSize: 11, color: T.mutedLight }}>{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}
