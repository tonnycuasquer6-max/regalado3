import React, { useState, useEffect, Fragment } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../services/supabaseClient';

// --- Iconos ---
const BellIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>;
const UserIcon = ({ className = "w-5 h-5" }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;

// --- Componente Modal Fijo ---
const Modal: React.FC<{ isOpen: boolean; children: React.ReactNode }> = ({ isOpen, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            {children}
        </div>
    );
};

// --- Placeholder Vistas (Se desarrollarán después) ---
const PlaceholderView = ({ title }: { title: string }) => (
    <div className="p-8 border border-dashed border-zinc-800 text-center animate-in fade-in duration-500 text-white font-mono h-full flex flex-col items-center justify-center">
        <h2 className="text-3xl font-black uppercase tracking-widest mb-4">{title}</h2>
        <p className="text-zinc-500 text-sm tracking-widest uppercase">Próximamente disponible</p>
    </div>
);

// ==========================================
// COMPONENTE PRINCIPAL CLIENT DASHBOARD
// ==========================================
const ClientDashboard: React.FC<{ session: Session }> = ({ session }) => {
    
    const [activeView, setActiveView] = useState('HOME');
    const [profilePic, setProfilePic] = useState<string | null>(null);
    const [clientName, setClientName] = useState('');
    
    // --- Menús y Notificaciones ---
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);

    // --- Modal de Cambio de Contraseña Forzado ---
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passLoading, setPassLoading] = useState(false);

    // Validaciones exactas del diseño
    const lenCheck = newPassword.length >= 8 && newPassword.length <= 20;
    const upperCheck = /[A-Z]/.test(newPassword);
    const lowerCheck = /[a-z]/.test(newPassword);
    const numCheck = /\d/.test(newPassword);
    const specCheck = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
    
    const isPasswordValid = lenCheck && upperCheck && lowerCheck && numCheck && specCheck;
    const passwordsMatch = newPassword === confirmPassword;

    useEffect(() => {
        const fetchInitialData = async () => {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
            if (profile) {
                setClientName(profile.primer_nombre || session.user.email);
                setProfilePic(profile.foto_url);

                if (profile.cambiar_pass_obligatorio === true) {
                    setShowPasswordModal(true);
                }
            }

            const { data: myCases } = await supabase.from('cases').select('id').eq('cliente_id', session.user.id);
            if (myCases && myCases.length > 0) {
                const caseIds = myCases.map(c => c.id);
                const { data: updates } = await supabase.from('case_updates')
                    .select('id, descripcion, created_at, caso:cases(titulo)')
                    .in('case_id', caseIds)
                    .eq('estado_aprobacion', 'aprobado')
                    .order('created_at', { ascending: false })
                    .limit(10);
                setNotifications(updates || []);
            }
        };

        fetchInitialData();
    }, [session.user.id]);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isPasswordValid || !passwordsMatch) return;
        setPassLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            await supabase.from('profiles').update({ cambiar_pass_obligatorio: false }).eq('id', session.user.id);
            setShowPasswordModal(false);
            alert("Contraseña actualizada exitosamente.");
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        } finally {
            setPassLoading(false);
        }
    };

    const closeAllMenus = () => {
        setNotificationsOpen(false);
        setProfileMenuOpen(false);
        setMobileMenuOpen(false);
    };

    const handleMenuClick = (view: string) => {
        setActiveView(view);
        closeAllMenus();
    };

    const renderContent = () => {
        switch (activeView) {
            case 'CASES': return <PlaceholderView title="Mis Casos" />;
            case 'PAYMENTS': return <PlaceholderView title="Métodos de Pago" />;
            case 'CHAT': return <PlaceholderView title="Chat" />;
            case 'PROFILE': return <PlaceholderView title="Mi Perfil" />;
            default: return null;
        }
    };

    return (
        <Fragment>
            <style>{`
                ::-webkit-scrollbar { width: 0px !important; height: 0px !important; background: transparent !important; display: none !important; }
                * { -ms-overflow-style: none !important; scrollbar-width: none !important; }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            <div className="bg-black min-h-screen text-white flex flex-col font-sans relative">
                
                <header className="flex justify-between items-center p-6 bg-black sticky top-0 z-50 border-b border-zinc-900/50">
                    <button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-zinc-400 hover:text-white">
                        <MenuIcon />
                    </button>
                    <div className="font-serif font-bold text-2xl tracking-widest cursor-pointer hover:text-zinc-300 transition-colors hidden md:block w-32" onClick={() => handleMenuClick('HOME')}>
                        R & R
                    </div>
                    
                    <nav className="hidden md:flex flex-grow justify-center gap-8 lg:gap-16 relative z-40">
                        <button onClick={() => handleMenuClick('CASES')} className={`text-sm lg:text-base font-bold transition-colors ${activeView === 'CASES' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}>Mis Casos</button>
                        <button onClick={() => handleMenuClick('PAYMENTS')} className={`text-sm lg:text-base font-bold transition-colors ${activeView === 'PAYMENTS' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}>Métodos de Pago</button>
                        <button onClick={() => handleMenuClick('CHAT')} className={`text-sm lg:text-base font-bold transition-colors ${activeView === 'CHAT' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}>Chat</button>
                    </nav>

                    <div className="flex items-center justify-end gap-6 w-32 relative z-50">
                        
                        {/* CAMPANITA */}
                        <div className="relative">
                            <button onClick={() => { closeAllMenus(); setNotificationsOpen(!notificationsOpen); }} className={`text-zinc-500 hover:text-white transition-colors relative ${notificationsOpen ? 'text-white' : ''}`}>
                                <BellIcon />
                                {notifications.length > 0 && <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black"></span>}
                            </button>

                            {notificationsOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={closeAllMenus}></div>
                                    <div className="absolute right-0 mt-6 w-80 bg-black/40 backdrop-blur-3xl border border-white/10 shadow-2xl shadow-black rounded-2xl py-2 z-50 animate-in fade-in slide-in-from-top-3 duration-300 overflow-hidden font-mono">
                                        <div className="p-5 border-b border-white/5">
                                            <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-black">Actualizaciones Recientes</p>
                                        </div>
                                        <div className="max-h-80 overflow-y-auto scrollbar-hide">
                                            {notifications.length === 0 ? (
                                                <p className="p-6 text-xs text-zinc-500 italic text-center">Todo al día. No hay novedades.</p>
                                            ) : (
                                                notifications.map((n, i) => (
                                                    <div key={i} onClick={() => handleMenuClick('CASES')} className="p-4 border-b border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 font-mono">{new Date(n.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                        <p className="text-white text-xs font-bold mt-1">Caso: {n.caso?.titulo}</p>
                                                        <p className="text-zinc-400 text-xs mt-1 line-clamp-2">{n.descripcion}</p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        
                        {/* PERFIL */}
                        <div className="relative">
                            <button onClick={() => { closeAllMenus(); setProfileMenuOpen(!profileMenuOpen); }} className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all overflow-hidden bg-zinc-900 ${profileMenuOpen ? 'border-white' : 'border-zinc-700 hover:border-white'}`}>
                                {profilePic ? <img src={profilePic} alt="Perfil" className="w-full h-full object-cover" /> : <UserIcon className="w-6 h-6 text-zinc-400 pointer-events-none" />}
                            </button>

                            {profileMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={closeAllMenus}></div>
                                    <div className="absolute right-0 mt-6 w-56 bg-black/40 backdrop-blur-3xl border border-white/10 shadow-2xl shadow-black rounded-2xl py-2 z-50 animate-in fade-in slide-in-from-top-3 duration-300 overflow-hidden font-mono">
                                        <div className="p-5 border-b border-white/5">
                                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 font-black">Hola,</p>
                                            <p className="text-sm font-bold text-white truncate">{clientName}</p>
                                        </div>
                                        <button onClick={() => handleMenuClick('PROFILE')} className="w-full text-left px-5 py-4 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-colors border-b border-white/5">
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

                {/* MENÚ MÓVIL */}
                {mobileMenuOpen && (
                    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex flex-col font-sans p-6">
                        <div className="flex justify-between items-center mb-12">
                            <div className="font-serif font-bold text-2xl tracking-widest">R & R</div>
                            <button onClick={closeAllMenus} className="text-zinc-500 hover:text-white font-bold font-mono text-sm tracking-widest">CERRAR</button>
                        </div>
                        <div className="flex flex-col gap-8 text-left">
                            <button onClick={() => handleMenuClick('HOME')} className={`text-2xl font-bold text-left ${activeView === 'HOME' ? 'text-white' : 'text-zinc-400'}`}>Inicio</button>
                            <button onClick={() => handleMenuClick('CASES')} className={`text-2xl font-bold text-left ${activeView === 'CASES' ? 'text-white' : 'text-zinc-400'}`}>Mis Casos</button>
                            <button onClick={() => handleMenuClick('PAYMENTS')} className={`text-2xl font-bold text-left ${activeView === 'PAYMENTS' ? 'text-white' : 'text-zinc-400'}`}>Métodos de Pago</button>
                            <button onClick={() => handleMenuClick('CHAT')} className={`text-2xl font-bold text-left ${activeView === 'CHAT' ? 'text-white' : 'text-zinc-400'}`}>Chat</button>
                        </div>
                    </div>
                )}

                {/* CONTENIDO PRINCIPAL */}
                <main className="flex-grow flex flex-col relative z-10">
                    {activeView === 'HOME' ? (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center font-bold text-5xl md:text-7xl relative w-full flex items-center justify-center font-serif tracking-widest">
                                <h1 className="text-white drop-shadow-2xl">
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

                {/* MODAL DE CAMBIO DE CONTRASEÑA FORZADO */}
                <Modal isOpen={showPasswordModal}>
                    <form onSubmit={handleUpdatePassword} className="bg-black w-full max-w-md mx-auto p-10 font-serif border border-zinc-800 shadow-2xl shadow-black">
                        <h2 className="text-sm font-bold tracking-[0.3em] uppercase text-zinc-400 mb-8 text-left">
                            Contraseña Maestra
                        </h2>
                        
                        <input 
                            type="password" 
                            required 
                            value={newPassword} 
                            onChange={e => setNewPassword(e.target.value)} 
                            className="w-full bg-transparent border-b-2 border-zinc-700 text-white pb-2 focus:outline-none focus:border-zinc-300 transition-colors mb-6 font-sans text-lg tracking-wider" 
                        />
                        
                        <div className="bg-[#0a0a0a] border border-zinc-900 p-6 mb-10 flex flex-col gap-4 font-sans text-sm tracking-wide">
                            <div className={`flex items-center gap-4 transition-colors ${lenCheck ? 'text-zinc-300' : 'text-zinc-700'}`}>
                                <CheckIcon /> 8-20 caracteres
                            </div>
                            <div className={`flex items-center gap-4 transition-colors ${upperCheck ? 'text-zinc-300' : 'text-zinc-700'}`}>
                                <CheckIcon /> Mayúsculas
                            </div>
                            <div className={`flex items-center gap-4 transition-colors ${lowerCheck ? 'text-zinc-300' : 'text-zinc-700'}`}>
                                <CheckIcon /> Minúsculas
                            </div>
                            <div className={`flex items-center gap-4 transition-colors ${numCheck ? 'text-zinc-300' : 'text-zinc-700'}`}>
                                <CheckIcon /> Números
                            </div>
                            <div className={`flex items-center gap-4 transition-colors ${specCheck ? 'text-zinc-300' : 'text-zinc-700'}`}>
                                <CheckIcon /> Especial
                            </div>
                        </div>

                        <h2 className="text-sm font-bold tracking-[0.3em] uppercase text-zinc-400 mb-6 text-left">
                            Confirmación
                        </h2>
                        
                        <input 
                            type="password" 
                            required 
                            value={confirmPassword} 
                            onChange={e => setConfirmPassword(e.target.value)} 
                            className="w-full bg-transparent border-b-2 border-zinc-700 text-white pb-2 focus:outline-none focus:border-zinc-300 transition-colors font-sans text-lg tracking-wider mb-2" 
                        />
                        
                        <div className="h-6 mb-8 font-serif">
                            {confirmPassword.length > 0 && !passwordsMatch && (
                                <p className="text-red-500 font-bold tracking-wider text-sm">
                                    Las contraseñas no coinciden
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end font-sans">
                            <button 
                                type="submit" 
                                disabled={passLoading || !isPasswordValid || !passwordsMatch} 
                                className={`font-bold py-3 px-8 text-xs tracking-widest uppercase transition-colors ${isPasswordValid && passwordsMatch ? 'bg-white text-black hover:bg-zinc-300' : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'}`}
                            >
                                {passLoading ? 'GUARDANDO...' : 'GUARDAR'}
                            </button>
                        </div>
                    </form>
                </Modal>
            </div>
        </Fragment>
    );
};

export default ClientDashboard;