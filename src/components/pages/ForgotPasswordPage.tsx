import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

const ForgotPasswordPage: React.FC = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } else {
      setSubmitted(true);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="glass-effect border-blue-500/50 text-slate-100 rounded-2xl p-8 shadow-2xl">
          {!submitted ? (
            <>
              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold gradient-text mb-2">
                  Recuperar Contraseña
                </h1>
                <p className="text-slate-400">
                  Ingresa tu email y te enviaremos un enlace para restablecer tu
                  contraseña.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-blue-950/30 border-blue-400/30 text-slate-100 pl-10"
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {loading ? "Enviando..." : "Enviar Enlace de Recuperación"}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-slate-100 mb-2">
                ¡Revisa tu correo!
              </h1>
              <p className="text-slate-300">
                Si existe una cuenta con el email{" "}
                <span className="font-bold text-cyan-400">{email}</span>, hemos
                enviado un enlace para restablecer tu contraseña.
              </p>
            </div>
          )}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-cyan-400 hover:underline inline-flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Volver al inicio
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
