import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabaseClient';
import { BellIcon, LogoutIcon } from '../shared/Icons';

// Subcomponente para los ítems de navegación con submenú
interface NavItemWithDropdownProps {
    label: string;
    children: React.ReactNode;
}
const NavItemWithDropdown: React.FC<NavItemWithDropdownProps> = ({ label, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const node = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (node.current && !node.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={node} className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className="nav-button">{label}</button>
            <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-4 w-40 bg-black/90 backdrop-blur-md py-2 z-50 transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
                {React.Children.map(children, child => 
                    React.isValidElement(child) ? React.cloneElement(child, { onClick: () => {
                        if (child.props.onClick) child.props.onClick();
                        setIsOpen(false);
                    }} as React.Attributes) : child
                )}
            </div>
        </div>
    );
};

// SOLUCIÓN: Agregada la función handleNavigation como prop para que sepa cambiar de pantalla
const ProfileDropdown: React.FC<{ profilePic: string | null, handleNavigation: any }> = ({ profilePic, handleNavigation }) => {
    const [isOpen, setIsOpen] = useState(false);
    const node = useRef<HTMLDivElement>(null);
    
    const handleLogout = async () => {
        localStorage.removeItem('deviceToken');
        await supabase.auth.signOut();
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (node.current && !node.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={node} className="relative flex items-center h-full">
            <img onClick={() => setIsOpen(!isOpen)} src={profilePic || "https://via.placeholder.com/150"} alt="Admin" className="w-10 h-10 rounded-full border-2 border-zinc-700 hover:border-white transition-all cursor-pointer object-cover"/>
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-black/80 backdrop-blur-md shadow-2xl shadow-black/90 rounded-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-300 overflow-hidden flex flex-col divide-y divide-zinc-800/50">
                    
                    {/* BOTÓN MI PERFIL */}
                    <a onClick={() => { setIsOpen(false); handleNavigation('PROFILE'); }} className="flex items-center gap-3 w-full text-left px-5 py-3 text-sm text-zinc-300 hover:bg-white/5 cursor-pointer transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                        Mi Perfil
                    </a>
                    
                    <a onClick={handleLogout} className="flex items-center gap-3 w-full text-left px-5 py-3 text-sm text-red-400 hover:bg-white/5 cursor-pointer transition-colors">
                        <LogoutIcon /> Cerrar Sesión
                    </a>
                </div>
            )}
        </div>
    );
};

const BellDropdown: React.FC<{ pendingCount: number, recentLogins: any[], handleNavigation: any }> = ({ pendingCount, recentLogins, handleNavigation }) => {
    const [isOpen, setIsOpen] = useState(false);
    const node = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (node.current && !node.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={node} className="relative flex items-center h-full">
            <button onClick={() => setIsOpen(!isOpen)} className="text-zinc-400 hover:text-white transition-colors relative">
                <BellIcon />
                {pendingCount > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-black"></span>}
            </button>
            
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-black/80 backdrop-blur-md shadow-2xl shadow-black/90 z-50 flex flex-col rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                    
                    <div className="p-5 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => { setIsOpen(false); handleNavigation('APPROVALS'); }}>
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-white uppercase tracking-widest">Aprobaciones</p>
                            {pendingCount > 0 ? (
                                <span className="bg-red-900/80 text-red-300 px-2 py-0.5 text-[10px] font-black rounded">{pendingCount} PENDIENTES</span>
                            ) : (
                                <span className="text-zinc-500 text-[10px] uppercase font-bold">Al día</span>
                            )}
                        </div>
                        {pendingCount > 0 && <p className="text-[10px] text-zinc-400 mt-2">Nuevas solicitudes requieren tu revisión.</p>}
                    </div>

                    <div className="p-5 bg-transparent pt-0">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-4">Accesos Recientes</p>
                        {recentLogins.length === 0 ? (
                            <p className="text-[10px] text-zinc-600 italic">No hay registros recientes.</p>
                        ) : (
                            <div className="space-y-4">
                                {recentLogins.map((log, idx) => (
                                    <div key={idx} className="flex justify-between items-start pb-1">
                                        <div>
                                            <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">{log.profiles?.primer_nombre} {log.profiles?.primer_apellido}</p>
                                            <p className="text-[8px] text-zinc-500 uppercase mt-0.5">{log.profiles?.rol}</p>
                                        </div>
                                        <p className="text-[9px] text-zinc-500 font-mono bg-black/50 px-1.5 py-0.5 rounded border border-zinc-800/30">
                                            {new Date(log.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

interface AdminHeaderProps {
    setActiveView: (viewConfig: { name: string; params?: any }) => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ setActiveView }) => {
    const [profilePic, setProfilePic] = useState<string | null>(null);
    const [pendingCount, setPendingCount] = useState(0);
    const [recentLogins, setRecentLogins] = useState<any[]>([]);

    useEffect(() => {
        const fetchHeaderData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase.from('profiles').select('foto_url').eq('id', user.id).single();
            if (profile && profile.foto_url) {
                setProfilePic(profile.foto_url);
            }

            const updateCount = async () => {
                const { count: countUpdates } = await supabase.from('case_updates').select('*', { count: 'exact', head: true }).eq('estado_aprobacion', 'pendiente');
                const { count: countPetitions } = await supabase.from('peticiones_acceso').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente');
                setPendingCount((countUpdates || 0) + (countPetitions || 0));
            };
            updateCount();

            const fetchLogins = async () => {
                const { data: accesos } = await supabase.from('registro_accesos')
                    .select('fecha, profiles (primer_nombre, primer_apellido, rol)')
                    .order('fecha', { ascending: false })
                    .limit(5);
                if (accesos) setRecentLogins(accesos);
            };
            fetchLogins();

            const notificationsChannel = supabase.channel('admin_notifications')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'case_updates' }, updateCount)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'peticiones_acceso' }, updateCount)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'registro_accesos' }, fetchLogins)
                .subscribe();


            const localToken = localStorage.getItem('deviceToken');
            if (localToken) {
                const { data: sesion } = await supabase.from('sesion_unica').select('token_dispositivo').eq('user_id', user.id).single();
                if (sesion && sesion.token_dispositivo !== localToken) {
                    await supabase.auth.signOut();
                    window.location.reload();
                }

                const sessionChannel = supabase.channel('sesion_activa')
                    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sesion_unica', filter: `user_id=eq.${user.id}` }, (payload) => {
                        if (payload.new.token_dispositivo !== localToken) {
                            supabase.auth.signOut().then(() => {
                                alert("Sesión cerrada automáticamente: Se ha iniciado sesión en otro dispositivo.");
                                window.location.reload();
                            });
                        }
                    }).subscribe();

                return () => { 
                    supabase.removeChannel(sessionChannel);
                    supabase.removeChannel(notificationsChannel);
                }
            }
        };

        fetchHeaderData();
    }, []);

    const handleNavigation = (viewName: string, params?: any) => {
        setActiveView({ name: viewName, params });
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-lg border-b border-zinc-900/50">
            <nav className="px-8 flex items-center justify-between h-20">
                <button onClick={() => handleNavigation('HOME')} className="text-2xl font-black tracking-widest hover:text-zinc-300 transition-colors">R&R</button>
                
                <div className="flex-grow flex justify-center items-center gap-12">
                   <NavItemWithDropdown label="Registrar">
                       <a onClick={() => handleNavigation('USERS', { preselectedRole: 'abogado' })} className="dropdown-item">Abogado</a>
                       <a onClick={() => handleNavigation('USERS', { preselectedRole: 'estudiante' })} className="dropdown-item">Estudiante</a>
                       <a onClick={() => handleNavigation('USERS', { preselectedRole: 'cliente' })} className="dropdown-item">Cliente</a>
                   </NavItemWithDropdown>

                   <NavItemWithDropdown label="Perfiles">
                       <a onClick={() => handleNavigation('PROFILES', { role: 'abogado' })} className="dropdown-item">Abogados</a>
                       <a onClick={() => handleNavigation('PROFILES', { role: 'estudiante' })} className="dropdown-item">Estudiantes</a>
                       <a onClick={() => handleNavigation('PROFILES', { role: 'cliente' })} className="dropdown-item">Clientes</a>
                   </NavItemWithDropdown>

                   <button onClick={() => handleNavigation('TIME_BILLING')} className="nav-button">Time Billing</button>
                   <button onClick={() => handleNavigation('APPROVALS')} className="nav-button">Aprobaciones</button>
                   <button onClick={() => handleNavigation('REPORTS')} className="nav-button">Reportes</button>
                </div>

                <div className="flex items-center gap-8 h-full">
                    <BellDropdown pendingCount={pendingCount} recentLogins={recentLogins} handleNavigation={handleNavigation} />
                    {/* SOLUCIÓN: Pasamos la propiedad handleNavigation al dropdown */}
                    <ProfileDropdown profilePic={profilePic} handleNavigation={handleNavigation} />
                </div>
            </nav>
            <style>{`
              .nav-button {
                background: none; border: none; cursor: pointer;
                color: #a1a1aa; font-size: 0.9rem; font-weight: 600;
                transition: color 0.3s;
              }
              .nav-button:hover { color: #ffffff; }

              .dropdown-item {
                display: block; text-align: center;
                padding: 0.5rem 1rem;
                font-size: 0.85rem;
                color: #a1a1aa;
                cursor: pointer;
                transition: color 0.2s;
              }
              .dropdown-item:hover {
                color: #ffffff;
              }
            `}</style>
        </header>
    );
};

export default AdminHeader;