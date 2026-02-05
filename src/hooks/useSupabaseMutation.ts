import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";

interface UseSupabaseMutationOptions<T = any> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

/**
 * Custom hook for Supabase mutations (insert, update, delete)
 * Handles loading state, error handling, and toast notifications
 *
 * @example
 * const { mutate, isLoading } = useSupabaseMutation({
 *   successMessage: "Job created successfully",
 *   onSuccess: () => fetchJobs()
 * });
 *
 * await mutate(async () => {
 *   return await supabase.from('jobs').insert(data);
 * });
 */
export function useSupabaseMutation<T = any>(
  options: UseSupabaseMutationOptions<T> = {}
) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (mutationFn: () => Promise<{ data: T | null; error: any }>) => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: mutationError } = await mutationFn();

        if (mutationError) {
          throw new Error(mutationError.message || "An error occurred");
        }

        if (options.successMessage) {
          toast({
            title: "✅ Success",
            description: options.successMessage
          });
        }

        if (options.onSuccess) {
          options.onSuccess(data as T);
        }

        return { data, error: null };
      } catch (err: any) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);

        toast({
          title: "Error",
          description: options.errorMessage || error.message,
          variant: "destructive"
        });

        if (options.onError) {
          options.onError(error);
        }

        return { data: null, error };
      } finally {
        setIsLoading(false);
      }
    },
    [options, toast]
  );

  return {
    mutate,
    isLoading,
    error,
    reset: () => {
      setError(null);
      setIsLoading(false);
    }
  };
}

/**
 * Specialized hook for delete operations
 *
 * @example
 * const { deleteItem, isDeleting } = useSupabaseDelete({
 *   successMessage: "Job deleted successfully"
 * });
 *
 * await deleteItem(async () => {
 *   return await supabase.from('jobs').delete().eq('id', jobId);
 * });
 */
export function useSupabaseDelete(options: UseSupabaseMutationOptions = {}) {
  const mutation = useSupabaseMutation({
    ...options,
    successMessage: options.successMessage || "Item deleted successfully"
  });

  return {
    deleteItem: mutation.mutate,
    isDeleting: mutation.isLoading,
    error: mutation.error,
    reset: mutation.reset
  };
}

/**
 * Specialized hook for create operations
 *
 * @example
 * const { createItem, isCreating } = useSupabaseCreate({
 *   successMessage: "Job created successfully"
 * });
 */
export function useSupabaseCreate<T = any>(
  options: UseSupabaseMutationOptions<T> = {}
) {
  const mutation = useSupabaseMutation<T>({
    ...options,
    successMessage: options.successMessage || "Item created successfully"
  });

  return {
    createItem: mutation.mutate,
    isCreating: mutation.isLoading,
    error: mutation.error,
    reset: mutation.reset
  };
}

/**
 * Specialized hook for update operations
 *
 * @example
 * const { updateItem, isUpdating } = useSupabaseUpdate({
 *   successMessage: "Job updated successfully"
 * });
 */
export function useSupabaseUpdate<T = any>(
  options: UseSupabaseMutationOptions<T> = {}
) {
  const mutation = useSupabaseMutation<T>({
    ...options,
    successMessage: options.successMessage || "Item updated successfully"
  });

  return {
    updateItem: mutation.mutate,
    isUpdating: mutation.isLoading,
    error: mutation.error,
    reset: mutation.reset
  };
}
