"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, CheckCircle, XCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

function VerifyEmailContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");
  const [status, setStatus] = useState<
    "verifying" | "success" | "error" | "unverified"
  >(
    email ? "verifying" : "verifying" // Initial state, will resolve in useEffect
  );
  const [message, setMessage] = useState(
    "Verificando tu correo electrónico..."
  );
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    const verifyUser = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!email) {
        if (session) {
          // Check if actually verified
          const { data: profile } = await supabase
            .from("profiles")
            .select("verified_at")
            .eq("id", session.user.id)
            .single();

          if (profile?.verified_at) {
            setStatus("success");
            setMessage("Tu cuenta ya está verificada.");
          } else {
            setStatus("unverified");
            setMessage(
              "Tu cuenta aún no ha sido verificada. Por favor, revisa tu correo electrónico."
            );
          }
        } else {
          // Not logged in and no token -> redirect to home
          router.push("/");
        }
        return;
      }

      // If email param exists, try to verify
      try {
        if (session && session.user.email === email) {
          // User is logged in and email matches, valid verification context
          const { error } = await supabase
            .from("profiles")
            .update({ verified_at: new Date().toISOString() })
            .eq("id", session.user.id);

          if (error) throw error;
          setStatus("success");
          setMessage("¡Tu correo ha sido verificado correctamente!");
        } else {
          if (!session) {
            setStatus("error"); // Soft error
            setMessage(
              "Por favor, inicia sesión para completar la verificación."
            );
          } else {
            setStatus("error");
            setMessage("El correo no coincide con la sesión actual.");
          }
        }
      } catch (error: any) {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage("Hubo un error al verificar tu correo. Inténtalo de nuevo.");
      }
    };

    verifyUser();
  }, [email, router]);

  const handleResendEmail = async () => {
    setResending(true);
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (session?.user?.email) {
        await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "verification",
            to: session.user.email,
            payload: {
              link: `${window.location.origin}/verify-email?email=${encodeURIComponent(
                session.user.email
              )}`
            }
          })
        });
        toast({
          title: "Correo enviado",
          description: "Se ha enviado un nuevo enlace de verificación."
        });
        // 60s for production (simulated), 5s for dev/test as requested
        const isProduction = process.env.NODE_ENV === "production";
        setCooldown(isProduction ? 60 : 5);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo enviar el correo."
      });
    } finally {
      setResending(false);
    }
  };

  const handleAction = () => {
    if (status === "success") {
      router.push("/candidate-dashboard");
    } else {
      router.push("/");
    }
  };

  return (
    <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 max-w-md w-full text-center space-y-6">
      {status === "verifying" && (
        <>
          <Loader2 className="w-16 h-16 text-cyan-400 animate-spin mx-auto" />
          <h1 className="text-2xl font-bold">Verificando...</h1>
          <p className="text-slate-400">{message}</p>
        </>
      )}

      {status === "success" && (
        <>
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h1 className="text-2xl font-bold text-green-400">¡Verificado!</h1>
          <p className="text-slate-300">{message}</p>
          <Button
            onClick={handleAction}
            className="w-full bg-cyan-600 hover:bg-cyan-500"
          >
            Continuar al Dashboard
          </Button>
        </>
      )}

      {status === "error" && (
        <>
          <XCircle className="w-16 h-16 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold text-red-400">Error</h1>
          <p className="text-slate-300 mb-4">{message}</p>
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="w-full border-slate-600 hover:bg-slate-700"
          >
            Volver al Inicio
          </Button>
        </>
      )}

      {status === "unverified" && (
        <>
          <Mail className="w-16 h-16 text-yellow-500 mx-auto animate-pulse" />
          <h1 className="text-2xl font-bold text-yellow-400">
            Verificación Pendiente
          </h1>
          <p className="text-slate-300">{message}</p>
          <div className="space-y-3 pt-4">
            <Button
              onClick={handleResendEmail}
              disabled={resending || cooldown > 0}
              className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-400"
            >
              {resending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : cooldown > 0 ? (
                `Reenviar en ${cooldown}s`
              ) : (
                "Reenviar correo de verificación"
              )}
            </Button>
            <Button
              onClick={() => router.push("/")}
              variant="ghost"
              className="w-full text-slate-400 hover:text-white"
            >
              Volver al inicio
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
      <Suspense
        fallback={<Loader2 className="w-16 h-16 text-cyan-400 animate-spin" />}
      >
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
