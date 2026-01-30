import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Key } from "lucide-react";

interface User {
  id: string;
  email: string;
}

interface ChangePasswordModalProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  user,
  open,
  onOpenChange
}) => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePasswordChange = async () => {
    if (!user) return;

    if (!password) {
      toast({
        title: "Error",
        description: "La contraseña no puede estar vacía.",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);

    const { error } = await supabase.functions.invoke("update-user-password", {
      body: { userId: user.id, password }
    });

    if (error) {
      toast({
        title: "Error al cambiar la contraseña",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Éxito",
        description: `Contraseña actualizada para ${user.email}.`
      });
      setPassword("");
      onOpenChange(false);
    }
    setLoading(false);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-200">
        <DialogHeader>
          <DialogTitle>Cambiar Contraseña</DialogTitle>
          <DialogDescription>
            Estás cambiando la contraseña para el usuario{" "}
            <span className="font-bold text-cyan-400">{user.email}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <Label htmlFor="new-password">Nueva Contraseña</Label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-600"
              placeholder="Ingresa la nueva contraseña"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handlePasswordChange} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Actualizar Contraseña
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordModal;
