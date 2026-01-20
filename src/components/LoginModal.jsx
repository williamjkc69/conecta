import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const LoginModal = ({ isOpen, onClose, type }) => {
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('signin');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    company_name: '',
    document_number: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(formData.email, formData.password);
    if (!error) {
      onClose();
    }
    setLoading(false);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (formData.email.toLowerCase() === 'root@admin.local') {
        toast({
            variant: "destructive",
            title: "Acción no permitida",
            description: "No puedes registrar el correo del administrador. Por favor, inicia sesión.",
        });
        setLoading(false);
        setActiveTab('signin');
        return;
    }

    const metaData = {
      type: type,
      full_name: formData.full_name,
      ...(type === 'company' && { company_name: formData.company_name }),
      ...(type === 'candidate' && { document_number: formData.document_number })
    };
    
    const options = { data: metaData };
    
    const { error } = await signUp(formData.email, formData.password, options);
    if (!error) {
      onClose();
    } else if (error?.message?.includes('User already registered')) {
        setActiveTab('signin');
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-effect border-blue-500/50 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold gradient-text">
            {type === 'company' ? 'Acceso para Empresas' : 'Acceso para Candidatos'}
          </DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-blue-950/30">
            <TabsTrigger value="signin">Iniciar Sesión</TabsTrigger>
            <TabsTrigger value="signup">Registrarse</TabsTrigger>
          </TabsList>
          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="email-signin" className="text-slate-300">Email</Label>
                <Input id="email-signin" name="email" type="email" placeholder="tu@email.com" value={formData.email} onChange={handleChange} className="bg-blue-950/20 border-blue-400/20 text-slate-100" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-signin" className="text-slate-300">Contraseña</Label>
                <Input id="password-signin" name="password" type="password" value={formData.password} onChange={handleChange} className="bg-blue-950/20 border-blue-400/20 text-slate-100" required />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
                {loading ? 'Ingresando...' : 'Ingresar'}
              </Button>
            </form>
            <DialogFooter className="pt-4">
                <Link to="/forgot-password" onClick={onClose} className="text-sm text-cyan-400 hover:underline text-center w-full">
                  ¿Olvidaste tu contraseña?
                </Link>
            </DialogFooter>
          </TabsContent>
          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="full_name-signup" className="text-slate-300">Nombre Completo</Label>
                <Input id="full_name-signup" name="full_name" placeholder="Tu Nombre Completo" value={formData.full_name} onChange={handleChange} className="bg-blue-950/20 border-blue-400/20 text-slate-100" required />
              </div>
              {type === 'company' && (
                <div className="space-y-2">
                  <Label htmlFor="company_name-signup" className="text-slate-300">Nombre de la Empresa</Label>
                  <Input id="company_name-signup" name="company_name" placeholder="Tu Empresa" value={formData.company_name} onChange={handleChange} className="bg-blue-950/20 border-blue-400/20 text-slate-100" required />
                </div>
              )}
               {type === 'candidate' && (
                <div className="space-y-2">
                  <Label htmlFor="document_number-signup" className="text-slate-300">Número de Documento</Label>
                  <Input id="document_number-signup" name="document_number" placeholder="Tu número de identidad" value={formData.document_number} onChange={handleChange} className="bg-blue-950/20 border-blue-400/20 text-slate-100" required />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email-signup" className="text-slate-300">Email</Label>
                <Input id="email-signup" name="email" type="email" placeholder="tu@email.com" value={formData.email} onChange={handleChange} className="bg-blue-950/20 border-blue-400/20 text-slate-100" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-signup" className="text-slate-300">Contraseña</Label>
                <Input id="password-signup" name="password" type="password" value={formData.password} onChange={handleChange} className="bg-blue-950/20 border-blue-400/20 text-slate-100" required />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
                {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;