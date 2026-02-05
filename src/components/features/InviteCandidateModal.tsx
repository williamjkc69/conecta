import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Search, UserPlus, Briefcase } from "lucide-react";
import {
  TITLES,
  MESSAGES,
  BUTTONS,
  LABELS,
  PLACEHOLDERS
} from "@/constants/text";

interface InviteCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onInviteSent?: () => void;
  candidate?: any;
  job?: any;
  jobs?: any[];
}

const InviteCandidateModal: React.FC<InviteCandidateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onInviteSent,
  candidate: initialCandidate,
  job: initialJob,
  jobs: externalJobs
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<any[]>(externalJobs || []);
  const [selectedJobId, setSelectedJobId] = useState(initialJob?.id || "");
  const [emailSearch, setEmailSearch] = useState("");
  const [foundCandidate, setFoundCandidate] = useState<any>(
    initialCandidate || null
  );
  const [searching, setSearching] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchJobs();
      if (initialCandidate) {
        setFoundCandidate(initialCandidate);
        setEmailSearch(initialCandidate.email);
      } else {
        setFoundCandidate(null);
        setEmailSearch("");
      }
      if (initialJob) {
        setSelectedJobId(initialJob.id);
      }
    }
  }, [isOpen, initialCandidate, initialJob]);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from("listings")
        .select("id, title, company_id, company:companies(name)")
        .eq("status", "active");

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast({
        variant: "destructive",
        title: TITLES.ERROR,
        description: MESSAGES.ERROR_LOADING_JOBS
      });
    }
  };

  const searchCandidate = async () => {
    if (!emailSearch.trim()) return;

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select(
          `
            id, name, lastname, email, auth_user_id,
            role:roles!inner(name)
        `
        )
        .eq("email", emailSearch.trim())
        .eq("role.name", "candidate")
        .single();

      if (error) {
        setFoundCandidate(null);
        toast({
          variant: "destructive",
          title: MESSAGES.CANDIDATE_NOT_FOUND_TITLE,
          description: MESSAGES.CANDIDATE_NOT_FOUND_DESC
        });
      } else {
        const candidate = {
          ...data,
          full_name: `${data.name || ""} ${data.lastname || ""}`.trim()
        };
        setFoundCandidate(candidate);
        toast({
          title: MESSAGES.CANDIDATE_FOUND_TITLE,
          description: `${candidate.full_name} ${MESSAGES.CANDIDATE_FOUND_MSG}`
        });
      }
    } catch (error) {
      console.error("Error searching candidate:", error);
    } finally {
      setSearching(false);
    }
  };

  const checkUserExists = async (email: string) => {
    try {
      const response = await fetch("/api/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      return data.exists;
    } catch (error) {
      console.error("Error checking user:", error);
      return false; // Assume false or handle error
    }
  };

  const handleInvite = async () => {
    if (!selectedJobId) {
      toast({
        variant: "destructive",
        title: MESSAGES.FIELDS_INCOMPLETE_TITLE,
        description: MESSAGES.FIELDS_INCOMPLETE_DESC
      });
      return;
    }

    const emailToInvite = foundCandidate ? foundCandidate.email : emailSearch;
    if (!emailToInvite) {
      toast({
        variant: "destructive",
        title: MESSAGES.EMAIL_REQUIRED_TITLE,
        description: MESSAGES.EMAIL_REQUIRED_DESC
      });
      return;
    }

    setLoading(true);
    const selectedJob = jobs.find((j) => j.id === selectedJobId);

    try {
      const userExists = foundCandidate
        ? true
        : await checkUserExists(emailToInvite);

      if (userExists) {
        // --- EXISTING USER FLOW ---
        let candidateId = foundCandidate?.id;

        // If we found candidate object, we have ID.
        // If userExists is true but no object (check-user flow), we can't create application without ID
        // unless check-user returns ID (which we fixed check-user to query users, but API returns bool currently).
        // Since we are moving to Normalized ID, we really need the ID.
        // For now, if we don't have candidate object, we fall back to "Invite existing via email" (notification only).
        // But if we have candidate object:

        if (foundCandidate && candidateId) {
          // Check existing
          const { data: existingApp } = await supabase
            .from("applications")
            .select("id")
            .eq("user_id", candidateId)
            .eq("listing_id", selectedJobId)
            .single();

          if (existingApp) {
            toast({
              variant: "destructive",
              title: MESSAGES.ALREADY_INVITED_TITLE,
              description: MESSAGES.ALREADY_INVITED_DESC
            });
            setLoading(false);
            return;
          }

          // Get 'invited' status ID
          const { data: statusData } = await supabase
            .from("application_statuses")
            .select("id")
            .eq("name", "invited")
            .single();
          const invitedStatusId = statusData?.id;

          const { error } = await supabase.from("applications").insert({
            user_id: candidateId,
            listing_id: selectedJobId,
            status_id: invitedStatusId
            // created_at defaults to now
          });

          if (error) throw error;

          // Send Notification Email
          await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "invitation_existing",
              to: foundCandidate.email,
              payload: {
                link: `${window.location.origin}/candidate-dashboard`,
                dashboardUrl: `${window.location.origin}/candidate-dashboard`
              }
            })
          });

          toast({
            title: MESSAGES.INVITATION_SENT_TITLE,
            description: MESSAGES.INVITATION_SENT_DESC
          });
        } else {
          // Exists but we don't have object. Just notify.
          await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "invitation_existing",
              to: emailToInvite,
              payload: {
                link: `${window.location.origin}/login`,
                dashboardUrl: `${window.location.origin}/candidate-dashboard`
              }
            })
          });
          toast({
            title: MESSAGES.NOTICE_SENT_TITLE,
            description: MESSAGES.NOTICE_SENT_DESC
          });
        }
      } else {
        // --- NEW USER FLOW ---
        const token = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Create invitation record in DB
        const { error: inviteError } = await supabase
          .from("invitations")
          .insert({
            email: emailToInvite,
            role: "candidate",
            listing_id: selectedJobId,
            company_id: selectedJob.company_id,
            token: token,
            expires_at: expiresAt.toISOString(),
            status: "pending"
          });

        if (inviteError) {
          console.error("Error creating invitation:", inviteError);
          throw new Error(MESSAGES.INVITATION_SAVE_ERROR);
        }

        await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "invitation_new",
            to: emailToInvite,
            payload: {
              role: "candidate",
              link: `${window.location.origin}/register?email=${encodeURIComponent(
                emailToInvite
              )}&listingId=${selectedJobId}&token=${token}`
            }
          })
        });

        toast({
          title: MESSAGES.INVITATION_SENT_TITLE,
          description: MESSAGES.NEW_USER_INVITE_DESC
        });
      }

      if (onSuccess) onSuccess();
      if (onInviteSent) onInviteSent();
      onClose();
    } catch (error: any) {
      console.error("Invitation error:", error);
      toast({
        variant: "destructive",
        title: TITLES.ERROR,
        description: error.message || MESSAGES.INVITATION_SEND_ERROR
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <UserPlus className="w-5 h-5 text-cyan-400" />
            {TITLES.INVITE_CANDIDATE}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {MESSAGES.INVITE_DESC}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Candidate Selection */}
          <div className="space-y-2">
            <Label className="text-slate-200">{LABELS.CANDIDATE}</Label>
            {initialCandidate ? (
              <div className="p-3 bg-slate-800 rounded-md border border-slate-700 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-200">
                    {initialCandidate.full_name}
                  </p>
                  <p className="text-sm text-slate-400">
                    {initialCandidate.email}
                  </p>
                </div>
                <div className="bg-green-900/30 text-green-400 text-xs px-2 py-1 rounded border border-green-900/50">
                  {LABELS.SELECTED}
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder={PLACEHOLDERS.SEARCH_BY_EMAIL}
                  value={emailSearch}
                  onChange={(e) => setEmailSearch(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-slate-100"
                  onKeyDown={(e) => e.key === "Enter" && searchCandidate()}
                />
                <Button
                  onClick={searchCandidate}
                  disabled={searching}
                  variant="secondary"
                  className="shrink-0"
                >
                  {searching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>
            )}
            {!initialCandidate && foundCandidate && (
              <div className="mt-2 p-2 bg-green-900/20 border border-green-900/50 rounded text-sm text-green-400 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                {LABELS.FOUND}: {foundCandidate.full_name}
              </div>
            )}
          </div>

          {/* Job Selection */}
          <div className="space-y-2">
            <Label className="text-slate-200">{LABELS.JOB}</Label>
            <Select
              value={String(selectedJobId)} // ensure string for Select
              onValueChange={(val) => setSelectedJobId(Number(val) || val)} // handle number
              disabled={!!initialJob}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                <SelectValue placeholder={PLACEHOLDERS.SELECT_JOB} />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={String(job.id)}>
                    {job.title}{" "}
                    <span className="text-slate-500 text-xs">
                      ({job.company?.name})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            {BUTTONS.CANCEL}
          </Button>
          <Button
            onClick={handleInvite}
            // Allow invite even if not found (new user flow), just need a valid email if searching manually
            disabled={
              loading || !selectedJobId || (!foundCandidate && !emailSearch)
            }
            className="bg-cyan-600 hover:bg-cyan-500 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {BUTTONS.INVITING}
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                {BUTTONS.SEND_INVITATION}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InviteCandidateModal;
