import React, { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, PlayCircle, PauseCircle, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ApplicationCard = ({ application, onStartInterview }) => {
  useEffect(() => {
    if (application) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [ApplicationCard] Rendering for App ID: ${application.id}`);
      console.log(`   - Interview Status: ${application.interview_status}`);
      console.log(`   - Main Status: ${application.status}`);
    }
  }, [application]);

  if (!application) return null;

  const interviewStatus = application.interview_status || 'pending';
  const mainStatus = application.status;

  // 1. Completed / Reviewed / Hired / Rejected
  if (interviewStatus === 'completed' || mainStatus === 'reviewed' || mainStatus === 'hired' || mainStatus === 'rejected') {
    console.log(`[${new Date().toISOString()}] [ApplicationCard] Rendering COMPLETED branch`);
    return (
      <Card className="glass-effect border-slate-700/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2">
            <Badge variant="outline" className="border-green-500/50 text-green-400 bg-green-900/10">Completado</Badge>
        </div>
        <CardHeader>
          <CardTitle className="text-slate-200 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-500" />
            Proceso Finalizado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400">
            Has completado esta etapa del proceso. La empresa revisará tus resultados.
          </p>
        </CardContent>
      </Card>
    );
  }

  // 2. Invited -> Show "Realizar entrevista"
  if (interviewStatus === 'invited') {
    console.log(`[${new Date().toISOString()}] [ApplicationCard] Rendering INVITED branch`);
    return (
      <Card className="bg-gradient-to-br from-blue-900 to-cyan-900 border-cyan-700 shadow-lg shadow-cyan-900/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2">
            <Badge className="bg-yellow-400 text-black hover:bg-yellow-500 border-none">Acción Requerida</Badge>
        </div>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-300" />
            ¡Invitación Recibida!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-100 mb-6">
            Has sido seleccionado para realizar una entrevista por voz con nuestro agente de IA.
          </p>
          <Button 
            className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold text-lg py-6 shadow-xl transition-all hover:scale-105" 
            onClick={() => onStartInterview(application)}
          >
            <PlayCircle className="mr-2 h-5 w-5" />
            Realizar entrevista
          </Button>
        </CardContent>
      </Card>
    );
  }

  // 3. In Progress -> Show "Entrevista en curso"
  if (interviewStatus === 'in_progress') {
    console.log(`[${new Date().toISOString()}] [ApplicationCard] Rendering IN_PROGRESS branch`);
    return (
      <Card className="bg-slate-800 border-yellow-600/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2">
            <Badge variant="outline" className="border-yellow-500/50 text-yellow-400 bg-yellow-900/10 animate-pulse">En Curso</Badge>
        </div>
        <CardHeader>
          <CardTitle className="text-yellow-400 flex items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            Entrevista en curso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-300 mb-4">
            Tu entrevista está activa. Puedes continuar donde la dejaste.
          </p>
          <Button 
            className="w-full sm:w-auto bg-yellow-600 hover:bg-yellow-500 text-white font-semibold" 
            onClick={() => onStartInterview(application)}
          >
            <PauseCircle className="mr-2 h-5 w-5" />
            Continuar Entrevista
          </Button>
        </CardContent>
      </Card>
    );
  }

  // 4. Pending (Default) -> "A la espera de invitación"
  console.log(`[${new Date().toISOString()}] [ApplicationCard] Rendering PENDING branch`);
  return (
    <Card className="glass-effect border-slate-700/80 relative">
      <div className="absolute top-0 right-0 p-2">
            <Badge variant="outline" className="border-slate-600 text-slate-500">Pendiente</Badge>
      </div>
      <CardHeader>
        <CardTitle className="text-slate-400 flex items-center gap-2">
          <Clock className="w-6 h-6" />
          A la espera de invitación
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-slate-500">
          Tu solicitud ha sido enviada. Si tu perfil coincide, recibirás una invitación.
        </p>
      </CardContent>
    </Card>
  );
};

export default ApplicationCard;