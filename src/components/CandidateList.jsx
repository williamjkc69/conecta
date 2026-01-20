import React from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Calendar, Eye, Users, Send, Check, Clock, X, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const statusConfig = {
  applied: { icon: <Clock className="w-4 h-4" />, text: 'Aplicado', color: 'bg-yellow-500/20 text-yellow-400' },
  invited: { icon: <Send className="w-4 h-4" />, text: 'Invitado', color: 'bg-blue-500/20 text-blue-300' },
  interviewing: { icon: <Briefcase className="w-4 h-4" />, text: 'En Entrevista', color: 'bg-purple-500/20 text-purple-300' },
  reviewed: { icon: <Check className="w-4 h-4" />, text: 'Completada', color: 'bg-green-500/20 text-green-400' },
  rejected: { icon: <X className="w-4 h-4" />, text: 'Rechazado', color: 'bg-red-500/20 text-red-400' },
  hired: { icon: <Check className="w-4 h-4" />, text: 'Contratado', color: 'bg-emerald-500/20 text-emerald-400' },
};

const CandidateList = ({ candidates, jobs }) => {
  const { toast } = useToast();

  const getJobTitle = (jobId) => {
    const job = jobs.find(j => j.id === jobId);
    return job ? job.title : 'Vacante no encontrada';
  };

  if (candidates.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 mx-auto mb-4 text-slate-600" />
        <p className="text-slate-400">No hay candidatos para tus vacantes aún.</p>
        <p className="text-sm text-slate-500">Invita a candidatos para empezar el proceso de selección.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {candidates.map((candidate, index) => {
        const statusInfo = statusConfig[candidate.status] || { icon: <User className="w-4 h-4" />, text: candidate.status, color: 'bg-gray-500/20 text-gray-400' };
        
        return (
          <motion.div
            key={candidate.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-cyan-500/50 transition-all"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-start gap-4 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white font-bold text-lg">
                    {candidate.candidateName?.charAt(0).toUpperCase() || 'C'}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="text-lg font-bold mb-1 text-slate-100">{candidate.candidateName}</h4>
                    <div className="flex flex-wrap gap-3 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {candidate.candidateEmail}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(candidate.appliedAt).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-sm text-slate-400">Vacante:</span>
                  <span className="text-sm font-semibold text-cyan-400">{getJobTitle(candidate.job_id)}</span>
                  <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                    {statusInfo.icon}
                    {statusInfo.text}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                {candidate.status === 'invited' && (
                   <Button
                    onClick={() => toast({
                      title: "🚧 Función no implementada",
                      description: "Esta función estará disponible próximamente para recordar a los candidatos."
                    })}
                    variant="outline"
                    className="border-blue-500/50 text-cyan-400 hover:bg-blue-500/10"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Reenviar
                  </Button>
                )}
                 {candidate.status === 'reviewed' && (
                  <Button
                    onClick={() => toast({
                      title: "🚧 Función no implementada",
                      description: "Visualización de resultados disponible próximamente."
                    })}
                    variant="outline"
                    className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Análisis
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  );
};

export default CandidateList;