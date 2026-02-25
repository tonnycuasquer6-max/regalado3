import React, { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../services/supabaseClient';

// --- Vistas ---
import TimeBillingMaestro from './TimeBillingMaestro';
import ReportsView from './ReportsView';
import AdminProfile from './AdminProfile';
import UserManagementView from './UserManagementView';
import ListaPerfiles from './ListaPerfiles';

// --- Iconos ---
const BellIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>;
const UserIcon = ({ className = "w-5 h-5" }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>;
const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 ml-1 inline-block"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>;

const AdminDashboard: React.FC<{ session: Session }> = ({ session }) => {
    
    // --- Estados de Vistas ---
    const [activeView, setActiveView] = useState(() => sessionStorage.getItem('adminActiveView') || 'HOME');
    const [selectedRoleForCreate, setSelectedRoleForCreate] = useState<'abogado' | 'estudiante' | 'cliente' | undefined>();
    const [selectedRoleForView, setSelectedRoleForView] = useState<'abogado' | 'estudiante' | 'cliente' | undefined>();

    // --- Estados de Menús Desplegables ---
    const [createMenuOpen, setCreateMenuOpen] = useState(false);
    const [viewMenuOpen, setViewMenuOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // --- Datos de Perfil y Notificaciones ---
    const [adminProfilePic, setAdminProfilePic] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => { sessionStorage.setItem('adminActiveView', activeView); }, [activeView]);

    useEffect(() => {
        const fetchInitialData = async () => {
            // Obtener foto de perfil
            const { data: profile } = await supabase.from('profiles').select('foto_url').eq('id', session.user.id).single();
            if (profile?.foto_url) setAdminProfilePic(profile.foto_url);

            // Obtener Notificaciones Pendientes para el Admin
            const { data: petitions } = await supabase.from('peticiones_acceso')
                .select('id, tipo, created_at, trabajador:profiles!peticiones_acceso_trabajador_id_fkey(primer_nombre, primer_apellido)')
                .eq('estado', 'pendiente').order('created_at', { ascending: false }).limit(10);
            
            const { data: updates } = await supabase.from('case_updates')
                .select('id, descripcion, created_at, caso:cases(titulo), trabajador:profiles(primer_nombre, primer_apellido)')
                .eq('estado_aprobacion', 'pendiente').order('created_at', { ascending: false }).limit(10);

            const allNotifs = [...(petitions || []), ...(updates || [])]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 15);
            
            setNotifications(allNotifs);
        };
        fetchInitialData();
    }, [session.user.id]);

    const closeAllMenus = () => {
        setCreateMenuOpen(false);
        setViewMenuOpen(false);
        setNotificationsOpen(false);
        setProfileMenuOpen(false);
    };

    const handleNavigate = (view: string) => {
        setActiveView(view);
        closeAllMenus();
        setMobileMenuOpen(false);
    };

    const handleCreateClick = (role: 'abogado' | 'estudiante' | 'cliente') => {
        setSelectedRoleForCreate(role);
        handleNavigate('CREATE_USER');
    };

    const handleViewClick = (role: 'abogado' | 'estudiante' | 'cliente') => {
        setSelectedRoleForView(role);
        handleNavigate('LIST_USERS');
    };

    const renderContent = () => {
        switch (activeView) {
            case 'TIME_BILLING': return <TimeBillingMaestro onCancel={() => handleNavigate('HOME')} />;
            case 'REPORTS': return <ReportsView onCancel={() => handleNavigate('HOME')} />;
            case 'PROFILE': return <AdminProfile session={session} onCancel={() => handleNavigate('HOME')} />;
            case 'CREATE_USER': return <UserManagementView preselectedRole={selectedRoleForCreate} onCancel={() => handleNavigate('HOME')} />;
            case 'LIST_USERS': return selectedRoleForView ? <ListaPerfiles role={selectedRoleForView} onCancel={() => handleNavigate('HOME')} /> : null;
            default: return null;
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
            
            <header className="flex justify-between items-center p-6 bg-black sticky top-0 z-50 border-b border-zinc-900/50">
                <button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-zinc-400 hover:text-white">
                    <MenuIcon />
                </button>
                <div className="font-black text-2xl tracking-[0.3em] cursor-pointer hover:text-zinc-300 transition-colors hidden md:block w-32" onClick={() => handleNavigate('HOME')}>
                    R&R
                </div>
                
                <nav className="hidden md:flex flex-grow justify-center gap-8 lg:gap-12 items-center relative z-40">
                    <button onClick={() => handleNavigate('TIME_BILLING')} className={`text-sm lg:text-base uppercase font-black tracking-[0.2em] transition-colors ${activeView === 'TIME_BILLING' ? 'text-white' : 'text-zinc-500 hover:text-white'}`}>Time Billing</button>
                    <button onClick={() => handleNavigate('REPORTS')} className={`text-sm lg:text-base uppercase font-black tracking-[0.2em] transition-colors ${activeView === 'REPORTS' ? 'text-white' : 'text-zinc-500 hover:text-white'}`}>Reportes</button>
                    
                    {/* MENÚ CREAR PERFIL (GLASSMORPHISM) */}
                    <div className="relative">
                        <button onClick={() => { closeAllMenus(); setCreateMenuOpen(!createMenuOpen); }} className={`text-sm lg:text-base uppercase font-black tracking-[0.2em] transition-colors flex items-center ${activeView === 'CREATE_USER' || createMenuOpen ? 'text-white' : 'text-zinc-500 hover:text-white'}`}>
                            Crear Perfil <ChevronDownIcon />
                        </button>
                        {createMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-30" onClick={closeAllMenus}></div>
                                <div className="absolute left-1/2 -translate-x-1/2 mt-6 w-56 bg-black/40 backdrop-blur-3xl border border-white/10 shadow-2xl shadow-black rounded-2xl py-2 z-50 animate-in fade-in slide-in-from-top-3 duration-300 overflow-hidden">
                                    <button onClick={() => handleCreateClick('abogado')} className="w-full text-left px-5 py-4 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-colors border-b border-white/5">Abogado</button>
                                    <button onClick={() => handleCreateClick('estudiante')} className="w-full text-left px-5 py-4 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-colors border-b border-white/5">Estudiante</button>
                                    <button onClick={() => handleCreateClick('cliente')} className="w-full text-left px-5 py-4 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-colors">Cliente</button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* MENÚ VER PERFILES (GLASSMORPHISM) */}
                    <div className="relative">
                        <button onClick={() => { closeAllMenus(); setViewMenuOpen(!viewMenuOpen); }} className={`text-sm lg:text-base uppercase font-black tracking-[0.2em] transition-colors flex items-center ${activeView === 'LIST_USERS' || viewMenuOpen ? 'text-white' : 'text-zinc-500 hover:text-white'}`}>
                            Ver Perfiles <ChevronDownIcon />
                        </button>
                        {viewMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-30" onClick={closeAllMenus}></div>
                                <div className="absolute left-1/2 -translate-x-1/2 mt-6 w-56 bg-black/40 backdrop-blur-3xl border border-white/10 shadow-2xl shadow-black rounded-2xl py-2 z-50 animate-in fade-in slide-in-from-top-3 duration-300 overflow-hidden">
                                    <button onClick={() => handleViewClick('abogado')} className="w-full text-left px-5 py-4 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-colors border-b border-white/5">Abogados</button>
                                    <button onClick={() => handleViewClick('estudiante')} className="w-full text-left px-5 py-4 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-colors border-b border-white/5">Estudiantes</button>
                                    <button onClick={() => handleViewClick('cliente')} className="w-full text-left px-5 py-4 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-colors">Clientes</button>
                                </div>
                            </>
                        )}
                    </div>
                </nav>

                <div className="flex items-center justify-end gap-6 w-32 relative z-50">
                    
                    {/* DROPDOWN CAMPANITA ADMIN (GLASSMORPHISM) */}
                    <div className="relative">
                        <button onClick={() => { closeAllMenus(); setNotificationsOpen(!notificationsOpen); }} className={`text-zinc-500 hover:text-white transition-colors relative ${notificationsOpen ? 'text-white' : ''}`}>
                            <BellIcon />
                            {notifications.length > 0 && <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black"></span>}
                        </button>

                        {notificationsOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={closeAllMenus}></div>
                                <div className="absolute right-0 mt-6 w-80 bg-black/40 backdrop-blur-3xl border border-white/10 shadow-2xl shadow-black rounded-2xl py-2 z-50 animate-in fade-in slide-in-from-top-3 duration-300 overflow-hidden">
                                    <div className="p-5 border-b border-white/5">
                                        <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-black">Pendiente de Aprobación</p>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto scrollbar-hide">
                                        {notifications.length === 0 ? (
                                            <p className="p-6 text-xs text-zinc-500 italic text-center">Todo al día. No hay pendientes.</p>
                                        ) : (
                                            notifications.map((n, i) => {
                                                const isUpdate = n.caso !== undefined;
                                                return (
                                                    <div key={i} onClick={() => { closeAllMenus(); handleViewClick(isUpdate ? 'abogado' : 'cliente'); }} className="p-4 border-b border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-yellow-900/50 text-yellow-400">
                                                                Revisión Requerida
                                                            </span>
                                                            <span className="text-[9px] text-zinc-500 font-mono">{new Date(n.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                        <p className="text-white text-xs font-bold mt-2">
                                                            {isUpdate ? `Caso: ${n.caso?.titulo}` : (n.tipo === 'nuevo_cliente' ? 'Nuevo Cliente' : 'Petición de Acceso')}
                                                        </p>
                                                        <p className="text-zinc-400 text-xs mt-1 line-clamp-2">
                                                            De: {n.trabajador?.primer_nombre} {n.trabajador?.primer_apellido}
                                                        </p>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    
                    {/* DROPDOWN PERFIL ADMIN (GLASSMORPHISM) */}
                    <div className="relative">
                        <button onClick={() => { closeAllMenus(); setProfileMenuOpen(!profileMenuOpen); }} className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all overflow-hidden bg-zinc-900 ${profileMenuOpen ? 'border-white' : 'border-zinc-700 hover:border-white'}`}>
                            {adminProfilePic ? (
                                <img src={adminProfilePic} alt="Perfil" className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon className="w-6 h-6 text-zinc-400 pointer-events-none" />
                            )}
                        </button>

                        {profileMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={closeAllMenus}></div>
                                <div className="absolute right-0 mt-6 w-64 bg-black/40 backdrop-blur-3xl border border-white/10 shadow-2xl shadow-black rounded-2xl py-2 z-50 animate-in fade-in slide-in-from-top-3 duration-300 overflow-hidden">
                                    <div className="p-5 border-b border-white/5">
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 font-black">Sesión activa</p>
                                        <p className="text-sm font-bold text-white truncate mb-1">{session.user.email}</p>
                                        <p className="text-[10px] text-blue-400 uppercase tracking-[0.2em] font-black">Administrador</p>
                                    </div>
                                    <button onClick={() => handleNavigate('PROFILE')} className="w-full text-left px-5 py-4 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-colors border-b border-white/5">
                                        Mi Perfil
                                    </button>
                                    <button onClick={async () => { 
                                        closeAllMenus(); 
                                        localStorage.removeItem('deviceToken');
                                        await supabase.auth.signOut(); 
                                    }} className="w-full text-left px-5 py-4 text-xs font-bold uppercase tracking-widest text-red-400 hover:bg-white/10 transition-colors">
                                        Cerrar Sesión
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {mobileMenuOpen && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex flex-col font-mono p-6">
                    <div className="flex justify-between items-center mb-12">
                        <div className="font-black text-2xl tracking-[0.3em]">R&R</div>
                        <button onClick={() => setMobileMenuOpen(false)} className="text-zinc-500 hover:text-white">CERRAR</button>
                    </div>
                    <div className="flex flex-col gap-8 text-left">
                        <button onClick={() => handleNavigate('HOME')} className={`text-2xl font-black uppercase tracking-[0.2em] text-left ${activeView === 'HOME' ? 'text-white' : 'text-zinc-600'}`}>Inicio</button>
                        <button onClick={() => handleNavigate('TIME_BILLING')} className={`text-2xl font-black uppercase tracking-[0.2em] text-left ${activeView === 'TIME_BILLING' ? 'text-white' : 'text-zinc-600'}`}>Time Billing</button>
                        <button onClick={() => handleNavigate('REPORTS')} className={`text-2xl font-black uppercase tracking-[0.2em] text-left ${activeView === 'REPORTS' ? 'text-white' : 'text-zinc-600'}`}>Reportes</button>
                        
                        <div className="mt-8 border-t border-zinc-900 pt-8 flex flex-col gap-6">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Crear Perfiles</p>
                            <button onClick={() => handleCreateClick('abogado')} className="text-lg font-bold uppercase tracking-widest text-left text-zinc-400">Abogado</button>
                            <button onClick={() => handleCreateClick('estudiante')} className="text-lg font-bold uppercase tracking-widest text-left text-zinc-400">Estudiante</button>
                            <button onClick={() => handleCreateClick('cliente')} className="text-lg font-bold uppercase tracking-widest text-left text-zinc-400">Cliente</button>
                        </div>
                    </div>
                </div>
            )}

            <main className="flex-grow flex flex-col relative z-10">
                {activeView === 'HOME' ? (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center font-black text-6xl relative h-20 w-full flex items-center justify-center">
                            <h1 className="absolute transition-all duration-1000 ease-in-out opacity-100 tracking-[.2em]">
                                Regalado & Regalado
                            </h1>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 sm:p-8 w-full max-w-7xl mx-auto flex-grow flex flex-col">
                        {renderContent()}
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;