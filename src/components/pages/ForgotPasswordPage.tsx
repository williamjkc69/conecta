"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Supabase sends the email automatically with their template unless we disable it.
      // If we want to use OUR template, we need to generate a link manually or capture the event.
      // Standard way with Supabase is to use their system for simplicity, or:
      // 1. Generate a token (server-side admin function).
      // 2. Send email via /api/send-email.

      // For this implementation plan, we will stick to Supabase's built-in robust flow but point the redirect URL
      // to our new update-password page.

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`
      });

      if (error) throw error;

      setSent(true);
      toast({
        title: "Correo enviado",
        description:
          "Revisa tu bandeja de entrada para restablecer tu contraseña."
      });

      // OPTIONAL: If we were sending custom email (bypassing Supabase email),
      // we would do it here, but getting a valid reset token from purely client-side Supabase SDK isn't possible
      // without triggering their email.
      // We rely on Supabase email here for the token security.
    } catch (error: any) {
      console.error("Reset password error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.message || "No se pudo enviar el correo de recuperación."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-xl p-8 shadow-2xl">
        <Link
          href="/"
          className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Inicio
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 mb-2">
            Recuperar Contraseña
          </h1>
          <p className="text-slate-400">
            Ingresa tu email y te enviaremos un enlace para recuperar tu cuenta.
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-400">
              <Mail className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-semibold text-white">
              ¡Correo Enviado!
            </h2>
            <p className="text-slate-300">
              Hemos enviado las instrucciones a <strong>{email}</strong>.
            </p>
            <Button
              variant="outline"
              className="w-full mt-4 border-slate-600 text-slate-200 hover:bg-slate-700"
              onClick={() => setSent(false)}
            >
              Intentar con otro correo
            </Button>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">
                Correo Electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-900/50 border-slate-600 text-white focus:ring-cyan-500 focus:border-cyan-500"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-900/20"
              disabled={loading}
            >
              {loading ? "Enviando..." : "Enviar Enlace de Recuperación"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
