import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ChefHat, LoaderCircle, LockKeyhole, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { safeStaffRedirect } from "@/lib/staff-access";
import { Btn, Card, Field, Input } from "@/components/pos/ui";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Acceso del personal · Chilaquería" },
      { name: "description", content: "Inicia sesión o registra tu cuenta para solicitar acceso al punto de venta de Chilaquería." },
      { property: "og:title", content: "Acceso del personal · Chilaquería" },
      { property: "og:description", content: "Acceso exclusivo para el personal aprobado de Chilaquería." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function authErrorMessage(message: string): string {
  if (message.includes("Invalid login credentials")) return "El correo o la contraseña no son correctos.";
  if (message.includes("Email not confirmed")) return "Confirma tu correo antes de iniciar sesión.";
  if (message.includes("User already registered")) return "Ya existe una cuenta con este correo.";
  return message;
}

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [puesto, setPuesto] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [confirmationSent, setConfirmationSent] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      if (session) void navigate({ href: safeStaffRedirect(search.redirect), replace: true });
      else setChecking(false);
    });
    return () => {
      active = false;
    };
  }, [navigate, search.redirect]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { nombre: nombre.trim(), puesto: puesto.trim() },
            emailRedirectTo: window.location.origin,
          },
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setConfirmationSent(true);
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
      }
      await navigate({ href: safeStaffRedirect(search.redirect), replace: true });
    } catch (cause) {
      setError(authErrorMessage(cause instanceof Error ? cause.message : "No se pudo completar el acceso."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 font-sans">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-secondary text-primary">
            <ChefHat className="size-7" />
          </span>
          <h1 className="font-display text-3xl font-extrabold text-primary">Chilaquería</h1>
          <p className="mt-2 text-sm text-muted-foreground">Acceso exclusivo para el personal</p>
        </div>

        <Card className="p-6">
          {checking ? (
            <p className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" /> Comprobando la sesión…
            </p>
          ) : confirmationSent ? (
            <div className="space-y-4 py-4 text-center">
              <MailCheck className="mx-auto size-10 text-success" />
              <h2 className="font-display text-xl font-bold">Revisa tu correo</h2>
              <p className="text-sm text-muted-foreground">
                Te enviamos un enlace para confirmar <strong>{email}</strong>. Después podrás iniciar sesión; un encargado deberá aprobar tu acceso.
              </p>
              <Btn variant="outline" className="w-full" onClick={() => { setConfirmationSent(false); setMode("login"); }}>
                Volver a iniciar sesión
              </Btn>
            </div>
          ) : (
            <>
              <div className="mb-5 flex items-center gap-2">
                <LockKeyhole className="size-5 text-primary" />
                <h2 className="font-display text-xl font-bold">{mode === "login" ? "Iniciar sesión" : "Crear cuenta"}</h2>
              </div>
              <form className="space-y-4" onSubmit={(event) => void submit(event)}>
                {mode === "signup" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Nombre">
                      <Input value={nombre} onChange={(event) => setNombre(event.target.value)} required maxLength={100} autoComplete="name" />
                    </Field>
                    <Field label="Puesto">
                      <Input value={puesto} onChange={(event) => setPuesto(event.target.value)} required maxLength={100} placeholder="Caja, cocina, mesero…" />
                    </Field>
                  </div>
                )}
                <Field label="Correo electrónico">
                  <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
                </Field>
                <Field label="Contraseña">
                  <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} />
                </Field>
                {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error}</p>}
                <Btn type="submit" className="w-full" disabled={busy}>
                  {busy && <LoaderCircle className="size-4 animate-spin" />}
                  {mode === "login" ? "Entrar" : "Solicitar acceso"}
                </Btn>
              </form>
              <div className="mt-5 text-center text-sm text-muted-foreground">
                {mode === "login" ? "¿Aún no tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
                <button className="font-semibold text-primary hover:underline" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>
                  {mode === "login" ? "Regístrate" : "Inicia sesión"}
                </button>
              </div>
              {mode === "signup" && <p className="mt-4 text-center text-xs text-muted-foreground">Tu acceso quedará pendiente hasta que un encargado lo apruebe.</p>}
            </>
          )}
        </Card>
      </div>
    </main>
  );
}
