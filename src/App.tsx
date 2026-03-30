import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';
import LoginPage from './components/LoginPage';
import ClientDashboard from './components/client/ClientDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import WorkerDashboard from './components/worker/WorkerDashboard';
import AccessDenied from './components/AccessDenied';
import Contador from './components/Contador';

const LoadingScreen: React.FC<{ message?: string }> = ({ message = "Cargando Portal Seguro..." }) => (
    <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-white text-xl animate-pulse font-mono tracking-widest uppercase">{message}</div>
    </div>
);

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAwaitingMfa, setIsAwaitingMfa] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        if (_event === 'SIGNED_OUT') {
          setIsAwaitingMfa(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchUserRole = async (user: User) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('rol, estado_aprobacion')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        
        // Si el usuario acaba de ser creado y está pendiente de aprobación
        if (data?.estado_aprobacion === 'pendiente') {
            setUserRole('pendiente');
        } else {
            setUserRole(data?.rol || null);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole(null);
      }
    };

    if (session?.user && !isAwaitingMfa) {
      setLoading(true);
      fetchUserRole(session.user).finally(() => setLoading(false));
    } else if (!session) {
      setUserRole(null);
      setLoading(false);
    }
  }, [session, isAwaitingMfa]);

  if (loading) {
    return <LoadingScreen />;
  }
  
  const showLogin = !session || isAwaitingMfa;

  const renderDashboard = () => {
    if (!session) return null;

    switch (userRole?.toLowerCase()) {
      case 'admin':
        return <AdminDashboard session={session} />;
      case 'trabajador':
        return <WorkerDashboard session={session} />;
      case 'cliente':
        return <ClientDashboard key={session.user.id} session={session} />;
      case 'contadora':
        return <Contador />;
      case 'pendiente':
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 font-mono text-center">
                <div className="w-16 h-16 bg-yellow-500/20 text-yellow-500 rounded-full flex items-center justify-center mb-6 border border-yellow-500/50">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h1 className="text-3xl font-black tracking-[0.2em] uppercase text-white mb-4">Cuenta en Revisión</h1>
                <p className="text-zinc-400 text-sm max-w-md">Su perfil ha sido registrado exitosamente, pero requiere aprobación por parte del Administrador para activar el acceso a las funciones del portal.</p>
                <button onClick={() => supabase.auth.signOut()} className="mt-8 px-8 py-3 text-xs tracking-widest font-bold uppercase border border-white/20 hover:bg-white/10 transition-colors rounded-xl">Cerrar Sesión</button>
            </div>
        );
      default:
        return <AccessDenied />;
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {showLogin ? (
        <LoginPage setIsAwaitingMfa={setIsAwaitingMfa} />
      ) : (
        renderDashboard()
      )}
    </div>
  );
};

export default App;