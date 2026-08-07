import React, { useState } from 'react';
import { useRamoxContext } from '../services/RamoxContextComponent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const { login } = useRamoxContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(email, password)) {
      toast.success('Login realizado com sucesso!');
    } else {
      toast.error('E-mail ou senha incorretos.');
    }
  };

  return (
    <Card className="w-full max-w-md border-none shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <div className="w-16 h-16 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4 shadow-lg shadow-brand-200">
          M
        </div>
        <CardTitle className="text-2xl font-bold">Acesse o MOX</CardTitle>
        <p className="text-slate-500">Entre com seu e-mail e senha para gerenciar o almoxarifado.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="seu@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha de Acesso</Label>
            <div className="relative">
              <Input 
                id="password" 
                type={showPassword ? 'text' : 'password'}
                placeholder="Sua senha" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
                required 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                title={showPassword ? 'Ocultar Senha' : 'Exibir Senha'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 h-11">
            <LogIn className="mr-2 h-4 w-4" /> Entrar no Sistema
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
