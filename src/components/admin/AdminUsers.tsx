import React, { useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Search,
  Trash2,
  Send,
  User,
  Building,
  Shield
} from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";

interface RoleIcons {
  [key: string]: ReactNode;
}

const roleIcons: RoleIcons = {
  candidate: <User className="w-4 h-4 text-blue-400" />,
  company: <Building className="w-4 h-4 text-green-400" />,
  admin: <Shield className="w-4 h-4 text-cyan-400" />
};

interface AdminUser {
  id: string;
  email: string;
  full_name?: string;
  company_name?: string;
  role: string;
  created_at: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);

  const { toast } = useToast();

  const fetchUsers = useCallback(
    async (search?: string) => {
      setLoading(true);
      let query = supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (search) {
        query = query.or(
          `full_name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar los usuarios.",
          variant: "destructive"
        });
      } else {
        setUsers(data);
      }
      setLoading(false);
    },
    [toast]
  );

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    fetchUsers(debouncedSearchTerm);
  }, [debouncedSearchTerm, fetchUsers]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    setDeletingId(userId);

    // Supabase Admin client is needed for this. This requires an edge function.
    const { error } = await supabase.functions.invoke("delete-user", {
      body: { userId }
    });

    if (error) {
      toast({
        title: "Error",
        description: `No se pudo eliminar al usuario ${userEmail}.`,
        variant: "destructive"
      });
    } else {
      toast({ title: "Éxito", description: `Usuario ${userEmail} eliminado.` });
      setUsers(users.filter((u) => u.id !== userId));
    }
    setDeletingId(null);
  };

  const handleResetPassword = async (email: string) => {
    setResettingId(email);
    // Reset password functionality
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar el email de recuperación.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Éxito",
        description: `Email de recuperación enviado a ${email}.`
      });
    }
    setResettingId(null);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-slate-100">Gestión de Usuarios</h2>
      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Buscar por nombre, email o empresa..."
            className="pl-10 bg-slate-800 border-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-800">
              <tr>
                <th className="p-4 font-semibold">Usuario</th>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold">Rol</th>
                <th className="p-4 font-semibold">Fecha de Registro</th>
                <th className="p-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && !users.length ? (
                <tr>
                  <td colSpan={5} className="text-center p-8">
                    <Loader2 className="mx-auto w-8 h-8 animate-spin text-cyan-400" />
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-t border-slate-700 hover:bg-slate-800/60"
                  >
                    <td className="p-4">
                      {user.full_name || user.company_name || "N/A"}
                    </td>
                    <td className="p-4 text-slate-400">{user.email}</td>
                    <td className="p-4 capitalize">
                      <span className="flex items-center gap-2">
                        {roleIcons[user.role] || ""}
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-500 text-blue-300 hover:bg-blue-500/10 hover:text-blue-200"
                        onClick={() => handleResetPassword(user.email)}
                        disabled={resettingId === user.email}
                      >
                        {resettingId === user.email ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                            disabled={
                              deletingId === user.id || user.role === "admin"
                            }
                          >
                            {deletingId === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción es irreversible. Se eliminará
                              permanentemente al usuario{" "}
                              <strong>{user.email}</strong> y todos sus datos
                              asociados (vacantes, aplicaciones, etc.).
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                handleDeleteUser(user.id, user.email)
                              }
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Sí, eliminar usuario
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
