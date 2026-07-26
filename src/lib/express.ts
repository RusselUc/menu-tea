import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import { normalizePhone } from "./loyalty";

export type QuestionType = "multiple" | "open";

export interface ExpressQuestion {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[]; // solo type === "multiple"
  correctIndex?: number; // solo type === "multiple"
  correctAnswer?: string; // opcional, solo type === "open" — si se define, la pregunta califica
  imageUrl?: string; // opcional — Supabase Storage, bucket "menu" bajo express/{dynamicId}/{questionId}
}

export interface ExpressDynamic {
  id: string;
  title: string;
  description?: string;
  questions: ExpressQuestion[];
  active: boolean;
  maxWinners?: number | null; // opcional — al alcanzarse se desactiva automaticamente
  winnersCount: number;
  concludedAt?: number | null; // se llena cuando se desactiva automaticamente por cupo de ganadores
  showClaimButton: boolean; // si es false, la pantalla de "ganaste" no muestra el boton de WhatsApp — el negocio contacta al ganador cuando decida
  showPodium: boolean; // el admin controla si el podio (top 3 ganadores) se muestra en /dinamica una vez que esta dinamica ya no esta activa (sin importar si se desactivo sola o a mano)
  createdAt: number;
}

export interface ExpressAnswer {
  questionId: string;
  value: string; // multiple: index de la opción elegida ("0","1"...) | open: texto libre
}

export interface ExpressParticipant {
  id: string;
  dynamicId: string;
  name: string;
  phone: string;
  answers: ExpressAnswer[];
  correctCount: number;
  totalGraded: number;
  won: boolean;
  timestamp: number;
  couponCode?: string; // codigo del cupon de premio enviado por WhatsApp desde /admin/dinamica
}

const DYNAMICS_COL = "express_dynamics";
const PARTICIPANTS_COL = "express_participants";

// Completa campos para dinamicas creadas antes de agregar el limite de
// ganadores o el toggle del boton de reclamo.
function withDefaults(id: string, data: Omit<ExpressDynamic, "id">): ExpressDynamic {
  return {
    id, ...data,
    winnersCount: data.winnersCount ?? 0,
    maxWinners: data.maxWinners ?? undefined,
    showClaimButton: data.showClaimButton ?? true,
    showPodium: data.showPodium ?? false,
  };
}

export async function getDynamics(): Promise<ExpressDynamic[]> {
  const q = query(collection(db, DYNAMICS_COL), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => withDefaults(d.id, d.data() as Omit<ExpressDynamic, "id">));
}

export async function getDynamic(id: string): Promise<ExpressDynamic | null> {
  const snap = await getDoc(doc(db, DYNAMICS_COL, id));
  if (!snap.exists()) return null;
  return withDefaults(snap.id, snap.data() as Omit<ExpressDynamic, "id">);
}

export async function getActiveDynamic(): Promise<ExpressDynamic | null> {
  const q = query(collection(db, DYNAMICS_COL), where("active", "==", true), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return withDefaults(d.id, d.data() as Omit<ExpressDynamic, "id">);
}

// Cuando no hay ninguna dinámica activa, esto le permite a la página pública
// distinguir "ya hubo una que vale la pena mostrar" (se concluyó sola por
// cupo, o el admin activó el podio a mano) de "nunca hubo nada". getDynamics()
// ya viene ordenado por createdAt desc, así que el primer match es el más
// reciente.
export async function getMostRecentClosed(): Promise<ExpressDynamic | null> {
  const all = await getDynamics();
  return all.find((d) => !d.active && (!!d.concludedAt || d.showPodium)) ?? null;
}

export async function createDynamic(data: {
  title: string;
  description?: string;
  questions: ExpressQuestion[];
  maxWinners?: number;
}): Promise<string> {
  const ref = await addDoc(collection(db, DYNAMICS_COL), {
    title: data.title,
    description: data.description ?? "",
    questions: data.questions,
    active: false,
    maxWinners: data.maxWinners ?? null,
    winnersCount: 0,
    concludedAt: null,
    showClaimButton: true,
    showPodium: false,
    createdAt: Date.now(),
  });
  return ref.id;
}

export async function updateDynamic(
  id: string,
  data: Partial<Pick<ExpressDynamic, "title" | "description" | "questions" | "maxWinners" | "showClaimButton" | "showPodium">>
): Promise<void> {
  const ref = doc(db, DYNAMICS_COL, id);

  // Si se esta tocando maxWinners, hay que revisar si el winnersCount actual
  // ya alcanza (o supera) el nuevo cupo — por ejemplo, el admin olvido poner
  // un limite, la dinamica ya lleva 3 ganadores, y recien ahora le pone
  // maxWinners=3. En ese caso la dinamica se concluye en este mismo guardado,
  // en vez de esperar a que entre un ganador mas para que se cierre sola.
  if (!("maxWinners" in data)) {
    await updateDoc(ref, data);
    return;
  }

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const current = snap.data() as ExpressDynamic;
    const patch: Partial<ExpressDynamic> = { ...data };
    const winnersCount = current.winnersCount ?? 0;
    if (current.active && data.maxWinners && winnersCount >= data.maxWinners) {
      patch.active = false;
      patch.concludedAt = Date.now();
    }
    tx.update(ref, patch);
  });
}

// Reinicia el contador de ganadores y limpia el estado de conclusion automatica.
// Util cuando el admin quiere reabrir una dinamica que ya alcanzo su cupo.
export async function resetWinners(id: string): Promise<void> {
  await updateDoc(doc(db, DYNAMICS_COL, id), { winnersCount: 0, concludedAt: null });
}

export async function deleteDynamic(id: string): Promise<void> {
  await deleteDoc(doc(db, DYNAMICS_COL, id));
}

// Activa esta dinámica y desactiva cualquier otra — solo una activa a la vez.
export async function setActiveDynamic(id: string): Promise<void> {
  const snap = await getDocs(collection(db, DYNAMICS_COL));
  const batch = writeBatch(db);
  snap.docs.forEach((d) => {
    const isTarget = d.id === id;
    if (isTarget || d.data().active) {
      batch.update(d.ref, { active: isTarget });
    }
  });
  await batch.commit();
}

export async function deactivateDynamic(id: string): Promise<void> {
  await updateDoc(doc(db, DYNAMICS_COL, id), { active: false });
}

export async function hasParticipated(dynamicId: string, phone: string): Promise<boolean> {
  const id = `${dynamicId}_${normalizePhone(phone)}`;
  const snap = await getDoc(doc(db, PARTICIPANTS_COL, id));
  return snap.exists();
}

// El id determinístico (dynamicId + telefono) + una transacción garantizan
// que un mismo telefono no pueda registrarse dos veces en la misma dinámica,
// incluso si el request se dispara dos veces en paralelo.
//
// La transacción también relee la dinámica (en vez de confiar en las preguntas
// que trae el cliente) para calificar contra el estado real en Firestore y para
// decidir, de forma atómica, si este registro hace alcanzar `maxWinners` — en
// cuyo caso la dinámica se desactiva sola en la misma escritura.
export async function registerParticipant(params: {
  dynamicId: string;
  name: string;
  phone: string;
  answers: ExpressAnswer[];
}): Promise<{ participant: ExpressParticipant | null; duplicate: boolean; closed: boolean }> {
  const phone = normalizePhone(params.phone);
  const participantId = `${params.dynamicId}_${phone}`;
  const participantRef = doc(db, PARTICIPANTS_COL, participantId);
  const dynamicRef = doc(db, DYNAMICS_COL, params.dynamicId);

  return runTransaction(db, async (tx) => {
    const [dynamicSnap, participantSnap] = await Promise.all([
      tx.get(dynamicRef),
      tx.get(participantRef),
    ]);

    if (participantSnap.exists()) {
      return { participant: null, duplicate: true, closed: false };
    }
    if (!dynamicSnap.exists() || !(dynamicSnap.data() as ExpressDynamic).active) {
      return { participant: null, duplicate: false, closed: true };
    }

    const dynamicData = dynamicSnap.data() as ExpressDynamic;
    const questions = dynamicData.questions;

    // Califican las de opcion multiple, y las abiertas solo si el admin les
    // definio una correctAnswer. La comparacion de texto libre ignora
    // mayusculas/minusculas y espacios al inicio/fin, pero no tolera faltas
    // de ortografia — es una coincidencia exacta, no aproximada.
    const normalize = (s: string) => s.trim().toUpperCase();
    const gradableQuestions = questions.filter(
      (q) => q.type === "multiple" || (q.type === "open" && !!q.correctAnswer?.trim())
    );
    let correctCount = 0;
    for (const q of gradableQuestions) {
      const answer = params.answers.find((a) => a.questionId === q.id);
      if (!answer) continue;
      if (q.type === "multiple") {
        if (Number(answer.value) === q.correctIndex) correctCount++;
      } else if (normalize(answer.value) === normalize(q.correctAnswer ?? "")) {
        correctCount++;
      }
    }
    const totalGraded = gradableQuestions.length;
    const won = totalGraded > 0 && correctCount === totalGraded;

    const participant: ExpressParticipant = {
      id: participantId,
      dynamicId: params.dynamicId,
      name: params.name.trim(),
      phone,
      answers: params.answers,
      correctCount,
      totalGraded,
      won,
      timestamp: Date.now(),
    };
    tx.set(participantRef, participant);

    if (won) {
      const newWinnersCount = (dynamicData.winnersCount ?? 0) + 1;
      const patch: Partial<ExpressDynamic> = { winnersCount: newWinnersCount };
      if (dynamicData.maxWinners && newWinnersCount >= dynamicData.maxWinners) {
        patch.active = false;
        patch.concludedAt = Date.now();
      }
      tx.update(dynamicRef, patch);
    }

    return { participant, duplicate: false, closed: false };
  });
}

// Registra el codigo de cupon de premio ya enviado a un ganador, para no
// crear/mandar uno nuevo por accidente si el admin vuelve a abrir el panel.
export async function setParticipantCoupon(participantId: string, couponCode: string): Promise<void> {
  await updateDoc(doc(db, PARTICIPANTS_COL, participantId), { couponCode });
}

export async function getParticipants(dynamicId: string): Promise<ExpressParticipant[]> {
  const q = query(collection(db, PARTICIPANTS_COL), where("dynamicId", "==", dynamicId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => d.data() as ExpressParticipant)
    .sort((a, b) => b.timestamp - a.timestamp);
}

// Los primeros en ganar, en orden — el "podio" público de una dinámica.
// No requiere un sistema de puntajes aparte: como maxWinners ya limita
// quién puede ganar, el orden de quién ganó primero es el ranking.
export async function getTopWinners(dynamicId: string, max = 3): Promise<ExpressParticipant[]> {
  const all = await getParticipants(dynamicId);
  return all
    .filter((p) => p.won)
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(0, max);
}

// Enmascara el nombre para mostrarlo en un lugar público (podio) sin
// exponer la identidad completa del cliente: "Juan" -> "J***n". El numero
// de telefono nunca se expone en estas vistas.
export function maskParticipantName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length <= 1) return `${trimmed || "?"}***`;
  return `${trimmed[0]}***${trimmed[trimmed.length - 1]}`;
}
