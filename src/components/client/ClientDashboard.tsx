import React, { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../services/supabaseClient';

// --- Iconos ---
const BellIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>;
const UserIcon = ({ className = "w-5 h-5" }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;
const LockClosedIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-yellow-500 mx-auto mb-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>;
const ChevronLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>;
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>;
const DocumentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 inline-block mr-1"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>;

const scrollbarStyle = "overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-700 transition-colors";

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode; preventClose?: boolean }> = ({ isOpen, onClose, children, preventClose = false }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 font-mono">
            <div className="bg-zinc-950 border border-zinc-800 shadow-2xl w-full max-w-2xl relative overflow-hidden p-8 max-h-[90vh] overflow-y-auto">
                {!preventClose && <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white">X</button>}
                {children}
            </div>
        </div>
    );
};

// ==========================================
// VISTA: MIS CASOS
// ==========================================
const ClientCasesView: React.FC<{ session: Session }> = ({ session }) => {
    const [cases, setCases] = useState<any[]>([]);
    const [activeCaseHistory, setActiveCaseHistory] = useState<any | null>(null);
    const [caseUpdates, setCaseUpdates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCases = async () => {
            setLoading(true);
            const { data } = await supabase.from('cases').select('*').eq('cliente_id', session.user.id).order('created_at', { ascending: false });
            setCases(data || []);
            setLoading(false);
        };
        fetchCases();
    }, [session.user.id]);

    const openCaseHistory = async (caso: any) => {
        setActiveCaseHistory(caso);
        const { data } = await supabase.from('case_updates').select('*').eq('case_id', caso.id).eq('estado_aprobacion', 'aprobado').order('created_at', { ascending: false });
        setCaseUpdates(data || []);
    };

    if (loading) return <div className="text-center p-12 text-zinc-500 animate-pulse font-mono">Cargando tus casos...</div>;

    return (
        <div className="animate-in fade-in duration-500 font-mono w-full max-w-4xl mx-auto">
            <h2 className="text-2xl font-black uppercase tracking-widest mb-8 border-b border-zinc-900 pb-4">Mis Casos</h2>
            {cases.length === 0 ? (
                <div className="p-8 border border-dashed border-zinc-900 text-center text-zinc-600 text-xs tracking-widest uppercase">No tienes casos registrados actualmente.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {cases.map(c => (
                        <div key={c.id} onClick={() => openCaseHistory(c)} className="bg-zinc-950 border border-zinc-800 p-6 hover:border-zinc-500 transition-colors cursor-pointer group relative">
                            <span className={`absolute top-4 right-4 text-[8px] font-black uppercase px-2 py-1 ${c.estado === 'cerrado' ? 'bg-red-950/50 text-red-500' : 'bg-zinc-900 text-zinc-400'}`}>
                                {c.estado}
                            </span>
                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors pr-16">{c.titulo}</h3>
                            <p className="text-xs text-zinc-500 line-clamp-2">{c.descripcion}</p>
                            <p className="text-[10px] text-zinc-600 mt-4 tracking-widest uppercase font-bold">Ver Línea de Tiempo ›</p>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={!!activeCaseHistory} onClose={() => setActiveCaseHistory(null)}>
                {activeCaseHistory && (
                    <div className="flex flex-col">
                        <div className="mb-6 border-b border-zinc-900 pb-4">
                            <h2 className="text-xl font-bold italic tracking-widest uppercase text-white">HISTORIAL: {activeCaseHistory.titulo}</h2>
                            <p className="text-xs text-zinc-500 mt-1">{activeCaseHistory.descripcion}</p>
                        </div>
                        <div className={`space-y-8 ${scrollbarStyle} pr-2`}>
                            {caseUpdates.length === 0 ? (
                                <p className="text-zinc-600 text-sm italic">Aún no hay actualizaciones en este caso.</p>
                            ) : (
                                caseUpdates.map((u) => (
                                    <div key={u.id} className="relative pl-6 border-l border-zinc-800">
                                        <div className="absolute w-2 h-2 rounded-full -left-[5px] top-1.5 ring-4 ring-black bg-white"></div>
                                        <p className="text-[10px] text-zinc-600 font-mono mb-1">{new Date(u.created_at).toLocaleDateString()} • {new Date(u.created_at).toLocaleTimeString()}</p>
                                        <p className="text-sm text-zinc-300 mt-2">{u.descripcion}</p>
                                        {u.file_url && (
                                            <a href={u.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center text-[10px] bg-zinc-900 border border-zinc-800 px-3 py-2 mt-3 text-white hover:bg-zinc-800 uppercase tracking-widest transition-colors">
                                                <DocumentIcon /> Descargar Documento
                                            </a>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

// ==========================================
// VISTA: MÉTODOS DE PAGO
// ==========================================
const ClientPaymentsView: React.FC = () => {
    const banks = [
        { id: 1, name: 'Banco del Pichincha', bg: 'bg-[#facc15]', text: 'text-black', logo: '🏦' },
        { id: 2, name: 'Banco del Pacífico', bg: 'bg-[#0ea5e9]', text: 'text-white', logo: '🌊' },
        { id: 3, name: 'Banco de Guayaquil', bg: 'bg-[#db2777]', text: 'text-white', logo: '🏛️' }
    ];

    return (
        <div className="animate-in fade-in duration-500 font-mono w-full max-w-5xl mx-auto">
            <h2 className="text-2xl font-black uppercase tracking-widest mb-8 border-b border-zinc-900 pb-4 text-center md:text-left">Cuentas Autorizadas</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {banks.map(bank => (
                    <div key={bank.id} className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex flex-col transform hover:scale-105 transition-transform duration-300">
                        <div className={`${bank.bg} ${bank.text} p-6 flex flex-col items-center justify-center text-center h-32`}>
                            <span className="text-4xl mb-2">{bank.logo}</span>
                            <h3 className="font-black uppercase tracking-widest text-sm">{bank.name}</h3>
                        </div>
                        <div className="p-6 bg-black flex-grow flex flex-col justify-center">
                            <div className="mb-4">
                                <p className="text-[10px] text-zinc-600 uppercase tracking-[0.2em] font-bold mb-1">PROPIETARIO</p>
                                <p className="text-sm font-bold text-white uppercase tracking-widest">REGALADO Y REGALADO</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-zinc-600 uppercase tracking-[0.2em] font-bold mb-1">NÚMERO DE CUENTA</p>
                                <p className="text-xl font-mono font-black text-green-400 tracking-[0.2em]">1111111111</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <p className="text-center text-zinc-500 text-xs mt-12 tracking-widest uppercase">Por favor, envíe el comprobante de transferencia mediante el chat o correo electrónico.</p>
        </div>
    );
};

// ==========================================
// VISTA: CHAT INTERNO (CLIENTE)
// ==========================================
const ClientChatView: React.FC<{ session: Session }> = ({ session }) => {
    const [adminProfile, setAdminProfile] = useState<any>(null);
    const [lawyers, setLawyers] = useState<any[]>([]);
    const [clientCases, setClientCases] = useState<any[]>([]);
    const [assignments, setAssignments] = useState<any[]>([]);

    const [selectedContact, setSelectedContact] = useState<any>(null);
    const [chatStep, setChatStep] = useState<'status' | 'case' | 'chat'>('status');
    const [selectedStatus, setSelectedStatus] = useState<'abierto' | 'cerrado' | null>(null);
    const [selectedCase, setSelectedCase] = useState<any>(null);
    
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<any[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const fetchChatData = async () => {
            const { data: admin } = await supabase.from('profiles').select('*').eq('rol', 'admin').limit(1).single();
            if (admin) setAdminProfile(admin);

            const { data: cases } = await supabase.from('cases').select('*').eq('cliente_id', session.user.id);
            setClientCases(cases || []);

            if (cases && cases.length > 0) {
                const caseIds = cases.map(c => c.id);
                const { data: asgs } = await supabase.from('asignaciones_casos').select('*').in('case_id', caseIds);
                setAssignments(asgs || []);

                if (asgs && asgs.length > 0) {
                    const lawyerIds = [...new Set(asgs.map(a => a.abogado_id))];
                    const { data: lawyersData } = await supabase.from('profiles').select('*').in('id', lawyerIds);
                    setLawyers(lawyersData || []);
                }
            }
        };
        fetchChatData();
    }, [session.user.id]);

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
        const { error } = await supabase.from('chat_messages').insert([{
            sender_id: session.user.id, receiver_id: selectedContact.id, case_id: selectedCase ? selectedCase.id : null, message: msgText
        }]);
        if (error) alert("Error al enviar mensaje");
    };

    const handleContactClick = (contact: any) => { setSelectedContact(contact); setChatStep('status'); setSelectedStatus(null); setSelectedCase(null); };
    const handleStatusClick = (status: 'abierto' | 'cerrado') => { setSelectedStatus(status); setChatStep('case'); };
    const handleCaseClick = (caso: any) => { setSelectedCase(caso); setChatStep('chat'); };

    const filteredCases = clientCases.filter(c => {
        if (c.estado !== selectedStatus) return false;
        if (selectedContact?.rol !== 'admin') {
            const isAssigned = assignments.some(a => a.case_id === c.id && a.abogado_id === selectedContact.id);
            if (!isAssigned) return false;
        }
        return true;
    });

    return (
        <div className="animate-in fade-in duration-500 font-mono w-full max-w-6xl mx-auto h-[75vh] flex flex-col md:flex-row border border-zinc-800 bg-black">
            <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col bg-zinc-950">
                <div className="p-4 border-b border-zinc-800"><h2 className="text-sm font-black uppercase tracking-widest text-zinc-400">Canales de Chat</h2></div>
                <div className="flex-grow overflow-y-auto">
                    {adminProfile && (
                        <button onClick={() => handleContactClick(adminProfile)} className={`w-full text-left p-4 border-b border-zinc-800/50 flex items-center gap-4 transition-colors ${selectedContact?.id === adminProfile.id ? 'bg-zinc-900 border-l-2 border-l-white' : 'hover:bg-zinc-900 border-l-2 border-l-transparent'}`}>
                            <div className="w-12 h-12 rounded-full border border-zinc-700 overflow-hidden flex-shrink-0 bg-black">
                                {adminProfile.foto_url ? <img src={adminProfile.foto_url} className="w-full h-full object-cover" /> : <UserIcon className="w-6 h-6 m-auto mt-3 text-zinc-500"/>}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white uppercase tracking-widest">{adminProfile.primer_nombre} {adminProfile.primer_apellido}</p>
                                <p className="text-[9px] text-blue-400 uppercase tracking-widest mt-1">Administración</p>
                            </div>
                        </button>
                    )}
                    {lawyers.map(lw => (
                        <button key={lw.id} onClick={() => handleContactClick(lw)} className={`w-full text-left p-4 border-b border-zinc-800/50 flex items-center gap-4 transition-colors ${selectedContact?.id === lw.id ? 'bg-zinc-900 border-l-2 border-l-white' : 'hover:bg-zinc-900 border-l-2 border-l-transparent'}`}>
                            <div className="w-12 h-12 rounded-full border border-zinc-700 overflow-hidden flex-shrink-0 bg-black">
                                {lw.foto_url ? <img src={lw.foto_url} className="w-full h-full object-cover" /> : <UserIcon className="w-6 h-6 m-auto mt-3 text-zinc-500"/>}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white uppercase tracking-widest">{lw.primer_nombre} {lw.primer_apellido}</p>
                                <p className="text-[9px] text-green-400 uppercase tracking-widest mt-1">Abogado Asignado</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-grow flex flex-col bg-[#050505] relative">
                {!selectedContact ? (
                    <div className="flex-grow flex items-center justify-center p-8 text-center"><p className="text-zinc-500 uppercase tracking-widest text-sm font-bold">Selecciona un contacto para iniciar</p></div>
                ) : (
                    <>
                        <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full border border-zinc-700 overflow-hidden flex-shrink-0 bg-black">
                                {selectedContact.foto_url ? <img src={selectedContact.foto_url} className="w-full h-full object-cover" /> : <UserIcon className="w-4 h-4 m-auto mt-2 text-zinc-500"/>}
                            </div>
                            <div>
                                <h3 className="font-bold uppercase tracking-widest text-sm text-white">{selectedContact.primer_nombre} {selectedContact.primer_apellido}</h3>
                                <p className="text-[8px] text-zinc-500 uppercase tracking-widest">{selectedContact.rol === 'admin' ? 'Administración' : 'Abogado'}</p>
                            </div>
                        </div>

                        <div className={`flex-grow p-8 flex flex-col ${chatStep === 'chat' ? '' : 'justify-center'} overflow-y-auto ${scrollbarStyle}`}>
                            {chatStep === 'status' && (
                                <div className="animate-in fade-in zoom-in duration-300 w-full max-w-md mx-auto text-center">
                                    <p className="text-zinc-400 mb-8 uppercase tracking-widest text-sm font-bold">Selecciona el caso del cual quieres tener información</p>
                                    <div className="flex flex-col gap-4">
                                        <button onClick={() => handleStatusClick('abierto')} className="bg-zinc-900 border border-zinc-800 hover:border-zinc-500 text-white font-black uppercase tracking-widest py-6 px-4 transition-colors">Casos Abiertos</button>
                                        <button onClick={() => handleStatusClick('cerrado')} className="bg-zinc-950 border border-zinc-900 hover:border-zinc-700 text-zinc-400 hover:text-white font-black uppercase tracking-widest py-6 px-4 transition-colors">Casos Cerrados</button>
                                    </div>
                                </div>
                            )}

                            {chatStep === 'case' && (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-300 w-full max-w-lg mx-auto">
                                    <button onClick={() => setChatStep('status')} className="text-zinc-500 hover:text-white text-[10px] uppercase tracking-widest mb-6 flex items-center gap-2">‹ Volver</button>
                                    <p className="text-zinc-400 mb-6 uppercase tracking-widest text-sm font-bold">Selecciona el caso específico:</p>
                                    {filteredCases.length === 0 ? (
                                        <p className="text-center text-zinc-600 italic border border-dashed border-zinc-800 p-8">No hay casos {selectedStatus}s vinculados.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {filteredCases.map(c => (
                                                <button key={c.id} onClick={() => handleCaseClick(c)} className="w-full text-left bg-zinc-900 border border-zinc-800 hover:border-white p-4 transition-colors group">
                                                    <h4 className="font-bold text-white uppercase tracking-widest flex justify-between">{c.titulo} <span className="opacity-0 group-hover:opacity-100 transition-opacity">›</span></h4>
                                                    <p className="text-xs text-zinc-500 line-clamp-1 mt-2">{c.descripcion}</p>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {chatStep === 'chat' && (
                                <div className="animate-in fade-in duration-300 flex flex-col w-full min-h-full gap-4">
                                    <div className="text-center my-4"><span className="bg-zinc-900 border border-zinc-800 text-zinc-400 text-[9px] uppercase tracking-widest px-4 py-2 rounded-full">Chat sobre caso: {selectedCase?.titulo}</span></div>
                                    
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
// VISTA: MI PERFIL FINANCIERO
// ==========================================
const ClientProfileView: React.FC<{ session: Session, profile: any }> = ({ session, profile }) => {
    const [cases, setCases] = useState<any[]>([]);
    const [timeEntries, setTimeEntries] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showRecords, setShowRecords] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const { data: myCases } = await supabase.from('cases').select('*').eq('cliente_id', session.user.id).order('created_at', { ascending: false });
            
            if (myCases && myCases.length > 0) {
                setCases(myCases);
                const caseIds = myCases.map(c => c.id);
                
                const { data: times } = await supabase.from('time_entries').select('*').in('caso_id', caseIds).order('fecha_tarea', { ascending: false });
                setTimeEntries(times || []);

                const { data: exps } = await supabase.from('gastos').select('*').in('caso_id', caseIds);
                setExpenses(exps || []);
            }
            setLoading(false);
        };
        fetchData();
    }, [session.user.id]);

    const handlePrevCase = () => setCurrentCaseIndex(prev => (prev > 0 ? prev - 1 : cases.length - 1));
    const handleNextCase = () => setCurrentCaseIndex(prev => (prev < cases.length - 1 ? prev + 1 : 0));

    if (loading) return <div className="text-center p-12 text-zinc-500 animate-pulse font-mono">Calculando estado de cuenta...</div>;

    const currentCase = cases[currentCaseIndex];
    const caseTimes = currentCase ? timeEntries.filter(t => t.caso_id === currentCase.id) : [];
    const caseExps = currentCase ? expenses.filter(e => e.caso_id === currentCase.id) : [];

    const totalHours = caseTimes.reduce((acc, t) => acc + (t.horas || 0), 0);
    const totalBilling = caseTimes.reduce((acc, t) => acc + ((t.horas || 0) * (t.tarifa_personalizada || 0)), 0);
    const totalExpenses = caseExps.reduce((acc, e) => acc + (e.monto || 0), 0);
    const totalToPay = totalBilling + totalExpenses;

    return (
        <div className="max-w-5xl mx-auto animate-in fade-in duration-500 font-mono text-white w-full">
            <header className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-900">
                <h1 className="text-3xl font-black uppercase tracking-tighter italic">Mi Perfil</h1>
            </header>

            {profile && (
                <div className="bg-zinc-950 border border-zinc-900 p-8 flex flex-col md:flex-row items-center gap-8 mb-8 shadow-2xl shadow-black relative overflow-hidden">
                    <img src={profile.foto_url || 'https://via.placeholder.com/150'} alt="Perfil" className="w-32 h-32 rounded-full border-4 border-zinc-800 object-cover z-10"/>
                    <div className="text-center md:text-left z-10">
                        <h2 className="text-3xl font-black uppercase tracking-widest">{profile.primer_nombre} {profile.primer_apellido}</h2>
                        <p className="text-zinc-500 uppercase tracking-widest mt-1 text-sm">Cliente</p>
                        <div className="mt-4 flex flex-col gap-1 text-xs text-zinc-400 font-mono">
                            <p>EMAIL: <span className="text-white">{profile.email}</span></p>
                            <p>CÉDULA: <span className="text-white">{profile.cedula || 'No registrada'}</span></p>
                        </div>
                    </div>
                </div>
            )}

            {cases.length === 0 ? (
                <div className="p-8 border border-dashed border-zinc-800 text-center animate-in fade-in duration-500 text-white font-mono h-full flex flex-col items-center justify-center">
                    <h2 className="text-3xl font-black uppercase tracking-widest mb-4">Estado Financiero</h2>
                    <p className="text-zinc-500 text-sm tracking-widest uppercase">Próximamente disponible</p>
                </div>
            ) : (
                <div className="bg-black border border-zinc-800 shadow-2xl shadow-black/50 p-8">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-6 mb-8">
                        {cases.length > 1 ? (
                            <button onClick={handlePrevCase} className="p-2 text-zinc-500 hover:text-white transition-colors bg-zinc-950 border border-zinc-900 rounded-full"><ChevronLeftIcon /></button>
                        ) : <div className="w-10"></div>}
                        
                        <div className="text-center px-4">
                            <p className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.3em] mb-1">Estado de Cuenta</p>
                            <h3 className="text-xl font-bold tracking-widest text-white uppercase">{currentCase.titulo}</h3>
                            {currentCase.estado === 'cerrado' && <span className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-1 block">Caso Cerrado</span>}
                        </div>

                        {cases.length > 1 ? (
                            <button onClick={handleNextCase} className="p-2 text-zinc-500 hover:text-white transition-colors bg-zinc-950 border border-zinc-900 rounded-full"><ChevronRightIcon /></button>
                        ) : <div className="w-10"></div>}
                    </div>

                    <div className="bg-zinc-950 border border-zinc-900 p-8 mb-8">
                        <div className="flex justify-between items-center mb-6 border-b border-zinc-900 pb-6">
                            <p className="text-zinc-400 uppercase tracking-widest text-sm font-bold">Total de Horas Trabajadas</p>
                            <p className="text-white font-mono font-bold text-lg">{totalHours.toFixed(2)} hrs</p>
                        </div>
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-zinc-500 uppercase tracking-widest text-xs font-bold">Honorarios (Time Billing)</p>
                            <p className="text-zinc-300 font-mono font-bold">${totalBilling.toFixed(2)}</p>
                        </div>
                        <div className="flex justify-between items-center mb-6">
                            <p className="text-zinc-500 uppercase tracking-widest text-xs font-bold">Gastos Reembolsables</p>
                            <p className="text-zinc-300 font-mono font-bold">${totalExpenses.toFixed(2)}</p>
                        </div>
                        <div className="border-t-2 border-dashed border-zinc-800 pt-8 mt-2 flex justify-between items-end">
                            <div>
                                <p className="text-white uppercase tracking-[0.3em] text-sm font-black">TOTAL A PAGAR</p>
                                <p className="text-[9px] text-zinc-500 tracking-widest mt-1 uppercase font-bold">Valor acumulado a la fecha</p>
                            </div>
                            <p className="text-green-500 font-black text-4xl tracking-wider">${totalToPay.toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button onClick={() => setShowRecords(!showRecords)} className="bg-white text-black font-bold py-3 px-8 text-[10px] tracking-[0.2em] uppercase hover:bg-zinc-300 transition-colors shadow-lg shadow-black/50">
                            {showRecords ? 'OCULTAR REGISTROS' : 'VER REGISTRO DE TAREAS'}
                        </button>
                    </div>

                    {showRecords && (
                        <div className="mt-8 animate-in fade-in slide-in-from-top-4 duration-500 border-t border-zinc-900 pt-8">
                            <p className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.3em] mb-4">REGISTRO DE ACTIVIDADES</p>
                            <div className="space-y-2">
                                {caseTimes.length === 0 ? (
                                    <p className="text-zinc-600 italic text-sm text-center py-8 border border-dashed border-zinc-900">No hay tareas registradas.</p>
                                ) : (
                                    caseTimes.map((te) => {
                                        const totalCobrar = (te.horas || 0) * (te.tarifa_personalizada || 0);
                                        return (
                                            <div key={te.id} className="bg-zinc-950 border border-zinc-900 p-4 flex flex-col gap-3">
                                                <div className="flex justify-between items-start border-b border-zinc-900 pb-2">
                                                    <p className="text-zinc-500 font-mono text-[10px]">{te.fecha_tarea}</p>
                                                    <p className="text-green-500 font-black font-mono text-sm tracking-wider">${totalCobrar.toFixed(2)}</p>
                                                </div>
                                                <p className="text-zinc-300 text-sm">{te.descripcion_tarea}</p>
                                                <div className="flex gap-6 mt-2 pt-2 border-t border-zinc-900/50">
                                                    <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest">TIEMPO: <span className="text-white font-bold">{te.horas} hrs</span></p>
                                                    <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest">TARIFA: <span className="text-white font-bold">${te.tarifa_personalizada || 0}/hr</span></p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ==========================================
// COMPONENTE PRINCIPAL (DASHBOARD)
// ==========================================
const ClientDashboard: React.FC<{ session: Session }> = ({ session }) => {
    
    const [activeView, setActiveView] = useState('HOME');
    const [clientProfile, setClientProfile] = useState<any>(null);
    
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);

    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passLoading, setPassLoading] = useState(false);

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
                setClientProfile(profile);
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
            case 'CASES': return <ClientCasesView session={session} />;
            case 'PAYMENTS': return <ClientPaymentsView />;
            case 'CHAT': return <ClientChatView session={session} />;
            case 'PROFILE': return <ClientProfileView session={session} profile={clientProfile} />;
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
                                            <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-black">Actualizaciones de Casos</p>
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
                        
                        <div className="relative">
                            <button onClick={() => { closeAllMenus(); setProfileMenuOpen(!profileMenuOpen); }} className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all overflow-hidden bg-zinc-900 ${profileMenuOpen ? 'border-white' : 'border-zinc-700 hover:border-white'}`}>
                                {clientProfile?.foto_url ? <img src={clientProfile.foto_url} alt="Perfil" className="w-full h-full object-cover" /> : <UserIcon className="w-6 h-6 text-zinc-400 pointer-events-none" />}
                            </button>

                            {profileMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={closeAllMenus}></div>
                                    <div className="absolute right-0 mt-6 w-56 bg-black/40 backdrop-blur-3xl border border-white/10 shadow-2xl shadow-black rounded-2xl py-2 z-50 animate-in fade-in slide-in-from-top-3 duration-300 overflow-hidden font-mono">
                                        <div className="p-5 border-b border-white/5">
                                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 font-black">Hola,</p>
                                            <p className="text-sm font-bold text-white truncate">{clientProfile?.primer_nombre || session.user.email}</p>
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
                            <button onClick={() => handleMenuClick('PROFILE')} className={`text-2xl font-bold text-left ${activeView === 'PROFILE' ? 'text-white' : 'text-zinc-400'}`}>Mi Perfil</button>
                        </div>
                    </div>
                )}

                <main className="flex-grow flex flex-col relative z-10">
                    {activeView === 'HOME' ? (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center font-bold text-5xl md:text-7xl relative w-full flex items-center justify-center font-serif tracking-widest animate-in fade-in duration-1000 slide-in-from-bottom-8">
                                <h1 className="text-white drop-shadow-2xl px-4">
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

                <Modal isOpen={showPasswordModal} preventClose={true}>
                    <form onSubmit={handleUpdatePassword} className="bg-black w-full max-w-md mx-auto p-10 font-serif border border-zinc-800 shadow-2xl shadow-black">
                        <LockClosedIcon />
                        <h2 className="text-sm font-bold tracking-[0.3em] uppercase text-zinc-400 mb-8 text-center">
                            Contraseña Maestra
                        </h2>
                        
                        <input 
                            type="password" 
                            required 
                            value={newPassword} 
                            onChange={e => setNewPassword(e.target.value)} 
                            className="w-full bg-transparent border-b-2 border-zinc-700 text-white pb-2 focus:outline-none focus:border-zinc-300 transition-colors mb-6 font-sans text-lg tracking-wider" 
                            placeholder="Nueva contraseña..."
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
                            placeholder="Repita la contraseña..."
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