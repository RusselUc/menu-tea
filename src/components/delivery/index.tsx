"use client";
import { useEffect, useState } from "react";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const Delivery = () => {
  const [sessionId, setSessionId] = useState<string>("");
  const [link, setLink] = useState<string>("");
  const [watchId, setWatchId] = useState<number | null>(null);

  // Generar sessionId y link al cargar
  useEffect(() => {
    const id = crypto.randomUUID();
    setSessionId(id);
    setLink(`${window.location.origin}/share/${id}`);
  }, []);

  // Actualizar ubicación en tiempo real
  useEffect(() => {
    if (!sessionId) return;

    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        await setDoc(doc(db, "sessions", sessionId), {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          updatedAt: new Date(),
        });
      },
      (err) => console.error(err),
      { enableHighAccuracy: true }
    );

    setWatchId(id);

    // Limpiar watchPosition al desmontar
    return () => {
      navigator.geolocation.clearWatch(id);
    };
  }, [sessionId]);

  // Función para detener el sharing
  const stopSharing = async () => {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    if (sessionId) await deleteDoc(doc(db, "sessions", sessionId));
    alert("Has dejado de compartir tu ubicación.");
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Compartir mi ubicación</h1>

      {link && (
        <div>
          <p>Comparte este link:</p>
          <a href={link} target="_blank" rel="noopener noreferrer">
            {link}
          </a>
        </div>
      )}

      <button
        onClick={stopSharing}
        style={{
          marginTop: "1rem",
          padding: "0.5rem 1rem",
          backgroundColor: "#ff4d4f",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Dejar de compartir mi ubicación
      </button>
    </div>
  );
};

export default Delivery;
