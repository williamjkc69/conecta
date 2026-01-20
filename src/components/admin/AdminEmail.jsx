import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MailWarning } from 'lucide-react';

const AdminEmail = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-slate-100">Gestión de Plantillas de Email</h2>
      <Card className="bg-slate-800/50 border-slate-700 text-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MailWarning className="w-6 h-6 text-yellow-400" />
            Funcionalidad en Desarrollo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400">
            La gestión de plantillas de email aún no está implementada.
          </p>
          <p className="mt-2 text-slate-500 text-sm">
            Aquí podrás editar el contenido de los correos de bienvenida, recuperación de contraseña, invitaciones a vacantes, y más.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminEmail;