import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin · Té Sueño",
  manifest: "/manifest-admin.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Comanda",
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
