import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../services/supabaseClient';

// --- Vistas ---
import TimeBillingMaestro from './TimeBillingMaestro';
import ReportsView from './ReportsView';
import AdminProfile from './AdminProfile';
import UserManagementView from './UserManagementView';
import ListaPerfiles from './ListaPerfiles';
import ApprovalsView from './ApprovalsView'; 

// --- Iconos ---
const BellIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>;
const UserIcon = ({ className = "w-5 h-5" }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>;

const scrollbarStyle = "overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-700 transition-colors";

// ==========================================
// VISTA: CHAT INTERNO ADMIN
// ==========================================
const AdminChatView: React.FC<{ session: Session }> = ({ session }) => {
    const [users, setUsers] = useState<any[]>([]);
    const [allCases, setAllCases] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'abogado' | 'estudiante' | 'cliente'>('abogado');

    const [selectedContact, setSelectedContact] = useState<any>(null);
    const [chatStep, setChatStep] = useState<'status' | 'case' | 'chat'>('chat');
    const [selectedStatus, setSelectedStatus] = useState<'abierto' | 'cerrado' | null>(null);
    const [selectedCase, setSelectedCase] = useState<any>(null);
    
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<any[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };

    useEffect(() => {
        const fetchChatData = async () => {
            const { data: profiles } = await supabase.from('profiles').select('*').neq('rol', 'admin');
            if (profiles) setUsers(profiles);
            const { data: casesData } = await supabase.from('cases').select('*');
            if (casesData) setAllCases(casesData);
        };
        fetchChatData();
    }, []);

    const fetchMessages = useCallback(async () => {
        if (!selectedContact) return;
        let q = supabase.from('chat_messages')
            .select('*')
            .or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${selectedContact.id}),and(sender_id.eq.${selectedContact.id},receiver_id.eq.${session.user.id})`)
            .order('created_at', { ascending: true });

        if (selectedCase) q = q.eq('case_id', selectedCase.id);
        else q = q.is('case_id', null);

        const { data } = await q;
        if (data) { setMessages(data); scrollToBottom(); }
    }, [selectedContact, selectedCase, session.user.id]);

    useEffect(() => {
        if (chatStep === 'chat') {
            fetchMessages();
            const channel = supabase.channel('chat_updates').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, payload => {
                const newMsg = payload.new;
                const isCurrentChat = (newMsg.sender_id === session.user.id && newMsg.receiver_id === selectedContact.id) || (newMsg.sender_id === selectedContact.id && newMsg.receiver_id === session.user.id);
                const isCurrentCase = selectedCase ? newMsg.case_id === selectedCase.id : newMsg.case_id === null;
                if (isCurrentChat && isCurrentCase) { setMessages(prev => [...prev, newMsg]); scrollToBottom(); }
            }).subscribe();
            return () => { supabase.removeChannel(channel); };
        }
    }, [chatStep, fetchMessages, selectedContact, selectedCase, session.user.id]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !selectedContact) return;
        const msgText = message.trim();
        setMessage('');
        
        // SOLUCIÓN: Agregada la alerta detallada con error.message
        const { error } = await supabase.from('chat_messages').insert([{
            sender_id: session.user.id, receiver_id: selectedContact.id, case_id: selectedCase ? selectedCase.id : null, message: msgText
        }]);
        
        if (error) {
            alert("Error de base de datos: " + error.message);
        }
    };

    const handleContactClick = (contact: any) => {
        setSelectedContact(contact);
        if (contact.rol === 'cliente') { setChatStep('status'); setSelectedStatus(null); setSelectedCase(null); }
        else { setChatStep('chat'); setSelectedCase(null); }
    };

    const handleStatusClick = (status: 'abierto' | 'cerrado') => { setSelectedStatus(status); setChatStep('case'); };
    const handleCaseClick = (caso: any) => { setSelectedCase(caso); setChatStep('chat'); };

    const filteredUsers = users.filter(u => activeTab === 'cliente' ? u.rol === 'cliente' : u.rol === 'trabajador' && u.categoria_usuario === activeTab);
    const clientCases = allCases.filter(c => c.cliente_id === selectedContact?.id && c.estado === selectedStatus);

    return (
        <div className="animate-in fade-in duration-500 font-mono w-full max-w-6xl mx-auto h-[75vh] flex flex-col md:flex-row border border-zinc-800 bg-black">
            <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col bg-zinc-950">
                <div className="flex border-b border-zinc-800 flex-shrink-0">
                    <button onClick={() => setActiveTab('abogado')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'abogado' ? 'bg-zinc-900 text-white border-b-2 border-white' : 'text-zinc-500 hover:text-white hover:bg-zinc-900/50'}`}>Abogados</button>
                    <button onClick={() => setActiveTab('estudiante')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'estudiante' ? 'bg-zinc-900 text-white border-b-2 border-white' : 'text-zinc-500 hover:text-white hover:bg-zinc-900/50'}`}>Estudiantes</button>
                    <button onClick={() => setActiveTab('cliente')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'cliente' ? 'bg-zinc-900 text-white border-b-2 border-white' : 'text-zinc-500 hover:text-white hover:bg-zinc-900/50'}`}>Clientes</button>
                </div>
                
                <div className={`flex-grow overflow-y-auto ${scrollbarStyle}`}>
                    {filteredUsers.length === 0 ? (
                        <p className="p-6 text-xs text-zinc-600 italic text-center">No hay usuarios en esta categoría.</p>
                    ) : (
                        filteredUsers.map(user => (
                            <button key={user.id} onClick={() => handleContactClick(user)} className={`w-full text-left p-4 border-b border-zinc-800/50 flex items-center gap-4 transition-colors ${selectedContact?.id === user.id ? 'bg-zinc-900 border-l-2 border-l-white' : 'hover:bg-zinc-900 border-l-2 border-l-transparent'}`}>
                                <div className="w-12 h-12 rounded-full border border-zinc-700 overflow-hidden flex-shrink-0 bg-black">
                                    {user.foto_url ? <img src={user.foto_url} className="w-full h-full object-cover" /> : <UserIcon className="w-6 h-6 m-auto mt-3 text-zinc-500"/>}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-white uppercase tracking-widest">{user.primer_nombre} {user.primer_apellido}</p>
                                    <p className={`text-[9px] uppercase tracking-widest mt-1 ${activeTab === 'abogado' ? 'text-green-400' : activeTab === 'estudiante' ? 'text-blue-400' : 'text-zinc-400'}`}>{activeTab === 'cliente' ? 'Cliente' : activeTab}</p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            <div className="flex-grow flex flex-col bg-[#050505] relative">
                {!selectedContact ? (
                    <div className="flex-grow flex items-center justify-center p-8 text-center"><p className="text-zinc-500 uppercase tracking-widest text-sm font-bold">Selecciona un contacto a la izquierda para iniciar</p></div>
                ) : (
                    <>
                        <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full border border-zinc-700 overflow-hidden flex-shrink-0 bg-black">
                                {selectedContact.foto_url ? <img src={selectedContact.foto_url} className="w-full h-full object-cover" /> : <UserIcon className="w-4 h-4 m-auto mt-2 text-zinc-500"/>}
                            </div>
                            <div>
                                <h3 className="font-bold uppercase tracking-widest text-sm text-white">{selectedContact.primer_nombre} {selectedContact.primer_apellido}</h3>
                                <p className="text-[8px] text-zinc-500 uppercase tracking-widest">{selectedContact.rol === 'cliente' ? 'Cliente' : selectedContact.categoria_usuario}</p>
                            </div>
                        </div>

                        <div className={`flex-grow p-8 flex flex-col ${chatStep === 'chat' ? '' : 'justify-center'} overflow-y-auto ${scrollbarStyle}`}>
                            {chatStep === 'status' && selectedContact.rol === 'cliente' && (
                                <div className="animate-in fade-in zoom-in duration-300 w-full max-w-md mx-auto text-center">
                                    <p className="text-zinc-400 mb-8 uppercase tracking-widest text-sm font-bold">Selecciona los casos de este cliente</p>
                                    <div className="flex flex-col gap-4">
                                        <button onClick={() => handleStatusClick('abierto')} className="bg-zinc-900 border border-zinc-800 hover:border-zinc-500 text-white font-black uppercase tracking-widest py-6 px-4 transition-colors">Casos Abiertos</button>
                                        <button onClick={() => handleStatusClick('cerrado')} className="bg-zinc-950 border border-zinc-900 hover:border-zinc-700 text-zinc-400 hover:text-white font-black uppercase tracking-widest py-6 px-4 transition-colors">Casos Cerrados</button>
                                    </div>
                                </div>
                            )}

                            {chatStep === 'case' && selectedContact.rol === 'cliente' && (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-300 w-full max-w-lg mx-auto">
                                    <button onClick={() => setChatStep('status')} className="text-zinc-500 hover:text-white text-[10px] uppercase tracking-widest mb-6 flex items-center gap-2">‹ Volver</button>
                                    <p className="text-zinc-400 mb-6 uppercase tracking-widest text-sm font-bold">Casos {selectedStatus}s del cliente:</p>
                                    {clientCases.length === 0 ? (
                                        <p className="text-center text-zinc-600 italic border border-dashed border-zinc-800 p-8">Este cliente no tiene casos {selectedStatus}s.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {clientCases.map(c => (
                                                <button key={c.id} onClick={() => handleCaseClick(c)} className="w-full text-left bg-zinc-900 border border-zinc-800 hover:border-white p-4 transition-colors group">
                                                    <h4 className="font-bold text-white uppercase tracking-widest flex justify-between items-center">{c.titulo} <span className="opacity-0 group-hover:opacity-100 transition-opacity">›</span></h4>
                                                    <p className="text-xs text-zinc-500 line-clamp-1 mt-2">{c.descripcion}</p>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {chatStep === 'chat' && (
                                <div className="animate-in fade-in duration-300 flex flex-col w-full min-h-full gap-4">
                                    <div className="text-center my-4">
                                        <span className="bg-zinc-900 border border-zinc-800 text-zinc-400 text-[9px] uppercase tracking-widest px-4 py-2 rounded-full">
                                            {selectedContact.rol === 'cliente' && selectedCase ? `Chat sobre caso: ${selectedCase.titulo}` : 'Conversación Directa'}
                                        </span>
                                    </div>
                                    
                                    {messages.length === 0 ? (
                                        <p className="text-zinc-600 text-xs italic text-center my-auto">Envía el primer mensaje para iniciar la conversación.</p>
                                    ) : (
                                        messages.map(msg => {
                                            const isMe = msg.sender_id === session.user.id;
                                            return (
                                                <div key={msg.id} className={`flex flex-col gap-1 max-w-[80%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                                                    <div className={`p-3 rounded-2xl ${isMe ? 'bg-zinc-800 border border-zinc-700 rounded-tr-none text-white' : 'bg-zinc-900 border border-zinc-800 rounded-tl-none text-zinc-300'}`}>
                                                        <p className="text-sm">{msg.message}</p>
                                                    </div>
                                                    <p className="text-[8px] text-zinc-500 font-mono">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                                </div>
                                            )
                                        })
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>

                        {chatStep === 'chat' && (
                            <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-800 bg-black animate-in slide-in-from-bottom-4 duration-300">
                                <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 p-2 rounded-full pr-4 focus-within:border-zinc-500 transition-colors">
                                    <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Escribe un mensaje..." className="flex-grow bg-transparent text-white text-sm focus:outline-none px-4 py-2" />
                                    <button type="submit" disabled={!message.trim()} className="text-white hover:text-blue-400 transition-colors p-2 bg-zinc-900 rounded-full disabled:opacity-50"><SendIcon /></button>
                                </div>
                            </form>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
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
            const { data: profile } = await supabase.from('profiles').select('foto_url').eq('id', session.user.id).single();
            if (profile?.foto_url) setAdminProfilePic(profile.foto_url);

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
            case 'APPROVALS': return <ApprovalsView onCancel={() => handleNavigate('HOME')} />;
            case 'CHAT': return <AdminChatView session={session} />;
            case 'PROFILE': return <AdminProfile session={session} onCancel={() => handleNavigate('HOME')} />;
            case 'CREATE_USER': return <UserManagementView preselectedRole={selectedRoleForCreate} onCancel={() => handleNavigate('HOME')} />;
            case 'LIST_USERS': return selectedRoleForView ? <ListaPerfiles role={selectedRoleForView} onCancel={() => handleNavigate('HOME')} /> : null;
            default: return null;
        }
    };

    return (
        <div className="bg-black min-h-screen text-white flex flex-col font-sans relative">
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
                <div className="font-serif font-bold text-2xl tracking-widest cursor-pointer hover:text-zinc-300 transition-colors hidden md:block w-32" onClick={() => handleNavigate('HOME')}>
                    R & R
                </div>
                
                <nav className="hidden md:flex flex-grow justify-center gap-6 lg:gap-10 items-center relative z-40">
                    
                    {/* MENÚ REGISTRAR */}
                    <div className="relative">
                        <button onClick={() => { closeAllMenus(); setCreateMenuOpen(!createMenuOpen); }} className={`text-sm lg:text-base font-bold transition-colors ${activeView === 'CREATE_USER' || createMenuOpen ? 'text-white' : 'text-zinc-400 hover:text-white'}`}>
                            Registrar
                        </button>
                        {createMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-30" onClick={closeAllMenus}></div>
                                <div className="absolute left-1/2 -translate-x-1/2 mt-6 w-56 bg-black/40 backdrop-blur-3xl border border-white/10 shadow-2xl shadow-black rounded-2xl py-2 z-50 animate-in fade-in slide-in-from-top-3 duration-300 overflow-hidden font-mono">
                                    <button onClick={() => handleCreateClick('abogado')} className="w-full text-left px-5 py-4 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-colors border-b border-white/5">Abogado</button>
                                    <button onClick={() => handleCreateClick('estudiante')} className="w-full text-left px-5 py-4 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-colors border-b border-white/5">Estudiante</button>
                                    <button onClick={() => handleCreateClick('cliente')} className="w-full text-left px-5 py-4 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-colors">Cliente</button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* MENÚ PERFILES */}
                    <div className="relative">
                        <button onClick={() => { closeAllMenus(); setViewMenuOpen(!viewMenuOpen); }} className={`text-sm lg:text-base font-bold transition-colors ${activeView === 'LIST_USERS' || viewMenuOpen ? 'text-white' : 'text-zinc-400 hover:text-white'}`}>
                            Perfiles
                        </button>
                        {viewMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-30" onClick={closeAllMenus}></div>
                                <div className="absolute left-1/2 -translate-x-1/2 mt-6 w-56 bg-black/40 backdrop-blur-3xl border border-white/10 shadow-2xl shadow-black rounded-2xl py-2 z-50 animate-in fade-in slide-in-from-top-3 duration-300 overflow-hidden font-mono">
                                    <button onClick={() => handleViewClick('abogado')} className="w-full text-left px-5 py-4 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-colors border-b border-white/5">Abogados</button>
                                    <button onClick={() => handleViewClick('estudiante')} className="w-full text-left px-5 py-4 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-colors border-b border-white/5">Estudiantes</button>
                                    <button onClick={() => handleViewClick('cliente')} className="w-full text-left px-5 py-4 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-colors">Clientes</button>
                                </div>
                            </>
                        )}
                    </div>

                    <button onClick={() => handleNavigate('TIME_BILLING')} className={`text-sm lg:text-base font-bold transition-colors ${activeView === 'TIME_BILLING' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}>Time Billing</button>
                    <button onClick={() => handleNavigate('APPROVALS')} className={`text-sm lg:text-base font-bold transition-colors ${activeView === 'APPROVALS' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}>Aprobaciones</button>
                    <button onClick={() => handleNavigate('REPORTS')} className={`text-sm lg:text-base font-bold transition-colors ${activeView === 'REPORTS' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}>Reportes</button>
                    <button onClick={() => handleNavigate('CHAT')} className={`text-sm lg:text-base font-bold transition-colors ${activeView === 'CHAT' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}>Chat</button>
                </nav>

                <div className="flex items-center justify-end gap-6 w-32 relative z-50">
                    
                    {/* DROPDOWN CAMPANITA ADMIN */}
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
                                        <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-black">Pendiente de Aprobación</p>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto scrollbar-hide">
                                        {notifications.length === 0 ? (
                                            <p className="p-6 text-xs text-zinc-500 italic text-center">Todo al día. No hay pendientes.</p>
                                        ) : (
                                            notifications.map((n, i) => {
                                                const isUpdate = n.caso !== undefined;
                                                return (
                                                    <div key={i} onClick={() => { closeAllMenus(); handleNavigate('APPROVALS'); }} className="p-4 border-b border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
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
                    
                    {/* DROPDOWN PERFIL ADMIN */}
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
                                <div className="absolute right-0 mt-6 w-64 bg-black/40 backdrop-blur-3xl border border-white/10 shadow-2xl shadow-black rounded-2xl py-2 z-50 animate-in fade-in slide-in-from-top-3 duration-300 overflow-hidden font-mono">
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
                        <div className="font-serif font-bold text-2xl tracking-widest">R & R</div>
                        <button onClick={() => setMobileMenuOpen(false)} className="text-zinc-500 hover:text-white font-bold">CERRAR</button>
                    </div>
                    <div className="flex flex-col gap-6 text-left">
                        <button onClick={() => handleNavigate('HOME')} className={`text-xl font-bold text-left ${activeView === 'HOME' ? 'text-white' : 'text-zinc-400'}`}>Inicio</button>
                        
                        <div className="mt-4 border-t border-zinc-900 pt-6 flex flex-col gap-4">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Registrar</p>
                            <button onClick={() => handleCreateClick('abogado')} className="text-lg font-bold text-left text-white">Abogado</button>
                            <button onClick={() => handleCreateClick('estudiante')} className="text-lg font-bold text-left text-white">Estudiante</button>
                            <button onClick={() => handleCreateClick('cliente')} className="text-lg font-bold text-left text-white">Cliente</button>
                        </div>
                        
                        <div className="mt-4 border-t border-zinc-900 pt-6 flex flex-col gap-4">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Perfiles</p>
                            <button onClick={() => handleViewClick('abogado')} className="text-lg font-bold text-left text-white">Abogados</button>
                            <button onClick={() => handleViewClick('estudiante')} className="text-lg font-bold text-left text-white">Estudiantes</button>
                            <button onClick={() => handleViewClick('cliente')} className="text-lg font-bold text-left text-white">Clientes</button>
                        </div>

                        <div className="mt-4 border-t border-zinc-900 pt-6 flex flex-col gap-6">
                            <button onClick={() => handleNavigate('TIME_BILLING')} className={`text-xl font-bold text-left ${activeView === 'TIME_BILLING' ? 'text-white' : 'text-zinc-400'}`}>Time Billing</button>
                            <button onClick={() => handleNavigate('APPROVALS')} className={`text-xl font-bold text-left ${activeView === 'APPROVALS' ? 'text-white' : 'text-zinc-400'}`}>Aprobaciones</button>
                            <button onClick={() => handleNavigate('REPORTS')} className={`text-xl font-bold text-left ${activeView === 'REPORTS' ? 'text-white' : 'text-zinc-400'}`}>Reportes</button>
                            <button onClick={() => handleNavigate('CHAT')} className={`text-xl font-bold text-left ${activeView === 'CHAT' ? 'text-white' : 'text-zinc-400'}`}>Chat</button>
                        </div>
                    </div>
                </div>
            )}

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
        </div>
    );
};

export default AdminDashboard;