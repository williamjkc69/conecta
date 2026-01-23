import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Key, Loader2, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";

const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    console.log("Attempting login with email:", email);

    if (email.toLowerCase() !== "root@admin.local") {
      toast({
        variant: "destructive",
        title: "Acceso denegado",
        description: "Email incorrecto."
      });
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    console.log("Supabase signIn response data:", data);
    console.log("Supabase signIn response error:", error);

    if (!error && data.user) {
      router.push("/admin-dashboard/overview");
    } else {
      toast({
        variant: "destructive",
        title: "Error de autenticación",
        description: error?.message || "Credenciales inválidas"
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div className="glass-effect border-blue-500/50 text-slate-100 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-3">
              <Shield className="w-8 h-8 text-cyan-400" />
              <h1 className="text-3xl font-bold gradient-text">Admin Panel</h1>
            </div>
            <p className="text-slate-400">
              Acceso exclusivo para administradores.
            </p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-blue-950/30 border-blue-400/30 text-slate-100 pl-10"
                  placeholder="root@admin.local"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-blue-950/30 border-blue-400/30 text-slate-100 pl-10"
                  placeholder="virtualiza"
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
              {loading ? "Verificando..." : "Ingresar"}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLoginPage;
