import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const AdminSettings = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('settings').select('*').order('key');
    if (error) {
      toast({ title: "Error", description: "No se pudieron cargar los ajustes.", variant: "destructive" });
    } else {
      setSettings(data);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleInputChange = (key, newValue) => {
    setSettings(prev => 
      prev.map(setting => 
        setting.key === key ? { ...setting, value: { value: newValue } } : setting
      )
    );
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    
    const updates = settings.map(setting => 
      supabase
        .from('settings')
        .update({ value: setting.value, updated_at: new Date().toISOString() })
        .eq('key', setting.key)
    );

    const results = await Promise.all(updates);
    const hasError = results.some(res => res.error);

    if (hasError) {
      toast({ title: "Error", description: "Algunos ajustes no se pudieron guardar.", variant: "destructive" });
    } else {
      toast({ title: "Éxito", description: "Todos los ajustes han sido guardados." });
      fetchSettings(); // Re-fetch to get latest updated_at
    }
    setSaving(false);
  };
  
  if (loading) {
    return <Loader2 className="mx-auto mt-10 w-8 h-8 animate-spin text-cyan-400" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-slate-100">Ajustes Generales</h2>
          <p className="text-slate-400 mt-1">Gestiona los parámetros principales de la plataforma.</p>
        </div>
        <Button onClick={handleSaveSettings} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Guardar Cambios
        </Button>
      </div>

      <Card className="bg-slate-800/50 border-slate-700 text-slate-200">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {settings.map(setting => (
              <div key={setting.key} className="space-y-2">
                <Label htmlFor={setting.key} className="font-semibold text-slate-300 capitalize">
                  {setting.key.replace(/_/g, ' ')}
                </Label>
                <Input
                  id={setting.key}
                  value={setting.value?.value ?? ''}
                  onChange={(e) => handleInputChange(setting.key, e.target.value)}
                  className="bg-slate-900 border-slate-600"
                />
                <p className="text-sm text-slate-500">{setting.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;