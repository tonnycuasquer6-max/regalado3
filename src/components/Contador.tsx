import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../services/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import ReportsView from './admin/ReportsView';
import ListaPerfiles from './admin/ListaPerfiles';

// --- HOOK DE MEMORIA CACHÉ ---
function useSessionState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = useState<T>(() => {
        try {
            const item = sessionStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            return initialValue;
        }
    });
    useEffect(() => {
        sessionStorage.setItem(key, JSON.stringify(state));
    }, [key, state]);
    return [state, setState];
}

// --- Iconos ---
const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>;
const UserIcon = ({ className = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
const DocumentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 inline-block mr-1"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;
const XMarkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>;
const PaperClipIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 pointer-events-none"><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" /></svg>;

const scrollbarStyle = "overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-700 transition-colors";

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode; preventClose?: boolean }> = ({ isOpen, onClose, children, preventClose = false }) => {
    if (!isOpen) return null;
    return createPortal(
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9999999] flex items-center justify-center p-4 font-mono">
            <div className="bg-black border border-zinc-800 shadow-2xl w-full max-w-2xl relative overflow-hidden p-8 max-h-[90vh] overflow-y-auto rounded-2xl animate-in zoom-in duration-300">
                {!preventClose && <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white">X</button>}
                {children}
            </div>
        </div>,
        document.body
    );
};

// --- VISTA CHAT CONTADORA ---
const ContadorChatView: React.FC<{ session: Session }> = ({ session }) => {
    const [contacts, setContacts] = useState<any[]>([]);
    const [selectedContact, setSelectedContact] = useSessionState<any>('c_chat_contact', null);
    const [message, useMessage] = useSessionState('c_chat_msg', '');
    const [messages, setMessages] = useState<any[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };

    useEffect(() => {
        const fetchChatData = async () => {
            const { data } = await supabase.from('profiles').select('*').neq('id', session.user.id).in('categoria_usuario', ['administrador', 'abogado', 'estudiante', 'asociado', 'cliente']);
            if (data) setContacts(data.filter(p => p.estado_aprobacion === 'aprobado'));
        };
        fetchChatData();
    }, [session.user.id]);

    const fetchMessages = useCallback(async () => {
        if (!selectedContact) return;
        const { data } = await supabase.from('chat_messages')
            .select('*')
            .or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${selectedContact.id}),and(sender_id.eq.${selectedContact.id},receiver_id.eq.${session.user.id})`)
            .is('case_id', null)
            .order('created_at', { ascending: true });
        if (data) { setMessages(data); scrollToBottom(); }
    }, [selectedContact, session.user.id]);

    useEffect(() => {
        fetchMessages();
        if (selectedContact) {
            const channel = supabase.channel('chat_updates_contador').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, payload => {
                const newMsg = payload.new;
                const isCurrentChat = (newMsg.sender_id === session.user.id && newMsg.receiver_id === selectedContact.id) || (newMsg.sender_id === selectedContact.id && newMsg.receiver_id === session.user.id);
                if (isCurrentChat && newMsg.case_id === null) { setMessages(prev => [...prev, newMsg]); scrollToBottom(); }
            }).subscribe();
            return () => { supabase.removeChannel(channel); };
        }
    }, [fetchMessages, selectedContact, session.user.id]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !selectedContact) return;
        const msgText = message.trim();
        useMessage('');
        await supabase.from('chat_messages').insert([{ sender_id: session.user.id, receiver_id: selectedContact.id, case_id: null, message: msgText }]);
    };

    return (
        <div className="animate-in fade-in duration-500 font-mono w-full max-w-6xl mx-auto h-[75vh] flex flex-col md:flex-row border border-zinc-800 bg-black rounded-2xl overflow-hidden shadow-2xl">
            <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col bg-zinc-950">
                <div className="p-4 border-b border-zinc-800"><h2 className="text-sm font-black uppercase tracking-widest text-zinc-300">Contactos</h2></div>
                <div className={`flex-grow overflow-y-auto ${scrollbarStyle}`}>
                    {contacts.map(user => (
                        <button key={user.id} onClick={() => setSelectedContact(user)} className={`w-full text-left p-4 border-b border-zinc-900/50 flex items-center gap-4 transition-colors ${selectedContact?.id === user.id ? 'bg-zinc-800 border-l-2 border-white' : 'hover:bg-zinc-900 border-l-2 border-transparent'}`}>
                            <div className="w-12 h-12 rounded-full border border-zinc-700 overflow-hidden flex-shrink-0 bg-black">
                                {user.foto_url ? <img src={user.foto_url} alt="Avatar" className="w-full h-full object-cover" /> : <UserIcon className="w-6 h-6 m-auto mt-3 text-zinc-500"/>}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white uppercase tracking-widest">{user.primer_nombre} {user.primer_apellido}</p>
                                <p className="text-[9px] text-blue-400 uppercase tracking-widest mt-1">{user.rol}</p>
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
                                {selectedContact.foto_url ? <img src={selectedContact.foto_url} alt="Avatar" className="w-full h-full object-cover" /> : <UserIcon className="w-4 h-4 m-auto mt-2 text-zinc-500"/>}
                            </div>
                            <div>
                                <h3 className="font-bold uppercase tracking-widest text-sm text-white">{selectedContact.primer_nombre} {selectedContact.primer_apellido}</h3>
                                <p className="text-[8px] text-zinc-400 uppercase tracking-widest">{selectedContact.rol}</p>
                            </div>
                        </div>

                        <div className={`flex-grow p-8 flex flex-col overflow-y-auto ${scrollbarStyle}`}>
                            <div className="animate-in fade-in duration-300 flex flex-col w-full min-h-full gap-4">
                                {messages.length === 0 ? (
                                    <p className="text-zinc-500 text-xs italic text-center my-auto bg-black/40 backdrop-blur-md py-4 px-6 rounded-xl border border-zinc-800 w-fit mx-auto">Envía el primer mensaje para iniciar la conversación.</p>
                                ) : (
                                    messages.map(msg => {
                                        const isMe = msg.sender_id === session.user.id;
                                        return (
                                            <div key={msg.id} className={`flex flex-col gap-1 max-w-[80%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                                                <div className={`p-3 rounded-2xl shadow-lg ${isMe ? 'bg-blue-600/80 border border-blue-500/50 rounded-tr-none text-white' : 'bg-zinc-900 border border-zinc-800 rounded-tl-none text-zinc-200'}`}>
                                                    <p className="text-sm">{msg.message}</p>
                                                </div>
                                                <p className="text-[8px] text-zinc-500 font-mono">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                            </div>
                                        )
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-800 bg-black/60 backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-300">
                            <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 p-2 rounded-full pr-4 focus-within:border-zinc-500 transition-colors shadow-inner">
                                <input type="text" value={message} onChange={e => useMessage(e.target.value)} placeholder="Escribe un mensaje..." className="flex-grow bg-transparent text-white text-sm focus:outline-none px-4 py-2" />
                                <button type="submit" disabled={!message.trim()} className="text-white hover:text-blue-400 transition-colors p-2 bg-zinc-900 hover:bg-zinc-800 rounded-full disabled:opacity-50"><SendIcon /></button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

// --- COMPONENTE CENTRAL DE PAGOS ---
const RevisionPagosView: React.FC = () => {
    const [combinedItems, setCombinedItems] = useState<any[]>([]);
    
    // Modales de Acción
    const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; id: string; isWorker: boolean }>({ isOpen: false, id: '', isWorker: false });
    const [motivoRechazo, setMotivoRechazo] = useState('');
    const [approveWorkerModal, setApproveWorkerModal] = useState<{ isOpen: boolean; id: string }>({ isOpen: false, id: '' });
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [actionLoading, setActionLoading] = useState(false);

    const fetchAllData = async () => {
        // 1. Traer Pagos de Clientes
        const { data: pagosData } = await supabase.from('pagos').select('*, perfiles:profiles!cliente_id(primer_nombre, primer_apellido), casos:cases!caso_id(titulo)');
        
        // 2. Traer Time Billing marcado como 'cobrado' por trabajadores
        const { data: timeData } = await supabase.from('time_entries').select('*, perfil:profiles!perfil_id(primer_nombre, primer_apellido), caso:cases!caso_id(titulo)').eq('estado', 'cobrado');

        let merged: any[] = [];
        if (pagosData) merged = [...merged, ...pagosData.map(p => ({ ...p, _type: 'cliente' }))];
        if (timeData) merged = [...merged, ...timeData.map(t => ({ ...t, _type: 'trabajador' }))];

        merged.sort((a, b) => new Date(b.created_at || b.fecha_tarea).getTime() - new Date(a.created_at || a.fecha_tarea).getTime());
        setCombinedItems(merged);
    };

    useEffect(() => { fetchAllData(); }, []);

    // Acción Cliente
    const handleApproveClientPago = async (id: string) => {
        setActionLoading(true);
        await supabase.from('pagos').update({ estado: 'aprobado', motivo_rechazo: null }).eq('id', id);
        fetchAllData();
        setActionLoading(false);
    };

    // Acción Rechazo General
    const executeReject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rejectModal.id || !motivoRechazo.trim()) return;
        setActionLoading(true);
        if (rejectModal.isWorker) {
            await supabase.from('time_entries').update({ estado_pago_contador: 'rechazado', comentario_contador: motivoRechazo }).eq('id', rejectModal.id);
        } else {
            await supabase.from('pagos').update({ estado: 'rechazado', motivo_rechazo: motivoRechazo }).eq('id', rejectModal.id);
        }
        setRejectModal({ isOpen: false, id: '', isWorker: false });
        setMotivoRechazo('');
        fetchAllData();
        setActionLoading(false);
    };

    // Acción Aprobar Trabajador (Requiere Foto)
    const executeApproveWorker = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!approveWorkerModal.id || !uploadFile) return;
        setActionLoading(true);

        let fileUrl = null;
        const fileName = `pago_trabajador_${Date.now()}_${uploadFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
        const { error: uploadError } = await supabase.storage.from('comprobantes').upload(fileName, uploadFile);
        if (!uploadError) {
            const { data } = supabase.storage.from('comprobantes').getPublicUrl(fileName);
            fileUrl = data.publicUrl;
        }

        await supabase.from('time_entries').update({ estado_pago_contador: 'aprobado', comprobante_contador_url: fileUrl, comentario_contador: null }).eq('id', approveWorkerModal.id);
        
        setApproveWorkerModal({ isOpen: false, id: '' });
        setUploadFile(null);
        fetchAllData();
        setActionLoading(false);
    };

    return (
        <div className="max-w-5xl mx-auto animate-in fade-in duration-500 font-mono text-white pb-12 w-full">
            <header className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-900">
                <h1 className="text-3xl font-black uppercase tracking-tighter italic">Revisión de Pagos</h1>
                <button onClick={fetchAllData} className="text-zinc-500 hover:text-white transition-colors text-[10px] uppercase font-bold tracking-widest flex items-center gap-2">Refrescar</button>
            </header>

            <div className="space-y-6">
                {combinedItems.length === 0 ? (
                    <p className="text-zinc-500 text-center py-10">No hay movimientos financieros para revisar.</p>
                ) : (
                    combinedItems.map((item) => {
                        const isWorker = item._type === 'trabajador';
                        const dateStr = isWorker ? item.fecha_tarea : new Date(item.created_at).toLocaleDateString();
                        const amount = isWorker ? ((item.horas || 0) * (item.tarifa_personalizada || 0)) : item.monto;
                        const status = isWorker ? (item.estado_pago_contador || 'pendiente') : (item.estado || 'pendiente');
                        
                        const isApproved = status === 'aprobado';
                        const isRejected = status === 'rechazado';
                        const borderColor = isApproved ? 'border-green-900/50' : isRejected ? 'border-red-900/50' : 'border-yellow-900/50';

                        return (
                            <div key={`${item._type}-${item.id}`} className={`bg-zinc-950 border ${borderColor} rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between gap-6 items-start md:items-center transition-colors relative overflow-hidden`}>
                                <div className={`absolute top-0 left-0 w-2 h-full ${isApproved ? 'bg-green-500' : isRejected ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                                
                                <div className="flex-grow pl-4 w-full">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className={`px-3 py-1 text-[9px] font-black tracking-widest uppercase rounded ${isWorker ? 'bg-purple-900/30 text-purple-400 border border-purple-900/50' : 'bg-blue-900/30 text-blue-400 border border-blue-900/50'}`}>
                                            {isWorker ? 'Cobro de Trabajador' : 'Pago de Cliente'}
                                        </span>
                                        <span className="text-zinc-500 font-mono text-[10px]">{dateStr}</span>
                                    </div>
                                    <h3 className="text-white font-bold text-lg uppercase tracking-wider mb-1">
                                        {isWorker ? `${item.perfil?.primer_nombre} ${item.perfil?.primer_apellido}` : `${item.perfiles?.primer_nombre} ${item.perfiles?.primer_apellido}`}
                                    </h3>
                                    <p className="text-zinc-400 text-xs mb-2">CASO: {isWorker ? item.caso?.titulo : item.casos?.titulo}</p>
                                    <p className="text-zinc-500 text-xs">{item.descripcion || item.descripcion_tarea}</p>
                                    
                                    {!isWorker && item.comprobante_url && (
                                        <a href={item.comprobante_url} target="_blank" rel="noreferrer" className="inline-flex items-center text-[10px] bg-black/50 border border-zinc-800 px-3 py-1.5 mt-3 text-blue-400 hover:text-white uppercase tracking-widest transition-colors rounded-lg">
                                            <DocumentIcon /> Ver Recibo del Cliente
                                        </a>
                                    )}
                                    {isWorker && item.comprobante_contador_url && (
                                        <a href={item.comprobante_contador_url} target="_blank" rel="noreferrer" className="inline-flex items-center text-[10px] bg-black/50 border border-zinc-800 px-3 py-1.5 mt-3 text-green-400 hover:text-white uppercase tracking-widest transition-colors rounded-lg">
                                            <DocumentIcon /> Ver Comprobante Subido
                                        </a>
                                    )}

                                    {isRejected && (item.motivo_rechazo || item.comentario_contador) && (
                                        <div className="mt-3 bg-red-950/30 border border-red-900 p-3 text-xs text-red-400 rounded-lg w-fit">
                                            <strong className="uppercase text-[10px] tracking-widest block mb-1">Motivo de Rechazo:</strong>{item.motivo_rechazo || item.comentario_contador}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex flex-col items-start md:items-end flex-shrink-0 w-full md:w-auto border-t md:border-t-0 border-zinc-900 pt-4 md:pt-0">
                                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded mb-2 ${isApproved ? 'bg-green-900/50 text-green-400' : isRejected ? 'bg-red-900/50 text-red-400' : 'bg-yellow-900/50 text-yellow-400'}`}>
                                        {status}
                                    </span>
                                    <p className="text-3xl font-black text-white font-mono tracking-widest mb-4">${amount?.toFixed(2)}</p>
                                    
                                    {status === 'pendiente' && (
                                        <div className="flex gap-2 w-full">
                                            <button onClick={() => { if (isWorker) { setApproveWorkerModal({ isOpen: true, id: item.id }); } else { handleApproveClientPago(item.id); } }} disabled={actionLoading} className="flex-1 bg-green-600/80 hover:bg-green-500 text-white text-[10px] font-bold py-2 px-6 rounded-lg transition-colors uppercase tracking-widest shadow-lg shadow-green-500/20">
                                                Aprobar
                                            </button>
                                            <button onClick={() => setRejectModal({ isOpen: true, id: item.id, isWorker })} disabled={actionLoading} className="flex-1 bg-red-600/80 hover:bg-red-500 text-white text-[10px] font-bold py-2 px-6 rounded-lg transition-colors uppercase tracking-widest shadow-lg shadow-red-500/20">
                                                Rechazar
                                            </button>
                                        </div>
                                    )}
                                    {status !== 'pendiente' && (
                                        <button onClick={async () => {
                                            setActionLoading(true);
                                            if (isWorker) await supabase.from('time_entries').update({ estado_pago_contador: 'pendiente' }).eq('id', item.id);
                                            else await supabase.from('pagos').update({ estado: 'pendiente' }).eq('id', item.id);
                                            fetchAllData();
                                            setActionLoading(false);
                                        }} disabled={actionLoading} className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-[10px] font-bold py-2 px-4 rounded-lg transition-colors uppercase tracking-widest">
                                            Revertir a Pendiente
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* MODALES DE ACCIÓN CONTADORA */}
            <Modal isOpen={rejectModal.isOpen} onClose={() => { setRejectModal({ isOpen: false, id: '', isWorker: false }); setMotivoRechazo(''); }}>
                <form onSubmit={executeReject} className="p-8 w-full">
                    <h2 className="text-xl font-bold mb-6 italic tracking-widest uppercase text-red-500">Rechazar Movimiento</h2>
                    <p className="text-zinc-400 text-xs mb-4">Ingresa el motivo. El usuario verá este mensaje en su portal.</p>
                    <input type="text" value={motivoRechazo} onChange={(e) => setMotivoRechazo(e.target.value)} required className="w-full py-3 px-4 bg-black border-2 border-zinc-800 rounded-xl text-white focus:outline-none focus:border-red-500 transition-colors mb-6" placeholder="Ej: La transferencia rebotó..." />
                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={() => { setRejectModal({ isOpen: false, id: '', isWorker: false }); setMotivoRechazo(''); }} className="py-2 px-6 text-zinc-400 hover:text-white transition-colors font-bold uppercase text-[10px] tracking-widest border border-zinc-800 rounded-xl">Cancelar</button>
                        <button type="submit" disabled={!motivoRechazo.trim() || actionLoading} className="bg-red-600/80 hover:bg-red-500 rounded-xl shadow-lg text-white font-bold py-2 px-6 transition-colors uppercase tracking-widest text-[10px] disabled:opacity-50">Rechazar</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={approveWorkerModal.isOpen} onClose={() => { setApproveWorkerModal({ isOpen: false, id: '' }); setUploadFile(null); }}>
                <form onSubmit={executeApproveWorker} className="p-8 flex flex-col gap-6 w-full">
                    <h2 className="text-xl font-bold uppercase tracking-widest text-green-500 italic">Confirmar Pago a Trabajador</h2>
                    <p className="text-zinc-400 text-xs">Sube el comprobante de transferencia bancaria para verificar el pago de esta tarea.</p>
                    
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-800 rounded-xl bg-black hover:bg-zinc-900 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf" required onChange={(e: any) => setUploadFile(e.target.files ? e.target.files[0] : null)} />
                        <PaperClipIcon />
                        <span className="mt-4 text-xs font-bold tracking-widest uppercase text-zinc-500">{uploadFile ? uploadFile.name : 'SELECCIONAR RECIBO'}</span>
                    </div>

                    <div className="flex justify-end gap-4 mt-4 border-t border-zinc-800 pt-6">
                        <button type="button" onClick={() => { setApproveWorkerModal({ isOpen: false, id: '' }); setUploadFile(null); }} className="py-2 px-6 text-zinc-400 hover:text-white font-bold uppercase text-[10px] tracking-widest border border-zinc-800 rounded-xl">Cancelar</button>
                        <button type="submit" disabled={!uploadFile || actionLoading} className="bg-green-600/80 hover:bg-green-500 text-white font-bold uppercase text-[10px] tracking-widest px-6 py-2 rounded-xl transition-colors shadow-lg disabled:opacity-50">Confirmar Pago</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

// --- MAIN CONTADORA COMPONENT ---
const ContadorDashboard = () => {
    const [activeView, setActiveView] = useSessionState('contadoraActiveView', 'HOME');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [session, setSession] = useState<Session | null>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) {
                setSession(data.session);
                setUserEmail(data.session.user?.email || '');
            }
        });
    }, []);

    const handleNavigate = (view: string) => {
        setActiveView(view);
        setMobileMenuOpen(false);
        setProfileMenuOpen(false);
    };

    const handleLogout = async () => {
        localStorage.removeItem('deviceToken');
        await supabase.auth.signOut();
    };

    if (!session) return <div className="min-h-screen bg-black flex justify-center items-center font-mono text-white animate-pulse">Cargando Sistema Contable...</div>;

    return (
        <div className="bg-black min-h-screen text-white flex flex-col font-sans relative">
            <style>{`
                ::-webkit-scrollbar { width: 0 !important; height: 0 !important; background: transparent !important; display: none !important; }
                * { -ms-overflow-style: none !important; scrollbar-width: none !important; }
            `}</style>

            <header className="flex justify-between items-center p-6 bg-black/80 backdrop-blur-md sticky top-0 border-b border-white/10 z-[90]">
                <button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-zinc-400 hover:text-white">
                    <MenuIcon />
                </button>
                
                <div className="font-serif font-bold text-2xl tracking-widest cursor-pointer hover:text-zinc-300 transition-colors hidden md:block w-32" onClick={() => handleNavigate('HOME')}>
                    R & R
                </div>

                <nav className="hidden md:flex flex-grow justify-center gap-6 lg:gap-10 items-center relative z-40">
                    <button onClick={() => handleNavigate('REPORTES')} className={`text-sm lg:text-base font-bold transition-colors ${activeView === 'REPORTES' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}>Reportes</button>
                    <button onClick={() => handleNavigate('PERFILES')} className={`text-sm lg:text-base font-bold transition-colors ${activeView === 'PERFILES' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}>Perfiles</button>
                    <button onClick={() => handleNavigate('PAGOS')} className={`text-sm lg:text-base font-bold transition-colors ${activeView === 'PAGOS' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}>Revisión de Pagos</button>
                    <button onClick={() => handleNavigate('CHAT')} className={`text-sm lg:text-base font-bold transition-colors ${activeView === 'CHAT' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}>Chat</button>
                </nav>

                <div className="flex items-center justify-end gap-6 w-32 relative">
                    <div className="relative">
                        <button onClick={() => setProfileMenuOpen(!profileMenuOpen)} className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all overflow-hidden bg-black/50 ${profileMenuOpen ? 'border-white' : 'border-zinc-700 hover:border-white'}`}>
                            <UserIcon className="w-6 h-6 text-zinc-400 pointer-events-none" />
                        </button>

                        {profileMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-[95]" onClick={() => setProfileMenuOpen(false)} />
                                <div className="absolute right-0 mt-6 w-64 bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black rounded-2xl py-2 z-[100] animate-in fade-in slide-in-from-top-3 duration-300 overflow-hidden font-mono">
                                    <div className="p-5 border-b border-white/5">
                                        <p className="text-[10px] text-zinc-400 uppercase tracking-widest mb-2 font-black">Sesión activa</p>
                                        <p className="text-sm font-bold text-white truncate mb-1">{userEmail}</p>
                                        <p className="text-[10px] text-green-400 uppercase tracking-[0.2em] font-black">Contabilidad</p>
                                    </div>
                                    <button onClick={handleLogout} className="w-full text-left px-5 py-4 text-xs font-bold uppercase tracking-widest text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors">Cerrar Sesión</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {mobileMenuOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex flex-col font-mono p-6 animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex justify-between items-center mb-12">
                        <div className="font-serif font-bold text-2xl tracking-widest">R & R</div>
                        <button onClick={() => setMobileMenuOpen(false)} className="text-zinc-500 hover:text-white font-bold tracking-widest text-sm">CERRAR X</button>
                    </div>
                    <div className="flex flex-col gap-6 text-left overflow-y-auto">
                        <button onClick={() => handleNavigate('HOME')} className={`text-xl font-bold text-left ${activeView === 'HOME' ? 'text-white' : 'text-zinc-400'}`}>Inicio</button>
                        <div className="mt-4 border-t border-zinc-800 pt-6 flex flex-col gap-6">
                            <button onClick={() => handleNavigate('REPORTES')} className={`text-xl font-bold text-left ${activeView === 'REPORTES' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}>Reportes</button>
                            <button onClick={() => handleNavigate('PERFILES')} className={`text-xl font-bold text-left ${activeView === 'PERFILES' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}>Perfiles de Clientes</button>
                            <button onClick={() => handleNavigate('PAGOS')} className={`text-xl font-bold text-left ${activeView === 'PAGOS' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}>Revisión de Pagos</button>
                            <button onClick={() => handleNavigate('CHAT')} className={`text-xl font-bold text-left ${activeView === 'CHAT' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}>Chat</button>
                        </div>
                    </div>
                </div>
            )}

            <main className="flex-grow relative p-4 sm:p-8 w-full max-w-7xl mx-auto flex flex-col">
                <div className={`${activeView === 'HOME' ? 'flex' : 'hidden'} relative flex-grow items-center justify-center pointer-events-none`}> 
                    <div className="flex items-center justify-center h-[60vh] pointer-events-none">
                        <div className="text-center font-bold text-5xl md:text-7xl font-serif tracking-widest">
                            <h1 className="text-white drop-shadow-2xl">Regalado & Regalado</h1>
                        </div>
                    </div>
                </div>
                
                <div className={`${activeView === 'REPORTES' ? 'flex-grow flex flex-col' : 'hidden'}`}>
                    <ReportsView onCancel={() => handleNavigate('HOME')} />
                </div>
                <div className={`${activeView === 'PERFILES' ? 'flex-grow flex flex-col' : 'hidden'}`}>
                    <ListaPerfiles role="cliente" isContador={true} onCancel={() => handleNavigate('HOME')} />
                </div>
                <div className={`${activeView === 'PAGOS' ? 'flex-grow flex flex-col' : 'hidden'}`}>
                    <RevisionPagosView />
                </div>
                <div className={`${activeView === 'CHAT' ? 'flex-grow flex flex-col' : 'hidden'}`}>
                    <ContadorChatView session={session} />
                </div>
            </main>
        </div>
    );
};

export default ContadorDashboard;