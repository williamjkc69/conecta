"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "company" | "candidate" | "admin";
  initialEmail?: string;
  jobId?: string;
  token?: string;
}

const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  type,
  initialEmail,
  jobId,
  token
}) => {
  const { signIn, signUp } = useAuthStore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(
    initialEmail ? "signup" : "signin"
  );
  const [formData, setFormData] = useState({
    email: initialEmail || "",
    password: "",
    confirm_password: "",
    full_name: "",
    company_name: "",
    document_number: ""
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await signIn(formData.email, formData.password);
    if (!error) {
      toast({
        title: "✅ ¡Bienvenido de vuelta!",
        description: "Has iniciado sesión correctamente."
      });
      const { user } = data;

      if (user?.email_confirmed_at) {
        // Fetch actual role from profile to ensure correct redirect
        // irrespective of which modal tab they used.
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        const userRole =
          profile?.role || (type === "company" ? "company" : "candidate");
        const dashboard =
          userRole === "company"
            ? "/company-dashboard"
            : "/candidate-dashboard";

        window.location.href = dashboard;
      } else {
        // Should not happen if sign in was successful but let's just close modal
        onClose();
      }
    } else {
      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description: error.message || "Credenciales incorrectas"
      });
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (formData.email.toLowerCase() === "root@admin.local") {
      toast({
        variant: "destructive",
        title: "Acción no permitida",
        description:
          "No puedes registrar el correo del administrador. Por favor, inicia sesión."
      });
      setLoading(false);
      setActiveTab("signin");
      return;
    }

    if (formData.password !== formData.confirm_password) {
      toast({
        variant: "destructive",
        title: "Las contraseñas no coinciden",
        description: "Por favor verifica que ambas contraseñas sean iguales."
      });
      setLoading(false);
      return;
    }

    const metaData = {
      type: type,
      full_name: formData.full_name,
      ...(type === "company" && { company_name: formData.company_name }),
      ...(type === "candidate" && { document_number: formData.document_number })
    };

    const options = { data: metaData };

    // @ts-ignore - Supabase options type matching
    const { data: authData, error } = await signUp(
      formData.email,
      formData.password,
      options
    );

    if (!error && authData?.user) {
      const user = authData.user;

      // Logic to accept invitation if token is present
      if (token && jobId && type === "candidate") {
        try {
          await fetch("/api/accept-invite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: formData.email,
              token,
              jobId,
              userId: user.id
            })
          });
        } catch (inviteProcessError) {
          console.error("Error processing invitation:", inviteProcessError);
        }
      }
      // Send verification email
      // Check if email already verified (rare on signup unless auto-confirm enabled)
      // Check if email already verified (rare on signup unless auto-confirm enabled)
      if (user.email_confirmed_at) {
        // Because it's a new signup, we can reasonably trust the 'type' prop (metadata),
        // but consistent behavior is better.
        const userRole = type === "company" ? "company" : "candidate"; // Metadata set during signup
        const dashboard =
          userRole === "company"
            ? "/company-dashboard"
            : "/candidate-dashboard";
        window.location.href = dashboard;
        return;
      }

      try {
        await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "verification",
            to: formData.email,
            payload: {
              // In a real Supabase flow, we'd use the link Supabase generates or our own verify page
              // For now, we'll point to our custom verify page.
              // Note: Supabase sends its own email if 'Enable Email Confirmations' is on.
              // If you want to use YOUR system entirely, you might disable Supabase emails
              // or ignore this if Supabase handles it.
              // Assuming user wants custom system:
              link: `${window.location.origin}/verify-email?email=${encodeURIComponent(formData.email)}`
            }
          })
        });
      } catch (emailErr) {
        console.error("Failed to send verification email", emailErr);
      }

      toast({
        title: "🎉 ¡Registro exitoso!",
        description:
          "Revisa tu correo para verificar tu cuenta antes de iniciar sesión."
      });
      onClose();
    } else if (error?.message?.includes("User already registered")) {
      toast({
        variant: "destructive",
        title: "Email ya registrado",
        description: "Este email ya está registrado. Por favor, inicia sesión."
      });
      setActiveTab("signin");
    } else {
      toast({
        variant: "destructive",
        title: "Error en el registro",
        description: error.message || "Algo salió mal"
      });
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-effect border-blue-500/50 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold gradient-text">
            {type === "company"
              ? "Acceso para Empresas"
              : "Acceso para Candidatos"}
          </DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-blue-950/30">
            <TabsTrigger value="signin">Iniciar Sesión</TabsTrigger>
            <TabsTrigger value="signup">Registrarse</TabsTrigger>
          </TabsList>
          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="email-signin" className="text-slate-300">
                  Email
                </Label>
                <Input
                  id="email-signin"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-blue-950/20 border-blue-400/20 text-slate-100"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-signin" className="text-slate-300">
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password-signin"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    className="bg-blue-950/20 border-blue-400/20 text-slate-100 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-slate-400 hover:text-slate-200"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
              >
                {loading ? "Ingresando..." : "Ingresar"}
              </Button>
            </form>
            <DialogFooter className="pt-4">
              <Link
                href="/forgot-password"
                onClick={onClose}
                className="text-sm text-cyan-400 hover:underline text-center w-full"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </DialogFooter>
          </TabsContent>
          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="full_name-signup" className="text-slate-300">
                  Nombre Completo
                </Label>
                <Input
                  id="full_name-signup"
                  name="full_name"
                  placeholder="Tu Nombre Completo"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="bg-blue-950/20 border-blue-400/20 text-slate-100"
                  required
                />
              </div>
              {type === "company" && (
                <div className="space-y-2">
                  <Label
                    htmlFor="company_name-signup"
                    className="text-slate-300"
                  >
                    Nombre de la Empresa
                  </Label>
                  <Input
                    id="company_name-signup"
                    name="company_name"
                    placeholder="Tu Empresa"
                    value={formData.company_name}
                    onChange={handleChange}
                    className="bg-blue-950/20 border-blue-400/20 text-slate-100"
                    required
                  />
                </div>
              )}
              {type === "candidate" && (
                <div className="space-y-2">
                  <Label
                    htmlFor="document_number-signup"
                    className="text-slate-300"
                  >
                    Número de Documento
                  </Label>
                  <Input
                    id="document_number-signup"
                    name="document_number"
                    placeholder="Tu número de identidad"
                    value={formData.document_number}
                    onChange={handleChange}
                    className="bg-blue-950/20 border-blue-400/20 text-slate-100"
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email-signup" className="text-slate-300">
                  Email
                </Label>
                <Input
                  id="email-signup"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-blue-950/20 border-blue-400/20 text-slate-100"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-signup" className="text-slate-300">
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password-signup"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    className="bg-blue-950/20 border-blue-400/20 text-slate-100 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-slate-400 hover:text-slate-200"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="confirm_password-signup"
                  className="text-slate-300"
                >
                  Confirmar Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="confirm_password-signup"
                    name="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirm_password}
                    onChange={handleChange}
                    className="bg-blue-950/20 border-blue-400/20 text-slate-100 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-slate-400 hover:text-slate-200"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
              >
                {loading ? "Creando cuenta..." : "Crear Cuenta"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
