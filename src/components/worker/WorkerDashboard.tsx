import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../services/supabaseClient';

// Vistas compartidas
import TimeBillingMaestro from '../admin/TimeBillingMaestro';
import CaseView from '../CaseView';
import ExpensesView from './ExpensesView';

const BellIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>;
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 inline-block mr-2 text-red-500"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>;
const UnlockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 inline-block mr-2 text-green-500"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>;
const UserIcon = ({ className = "w-5 h-5" }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
const DocumentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 inline-block mr-1"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
const PaperClipIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 pointer-events-none"><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" /></svg>;
const PencilIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 pointer-events-none"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>;
const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>;

const scrollbarStyle = "overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-700 transition-colors";

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode }> = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 font-mono"><div className="bg-black border border-zinc-800 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] relative">{children}</div></div>;
};

// ==========================================
// VISTA 1: DIRECTORIO DE CLIENTES (CENSURA Y PETICIONES)
// ==========================================
const WorkerClientsView: React.FC<{ session: Session }> = ({ session }) => {
    const [clients, setClients] = useState<any[]>([]);
    const [cases, setCases] = useState<any[]>([]);
    const [petitions, setPetitions] = useState<any[]>([]);
    const [assignedCases, setAssignedCases] = useState<string[]>([]);
    const [assignedClients, setAssignedClients] = useState<string[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Formulario Crear Cliente (2 Pasos)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [formStep, setFormStep] = useState(1);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [newClientData, setNewClientData] = useState({ primer_nombre: '', segundo_nombre: '', primer_apellido: '', segundo_apellido: '', cedula: '', email: '' });
    const [clientPassword, setClientPassword] = useState('');
    const photoInputRef = useRef<HTMLInputElement>(null);

    // Modal Historial de Caso
    const [activeCaseHistory, setActiveCaseHistory] = useState<any | null>(null);
    const [caseUpdates, setCaseUpdates] = useState<any[]>([]);
    const [updateDesc, setUpdateDesc] = useState('');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [editingUpdate, setEditingUpdate] = useState<any | null>(null); 
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const { data: clientsData } = await supabase.from('profiles').select('*').eq('rol', 'cliente').order('created_at', { ascending: false });
        const { data: casesData } = await supabase.from('cases').select('*');
        const { data: petitionsData } = await supabase.from('peticiones_acceso').select('*').eq('trabajador_id', session.user.id);
        
        const { data: assignments } = await supabase.from('asignaciones_casos').select('case_id').eq('abogado_id', session.user.id);
        const myAssignedCaseIds = assignments ? assignments.map(a => a.case_id) : [];
        const myAssignedClientIds = casesData ? casesData.filter(c => myAssignedCaseIds.includes(c.id)).map(c => c.cliente_id) : [];

        setClients(clientsData || []);
        setCases(casesData || []);
        setPetitions(petitionsData || []);
        setAssignedCases(myAssignedCaseIds);
        setAssignedClients(myAssignedClientIds);
        setLoading(false);
    }, [session.user.id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleRequestAccess = async (tipo: 'info_personal' | 'acceso_caso', clientId: string, caseId: string | null = null) => {
        setActionLoading(true);
        const { error } = await supabase.from('peticiones_acceso').insert({
            trabajador_id: session.user.id,
            cliente_id: clientId,
            caso_id: caseId,
            tipo: tipo,
            estado: 'pendiente'
        });
        if (error) alert(error.message);
        else await fetchData();
        setActionLoading(false);
    };

    // SOLUCIÓN: Crear cliente como una petición para que el admin lo valide y lo inserte en auth
    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);

        let final_photo_url = null;
        if (imageFile) {
            const filePath = `profile_pics/${Date.now()}_${imageFile.name}`;
            const { error: uploadError } = await supabase.storage.from('profiles').upload(filePath, imageFile);
            if (!uploadError) {
                const { data } = supabase.storage.from('profiles').getPublicUrl(filePath);
                final_photo_url = data.publicUrl;
            }
        }

        const { error } = await supabase.from('peticiones_acceso').insert({
            trabajador_id: session.user.id,
            tipo: 'nuevo_cliente',
            estado: 'pendiente',
            temp_email: newClientData.email,
            temp_password: clientPassword,
            temp_primer_nombre: newClientData.primer_nombre,
            temp_segundo_nombre: newClientData.segundo_nombre,
            temp_primer_apellido: newClientData.primer_apellido,
            temp_segundo_apellido: newClientData.segundo_apellido,
            temp_cedula: newClientData.cedula,
            temp_foto_url: final_photo_url
        });

        if (error) {
            alert(`Error al enviar a revisión: ${error.message}`);
        } else {
            setIsCreateModalOpen(false);
            setFormStep(1);
            setImagePreview(null);
            setImageFile(null);
            setNewClientData({ primer_nombre: '', segundo_nombre: '', primer_apellido: '', segundo_apellido: '', cedula: '', email: '' });
            setClientPassword('');
            alert('Cliente enviado a revisión exitosamente.');
            await fetchData();
        }
        setActionLoading(false);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
            setImagePreview(URL.createObjectURL(e.target.files[0]));
        }
    };

    const openCaseHistory = async (caso: any) => {
        setActiveCaseHistory(caso);
        const { data } = await supabase.from('case_updates').select('*').eq('case_id', caso.id).order('created_at', { ascending: false });
        setCaseUpdates(data || []);
    };

    const handleAddOrEditUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeCaseHistory || (!updateDesc.trim() && !uploadFile)) return;
        setActionLoading(true);
        let final_url = editingUpdate?.file_url || null;
        let final_name = editingUpdate?.file_name || null;

        if (uploadFile) {
            if (editingUpdate?.file_url) { const oldPath = editingUpdate.file_url.split('case_files/')[1]; if (oldPath) await supabase.storage.from('case_files').remove([oldPath]); }
            const filePath = `${activeCaseHistory.id}/${Date.now()}_${uploadFile.name}`;
            const { error: uploadError } = await supabase.storage.from('case_files').upload(filePath, uploadFile);
            if (!uploadError) { const { data } = supabase.storage.from('case_files').getPublicUrl(filePath); final_url = data.publicUrl; final_name = uploadFile.name; }
        }

        const payload = { case_id: activeCaseHistory.id, descripcion: updateDesc, file_url: final_url, file_name: final_name, estado_aprobacion: 'pendiente', perfil_id: session.user.id, observacion: null };
        
        if (editingUpdate) await supabase.from('case_updates').update(payload).eq('id', editingUpdate.id);
        else await supabase.from('case_updates').insert([payload]);

        setUpdateDesc(''); setUploadFile(null); setEditingUpdate(null); openCaseHistory(activeCaseHistory);
        setActionLoading(false);
    };

    if (loading) return <div className="text-center p-12 text-zinc-500 animate-pulse">Cargando base de datos segura...</div>;

    // Buscamos las peticiones de nuevo cliente pendientes de este trabajador para mostrarlas en la lista
    const pendingNewClients = petitions.filter(p => p.tipo === 'nuevo_cliente' && p.estado === 'pendiente');

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8 border-b border-zinc-900 pb-4">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter italic">Directorio de Clientes</h1>
                    <p className="text-zinc-500 text-xs tracking-widest mt-1">Datos protegidos por protocolo Zero-Trust</p>
                </div>
                <button onClick={() => { setIsCreateModalOpen(true); setFormStep(1); }} className="bg-white text-black font-bold py-2 px-6 hover:bg-zinc-200 transition-colors uppercase text-xs tracking-widest flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    NUEVO CLIENTE
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Mostramos los clientes que el trabajador mandó a crear y están pendientes */}
                {pendingNewClients.map(pet => (
                    <div key={pet.id} className="bg-black border border-zinc-800 p-6 flex flex-col relative overflow-hidden opacity-50 grayscale">
                        <div className="absolute top-4 right-4 bg-yellow-900/50 text-yellow-500 border border-yellow-900 px-3 py-1 text-[8px] font-black uppercase tracking-widest">
                            En Revisión de Admin
                        </div>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-bold uppercase tracking-widest text-white flex items-center gap-2">
                                    <LockIcon />
                                    {pet.temp_primer_nombre} {pet.temp_primer_apellido}
                                </h3>
                                <p className="text-zinc-500 text-xs font-mono mt-1">
                                    {pet.temp_cedula} | {pet.temp_email}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}

                {clients.length === 0 && pendingNewClients.length === 0 && <p className="text-zinc-500 text-sm">No hay clientes registrados en el sistema.</p>}
                
                {clients.map(client => {
                    const infoPet = petitions.find(p => p.cliente_id === client.id && p.tipo === 'info_personal');
                    const autoClientAccess = assignedClients.includes(client.id);
                    const hasInfoAccess = autoClientAccess || infoPet?.estado === 'aprobado';
                    const clientCases = cases.filter(c => c.cliente_id === client.id);

                    return (
                        <div key={client.id} className="bg-black border border-zinc-800 p-6 flex flex-col relative overflow-hidden transition-all">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-xl font-bold uppercase tracking-widest text-white flex items-center gap-2">
                                        {hasInfoAccess ? <UnlockIcon /> : <LockIcon />}
                                        {client.primer_nombre} {client.primer_apellido}
                                    </h3>
                                    <p className="text-zinc-500 text-xs font-mono mt-1">
                                        {hasInfoAccess ? `${client.cedula} | ${client.email}` : '***-******-* | *********@***.***'}
                                    </p>
                                </div>
                                
                                {!hasInfoAccess && (
                                    <div>
                                        {infoPet?.estado === 'pendiente' ? (
                                            <span className="text-yellow-500 text-[10px] font-bold uppercase tracking-widest border border-yellow-900 px-3 py-2">⏳ Revisando</span>
                                        ) : infoPet?.estado === 'rechazado' ? (
                                            <span className="text-red-500 text-[10px] font-bold uppercase tracking-widest">Denegado</span>
                                        ) : (
                                            <button onClick={() => handleRequestAccess('info_personal', client.id)} disabled={actionLoading} className="bg-white hover:bg-zinc-300 text-black py-2 px-6 text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50">
                                                Pedir Acceso
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {hasInfoAccess && (
                                <div className="border-t border-zinc-900 pt-4 flex-grow">
                                    <h4 className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] mb-4">Casos Vinculados</h4>
                                    {clientCases.length === 0 ? <p className="text-xs text-zinc-600 italic">No hay casos registrados.</p> : (
                                        <div className="space-y-3">
                                            {clientCases.map(c => {
                                                const casePet = petitions.find(p => p.caso_id === c.id && p.tipo === 'acceso_caso');
                                                const autoCaseAccess = assignedCases.includes(c.id);
                                                const hasCaseAccess = autoCaseAccess || casePet?.estado === 'aprobado';

                                                return (
                                                    <div key={c.id} className="bg-zinc-950 p-4 border border-zinc-800 flex justify-between items-center group">
                                                        <div>
                                                            <h5 className="font-bold text-sm text-white uppercase tracking-widest flex items-center gap-2">
                                                                {hasCaseAccess ? <UnlockIcon /> : <LockIcon />} {c.titulo}
                                                            </h5>
                                                            <p className="text-xs text-zinc-500 line-clamp-1 mt-1">{c.descripcion}</p>
                                                        </div>
                                                        <div>
                                                            {hasCaseAccess ? (
                                                                <button onClick={() => openCaseHistory(c)} className="text-green-500 hover:text-green-400 text-[10px] font-bold uppercase tracking-widest transition-colors border border-green-900/50 px-3 py-1">
                                                                    Abrir Caso ›
                                                                </button>
                                                            ) : (
                                                                casePet?.estado === 'pendiente' ? <span className="text-yellow-500 text-[10px] font-bold uppercase tracking-widest">⏳ Revisando</span> :
                                                                <button onClick={() => handleRequestAccess('acceso_caso', client.id, c.id)} disabled={actionLoading} className="text-zinc-400 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors border border-zinc-700 px-3 py-1">
                                                                    Pedir Acceso
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}>
                <form onSubmit={handleCreateClient} className="bg-black w-full text-white font-mono flex flex-col max-h-[85vh]">
                    
                    <div className="p-8 pb-4 flex-shrink-0">
                        <h2 className="text-2xl font-bold mb-2 italic tracking-widest uppercase">REGISTRAR NUEVO CLIENTE</h2>
                        <p className="text-zinc-500 text-xs mb-6">El perfil requerirá aprobación del Administrador.</p>
                        
                        <div className="flex border-b border-zinc-800">
                            <div className={`w-1/2 text-center pb-2 border-b-2 ${formStep === 1 ? 'border-zinc-500 text-white' : 'border-transparent text-zinc-600'} font-bold text-xs tracking-widest transition-colors`}>01. PERFIL</div>
                            <div className={`w-1/2 text-center pb-2 border-b-2 ${formStep === 2 ? 'border-zinc-500 text-white' : 'border-transparent text-zinc-600'} font-bold text-xs tracking-widest transition-colors`}>02. ACCESO</div>
                        </div>
                    </div>

                    <div className={`p-8 pt-4 overflow-y-auto flex-grow ${scrollbarStyle}`}>
                        {formStep === 1 ? (
                            <>
                                <div className="flex flex-col items-center mb-10">
                                    {imagePreview ? (
                                        <img src={imagePreview} className="w-32 h-32 rounded-full border border-zinc-800 object-cover mb-4" alt="Preview" />
                                    ) : (
                                        <div className="w-32 h-32 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-600 text-[10px] tracking-widest mb-4">NO IMAGE</div>
                                    )}
                                    <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                                    <button type="button" onClick={() => photoInputRef.current?.click()} className="bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] px-6 py-2 tracking-widest font-bold uppercase transition-colors">
                                        CARGAR FOTOGRAFÍA
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-12 pb-8">
                                    <div>
                                        <label className="block text-zinc-500 text-[10px] font-black mb-2 uppercase tracking-[0.3em]">PRIMER NOMBRE</label>
                                        <input type="text" required value={newClientData.primer_nombre} onChange={e => setNewClientData({...newClientData, primer_nombre: e.target.value})} className="w-full bg-transparent border-b border-zinc-800 text-white py-1 focus:outline-none focus:border-zinc-500" />
                                    </div>
                                    <div>
                                        <label className="block text-zinc-500 text-[10px] font-black mb-2 uppercase tracking-[0.3em]">SEGUNDO NOMBRE</label>
                                        <input type="text" value={newClientData.segundo_nombre} onChange={e => setNewClientData({...newClientData, segundo_nombre: e.target.value})} className="w-full bg-transparent border-b border-zinc-800 text-white py-1 focus:outline-none focus:border-zinc-500" />
                                    </div>
                                    <div>
                                        <label className="block text-zinc-500 text-[10px] font-black mb-2 uppercase tracking-[0.3em]">PRIMER APELLIDO</label>
                                        <input type="text" required value={newClientData.primer_apellido} onChange={e => setNewClientData({...newClientData, primer_apellido: e.target.value})} className="w-full bg-transparent border-b border-zinc-800 text-white py-1 focus:outline-none focus:border-zinc-500" />
                                    </div>
                                    <div>
                                        <label className="block text-zinc-500 text-[10px] font-black mb-2 uppercase tracking-[0.3em]">SEGUNDO APELLIDO</label>
                                        <input type="text" value={newClientData.segundo_apellido} onChange={e => setNewClientData({...newClientData, segundo_apellido: e.target.value})} className="w-full bg-transparent border-b border-zinc-800 text-white py-1 focus:outline-none focus:border-zinc-500" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-zinc-500 text-[10px] font-black mb-2 uppercase tracking-[0.3em]">DNI / CÉDULA</label>
                                        <input type="text" required value={newClientData.cedula} onChange={e => setNewClientData({...newClientData, cedula: e.target.value})} className="w-full bg-transparent border-b border-zinc-800 text-white py-1 focus:outline-none focus:border-zinc-500" />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="grid grid-cols-1 gap-y-12 pb-8">
                                <div>
                                    <label className="block text-zinc-500 text-[10px] font-black mb-2 uppercase tracking-[0.3em]">EMAIL CORPORATIVO</label>
                                    <input type="email" required value={newClientData.email} onChange={e => setNewClientData({...newClientData, email: e.target.value})} className="w-full bg-transparent border-b border-zinc-800 text-white py-1 focus:outline-none focus:border-zinc-500" />
                                </div>
                                <div>
                                    <label className="block text-zinc-500 text-[10px] font-black mb-2 uppercase tracking-[0.3em]">CONTRASEÑA PROVISIONAL</label>
                                    <input type="password" required value={clientPassword} onChange={e => setClientPassword(e.target.value)} className="w-full bg-transparent border-b border-zinc-800 text-white py-1 focus:outline-none focus:border-zinc-500" />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-8 pt-4 border-t border-zinc-900 flex justify-end flex-shrink-0 bg-black gap-6 items-center">
                        {formStep === 1 ? (
                            <button type="button" onClick={() => setFormStep(2)} className="bg-zinc-800 text-white font-bold py-3 px-8 text-[10px] tracking-widest uppercase hover:bg-zinc-700 transition-colors w-full md:w-auto text-center">SIGUIENTE</button>
                        ) : (
                            <>
                                <button type="button" onClick={() => setFormStep(1)} className="text-zinc-500 text-[10px] font-bold tracking-widest hover:text-white uppercase transition-colors">REGRESAR</button>
                                <button type="submit" disabled={actionLoading} className="bg-white text-black font-bold py-3 px-8 text-[10px] tracking-widest uppercase hover:bg-zinc-300 transition-colors disabled:opacity-50">ENVIAR A REVISIÓN</button>
                            </>
                        )}
                    </div>
                </form>
            </Modal>

            {/* MODAL HISTORIAL DEL CASO */}
            <Modal isOpen={!!activeCaseHistory} onClose={() => { setActiveCaseHistory(null); setEditingUpdate(null); setUpdateDesc(''); }}>
                {activeCaseHistory && (
                    <div className="flex flex-col h-[85vh]">
                        <div className="p-6 bg-zinc-950 border-b border-zinc-900">
                            <button onClick={() => { setActiveCaseHistory(null); setEditingUpdate(null); setUpdateDesc(''); }} className="text-zinc-500 hover:text-white text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2 transition-colors">
                                ‹ Volver a la Lista
                            </button>
                            <h2 className="text-lg font-bold italic tracking-widest uppercase text-white">HISTORIAL: {activeCaseHistory.titulo}</h2>
                        </div>
                        <div className={`p-6 flex-grow bg-black space-y-8 ${scrollbarStyle}`}>
                            {caseUpdates.map((u) => (
                                <div key={u.id} className="relative pl-6 border-l border-zinc-800 group/item">
                                    <div className={`absolute w-2 h-2 rounded-full -left-[5px] top-1.5 ring-4 ring-black ${u.estado_aprobacion === 'pendiente' ? 'bg-yellow-500' : u.estado_aprobacion === 'rechazado' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                    
                                    <div className="flex justify-between items-start">
                                        <p className="text-[10px] text-zinc-600 font-mono mb-1">{new Date(u.created_at).toLocaleString()}</p>
                                        
                                        {u.estado_aprobacion === 'rechazado' && (
                                            <button type="button" onClick={() => { setEditingUpdate(u); setUpdateDesc(u.descripcion); }} className="text-zinc-600 hover:text-white transition-colors opacity-0 group-hover/item:opacity-100" title="Editar y reenviar"><PencilIcon /></button>
                                        )}
                                    </div>
                                    
                                    {u.estado_aprobacion === 'pendiente' && <span className="bg-yellow-900/30 text-yellow-500 px-2 py-0.5 rounded text-[8px] uppercase tracking-widest font-black inline-block mb-2">Pendiente de Aprobación</span>}
                                    {u.estado_aprobacion === 'rechazado' && <div className="text-red-400 text-[10px] tracking-widest font-mono mb-2 p-2 border border-red-900/50 bg-red-950/20">RECHAZADO: {u.observacion}</div>}
                                    {u.estado_aprobacion === 'aprobado' && <span className="bg-green-900/30 text-green-500 px-2 py-0.5 rounded text-[8px] uppercase tracking-widest font-black inline-block mb-2">Aprobado</span>}
                                    
                                    <p className="text-sm text-zinc-300 mt-1">{u.descripcion}</p>
                                    {u.file_url && (
                                        <a href={u.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center text-[10px] bg-zinc-900 border border-zinc-800 px-3 py-1.5 mt-3 text-blue-400 hover:bg-zinc-800 uppercase tracking-widest transition-colors">
                                            <DocumentIcon /> {u.file_name}
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="p-4 bg-zinc-950 border-t border-zinc-900">
                            <form onSubmit={handleAddOrEditUpdate} className="flex flex-col gap-3">
                                {editingUpdate && <div className="text-[10px] text-yellow-500 uppercase font-black tracking-widest px-2">Corrigiendo Registro... <button type="button" onClick={() => {setEditingUpdate(null); setUpdateDesc('');}} className="ml-4 text-zinc-500 hover:text-white">Cancelar</button></div>}
                                <div className="flex items-end gap-3">
                                    <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setUploadFile(e.target.files![0])} />
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className={`p-3 border border-zinc-800 transition-colors ${uploadFile ? 'text-green-500' : 'text-zinc-500 hover:text-white'}`}><PaperClipIcon /></button>
                                    <input type="text" placeholder="Añadir actualización al caso..." className="flex-grow bg-transparent border-b border-zinc-800 py-2 text-white focus:outline-none transition-colors" value={updateDesc} onChange={(e) => setUpdateDesc(e.target.value)} required />
                                    <button disabled={actionLoading} className="bg-white text-black font-black px-6 py-2 text-[10px] uppercase tracking-widest hover:bg-zinc-300 transition-colors disabled:opacity-50">
                                        {editingUpdate ? 'Reenviar' : 'Enviar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

// ==========================================
// VISTA 2: CASOS ASIGNADOS
// ==========================================
const WorkerAssignedCasesView: React.FC<{ session: Session }> = ({ session }) => {
    const [assignedClientsDict, setAssignedClientsDict] = useState<{ [key: string]: { client: any, cases: any[] } }>({});
    const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [activeCaseHistory, setActiveCaseHistory] = useState<any | null>(null);
    const [caseUpdates, setCaseUpdates] = useState<any[]>([]);
    const [updateDesc, setUpdateDesc] = useState('');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [editingUpdate, setEditingUpdate] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchAssignedData = useCallback(async () => {
        setLoading(true);
        const { data: asignaciones } = await supabase.from('asignaciones_casos').select('case_id').eq('abogado_id', session.user.id);
        if (asignaciones && asignaciones.length > 0) {
            const caseIds = asignaciones.map(a => a.case_id);
            const { data: cases } = await supabase.from('cases').select('*').in('id', caseIds);
            if (cases && cases.length > 0) {
                const clientIds = [...new Set(cases.map(c => c.cliente_id))];
                const { data: clients } = await supabase.from('profiles').select('*').in('id', clientIds);
                const dict: any = {};
                clients?.forEach(client => { dict[client.id] = { client, cases: cases.filter(c => c.cliente_id === client.id) }; });
                setAssignedClientsDict(dict);
            }
        }
        setLoading(false);
    }, [session.user.id]);

    useEffect(() => { fetchAssignedData(); }, [fetchAssignedData]);

    const openCaseHistory = async (caso: any) => {
        setActiveCaseHistory(caso);
        const { data } = await supabase.from('case_updates').select('*').eq('case_id', caso.id).order('created_at', { ascending: false });
        setCaseUpdates(data || []);
    };

    const handleAddOrEditUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeCaseHistory || (!updateDesc.trim() && !uploadFile)) return;
        setActionLoading(true);
        let final_url = editingUpdate?.file_url || null;
        let final_name = editingUpdate?.file_name || null;

        if (uploadFile) {
            if (editingUpdate?.file_url) { const oldPath = editingUpdate.file_url.split('case_files/')[1]; if (oldPath) await supabase.storage.from('case_files').remove([oldPath]); }
            const filePath = `${activeCaseHistory.id}/${Date.now()}_${uploadFile.name}`;
            const { error: uploadError } = await supabase.storage.from('case_files').upload(filePath, uploadFile);
            if (!uploadError) { const { data } = supabase.storage.from('case_files').getPublicUrl(filePath); final_url = data.publicUrl; final_name = uploadFile.name; }
        }

        const payload = { case_id: activeCaseHistory.id, descripcion: updateDesc, file_url: final_url, file_name: final_name, estado_aprobacion: 'pendiente', perfil_id: session.user.id, observacion: null };
        if (editingUpdate) await supabase.from('case_updates').update(payload).eq('id', editingUpdate.id);
        else await supabase.from('case_updates').insert([payload]);

        setUpdateDesc(''); setUploadFile(null); setEditingUpdate(null); openCaseHistory(activeCaseHistory);
        setActionLoading(false);
    };

    return (
        <div className="animate-in fade-in duration-500 font-mono text-white max-w-4xl mx-auto w-full">
            <header className="flex justify-between items-center mb-8 border-b border-zinc-900 pb-4">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter italic">Mis Casos Asignados</h1>
                    <p className="text-zinc-500 text-xs tracking-widest mt-1">Doble clic en el caso para ver/añadir historial</p>
                </div>
            </header>

            {loading ? ( <div className="text-center p-12 text-zinc-500 animate-pulse">Cargando asignaciones...</div> ) : Object.values(assignedClientsDict).length === 0 ? (
                <div className="bg-black border border-zinc-900 p-8 text-center text-zinc-500 uppercase tracking-widest text-xs"> No tienes casos asignados actualmente. </div>
            ) : (
                <div className={`space-y-4 ${scrollbarStyle}`}>
                    {Object.values(assignedClientsDict).map(({client, cases}) => (
                        <div key={client.id} className="bg-zinc-950 mb-4 border border-zinc-800">
                            <div className="flex bg-zinc-900 items-center hover:bg-zinc-800 transition-colors cursor-pointer p-4" onClick={() => setExpandedClientId(expandedClientId === client.id ? null : client.id)}>
                                <div className="flex-grow">
                                    <h3 className="font-bold text-white uppercase tracking-widest">CLIENTE: {client.primer_nombre} {client.primer_apellido}</h3>
                                    <span className="text-zinc-500 text-xs">{cases.length} caso(s) asignado(s)</span>
                                </div>
                            </div>
                            {expandedClientId === client.id && (
                                <div className="bg-black">
                                    {cases.map(c => (
                                        <div key={c.id} className="flex border-b border-zinc-900 last:border-0 hover:bg-zinc-900/50 transition-colors cursor-pointer p-4 pl-8" onDoubleClick={() => openCaseHistory(c)}>
                                            <div className="flex-grow">
                                                <h4 className="font-bold text-sm text-white flex items-center gap-2"><UnlockIcon /> {c.titulo}</h4>
                                                <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{c.descripcion}</p>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="text-zinc-600 text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100">Doble clic para abrir ›</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={!!activeCaseHistory} onClose={() => { setActiveCaseHistory(null); setEditingUpdate(null); setUpdateDesc(''); }}>
                {activeCaseHistory && (
                    <div className="flex flex-col h-[85vh]">
                        <div className="p-6 bg-zinc-950 border-b border-zinc-900">
                            <button onClick={() => { setActiveCaseHistory(null); setEditingUpdate(null); setUpdateDesc(''); }} className="text-zinc-500 hover:text-white text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2 transition-colors">
                                ‹ Volver a la Lista
                            </button>
                            <h2 className="text-lg font-bold italic tracking-widest uppercase text-white">HISTORIAL: {activeCaseHistory.titulo}</h2>
                        </div>
                        <div className={`p-6 flex-grow bg-black space-y-8 ${scrollbarStyle}`}>
                            {caseUpdates.map((u) => (
                                <div key={u.id} className="relative pl-6 border-l border-zinc-800 group/item">
                                    <div className={`absolute w-2 h-2 rounded-full -left-[5px] top-1.5 ring-4 ring-black ${u.estado_aprobacion === 'pendiente' ? 'bg-yellow-500' : u.estado_aprobacion === 'rechazado' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                    
                                    <div className="flex justify-between items-start">
                                        <p className="text-[10px] text-zinc-600 font-mono mb-1">{new Date(u.created_at).toLocaleString()}</p>
                                        {u.estado_aprobacion === 'rechazado' && (
                                            <button type="button" onClick={() => { setEditingUpdate(u); setUpdateDesc(u.descripcion); }} className="text-zinc-600 hover:text-white transition-colors opacity-0 group-hover/item:opacity-100" title="Editar y reenviar"><PencilIcon /></button>
                                        )}
                                    </div>
                                    
                                    {u.estado_aprobacion === 'pendiente' && <span className="bg-yellow-900/30 text-yellow-500 px-2 py-0.5 rounded text-[8px] uppercase tracking-widest font-black inline-block mb-2">Pendiente de Aprobación</span>}
                                    {u.estado_aprobacion === 'rechazado' && <div className="text-red-400 text-[10px] tracking-widest font-mono mb-2 p-2 border border-red-900/50 bg-red-950/20">RECHAZADO: {u.observacion}</div>}
                                    {u.estado_aprobacion === 'aprobado' && <span className="bg-green-900/30 text-green-500 px-2 py-0.5 rounded text-[8px] uppercase tracking-widest font-black inline-block mb-2">Aprobado</span>}
                                    
                                    <p className="text-sm text-zinc-300 mt-1">{u.descripcion}</p>
                                    {u.file_url && (
                                        <a href={u.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center text-[10px] bg-zinc-900 border border-zinc-800 px-3 py-1.5 mt-3 text-blue-400 hover:bg-zinc-800 uppercase tracking-widest transition-colors">
                                            <DocumentIcon /> {u.file_name}
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="p-4 bg-zinc-950 border-t border-zinc-900">
                            <form onSubmit={handleAddOrEditUpdate} className="flex flex-col gap-3">
                                {editingUpdate && <div className="text-[10px] text-yellow-500 uppercase font-black tracking-widest px-2">Corrigiendo Registro... <button type="button" onClick={() => {setEditingUpdate(null); setUpdateDesc('');}} className="ml-4 text-zinc-500 hover:text-white">Cancelar</button></div>}
                                <div className="flex items-end gap-3">
                                    <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setUploadFile(e.target.files![0])} />
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className={`p-3 border border-zinc-800 transition-colors ${uploadFile ? 'text-green-500' : 'text-zinc-500 hover:text-white'}`}><PaperClipIcon /></button>
                                    <input type="text" placeholder="Añadir actualización al caso..." className="flex-grow bg-transparent border-b border-zinc-800 py-2 text-white focus:outline-none transition-colors" value={updateDesc} onChange={(e) => setUpdateDesc(e.target.value)} required />
                                    <button disabled={actionLoading} className="bg-white text-black font-black px-6 py-2 text-[10px] uppercase tracking-widest hover:bg-zinc-300 transition-colors disabled:opacity-50">
                                        {editingUpdate ? 'Reenviar' : 'Enviar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

// ==========================================
// COMPONENTE PRINCIPAL DEL DASHBOARD
// ==========================================
const WorkerDashboard: React.FC<{ session: Session }> = ({ session }) => {
    const [activeView, setActiveView] = useState('HOME');
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleMenuClick = (view: string) => {
        setActiveView(view);
        setMobileMenuOpen(false);
        setProfileMenuOpen(false); 
    };

    const renderContent = () => {
        switch (activeView) {
            case 'CLIENTS': return <WorkerClientsView session={session} />;
            case 'ASSIGNED_CASES': return <WorkerAssignedCasesView session={session} />;
            case 'TIME_BILLING': return <TimeBillingMaestro onCancel={() => handleMenuClick('HOME')} />;
            case 'EXPENSES': return <ExpensesView />;
            default: return null;
        }
    };

    return (
        <div className="bg-black min-h-screen text-white flex flex-col font-mono relative">
            
            <header className="flex justify-between items-center p-6 bg-black sticky top-0 z-50">
                <button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-zinc-400 hover:text-white">
                    <MenuIcon />
                </button>
                <div className="font-black text-2xl tracking-[0.3em] cursor-pointer hover:text-zinc-300 transition-colors hidden md:block w-32" onClick={() => handleMenuClick('HOME')}>
                    R&R
                </div>
                
                <nav className="hidden md:flex flex-grow justify-center gap-8 lg:gap-16">
                    {[
                        { id: 'CLIENTS', label: 'Clientes' },
                        { id: 'ASSIGNED_CASES', label: 'Casos Asignados' },
                        { id: 'TIME_BILLING', label: 'Time Billing' },
                        { id: 'EXPENSES', label: 'Gastos' }
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => handleMenuClick(item.id)}
                            className={`text-lg lg:text-xl uppercase font-black tracking-[0.2em] transition-colors ${activeView === item.id ? 'text-white' : 'text-zinc-600 hover:text-zinc-300'}`}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="flex items-center justify-end gap-6 w-32 relative">
                    <button className="text-zinc-500 hover:text-white transition-colors relative">
                        <BellIcon />
                        <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>
                    
                    <div className="relative">
                        <button onClick={() => setProfileMenuOpen(true)} className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center hover:border-zinc-400 transition-colors">
                            <UserIcon className="w-6 h-6 text-zinc-400 pointer-events-none" />
                        </button>

                        {profileMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)}></div>
                                <div className="absolute right-0 mt-4 w-48 bg-black border border-zinc-800 shadow-2xl z-50 flex flex-col relative">
                                    <div className="p-4 border-b border-zinc-900">
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Sesión activa</p>
                                        <p className="text-xs font-bold text-white truncate">{session.user.email}</p>
                                    </div>
                                    <button onClick={() => handleMenuClick('PROFILE')} className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors">
                                        Perfil
                                    </button>
                                    <button onClick={() => { setProfileMenuOpen(false); supabase.auth.signOut(); }} className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-950/30 transition-colors">
                                        Cerrar Sesión
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {mobileMenuOpen && (
                <div className="fixed inset-0 bg-black z-[100] flex flex-col font-mono p-6">
                    <div className="flex justify-between items-center mb-12">
                        <div className="font-black text-2xl tracking-[0.3em]">R&R</div>
                        <button onClick={() => setMobileMenuOpen(false)} className="text-zinc-500 hover:text-white">CERRAR</button>
                    </div>
                    <div className="flex flex-col gap-8 text-left">
                        {[
                            { id: 'HOME', label: 'Inicio' },
                            { id: 'CLIENTS', label: 'Clientes' },
                            { id: 'ASSIGNED_CASES', label: 'Casos Asignados' },
                            { id: 'TIME_BILLING', label: 'Time Billing' },
                            { id: 'EXPENSES', label: 'Gastos' }
                        ].map(item => (
                            <button key={item.id} onClick={() => handleMenuClick(item.id)} className={`text-2xl font-black uppercase tracking-[0.2em] text-left ${activeView === item.id ? 'text-white' : 'text-zinc-600'}`}>
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <main className="flex-grow flex flex-col relative">
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

export default WorkerDashboard;