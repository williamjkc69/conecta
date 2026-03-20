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
  Shield,
  Power,
  Ban,
  CheckCircle
} from "lucide-react";
import { toggleUserStatusAction } from "@/lib/actions/user-actions";
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
import {
  BUTTONS,
  TITLES,
  MESSAGES,
  LABELS,
  PLACEHOLDERS
} from "@/constants/text";

interface RoleIcons {
  [key: string]: ReactNode;
}

const roleIcons: RoleIcons = {
  candidate: <User className="w-4 h-4 text-blue-400" />,
  company: <Building className="w-4 h-4 text-green-400" />,
  admin: <Shield className="w-4 h-4 text-cyan-400" />
};

interface AdminUser {
  id: number;
  auth_user_id: string;
  email: string;
  full_name?: string;
  company_name?: string;
  role: string;
  created_at: string;
  disabled: boolean;
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
      // Query users with joined tables
      let query = supabase
        .from("users")
        .select(
          `
          id,
          auth_user_id,
          email,
          name,
          lastname,
          created_at,
          disabled,
          role:roles!inner(name),
          company:companies(name)
        `
        )
        .order("created_at", { ascending: false });

      if (search) {
        // Search is tricky with joined tables in Supabase JS without text search setup or view.
        // We'll search local fields. For deep search, we might need a stored proc or view.
        // Trying simple text search on top level users + company name if possible.
        // Simplification: search on user fields.
        query = query.or(
          `name.ilike.%${search}%,lastname.ilike.%${search}%,email.ilike.%${search}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        toast({
          title: TITLES.ERROR,
          description: MESSAGES.ERROR_LOADING_USERS,
          variant: "destructive"
        });
      } else {
        const mappedUsers: AdminUser[] = data.map((u: any) => ({
          id: u.id,
          auth_user_id: u.auth_user_id,
          email: u.email,
          full_name: `${u.name || ""} ${u.lastname || ""}`.trim(),
          company_name: u.company?.name,
          role: u.role?.name,
          disabled: u.disabled || false,
          created_at: u.created_at
        }));
        setUsers(mappedUsers);
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

  const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
    setDeletingId(String(userId));

    // Toggle: if currentStatus is true (disabled), we enable it (false).
    const newStatus = !currentStatus;

    const result = await toggleUserStatusAction(userId, newStatus);

    if (!result.success) {
      toast({
        title: TITLES.ERROR,
        description: result.error || "Failed to update user status",
        variant: "destructive"
      });
    } else {
      toast({
        title: TITLES.SUCCESS,
        description: newStatus
          ? "User disabled successfully"
          : "User activated successfully"
      });
      // Optimistic update
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, disabled: newStatus } : u))
      );
    }
    setDeletingId(null);
  };
  // Removed redundant success toast logic since it's handled above
  /*
  if (error) { ... } else { ... }
  */

  const handleResetPassword = async (email: string) => {
    setResettingId(email);
    // Reset password functionality
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      toast({
        title: TITLES.ERROR,
        description: MESSAGES.SEND_RESET_ERROR,
        variant: "destructive"
      });
    } else {
      toast({
        title: TITLES.SUCCESS,
        description: MESSAGES.RESET_SENT_TOAST
      });
    }
    setResettingId(null);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-slate-100">
        {TITLES.USER_MANAGEMENT}
      </h2>
      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder={PLACEHOLDERS.ADMIN_SEARCH_USERS}
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
                <th className="p-4 font-semibold">{LABELS.USER}</th>
                <th className="p-4 font-semibold">{LABELS.EMAIL}</th>
                <th className="p-4 font-semibold">{LABELS.ROLE}</th>
                <th className="p-4 font-semibold">{LABELS.REGISTERED_DATE}</th>
                <th className="p-4 font-semibold text-right">
                  {LABELS.ACTIONS}
                </th>
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
                      {user.full_name ||
                        user.company_name ||
                        LABELS.NOT_AVAILABLE}
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
                      {user.disabled ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-500 text-green-300 hover:bg-green-500/10 hover:text-green-200"
                          onClick={() => handleToggleStatus(user.id, true)}
                          disabled={deletingId === String(user.id)}
                        >
                          {deletingId === String(user.id) ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </Button>
                      ) : (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                              disabled={
                                deletingId === String(user.id) ||
                                user.role === "admin"
                              }
                            >
                              {deletingId === String(user.id) ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Ban className="w-4 h-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Disable User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to disable this user? They
                                will not be able to log in.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleToggleStatus(user.id, false)
                                }
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Disable User
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
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
