import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, DollarSign, Clock, Users, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

const JobCard = ({ job, onClick }) => {
  return (
    <motion.div
      whileHover={{ y: -5, borderColor: 'rgba(96, 165, 250, 0.5)' }}
      className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold mb-2 text-slate-100 line-clamp-1">{job.title}</h3>
          <div className="flex flex-wrap gap-3 text-sm text-slate-400">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {job.location || 'No especificado'}
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              {job.salary || 'A convenir'}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {job.type}
            </span>
          </div>
        </div>
        
        <span className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${
          job.status === 'active' 
            ? 'bg-green-500/20 text-green-400' 
            : 'bg-gray-500/20 text-gray-400'
        }`}>
          {job.status === 'active' ? 'Activa' : 'Inactiva'}
        </span>
      </div>

      <p className="text-slate-300 mb-4 line-clamp-2">{job.description}</p>

      <div className="flex items-center justify-between pt-4 border-t border-slate-700">
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1 text-slate-400">
            <Users className="w-4 h-4" />
            {job.applicants || 0} candidatos
          </span>
        </div>

        <Button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          variant="outline"
          size="sm"
          className="border-blue-500/50 text-cyan-400 hover:bg-blue-500/10"
        >
           <Eye className="w-4 h-4 mr-2" />
          Ver Detalles
        </Button>
      </div>
    </motion.div>
  );
};

export default JobCard;