import { doc, getDoc, setDoc, runTransaction } from "firebase/firestore";
import { db } from "./firebase";

export type SizeId = "mediano" | "grande" | "pandi";

export interface Insumos {
  vasos: Record<SizeId, number>;
}

const REF = () => doc(db, "settings", "insumos");

export async function getInsumos(): Promise<Insumos> {
  const snap = await getDoc(REF());
  if (!snap.exists()) return { vasos: { mediano: 0, grande: 0, pandi: 0 } };
  return snap.data() as Insumos;
}

export async function setVasos(vasos: Record<SizeId, number>): Promise<void> {
  await setDoc(REF(), { vasos }, { merge: true });
}

export async function deductVasos(counts: Partial<Record<SizeId, number>>): Promise<void> {
  const entries = Object.entries(counts).filter(([, qty]) => qty && qty > 0) as [SizeId, number][];
  if (entries.length === 0) return;

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(REF());
    const current: Record<SizeId, number> = snap.exists()
      ? (snap.data() as Insumos).vasos
      : { mediano: 0, grande: 0, pandi: 0 };

    const updated = { ...current };
    for (const [size, qty] of entries) {
      updated[size] = Math.max(0, (updated[size] ?? 0) - qty);
    }
    tx.set(REF(), { vasos: updated }, { merge: true });
  });
}
