import React, { useState, useEffect, useCallback, ReactNode } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Search,
  Trash2,
  Edit,
  User,
  Send,
  Briefcase,
  Check,
  X,
  Clock as ClockIcon
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
// @ts-ignore
import { fetchUsersWithStats } from "@/lib/adminStats";
import { supabase } from "@/lib/supabase";
import ChangePasswordModal from "./ChangePasswordModal";
import Pagination from "./Pagination";

interface StatusConfigItem {
  icon: ReactNode;
  text: string;
  color: string;
}

const statusConfig: Record<string, StatusConfigItem> = {
  invited: {
    icon: <Send className="w-4 h-4" />,
    text: "Invitado",
    color: "bg-blue-500/20 text-blue-300"
  },
  applied: {
    icon: <Briefcase className="w-4 h-4" />,
    text: "Aplicó",
    color: "bg-cyan-500/20 text-cyan-300"
  },
  interviewing: {
    icon: <ClockIcon className="w-4 h-4" />,
    text: "En Entrevista",
    color: "bg-purple-500/20 text-purple-300"
  },
  reviewed: {
    icon: <Check className="w-4 h-4" />,
    text: "Completada",
    color: "bg-green-500/20 text-green-400"
  },
  rejected: {
    icon: <X className="w-4 h-4" />,
    text: "Rechazado",
    color: "bg-red-500/20 text-red-400"
  },
  hired: {
    icon: <Check className="w-4 h-4" />,
    text: "Contratado",
    color: "bg-emerald-500/20 text-emerald-400"
  },
  default: {
    icon: <User className="w-4 h-4" />,
    text: "N/A",
    color: "bg-gray-500/20 text-gray-400"
  }
};

interface AdminCandidate {
  id: string;
  full_name: string;
  email: string;
  interviews_count: number;
  last_status: string;
  created_at: string;
}

const AdminCandidates = () => {
  const [users, setUsers] = useState<AdminCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<AdminCandidate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const { toast } = useToast();

  const fetchCandidates = useCallback(
    async (search: string, page: number) => {
      setLoading(true);
      try {
        const { users: fetchedUsers, count } = await fetchUsersWithStats({
          role: "candidate",
          searchTerm: search,
          page,
          limit
        });
        setUsers(fetchedUsers);
        setTotalPages(Math.ceil(count / limit));
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar los candidatos.",
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
    fetchCandidates(debouncedSearchTerm, 1);
  }, [debouncedSearchTerm, fetchCandidates]);

  // Handle page changes without resetting search
  useEffect(() => {
    if (currentPage > 1) {
      // Skip initial load or search reset
      fetchCandidates(debouncedSearchTerm, currentPage);
    }
  }, [currentPage, debouncedSearchTerm, fetchCandidates]);

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    setDeletingId(userId);
    const { error } = await supabase.functions.invoke("delete-user", {
      body: { userId }
    });
    if (error) {
      toast({
        title: "Error",
        description: `No se pudo eliminar al candidato ${userEmail}.`,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Éxito",
        description: `Candidato ${userEmail} eliminado.`
      });
      fetchCandidates(searchTerm, currentPage);
    }
    setDeletingId(null);
  };

  const openPasswordModal = (user: AdminCandidate) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
        <User /> Gestión de Candidatos
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
                <th className="p-4 font-semibold">Candidato</th>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold text-center">Entrevistas</th>
                <th className="p-4 font-semibold text-center">Último Estado</th>
                <th className="p-4 font-semibold">Registro</th>
                <th className="p-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && !users.length ? (
                <tr>
                  <td colSpan={6} className="text-center p-8">
                    <Loader2 className="mx-auto w-8 h-8 animate-spin text-cyan-400" />
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const statusInfo =
                    statusConfig[user.last_status] || statusConfig.default;
                  return (
                    <tr
                      key={user.id}
                      className="border-t border-slate-700 hover:bg-slate-800/60"
                    >
                      <td className="p-4">{user.full_name || "N/A"}</td>
                      <td className="p-4 text-slate-400">{user.email}</td>
                      <td className="p-4 text-center">
                        {user.interviews_count}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}
                        >
                          {statusInfo.icon}
                          {statusInfo.text}
                        </span>
                      </td>
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
                              <AlertDialogTitle>
                                ¿Estás seguro?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción es irreversible. Se eliminará
                                permanentemente al candidato{" "}
                                <strong>{user.full_name}</strong> y todos sus
                                datos asociados.
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
                  );
                })
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

export default AdminCandidates;
