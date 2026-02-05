"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface CompanyOnboardingModalProps {
  userId: number; // The public.users id (integer)
  onSuccess: () => void;
}

const CompanyOnboardingModal: React.FC<CompanyOnboardingModalProps> = ({
  userId,
  onSuccess
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    phone: "",
    email: ""
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let logoUrl = null;

      // 2. Create Company Record
      const { data: companyData, error: insertError } = await supabase
        .from("companies")
        .insert({
          name: formData.name,
          description: formData.description,
          phone: formData.phone,
          email: formData.email, // Contact email for the company listing
          logo: logoUrl
        })
        .select()
        .single();

      if (insertError) throw insertError;

      console.log("Company created successfully:", companyData);
      console.log("Updating user", userId, "with company_id:", companyData.id);

      // 3. Link Company to User
      const { error: linkError } = await supabase
        .from("users")
        .update({ company_id: companyData.id })
        .eq("id", userId);

      if (linkError) {
        console.error("Error linking company to user:", linkError);
        throw linkError;
      }

      console.log("User successfully linked to company");

      toast({
        title: "¡Empresa Creada!",
        description: "Tu perfil de empresa ha sido configurado correctamente."
      });

      // Wait a moment for the database to update, then trigger refetch
      setTimeout(() => {
        onSuccess(); // Triggers refetch in parent
        // Reload page to ensure fresh data
        window.location.reload();
      }, 500);
    } catch (error: any) {
      console.error("Error onboarding company:", error);
      toast({
        title: "Error",
        description:
          error.message || "No se pudo guardar la información de la empresa.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent
        className="glass-effect border-blue-500/50 text-slate-100 sm:max-w-[500px]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold gradient-text text-center">
            Configura tu Empresa
          </DialogTitle>
          <p className="text-slate-400 text-center text-sm">
            Para continuar, necesitamos algunos detalles sobre tu organización.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-300">
              Nombre de la Empresa *
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="Ej. Tech Solutions Inc."
              value={formData.name}
              onChange={handleChange}
              className="bg-blue-950/20 border-blue-400/20 text-slate-100"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-300">
              Descripción
            </Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Cuéntanos brevemente qué hace tu empresa..."
              value={formData.description}
              onChange={handleChange}
              className="bg-blue-950/20 border-blue-400/20 text-slate-100 min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-slate-300">
                Teléfono
              </Label>
              <Input
                id="phone"
                name="phone"
                placeholder="+52 555..."
                value={formData.phone}
                onChange={handleChange}
                className="bg-blue-950/20 border-blue-400/20 text-slate-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">
                Email de Contacto
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="contacto@empresa.com"
                value={formData.email}
                onChange={handleChange}
                className="bg-blue-950/20 border-blue-400/20 text-slate-100"
                required
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
                </>
              ) : (
                "Guardar y Continuar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CompanyOnboardingModal;
