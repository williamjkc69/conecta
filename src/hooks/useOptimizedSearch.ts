import { useState, useTransition, useDeferredValue, useCallback } from "react";

/**
 * Custom hook that combines useTransition and useDeferredValue
 * for optimized search/filter operations
 *
 * Uses React 18's concurrent features to keep UI responsive
 * during expensive filtering operations
 *
 * @example
 * const { value, deferredValue, isPending, setValue } = useOptimizedSearch("");
 *
 * // In component:
 * <input value={value} onChange={(e) => setValue(e.target.value)} />
 * {isPending && <Spinner />}
 * <Results data={filterData(deferredValue)} />
 */
export function useOptimizedSearch<T = string>(initialValue: T) {
  const [value, setValueState] = useState<T>(initialValue);
  const [isPending, startTransition] = useTransition();
  const deferredValue = useDeferredValue(value);

  const setValue = useCallback((newValue: T) => {
    startTransition(() => {
      setValueState(newValue);
    });
  }, []);

  return {
    value,
    deferredValue,
    isPending,
    setValue,
    reset: () => setValue(initialValue)
  };
}

/**
 * Hook for debounced search with React 18 optimizations
 * Combines debouncing with useTransition for best performance
 *
 * @example
 * const { searchTerm, deferredSearchTerm, isPending, setSearchTerm } =
 *   useDebouncedSearch("", 300);
 */
export function useDebouncedSearch(
  initialValue: string = "",
  delay: number = 300
) {
  const [searchTerm, setSearchTermState] = useState(initialValue);
  const [isPending, startTransition] = useTransition();
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const setSearchTerm = useCallback(
    (value: string) => {
      // Clear existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Set new timeout
      const newTimeoutId = setTimeout(() => {
        startTransition(() => {
          setSearchTermState(value);
        });
      }, delay);

      setTimeoutId(newTimeoutId);
    },
    [delay, timeoutId]
  );

  return {
    searchTerm,
    deferredSearchTerm,
    isPending,
    setSearchTerm,
    reset: () => setSearchTerm(initialValue)
  };
}

/**
 * Hook for filtering lists with React 18 optimizations
 * Automatically handles loading states and deferred updates
 *
 * @example
 * const { filteredData, isPending, setFilter } = useOptimizedFilter(
 *   jobs,
 *   (job, filter) => job.title.includes(filter)
 * );
 */
export function useOptimizedFilter<T>(
  data: T[],
  filterFn: (item: T, filter: string) => boolean
) {
  const {
    value: filter,
    deferredValue: deferredFilter,
    isPending,
    setValue: setFilter
  } = useOptimizedSearch("");

  const filteredData = data.filter((item) => filterFn(item, deferredFilter));

  return {
    filter,
    filteredData,
    isPending,
    setFilter,
    reset: () => setFilter("")
  };
}
