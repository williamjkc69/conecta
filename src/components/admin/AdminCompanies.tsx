import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Trash2, Edit, Building } from "lucide-react";
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
// @ts-ignore
import { fetchUsersWithStats } from "@/lib/adminStats";
import { supabase } from "@/lib/supabase";
import ChangePasswordModal from "./ChangePasswordModal";
import Pagination from "./Pagination";

interface AdminCompany {
  id: string;
  company_name: string;
  email: string;
  interviews_count: number;
  created_at: string;
}

const AdminCompanies = () => {
  const [users, setUsers] = useState<AdminCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<AdminCompany | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const { toast } = useToast();

  const fetchCompanies = useCallback(
    async (search: string, page: number) => {
      setLoading(true);
      try {
        const { users: fetchedUsers, count } = await fetchUsersWithStats({
          role: "company",
          searchTerm: search,
          page,
          limit
        });
        setUsers(fetchedUsers);
        setTotalPages(Math.ceil(count / limit));
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar las empresas.",
          variant: "destructive"
        });
      }
      setLoading(false);
    },
    [toast, limit]
  );

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    setCurrentPage(1);
    fetchCompanies(debouncedSearchTerm, 1);
  }, [debouncedSearchTerm, fetchCompanies]);

  useEffect(() => {
    if (currentPage > 1) {
      fetchCompanies(debouncedSearchTerm, currentPage);
    }
  }, [currentPage, debouncedSearchTerm, fetchCompanies]);

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    setDeletingId(userId);
    const { error } = await supabase.functions.invoke("delete-user", {
      body: { userId }
    });
    if (error) {
      toast({
        title: "Error",
        description: `No se pudo eliminar a la empresa ${userEmail}.`,
        variant: "destructive"
      });
    } else {
      toast({ title: "Éxito", description: `Empresa ${userEmail} eliminada.` });
      fetchCompanies(searchTerm, currentPage);
    }
    setDeletingId(null);
  };

  const openPasswordModal = (user: AdminCompany) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
        <Building /> Gestión de Empresas
      </h2>
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          placeholder="Buscar por nombre o email..."
          className="pl-10 bg-slate-800 border-slate-700"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-800">
              <tr>
                <th className="p-4 font-semibold">Empresa</th>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold text-center">Entrevistas</th>
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
                    <td className="p-4">{user.company_name || "N/A"}</td>
                    <td className="p-4 text-slate-400">{user.email}</td>
                    <td className="p-4 text-center">{user.interviews_count}</td>
                    <td className="p-4 text-slate-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-yellow-500 text-yellow-300 hover:bg-yellow-500/10 hover:text-yellow-200"
                        onClick={() => openPasswordModal(user)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                            disabled={deletingId === user.id}
                          >
                            {deletingId === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-slate-900 border-slate-700 text-slate-200">
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción es irreversible. Se eliminará
                              permanentemente la empresa{" "}
                              <strong>{user.company_name}</strong> y todos sus
                              datos asociados (vacantes, aplicaciones, etc.).
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
                              Sí, eliminar
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
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
      {editingUser && (
        <ChangePasswordModal
          user={editingUser}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
        />
      )}
    </div>
  );
};

export default AdminCompanies;
