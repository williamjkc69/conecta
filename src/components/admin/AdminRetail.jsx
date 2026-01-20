import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Store } from 'lucide-react';

const AdminRetail = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-slate-100">Parámetros de Retail</h2>
      <Card className="bg-slate-800/50 border-slate-700 text-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-6 h-6 text-yellow-400" />
            Funcionalidad en Desarrollo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400">
            La gestión de parámetros de retail aún no está implementada.
          </p>
          <p className="mt-2 text-slate-500 text-sm">
            Esta sección te permitirá configurar la apariencia y la funcionalidad de la interfaz de la tienda, como el nombre, logo, colores y claves de pasarelas de pago.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRetail;