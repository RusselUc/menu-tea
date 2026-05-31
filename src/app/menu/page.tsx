import { Metadata } from "next";
import Menu from "@/components/menu";

export const metadata: Metadata = {
  title: "Té Sueño | Menú de Bubble Tea — Calkiní, Campeche",
  description: "Ve el menú completo de Té Sueño: frappes, tés frutales, sodas italianas y especiales. Personaliza tu orden y pídela por WhatsApp. Calkiní, Campeche.",
  alternates: {
    canonical: "https://te-sueno-bobba-tea.vercel.app/menu",
  },
  openGraph: {
    title: "Menú — Té Sueño Bubble Tea",
    description: "Frappes, tés frutales, sodas italianas y especiales en Calkiní, Campeche.",
    url: "https://te-sueno-bobba-tea.vercel.app/menu",
  },
};

export default function MenuPage() {
  return <Menu />;
}
