import React, { useState, useEffect, Fragment } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../services/supabaseClient';

// --- Asegúrate de tener estas vistas importadas correctamente según tu estructura ---
import TimeBillingView from './TimeBillingView';
import ExpensesView from './ExpensesView';
import WorkerProfile from './WorkerProfile';
import ListaPerfiles from '../admin/ListaPerfiles'; // Para la vista de Clientes
import AdminChatView from '../admin/AdminDashboard'; // O tu componente de chat para trabajadores

// --- Iconos ---
const BellIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>;
const UserIcon = ({ className = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>;

const WorkerDashboard: React.FC<{ session: Session }> = ({ session }) => {
  const [activeView, setActiveView] = useState(() => sessionStorage.getItem('workerActiveView') || 'HOME');
  const [userRole, setUserRole] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    sessionStorage.setItem('workerActiveView', activeView);
  }, [activeView]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: profile } = await supabase.from('profiles').select('foto_url, categoria_usuario').eq('id', session.user.id).single();
      if (profile) {
        if (profile.foto_url) setProfilePic(profile.foto_url);
        if (profile.categoria_usuario) setUserRole(profile.categoria_usuario);
      }

      const { data: updates } = await supabase
        .from('case_updates')
        .select('id, descripcion, estado_aprobacion, created_at, caso:cases(titulo)')
        .eq('perfil_id', session.user.id)
        .in('estado_aprobacion', ['aprobado', 'rechazado'])
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: petitions } = await supabase
        .from('peticiones_acceso')
        .select('id, tipo, estado, created_at, cliente:profiles!peticiones_acceso_cliente_id_fkey(primer_nombre, primer_apellido)')
        .eq('trabajador_id', session.user.id)
        .in('estado', ['aprobado', 'rechazado'])
        .order('created_at', { ascending: false })
        .limit(10);

      const allNotifs = [...(updates || []), ...(petitions || [])]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 15);

      setNotifications(allNotifs);
    };

    fetchInitialData();
  }, [session.user.id]);

  const closeAllMenus = () => {
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
    setNotificationsOpen(false);
  };

  const handleNavigate = (view: string) => {
    setActiveView(view);
    closeAllMenus();
  };

  const renderContent = () => {
    switch (activeView) {
      case 'CLIENTS':
        return <ListaPerfiles role="cliente" onCancel={() => handleNavigate('HOME')} />;
      case 'ASSIGNED_CASES':
        return <div className="text-center p-12 text-zinc-500">Vista de Casos Asignados...</div>; // Reemplaza con tu vista real
      case 'TIME_BILLING':
        return <TimeBillingView onCancel={() => handleNavigate('HOME')} session={session} />;
      case 'EXPENSES':
        return <ExpensesView session={session} onCancel={() => handleNavigate('HOME')} />;
      case 'CHAT':
        return <div className="text-center p-12 text-zinc-500">Vista de Chat...</div>; // Reemplaza con tu vista real
      case 'PROFILE':
        return <WorkerProfile session={session} onCancel={() => handleNavigate('HOME')} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-black min-h-screen text-white flex flex-col font-mono relative">
      <style>{`
        ::-webkit-scrollbar { width: 0px !important; height: 0px !important; background: transparent !important; display: none !important; }
        * { -ms-overflow-style: none !important; scrollbar-width: none !important; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* HEADER CRISTAL ESTÁTICO (Sticky) */}
      <header className="flex justify-between items-center p-6 bg-black/80 backdrop-blur-md sticky top-0 z-[90] border-b border-white/10">
        <button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-zinc-400 hover:text-white">
          <MenuIcon />
        </button>
        <div className="font-black text-2xl tracking-[0.3em] cursor-pointer hover:text-zinc-300 transition-colors hidden md:block w-32" onClick={() => handleNavigate('HOME')}>
          R&R
        </div>

        <nav className="hidden md:flex flex-grow justify-center gap-6 lg:gap-12 relative">
          {[
            { id: 'CLIENTS', label: 'Clientes' },
            { id: 'ASSIGNED_CASES', label: 'Casos' },
            { id: 'TIME_BILLING', label: 'Billing' },
            { id: 'EXPENSES', label: 'Gastos' },
            { id: 'CHAT', label: 'Chat' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`text-sm lg:text-base uppercase font-black tracking-[0.2em] transition-colors ${activeView === item.id ? 'text-white' : 'text-zinc-600 hover:text-zinc-300'}`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-6 w-32 relative">
          <div className="relative">
            <button onClick={() => { closeAllMenus(); setNotificationsOpen(!notificationsOpen); }} className={`text-zinc-500 hover:text-white transition-colors relative ${notificationsOpen ? 'text-white' : ''}`}>
              <BellIcon />
              {notifications.length > 0 && <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black" />}
            </button>
            {notificationsOpen && (
              <>
                <div className="fixed inset-0 z-[95]" onClick={closeAllMenus} />
                <div className="absolute right-0 mt-4 w-80 bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black rounded-2xl py-2 z-[100] animate-in fade-in slide-in-from-top-3 duration-300 overflow-hidden">
                  <div className="p-5 border-b border-white/5">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Notificaciones Recientes</p>
                  </div>
                  <div className="max-h-80 overflow-y-auto scrollbar-hide">
                    {notifications.length === 0 ? (
                      <p className="p-6 text-xs text-zinc-600 italic text-center">Todo al día.</p>
                    ) : (
                      notifications.map((n, i) => {
                        const isUpdate = n.caso !== undefined;
                        const isApproved = (isUpdate ? n.estado_aprobacion : n.estado) === 'aprobado';
                        return (
                          <div key={i} onClick={() => handleNavigate(isUpdate ? 'ASSIGNED_CASES' : 'CLIENTS')} className="p-4 border-b border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                            <div className="flex justify-between items-center mb-1">
                              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${isApproved ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                                {isApproved ? '✓ Aprobado' : '✗ Rechazado'}
                              </span>
                              <span className="text-[9px] text-zinc-500 font-mono">{new Date(n.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-white text-xs font-bold mt-2">
                              {isUpdate ? `Caso: ${n.caso?.titulo}` : n.tipo === 'info_personal' ? `Acceso a Cliente: ${n.cliente?.primer_nombre}` : 'Nuevo Cliente Creado'}
                            </p>
                            {isUpdate && <p className="text-zinc-400 text-xs mt-1 line-clamp-2">{n.descripcion}</p>}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="relative">
            <button onClick={() => { closeAllMenus(); setProfileMenuOpen(!profileMenuOpen); }} className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all overflow-hidden bg-black/50 ${profileMenuOpen ? 'border-white' : 'border-zinc-700 hover:border-white'}`}>
              {profilePic ? (
                <img src={profilePic} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-6 h-6 text-zinc-400 pointer-events-none" />
              )}
            </button>
            {profileMenuOpen && (
              <>
                <div className="fixed inset-0 z-[95]" onClick={closeAllMenus} />
                <div className="absolute right-0 mt-4 w-64 bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black rounded-2xl py-2 z-[100] animate-in fade-in slide-in-from-top-3 duration-300 overflow-hidden">
                  <div className="p-5 border-b border-white/5">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 font-black">Sesión activa</p>
                    <p className="text-sm font-bold text-white truncate mb-1">{session.user.email}</p>
                    <p className="text-[10px] text-blue-400 uppercase tracking-[0.2em] font-black">{userRole}</p>
                  </div>
                  <button onClick={() => handleNavigate('PROFILE')} className="w-full text-left px-5 py-4 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-colors border-b border-white/5">Mi Perfil</button>
                  <button onClick={async () => { handleNavigate('HOME'); localStorage.removeItem('deviceToken'); await supabase.auth.signOut(); }} className="w-full text-left px-5 py-4 text-xs font-bold uppercase tracking-widest text-red-400 hover:bg-white/10 transition-colors">Cerrar Sesión</button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex flex-col font-mono p-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex justify-between items-center mb-12">
            <div className="font-black text-2xl tracking-[0.3em]">R&R</div>
            <button onClick={() => setMobileMenuOpen(false)} className="text-zinc-500 hover:text-white font-bold tracking-widest text-sm">CERRAR X</button>
          </div>
          <div className="flex flex-col gap-8 text-left overflow-y-auto">
            {[
              { id: 'HOME', label: 'Inicio' },
              { id: 'CLIENTS', label: 'Clientes' },
              { id: 'ASSIGNED_CASES', label: 'Casos Asignados' },
              { id: 'TIME_BILLING', label: 'Time Billing' },
              { id: 'EXPENSES', label: 'Gastos' },
              { id: 'CHAT', label: 'Chat' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`text-2xl font-black uppercase tracking-[0.2em] text-left ${activeView === item.id ? 'text-white' : 'text-zinc-600'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* EL Z-10 HA SIDO ELIMINADO PARA QUE LOS MODALES FLOTEN CORRECTAMENTE */}
      <main className="flex-grow relative p-4 sm:p-8 w-full max-w-7xl mx-auto">
        <div className={`${activeView === 'HOME' ? 'block' : 'hidden'} relative`}>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center font-black text-6xl relative h-20 w-full flex items-center justify-center">
              <h1 className="absolute transition-all duration-1000 ease-in-out opacity-100 tracking-[.2em] drop-shadow-2xl">Regalado & Regalado</h1>
            </div>
          </div>
        </div>
        <div className={`${activeView === 'HOME' ? 'hidden' : 'block'}`}>
            {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default WorkerDashboard;