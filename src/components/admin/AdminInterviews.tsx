import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, FileText } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import Pagination from "./Pagination";
import {
  TITLES,
  MESSAGES,
  PLACEHOLDERS,
  LABELS,
  BUTTONS
} from "@/constants/text";
import { CANDIDATE_STATUS_LABELS } from "@/constants/options";

interface Interview {
  id: string;
  created_at: string;
  status: string;
  candidate?: { full_name: string };
  company?: { company_name: string };
  job?: { title: string };
}

const AdminInterviews = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const { toast } = useToast();

  const fetchInterviews = useCallback(
    async (search: string, page: number) => {
      setLoading(true);
      const offset = (page - 1) * limit;

      let query = supabase
        .from("applications")
        .select(
          "*, company:company_id(company_name), candidate:candidate_id(full_name), job:job_id(title)",
          { count: "exact" }
        );

      if (search) {
        query = query.or(`status.ilike.%${search}%`); // Simple search on status for now
      }

      query = query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        toast({
          title: TITLES.ERROR,
          description: MESSAGES.ERROR_LOADING_INTERVIEWS,
          variant: "destructive"
        });
      } else {
        setInterviews(data);
        setTotalPages(Math.ceil((count || 0) / limit));
      }
      setLoading(false);
    },
    [toast]
  );

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    setCurrentPage(1);
    fetchInterviews(debouncedSearchTerm, 1);
  }, [debouncedSearchTerm, fetchInterviews]);

  useEffect(() => {
    if (currentPage > 1) {
      fetchInterviews(debouncedSearchTerm, currentPage);
    }
  }, [currentPage, debouncedSearchTerm, fetchInterviews]);

  const exportData = () => {
    toast({
      title: TITLES.COMING_SOON,
      description: MESSAGES.EXPORT_NOT_IMPLEMENTED
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
          <FileText /> {TITLES.INTERVIEW_MANAGEMENT}
        </h2>
        <Button onClick={exportData}>{BUTTONS.EXPORT}</Button>
      </div>
      <div className="flex gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder={PLACEHOLDERS.FILTER_BY_STATUS}
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
                <th className="p-4 font-semibold">{LABELS.CANDIDATE}</th>
                <th className="p-4 font-semibold">{LABELS.COMPANY}</th>
                <th className="p-4 font-semibold">{LABELS.JOB}</th>
                <th className="p-4 font-semibold">{LABELS.DATE}</th>
                <th className="p-4 font-semibold">{LABELS.STATUS}</th>
              </tr>
            </thead>
            <tbody>
              {loading && !interviews.length ? (
                <tr>
                  <td colSpan={5} className="text-center p-8">
                    <Loader2 className="mx-auto w-8 h-8 animate-spin text-cyan-400" />
                  </td>
                </tr>
              ) : (
                interviews.map((interview) => (
                  <tr
                    key={interview.id}
                    className="border-t border-slate-700 hover:bg-slate-800/60"
                  >
                    <td className="p-4">
                      {interview.candidate?.full_name || LABELS.NOT_AVAILABLE}
                    </td>
                    <td className="p-4 text-slate-400">
                      {interview.company?.company_name || LABELS.NOT_AVAILABLE}
                    </td>
                    <td className="p-4 text-slate-400">
                      {interview.job?.title || LABELS.NOT_AVAILABLE}
                    </td>
                    <td className="p-4 text-slate-400">
                      {new Date(interview.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 capitalize">
                      {CANDIDATE_STATUS_LABELS[
                        interview.status as keyof typeof CANDIDATE_STATUS_LABELS
                      ] || interview.status}
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
    </div>
  );
};

export default AdminInterviews;
