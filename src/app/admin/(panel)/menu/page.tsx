"use client";
import { useState, useEffect } from "react";
import {
  MenuItem,
  getMenuItems,
  saveMenuItem,
  toggleMenuItem,
  deleteMenuItem,
  uploadMenuImageSupabase,
  seedMenuFromStatic,
  getPriceRules,
  savePriceRules,
  PriceRules,
  DEFAULT_PRICE_RULES,
  PRICE_RULE_LABELS,
  getToppings,
  saveToppings,
  ToppingGroup,
  DEFAULT_TOPPINGS,
  CATEGORY_LABELS,
  ALL_CATEGORIES,
} from "@/lib/menu-items";

const T = {
  bg: "#F8FAFC",
  white: "#FFFFFF",
  border: "#E2E8F0",
  text: "#0F172A",
  secondary: "#334155",
  muted: "#64748B",
  mutedLight: "#94A3B8",
  slate: "#F1F5F9",
  blue: "#2563EB",
  blueBg: "#EFF6FF",
  blueBorder: "#BFDBFE",
  green: "#059669",
  greenBg: "#ECFDF5",
  greenBorder: "#A7F3D0",
  red: "#DC2626",
  redBg: "#FEF2F2",
  redBorder: "#FECACA",
  amber: "#D97706",
  amberBg: "#FFFBEB",
  amberBorder: "#FDE68A",
};

const CAT_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  frappe: { bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE" },
  tea: { bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0" },
  sodaItaliana: { bg: "#FFF7ED", color: "#EA580C", border: "#FED7AA" },
  specialty: { bg: "#FDF4FF", color: "#9333EA", border: "#E9D5FF" },
  milkTea: { bg: "#FFF1F2", color: "#E11D48", border: "#FECDD3" },
};

const EMPTY_FORM: Omit<MenuItem, "createdAt" | "order"> = {
  id: "",
  name: "",
  categories: [],
  tier: "premium",
  descriptions: {},
  imageUrls: {},
  active: true,
};

function generateId(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<Omit<MenuItem, "createdAt" | "order">>(EMPTY_FORM);
  const [imageFiles, setImageFiles] = useState<Record<string, File>>({});
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [toast, setToast] = useState<string>("");
  const [confirmDelete, setConfirmDelete] = useState<MenuItem | null>(null);
  const [priceRules, setPriceRules] = useState<PriceRules>(DEFAULT_PRICE_RULES);
  const [pricesDraft, setPricesDraft] = useState<PriceRules>(DEFAULT_PRICE_RULES);
  const [showPrices, setShowPrices] = useState(false);
  const [savingPrices, setSavingPrices] = useState(false);
  const [toppingGroups, setToppingGroups] = useState<ToppingGroup[]>(DEFAULT_TOPPINGS);
  const [toppingsDraft, setToppingsDraft] = useState<ToppingGroup[]>(DEFAULT_TOPPINGS);
  const [showToppings, setShowToppings] = useState(false);
  const [savingToppings, setSavingToppings] = useState(false);

  useEffect(() => {
    load();
    getPriceRules().then((r) => { setPriceRules(r); setPricesDraft(r); });
    getToppings().then((g) => { setToppingGroups(g); setToppingsDraft(g); });
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await getMenuItems();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function handleSeed() {
    setSeeding(true);
    try {
      const n = await seedMenuFromStatic();
      await load();
      showToast(n > 0 ? `${n} productos importados` : "Menú ya estaba inicializado");
    } finally {
      setSeeding(false);
    }
  }

  function openAdd() {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setImageFiles({});
    setImagePreviews({});
    setShowForm(true);
  }

  function openEdit(item: MenuItem) {
    setEditItem(item);
    setForm({
      id: item.id,
      name: item.name,
      categories: item.categories,
      tier: item.tier,
      customPrice: item.customPrice,
      imageUrls: item.imageUrls ?? {},
      descriptions: { ...item.descriptions },
      active: item.active,
    });
    setImageFiles({});
    setImagePreviews(item.imageUrls ?? {});
    setShowForm(true);
  }

  function handleImageChange(cat: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFiles((prev) => ({ ...prev, [cat]: file }));
    setImagePreviews((prev) => ({ ...prev, [cat]: URL.createObjectURL(file) }));
  }

  async function handleSave() {
    if (!form.name.trim() || form.categories.length === 0) return;
    setSaving(true);
    try {
      const id = editItem ? editItem.id : generateId(form.name);
      const imageUrls: Record<string, string> = { ...(form.imageUrls ?? {}) };
      for (const [cat, file] of Object.entries(imageFiles)) {
        imageUrls[cat] = await uploadMenuImageSupabase(file, id, cat);
      }
      await saveMenuItem({ ...form, id, imageUrls: Object.keys(imageUrls).length > 0 ? imageUrls : undefined });
      await load();
      setShowForm(false);
      showToast(editItem ? "Producto actualizado" : "Producto agregado");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(item: MenuItem) {
    await toggleMenuItem(item.id, !item.active);
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, active: !item.active } : i));
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    await deleteMenuItem(confirmDelete.id);
    setItems((prev) => prev.filter((i) => i.id !== confirmDelete.id));
    setConfirmDelete(null);
    showToast("Producto eliminado");
  }

  async function handleSaveToppings() {
    setSavingToppings(true);
    try {
      await saveToppings(toppingsDraft);
      setToppingGroups(toppingsDraft);
      showToast("Toppings actualizados");
      setShowToppings(false);
    } finally {
      setSavingToppings(false);
    }
  }

  async function handleSavePrices() {
    setSavingPrices(true);
    try {
      await savePriceRules(pricesDraft);
      setPriceRules(pricesDraft);
      showToast("Precios actualizados");
      setShowPrices(false);
    } finally {
      setSavingPrices(false);
    }
  }

  function toggleFormCategory(cat: string) {
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter((c) => c !== cat)
        : [...f.categories, cat],
    }));
  }

  const filtered = items.filter((item) => {
    if (filterCat !== "all" && !item.categories.includes(filterCat)) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const activeCount = items.filter((i) => i.active).length;

  return (
    <div style={{ padding: "28px 24px 48px", maxWidth: 720, margin: "0 auto", fontFamily: "var(--font-poppins)" }}>
      <style>{`
        .menu-header { display: flex; flex-direction: column; gap: 14px; margin-bottom: 24px; }
        .menu-header-actions { display: flex; flex-wrap: wrap; gap: 8px; }
        @media (min-width: 640px) {
          .menu-header { flex-direction: row; justify-content: space-between; align-items: flex-start; }
          .menu-header-actions { flex-wrap: nowrap; }
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          background: T.text, color: T.white, padding: "10px 20px",
          borderRadius: 10, fontSize: 13, fontWeight: 600,
          zIndex: 200, boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
          whiteSpace: "nowrap",
        }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="menu-header">
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: T.text, letterSpacing: "-0.02em" }}>
            Menú
          </h1>
          <p style={{ margin: "3px 0 0", fontSize: 13, color: T.muted }}>
            {items.length > 0
              ? `${activeCount} activos · ${items.length - activeCount} inactivos`
              : "Gestiona los productos del menú"}
          </p>
        </div>
        <div className="menu-header-actions">
          {items.length === 0 && !loading && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              style={{
                height: 38, padding: "0 14px", borderRadius: 8,
                border: `1px solid ${T.amberBorder}`,
                background: T.amberBg, color: T.amber,
                fontSize: 13, fontWeight: 600, cursor: seeding ? "not-allowed" : "pointer",
                fontFamily: "var(--font-poppins)",
              }}
            >
              {seeding ? "Importando..." : "Importar del código"}
            </button>
          )}
          <button
            onClick={openAdd}
            style={{
              height: 38, padding: "0 16px", borderRadius: 8,
              border: "none", background: T.text, color: T.white,
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              fontFamily: "var(--font-poppins)",
            }}
          >
            + Agregar
          </button>
          <button
            onClick={() => { setToppingsDraft(toppingGroups); setShowToppings(true); }}
            style={{
              height: 38, padding: "0 14px", borderRadius: 8,
              border: `1px solid ${T.border}`, background: T.white,
              color: T.muted, fontSize: 13, fontWeight: 500, cursor: "pointer",
              fontFamily: "var(--font-poppins)",
            }}
          >
            Toppings
          </button>
          <button
            onClick={() => { setPricesDraft(priceRules); setShowPrices(true); }}
            style={{
              height: 38, padding: "0 14px", borderRadius: 8,
              border: `1px solid ${T.border}`, background: T.white,
              color: T.muted, fontSize: 13, fontWeight: 500, cursor: "pointer",
              fontFamily: "var(--font-poppins)",
            }}
          >
            Precios
          </button>
        </div>
      </div>

      {/* Seed prompt */}
      {items.length === 0 && !loading && (
        <div style={{
          background: T.amberBg, border: `1px solid ${T.amberBorder}`,
          borderRadius: 12, padding: "18px 20px", marginBottom: 20,
        }}>
          <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: T.amber }}>
            Menú vacío
          </p>
          <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.5 }}>
            Importa los productos actuales del código para comenzar a gestionarlos desde aquí.
            Puedes hacerlo una sola vez; los cambios futuros se harán directamente en esta página.
          </p>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: T.muted, fontSize: 13 }}>
          Cargando...
        </div>
      ) : items.length > 0 && (
        <>
          {/* Filters */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <input
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1, minWidth: 160, height: 36, borderRadius: 8,
                border: `1px solid ${T.border}`, background: T.white,
                padding: "0 12px", fontSize: 13, color: T.text,
                outline: "none", fontFamily: "var(--font-poppins)",
              }}
            />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[{ id: "all", label: "Todos" }, ...ALL_CATEGORIES.map((c) => ({ id: c, label: CATEGORY_LABELS[c] }))].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setFilterCat(id)}
                  style={{
                    height: 36, padding: "0 12px", borderRadius: 8,
                    border: `1px solid ${filterCat === id ? T.blue : T.border}`,
                    background: filterCat === id ? T.blueBg : T.white,
                    color: filterCat === id ? T.blue : T.muted,
                    fontSize: 12, fontWeight: filterCat === id ? 600 : 400,
                    cursor: "pointer", fontFamily: "var(--font-poppins)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Item list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.length === 0 ? (
              <p style={{ textAlign: "center", padding: "40px 0", color: T.mutedLight, fontSize: 13 }}>
                Sin resultados
              </p>
            ) : filtered.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                onToggle={handleToggle}
                onEdit={openEdit}
                onDelete={setConfirmDelete}
              />
            ))}
          </div>
        </>
      )}

      {/* Slide-over form */}
      {showForm && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.4)",
            display: "flex", justifyContent: "flex-end",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
        >
          <div style={{
            width: "min(520px, 100vw)", height: "100vh",
            background: T.white, overflowY: "auto",
            padding: "28px 24px 40px",
            display: "flex", flexDirection: "column", gap: 20,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.text }}>
                {editItem ? "Editar producto" : "Nuevo producto"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: T.muted, padding: 4 }}
              >
                ×
              </button>
            </div>

            {/* Name */}
            <FormField label="Nombre">
              <input
                placeholder="Ej. Fresa, Maracuyá..."
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                style={inputStyle}
              />
            </FormField>

            {/* Categories */}
            <FormField label="Categorías">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {ALL_CATEGORIES.map((cat) => {
                  const active = form.categories.includes(cat);
                  const colors = CAT_COLORS[cat] ?? { bg: T.slate, color: T.muted, border: T.border };
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleFormCategory(cat)}
                      style={{
                        padding: "5px 12px", borderRadius: 100,
                        border: `1px solid ${active ? colors.border : T.border}`,
                        background: active ? colors.bg : T.white,
                        color: active ? colors.color : T.muted,
                        fontSize: 12, fontWeight: active ? 600 : 400,
                        cursor: "pointer",
                      }}
                    >
                      {CATEGORY_LABELS[cat]}
                    </button>
                  );
                })}
              </div>
            </FormField>

            {/* Tier */}
            <FormField label="Tier de precio">
              <div style={{ display: "flex", gap: 8 }}>
                {(["classic", "premium"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, tier: t }))}
                    style={{
                      flex: 1, height: 38, borderRadius: 8,
                      border: `1px solid ${form.tier === t ? T.blue : T.border}`,
                      background: form.tier === t ? T.blueBg : T.white,
                      color: form.tier === t ? T.blue : T.muted,
                      fontSize: 13, fontWeight: form.tier === t ? 600 : 400,
                      cursor: "pointer", textTransform: "capitalize",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </FormField>

            {/* Custom price toggle */}
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={!!form.customPrice}
                  onChange={(e) => setForm((f) => ({
                    ...f,
                    customPrice: e.target.checked ? { mediano: 70, grande: 80, pandi: 85 } : undefined,
                  }))}
                />
                <span style={{ fontSize: 13, color: T.secondary, fontWeight: 500 }}>
                  Precio personalizado
                </span>
              </label>
              {form.customPrice && (
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  {(["mediano", "grande", "pandi"] as const).map((sz) => (
                    <FormField key={sz} label={sz.charAt(0).toUpperCase() + sz.slice(1)}>
                      <input
                        type="number"
                        value={form.customPrice![sz]}
                        onChange={(e) => setForm((f) => ({
                          ...f,
                          customPrice: { ...f.customPrice!, [sz]: +e.target.value },
                        }))}
                        style={{ ...inputStyle, textAlign: "center" }}
                      />
                    </FormField>
                  ))}
                </div>
              )}
            </div>

            {/* Descriptions */}
            <div>
              <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Descripciones
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {form.categories.map((cat) => (
                  <FormField key={cat} label={CATEGORY_LABELS[cat] ?? cat}>
                    <textarea
                      placeholder={`Descripción para ${CATEGORY_LABELS[cat] ?? cat}...`}
                      value={form.descriptions[cat] ?? ""}
                      onChange={(e) => setForm((f) => ({
                        ...f,
                        descriptions: { ...f.descriptions, [cat]: e.target.value },
                      }))}
                      rows={2}
                      style={{ ...inputStyle, height: "auto", resize: "vertical", paddingTop: 8, paddingBottom: 8 }}
                    />
                  </FormField>
                ))}
                {form.categories.length === 0 && (
                  <p style={{ fontSize: 12, color: T.mutedLight, margin: 0 }}>
                    Selecciona categorías para agregar descripciones.
                  </p>
                )}
              </div>
            </div>

            {/* Image */}
            {/* Images per category */}
            {form.categories.length > 0 && (
              <div>
                <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Imágenes por categoría
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {form.categories.map((cat) => {
                    const preview = imagePreviews[cat];
                    return (
                      <div key={cat}>
                        <p style={{ margin: "0 0 6px", fontSize: 12, color: T.secondary, fontWeight: 500 }}>
                          {CATEGORY_LABELS[cat] ?? cat}
                        </p>
                        <label htmlFor={`img-input-${cat}`} style={{ cursor: "pointer", display: "block" }}>
                        <div
                          style={{
                            border: `2px dashed ${T.border}`, borderRadius: 10,
                            padding: preview ? 0 : "16px",
                            textAlign: "center", cursor: "pointer",
                            overflow: "hidden",
                            background: preview ? "transparent" : T.slate,
                          }}
                        >
                          {preview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={preview} alt={cat} style={{ width: "100%", maxHeight: 140, objectFit: "cover", display: "block" }} />
                          ) : (
                            <p style={{ margin: 0, fontSize: 12, color: T.mutedLight }}>
                              Subir imagen para {CATEGORY_LABELS[cat] ?? cat}
                            </p>
                          )}
                        </div>
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={(e) => handleImageChange(cat, e)}
                          id={`img-input-${cat}`}
                        />
                        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                          <label
                            htmlFor={`img-input-${cat}`}
                            style={{ fontSize: 12, color: T.blue, cursor: "pointer", fontWeight: 500 }}
                          >
                            {preview ? "Cambiar" : "Seleccionar"} imagen
                          </label>
                          {preview && (
                            <button
                              type="button"
                              onClick={() => {
                                setImageFiles((p) => { const n = { ...p }; delete n[cat]; return n; });
                                setImagePreviews((p) => { const n = { ...p }; delete n[cat]; return n; });
                                setForm((f) => {
                                  const urls = { ...(f.imageUrls ?? {}) };
                                  delete urls[cat];
                                  return { ...f, imageUrls: urls };
                                });
                              }}
                              style={{ fontSize: 12, color: T.red, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                            >
                              Quitar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Active toggle */}
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              />
              <span style={{ fontSize: 13, color: T.secondary, fontWeight: 500 }}>
                Visible en el menú
              </span>
            </label>

            {/* Submit */}
            <button
              onClick={handleSave}
              disabled={saving || !form.name.trim() || form.categories.length === 0}
              style={{
                height: 44, borderRadius: 9, border: "none",
                background: saving || !form.name.trim() || form.categories.length === 0 ? T.slate : T.text,
                color: saving || !form.name.trim() || form.categories.length === 0 ? T.mutedLight : T.white,
                fontSize: 14, fontWeight: 600, cursor: "pointer",
                fontFamily: "var(--font-poppins)",
              }}
            >
              {saving ? "Guardando..." : editItem ? "Guardar cambios" : "Agregar producto"}
            </button>
          </div>
        </div>
      )}

      {/* Toppings panel */}
      {showToppings && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.4)", display: "flex", justifyContent: "flex-end" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowToppings(false); }}
        >
          <div style={{
            width: "min(480px, 100vw)", height: "100vh", background: T.white,
            overflowY: "auto", padding: "28px 24px 40px",
            display: "flex", flexDirection: "column", gap: 20,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.text }}>Toppings</h2>
                <p style={{ margin: "3px 0 0", fontSize: 12, color: T.muted }}>Grupos y opciones disponibles</p>
              </div>
              <button onClick={() => setShowToppings(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: T.muted }}>×</button>
            </div>

            {toppingsDraft.map((group, gi) => (
              <div key={group.id} style={{ background: T.bg, borderRadius: 10, padding: "14px 16px" }}>
                {/* Group label */}
                <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
                  <input
                    value={group.label}
                    onChange={(e) => setToppingsDraft((prev) => prev.map((g, i) => i === gi ? { ...g, label: e.target.value } : g))}
                    style={{ ...inputStyle, fontWeight: 600, flex: 1 }}
                    placeholder="Nombre del grupo"
                  />
                  <button
                    onClick={() => setToppingsDraft((prev) => prev.filter((_, i) => i !== gi))}
                    style={{ height: 40, width: 40, borderRadius: 8, border: `1px solid ${T.redBorder}`, background: T.redBg, color: T.red, cursor: "pointer", fontSize: 16, flexShrink: 0 }}
                  >×</button>
                </div>

                {/* Items */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {group.items.map((item, ii) => (
                    <div key={ii} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {/* Active toggle */}
                      <button
                        onClick={() => setToppingsDraft((prev) => prev.map((g, i) => i === gi
                          ? { ...g, items: g.items.map((it, j) => j === ii ? { ...it, active: !it.active } : it) }
                          : g
                        ))}
                        title={item.active ? "Desactivar" : "Activar"}
                        style={{
                          width: 36, height: 20, borderRadius: 10,
                          background: item.active ? T.green : T.border,
                          border: "none", cursor: "pointer", position: "relative",
                          transition: "background 0.2s", flexShrink: 0,
                        }}
                      >
                        <span style={{
                          position: "absolute", top: 2,
                          left: item.active ? 18 : 2,
                          width: 16, height: 16, borderRadius: "50%",
                          background: T.white, transition: "left 0.2s", display: "block",
                        }} />
                      </button>
                      <input
                        value={item.name}
                        onChange={(e) => setToppingsDraft((prev) => prev.map((g, i) => i === gi
                          ? { ...g, items: g.items.map((it, j) => j === ii ? { ...it, name: e.target.value } : it) }
                          : g
                        ))}
                        style={{ ...inputStyle, flex: 1, opacity: item.active ? 1 : 0.5 }}
                        placeholder="Nombre del topping"
                      />
                      <button
                        onClick={() => setToppingsDraft((prev) => prev.map((g, i) => i === gi
                          ? { ...g, items: g.items.filter((_, j) => j !== ii) }
                          : g
                        ))}
                        style={{ height: 40, width: 40, borderRadius: 8, border: `1px solid ${T.redBorder}`, background: T.redBg, color: T.red, cursor: "pointer", fontSize: 16, flexShrink: 0 }}
                      >×</button>
                    </div>
                  ))}
                  <button
                    onClick={() => setToppingsDraft((prev) => prev.map((g, i) => i === gi ? { ...g, items: [...g.items, { name: "", active: true }] } : g))}
                    style={{ height: 36, borderRadius: 8, border: `1px dashed ${T.border}`, background: "transparent", color: T.muted, fontSize: 12, cursor: "pointer" }}
                  >
                    + Agregar topping
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={() => setToppingsDraft((prev) => [...prev, { id: `group-${Date.now()}`, label: "", items: [] }])}
              style={{ height: 40, borderRadius: 9, border: `1px dashed ${T.border}`, background: "transparent", color: T.muted, fontSize: 13, cursor: "pointer" }}
            >
              + Agregar grupo
            </button>

            <button
              onClick={handleSaveToppings}
              disabled={savingToppings}
              style={{
                height: 44, borderRadius: 9, border: "none",
                background: savingToppings ? T.slate : T.text,
                color: savingToppings ? T.mutedLight : T.white,
                fontSize: 14, fontWeight: 600, cursor: "pointer",
                fontFamily: "var(--font-poppins)",
              }}
            >
              {savingToppings ? "Guardando..." : "Guardar toppings"}
            </button>
          </div>
        </div>
      )}

      {/* Price rules panel */}
      {showPrices && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.4)", display: "flex", justifyContent: "flex-end" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowPrices(false); }}
        >
          <div style={{
            width: "min(480px, 100vw)", height: "100vh", background: T.white,
            overflowY: "auto", padding: "28px 24px 40px",
            display: "flex", flexDirection: "column", gap: 20,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.text }}>Precios por tier</h2>
                <p style={{ margin: "3px 0 0", fontSize: 12, color: T.muted }}>Mediano · Grande · Pandi</p>
              </div>
              <button onClick={() => setShowPrices(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: T.muted }}>×</button>
            </div>

            {(Object.keys(DEFAULT_PRICE_RULES) as (keyof PriceRules)[]).map((rule) => (
              <div key={rule} style={{ background: T.bg, borderRadius: 10, padding: "14px 16px" }}>
                <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600, color: T.text }}>
                  {PRICE_RULE_LABELS[rule] ?? rule}
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["mediano", "grande", "pandi"] as const).map((sz) => (
                    <div key={sz} style={{ flex: 1 }}>
                      <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 600, color: T.muted, textTransform: "uppercase" }}>{sz}</p>
                      <input
                        type="number"
                        value={pricesDraft[rule][sz]}
                        onChange={(e) => setPricesDraft((prev) => ({
                          ...prev,
                          [rule]: { ...prev[rule], [sz]: +e.target.value },
                        }))}
                        style={{ ...inputStyle, textAlign: "center" }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button
              onClick={handleSavePrices}
              disabled={savingPrices}
              style={{
                height: 44, borderRadius: 9, border: "none",
                background: savingPrices ? T.slate : T.text,
                color: savingPrices ? T.mutedLight : T.white,
                fontSize: 14, fontWeight: 600, cursor: "pointer",
                fontFamily: "var(--font-poppins)",
              }}
            >
              {savingPrices ? "Guardando..." : "Guardar precios"}
            </button>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 150,
            background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmDelete(null); }}
        >
          <div style={{
            background: T.white, borderRadius: 14, padding: "24px 24px 20px",
            maxWidth: 340, width: "100%",
          }}>
            <p style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: T.text }}>
              ¿Eliminar producto?
            </p>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: T.muted }}>
              Se eliminará <strong>{confirmDelete.name}</strong> permanentemente.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{
                  flex: 1, height: 40, borderRadius: 8,
                  border: `1px solid ${T.border}`, background: T.white,
                  color: T.muted, fontSize: 13, fontWeight: 500, cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                style={{
                  flex: 1, height: 40, borderRadius: 8,
                  border: "none", background: T.red,
                  color: T.white, fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ItemRow({
  item,
  onToggle,
  onEdit,
  onDelete,
}: {
  item: MenuItem;
  onToggle: (item: MenuItem) => void;
  onEdit: (item: MenuItem) => void;
  onDelete: (item: MenuItem) => void;
}) {
  return (
    <div style={{
      background: item.active ? T.white : T.slate,
      border: `1px solid ${T.border}`,
      borderRadius: 10,
      padding: "12px 14px",
      display: "flex",
      alignItems: "center",
      gap: 12,
      opacity: item.active ? 1 : 0.65,
      transition: "opacity 0.2s",
    }}>
      {/* Image */}
      {item.imageUrls && Object.values(item.imageUrls)[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={Object.values(item.imageUrls)[0]}
          alt={item.name}
          style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
        />
      ) : (
        <div style={{
          width: 44, height: 44, borderRadius: 8, background: T.border,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, flexShrink: 0,
        }}>
          🧋
        </div>
      )}

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: T.text }}>
          {item.name}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
          {item.categories.map((cat) => {
            const c = CAT_COLORS[cat] ?? { bg: T.slate, color: T.muted, border: T.border };
            return (
              <span key={cat} style={{
                fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 100,
                background: c.bg, color: c.color, border: `1px solid ${c.border}`,
              }}>
                {CATEGORY_LABELS[cat] ?? cat}
              </span>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {/* Active toggle */}
        <button
          onClick={() => onToggle(item)}
          title={item.active ? "Desactivar" : "Activar"}
          style={{
            width: 36, height: 20, borderRadius: 10,
            background: item.active ? T.green : T.border,
            border: "none", cursor: "pointer",
            position: "relative", transition: "background 0.2s",
            flexShrink: 0,
          }}
        >
          <span style={{
            position: "absolute",
            top: 2, left: item.active ? 18 : 2,
            width: 16, height: 16, borderRadius: "50%",
            background: T.white,
            transition: "left 0.2s",
            display: "block",
          }} />
        </button>

        <button
          onClick={() => onEdit(item)}
          style={{
            height: 32, padding: "0 12px", borderRadius: 7,
            border: `1px solid ${T.border}`, background: T.white,
            color: T.muted, fontSize: 12, fontWeight: 500, cursor: "pointer",
          }}
        >
          Editar
        </button>

        <button
          onClick={() => onDelete(item)}
          style={{
            height: 32, width: 32, borderRadius: 7,
            border: `1px solid ${T.redBorder}`, background: T.redBg,
            color: T.red, fontSize: 14, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </p>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 40,
  borderRadius: 8,
  border: `1px solid ${T.border}`,
  background: T.bg,
  padding: "0 12px",
  fontSize: 13,
  color: T.text,
  outline: "none",
  fontFamily: "var(--font-poppins)",
  boxSizing: "border-box",
};
