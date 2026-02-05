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
  const token = searchParams.get("token");
  const email = searchParams.get("email"); // kept for fallback or specific error messages, but verification relies on token

  const [status, setStatus] = useState<
    "verifying" | "success" | "error" | "unverified"
  >(token ? "verifying" : "verifying");

  const [message, setMessage] = useState(
    "Verificando tu correo electrónico..."
  );
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [userEmail, setUserEmail] = useState<string | null>(null); // Store email for resend

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const justRegistered = searchParams.get("justRegistered");
  const [redirectUrl, setRedirectUrl] = useState("/");

  useEffect(() => {
    // Only start cooldown if user just registered
    if (justRegistered === "true" && status === "unverified") {
      setCooldown(60);
    }
  }, [justRegistered, status]);

  // ... (timer useEffect remains the same)

  useEffect(() => {
    const verify = async () => {
      // If token is present, try to verify with token
      if (token) {
        try {
          const { data, error } = await supabase.rpc("verify_user", { token });

          if (error) {
            throw error;
          }

          if (data === true) {
            setStatus("success");
            setMessage("¡Tu correo ha sido verificado correctamente!");

            // Determine redirect URL
            const {
              data: { session }
            } = await supabase.auth.getSession();

            if (session) {
              await supabase.auth.updateUser({
                data: { verified: true }
              });

              const { data: profileData } = await supabase
                .from("users")
                .select("role:roles(name)")
                .eq("auth_user_id", session.user.id)
                .single();

              const roleName = (profileData as any)?.role?.name;
              const dashboard =
                roleName === "company"
                  ? "/company-dashboard"
                  : "/candidate-dashboard";
              setRedirectUrl(dashboard);
            } else {
              setRedirectUrl("/?login=true");
            }
          } else {
            setStatus("error");
            setMessage("El enlace de verificación es inválido o ha expirado.");
          }
        } catch (err: any) {
          console.error("Verification error:", err);
          setStatus("error");
          setMessage("Hubo un error al verificar el token.");
        }
        return;
      }

      // If no token, check session status
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (session) {
        // Check if user is already verified in DB
        const { data: userRecord } = await supabase
          .from("users")
          .select("verified_at, email")
          .eq("auth_user_id", session.user.id)
          .single();

        // Store email for resend functionality
        if (userRecord?.email) {
          setUserEmail(userRecord.email);
        }

        if (userRecord?.verified_at) {
          // User IS verified - redirect to dashboard
          setStatus("success");
          setMessage("Tu cuenta ya está verificada.");

          const { data: profileData } = await supabase
            .from("users")
            .select("role:roles(name)")
            .eq("auth_user_id", session.user.id)
            .single();

          const roleName = (profileData as any)?.role?.name;
          const dashboard =
            roleName === "company"
              ? "/company-dashboard"
              : "/candidate-dashboard";

          setRedirectUrl(dashboard);

          // Redirect to appropriate dashboard after a short delay
          setTimeout(() => {
            router.push(dashboard);
          }, 2000);
        } else {
          // User is NOT verified - show unverified state
          setStatus("unverified");
          setMessage(
            "Tu cuenta aún no ha sido verificada. Por favor, revisa tu correo electrónico para encontrar el enlace de verificación."
          );
        }
      } else {
        // Not logged in and no token - redirect to home
        setStatus("error");
        setMessage("Debes iniciar sesión para verificar tu cuenta.");
        setTimeout(() => router.push("/?login=true"), 2000);
      }
    };

    verify();
  }, [token, email, router]);

  const handleResendEmail = async () => {
    setResending(true);
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      let emailToUse = userEmail || email;
      let tokenToSend = null;

      if (session?.user?.id) {
        // User is logged in - fetch from their auth_user_id
        const { data: userRecord, error: fetchError } = await supabase
          .from("users")
          .select("verification_token, email")
          .eq("auth_user_id", session.user.id)
          .single();

        if (fetchError) {
          console.error("Error fetching user record:", fetchError);
          throw new Error("No se pudo obtener la información del usuario.");
        }

        if (!userRecord?.verification_token) {
          console.error("No verification token found for user");
          throw new Error(
            "No se encontró el token de verificación. Por favor contacta soporte."
          );
        }

        emailToUse = userRecord.email;
        tokenToSend = userRecord.verification_token;
      } else if (emailToUse) {
        // User is NOT logged in but we have their email - fetch by email
        const { data: userRecord, error: fetchError } = await supabase
          .from("users")
          .select("verification_token")
          .eq("email", emailToUse)
          .single();

        if (fetchError) {
          console.error("Error fetching user by email:", fetchError);
          throw new Error("No se pudo obtener la información del usuario.");
        }

        if (!userRecord?.verification_token) {
          console.error("No verification token found for email");
          throw new Error(
            "No se encontró el token de verificación. Por favor contacta soporte."
          );
        }

        tokenToSend = userRecord.verification_token;
      } else {
        throw new Error(
          "No se pudo determinar tu correo electrónico. Por favor inicia sesión."
        );
      }

      console.log(
        "Resending verification email to:",
        emailToUse,
        "with token:",
        tokenToSend
      );

      const link = `${window.location.origin}/verify-email?token=${tokenToSend}`;

      const emailResponse = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "verification",
          to: emailToUse,
          payload: { link }
        })
      });

      if (!emailResponse.ok) {
        throw new Error("Error al enviar el correo.");
      }

      toast({
        title: "Correo enviado",
        description:
          "Se ha enviado un nuevo enlace de verificación a tu correo."
      });

      const isProduction = process.env.NODE_ENV === "production";
      setCooldown(isProduction ? 60 : 10);
    } catch (error: any) {
      console.error("Resend email error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo enviar el correo."
      });
    } finally {
      setResending(false);
    }
  };

  const handleAction = () => {
    if (status === "success" && redirectUrl) {
      router.push(redirectUrl);
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
