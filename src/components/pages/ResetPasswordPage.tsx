import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

const ResetPasswordPage: React.FC = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Las contraseñas no coinciden"
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push("/");
      }, 2000);
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
          {!success ? (
            <>
              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold gradient-text mb-2">
                  Nueva Contraseña
                </h1>
                <p className="text-slate-400">Ingresa tu nueva contraseña</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300">
                    Nueva Contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-blue-950/30 border-blue-400/30 text-slate-100 pl-10 pr-10"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-slate-300">
                    Confirmar Contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-blue-950/30 border-blue-400/30 text-slate-100 pl-10"
                      required
                      minLength={6}
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
                  {loading ? "Actualizando..." : "Actualizar Contraseña"}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-slate-100 mb-2">
                ¡Contraseña Actualizada!
              </h1>
              <p className="text-slate-300">
                Tu contraseña ha sido actualizada exitosamente. Redirigiendo...
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
