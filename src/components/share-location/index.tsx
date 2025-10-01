"use client";
// import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { doc, onSnapshot } from "firebase/firestore";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";

// Icono predeterminado de Leaflet
// delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function WatchPosition() {
  //   const router = useRouter();
  const { sessionId } = useParams();
  const [position, setPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    const unsub = onSnapshot(
      doc(db, "sessions", sessionId as string),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPosition([data.latitude, data.longitude]);
        }
      }
    );
    return () => unsub();
  }, [sessionId]);

  if (!position) return <p>Cargando mapa...</p>; // no renderizar mapa aún

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapContainer
        center={position}
        zoom={16}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={position} />
      </MapContainer>
    </div>
  );
}
