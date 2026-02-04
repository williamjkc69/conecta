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
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface CandidateOnboardingModalProps {
  userId: number; // The public.users id (integer)
  userName: string; // Current name from signup
  onSuccess: () => void;
}

const CandidateOnboardingModal: React.FC<CandidateOnboardingModalProps> = ({
  userId,
  userName,
  onSuccess
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [documentNumber, setDocumentNumber] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update user record with document number
      const { error: updateError } = await supabase
        .from("users")
        .update({
          document_number: documentNumber
        })
        .eq("id", userId);

      if (updateError) throw updateError;

      toast({
        title: "¡Perfil Completado!",
        description: "Tu información ha sido guardada correctamente."
      });

      // Wait a moment for the database to update, then reload
      setTimeout(() => {
        onSuccess(); // Triggers refetch in parent
        window.location.reload();
      }, 500);
    } catch (error: any) {
      console.error("Error completing candidate profile:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la información.",
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
            Completa tu Perfil
          </DialogTitle>
          <p className="text-slate-400 text-center text-sm">
            Hola {userName}, necesitamos un dato adicional para continuar.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="document_number" className="text-slate-300">
              Número de Documento *
            </Label>
            <Input
              id="document_number"
              name="document_number"
              placeholder="Tu número de identidad"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              className="bg-blue-950/20 border-blue-400/20 text-slate-100"
              required
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
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

export default CandidateOnboardingModal;
