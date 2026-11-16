import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/auth" });
  },
  head: () => ({
    meta: [
      { title: "Chilaquería · Acceso al Punto de Venta" },
      { name: "description", content: "Entra al punto de venta de Chilaquería con una cuenta de personal aprobada." },
      { property: "og:title", content: "Chilaquería · Acceso al Punto de Venta" },
      { property: "og:description", content: "Acceso para el personal autorizado de Chilaquería." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
