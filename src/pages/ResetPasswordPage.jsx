import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const ResetPasswordPage = () => {
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(false);

  useEffect(() => {
    // Supabase JS v2 automatically handles the access token from the URL fragment
    // after the redirect. We just need to check if we are in this state.
    const hash = window.location.hash;
    if (hash.includes('access_token')) {
        setIsTokenValid(true);
    } else {
        toast({
            title: "Enlace inválido",
            description: "El enlace de recuperación de contraseña es inválido o ha expirado.",
            variant: "destructive",
        });
        navigate('/');
    }
  }, [navigate, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }
    if (password.length < 6) {
        toast({
            title: "Contraseña muy corta",
            description: "La contraseña debe tener al menos 6 caracteres.",
            variant: "destructive",
        });
        return;
    }

    setLoading(true);
    const { error } = await updateUser({ password });
    setLoading(false);

    if (!error) {
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada exitosamente. Por favor, inicia sesión.",
        variant: "success",
      });
      navigate('/');
    }
    // Error is already handled by the useAuth hook
  };
  
  if (!isTokenValid) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
            <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
        </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="glass-effect border-blue-500/50 text-slate-100 rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-6">
                <h1 className="text-3xl font-bold gradient-text mb-2">Restablecer Contraseña</h1>
                <p className="text-slate-400">Crea una nueva contraseña para tu cuenta.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="password">Nueva Contraseña</Label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-blue-950/30 border-blue-400/30 text-slate-100 pl-10"
                        required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                        {showPassword ? <EyeOff className="h-5 w-5 text-slate-400"/> : <Eye className="h-5 w-5 text-slate-400"/>}
                    </button>
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                 <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="bg-blue-950/30 border-blue-400/30 text-slate-100 pl-10"
                        required
                    />
                </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {loading ? 'Guardando...' : 'Guardar Nueva Contraseña'}
            </Button>
            </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;