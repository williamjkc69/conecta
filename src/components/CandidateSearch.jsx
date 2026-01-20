import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, UserPlus } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useDebounce } from '@/hooks/useDebounce';

const CandidateSearch = ({ onSelectCandidate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const searchCandidates = useCallback(async (term) => {
    if (term.length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'candidate')
      .or(`full_name.ilike.%${term}%,email.ilike.%${term}%`)
      .limit(5);

    if (error) {
      console.error("Error searching candidates:", error);
      setResults([]);
    } else {
      setResults(data);
    }
    setLoading(false);
  }, []);

  useDebounce(() => searchCandidates(searchTerm), 500, [searchTerm]);

  const handleSelect = (candidate) => {
    onSelectCandidate(candidate);
    setSearchTerm('');
    setResults([]);
    setIsFocused(false);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium mb-2 text-slate-300">Buscar Candidato Registrado</label>
      <div className="relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          className="w-full pl-12 pr-4 py-3 rounded-lg bg-slate-900 border border-slate-600 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          placeholder="Buscar por nombre o email..."
        />
        {loading && <Loader2 className="w-4 h-4 absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 animate-spin" />}
      </div>

      <AnimatePresence>
        {isFocused && (searchTerm.length > 2 || results.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-10 w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-lg overflow-hidden"
          >
            {results.length > 0 ? (
              <ul className="divide-y divide-slate-700">
                {results.map((candidate) => (
                  <li
                    key={candidate.id}
                    onMouseDown={() => handleSelect(candidate)}
                    className="px-4 py-3 hover:bg-slate-700/50 cursor-pointer transition-colors"
                  >
                    <p className="font-semibold text-slate-100">{candidate.full_name}</p>
                    <p className="text-sm text-slate-400">{candidate.email}</p>
                  </li>
                ))}
              </ul>
            ) : (
              !loading && searchTerm.length > 2 && (
                <div className="p-4 text-center text-slate-400">
                  <p>No se encontraron candidatos.</p>
                  <p className="text-xs">El candidato debe estar registrado en la plataforma.</p>
                </div>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CandidateSearch;