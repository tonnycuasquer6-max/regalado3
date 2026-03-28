import React, { useState, useEffect, useCallback, Fragment, useRef } from 'react';
import { supabase } from '../../services/supabaseClient';
import { PencilIcon, TrashIcon, SearchIcon } from '../shared/Icons';

const PlusCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 pointer-events-none"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const EyeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 pointer-events-none"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const PaperClipIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 pointer-events-none"><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" /></svg>;
const DocumentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 inline-block mr-1 pointer-events-none"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
const DocumentAssignIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 pointer-events-none"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9" /></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5 pointer-events-none"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;
const XMarkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5 pointer-events-none"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const ShieldIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 pointer-events-none"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>;

const scrollbarStyle = "overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-700 transition-colors";

interface Profile { id: string; primer_nombre: string; primer_apellido: string; cedula: string; email: string; foto_url: string | null; rol: string; categoria_usuario: 'abogado' | 'estudiante' | 'cliente'; estado_aprobacion: string; color_perfil?: string; }
interface Case { id: string; created_at: string; titulo: string; descripcion: string; estado: string; cliente_id: string; }
interface CaseUpdate { id: string; created_at: string; descripcion: string; file_url: string | null; file_name: string | null; estado_aprobacion: string; observacion: string | null; }

const PROFILE_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6', '#f43f5e', '#84cc16'];

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode }> = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 font-mono"><div className="bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] rounded-2xl relative">{children}</div></div>;
};

const InputField: React.FC<{ label: string, value: string, onChange: (e: any) => void, type?: string, required?: boolean }> = ({ label, value, onChange, type = 'text', required }) => (
    <div><label className="block text-zinc-500 text-[10px] font-black mb-2 uppercase tracking-[0.3em]">{label}</label><input type={type} value={value} onChange={onChange} required={required} className="w-full py-2 px-0 bg-transparent border-b-2 border-zinc-800 text-white focus:outline-none focus:border-zinc-500 transition-colors" /></div>
);

const ListaPerfiles: React.FC<{ role: 'abogado' | 'estudiante' | 'cliente'; isContador?: boolean; onCancel: () => void }> = ({ role, isContador, onCancel }) => {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const [profileToDelete, setProfileToDelete] = useState<Profile | null>(null);
    const [profileToEdit, setProfileToEdit] = useState<Profile | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<Profile>>({});
    
    // NUEVO CASO STATES
    const [createCaseClient, setCreateCaseClient] = useState<Profile | null>(null);
    const [caseType, setCaseType] = useState<'custom' | 'preset' | null>(null);
    const [caseTitle, setCaseTitle] = useState('');
    const [caseDesc, setCaseDesc] = useState('');
    const [presetSearch, setPresetSearch] = useState('');
    const [presetOption, setPresetOption] = useState<number | null>(null);
    const fixedCostOptions = Array.from({ length: 50 }, (_, i) => i + 1);
    
    const [viewCasesClient, setViewCasesClient] = useState<Profile | null>(null);
    const [clientCases, setClientCases] = useState<Case[]>([]);
    const [activeCaseHistory, setActiveCaseHistory] = useState<Case | null>(null);
    const [caseUpdates, setCaseUpdates] = useState<any[]>([]);
    const [loadingUpdates, setLoadingUpdates] = useState(false);
    
    const [editingUpdate, setEditingUpdate] = useState<CaseUpdate | null>(null);
    const [updateDesc, setUpdateDesc] = useState('');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadingUpdate, setUploadingUpdate] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [assignLawyer, setAssignLawyer] = useState<Profile | null>(null);
    const [allClients, setAllClients] = useState<Profile[]>([]);
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [selectedAssignClient, setSelectedAssignClient] = useState<Profile | null>(null);
    const [assignCasesList, setAssignCasesList] = useState<Case[]>([]);
    const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);

    const [viewAssignedProfile, setViewAssignedProfile] = useState<Profile | null>(null);
    const [assignedClientsDict, setAssignedClientsDict] = useState<{ [key: string]: { client: Profile, cases: Case[] } }>({});
    const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

    const [viewPermissionsProfile, setViewPermissionsProfile] = useState<Profile | null>(null);
    const [activePermissions, setActivePermissions] = useState<any[]>([]);

    const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
    const [rejectDialog, setRejectDialog] = useState<{ isOpen: boolean; updateId: string }>({ isOpen: false, updateId: '' });
    const [rejectReason, setRejectReason] = useState('');

    const [usedColors, setUsedColors] = useState<string[]>([]);

    const fetchProfiles = useCallback(async () => {
        setLoading(true);
        const { data } = await supabase.from('profiles').select('*').eq('categoria_usuario', role);
        setProfiles(data ? data.filter(p => p.estado_aprobacion !== 'pendiente') : []);
        setLoading(false);
    }, [role]);

    const fetchUsedColors = async () => {
        const { data } = await supabase.from('profiles').select('color_perfil').not('color_perfil', 'is', null);
        if (data) setUsedColors(data.map(p => p.color_perfil));
    };

    useEffect(() => { 
        fetchProfiles(); 
        if (role === 'abogado' || role === 'estudiante') fetchUsedColors();
    }, [fetchProfiles, role]);

    const handleUpdateProfile = async (e: React.FormEvent) => { 
        e.preventDefault(); 
        if (!profileToEdit) return; 
        setActionLoading(true); 
        const { data } = await supabase.from('profiles').update(editFormData).eq('id', profileToEdit.id).select().single(); 
        if (data) { 
            setProfiles(prev => prev.map(p => (p.id === data.id ? data : p))); 
            setProfileToEdit(null); 
            fetchUsedColors();
        } 
        setActionLoading(false); 
    };
    
    const handleDeleteProfile = async () => { 
        if (!profileToDelete) return; 
        setConfirmDialog({
            isOpen: true,
            title: '¿ELIMINAR PERFIL?',
            message: 'Esta acción no se puede deshacer. Se borrarán sus asignaciones y horas registradas.',
            onConfirm: async () => {
                setActionLoading(true); 
                await supabase.from('asignaciones_casos').delete().eq('abogado_id', profileToDelete.id);
                await supabase.from('peticiones_acceso').delete().eq('trabajador_id', profileToDelete.id);
                await supabase.from('time_entries').delete().eq('perfil_id', profileToDelete.id);

                const { error } = await supabase.from('profiles').delete().eq('id', profileToDelete.id); 
                if (error) {
                    alert(`No se pudo eliminar del todo porque el trabajador subió documentos al sistema en el pasado. Su acceso fue revocado.`);
                } else { 
                    setProfiles(prev => prev.filter(p => p.id !== profileToDelete.id)); 
                }
                setProfileToDelete(null); 
                setActionLoading(false); 
            }
        });
    };
    
    const handleCreateCase = async (e: React.FormEvent) => { 
        e.preventDefault(); 
        if (!createCaseClient) return; 
        
        let finalTitle = caseTitle;
        let finalDesc = caseDesc;
        
        if (caseType === 'preset' && presetOption) {
            const baseHours = 0.5 + presetOption * 0.1;
            const baseRate = 30 + presetOption * 1.5;
            const hours = Math.round(baseHours * 100) / 100;
            const rate = Math.round((baseRate + 5) * 100) / 100;
            
            finalTitle = `Caso Predeterminado #${presetOption}`;
            finalDesc = `Tiempo estimado: ${hours}h\nPrecio: $${rate}`;
        } else if (caseType === 'custom' && (!caseTitle.trim() || !caseDesc.trim())) {
            alert('Por favor completa el título y descripción');
            return;
        }

        setActionLoading(true); 
        const { error } = await supabase.from('cases').insert([{ titulo: finalTitle.trim(), descripcion: finalDesc.trim(), cliente_id: createCaseClient.id, estado: 'abierto' }]); 
        if (!error) {
            setCreateCaseClient(null); 
            setCaseType(null);
            setPresetOption(null);
            setCaseTitle('');
            setCaseDesc('');
        } else {
            alert(error.message); 
        }
        setActionLoading(false); 
    };

    const handleOpenViewCases = async (client: Profile) => {
        setViewCasesClient(client);
        const { data } = await supabase.from('cases').select('*').eq('cliente_id', client.id).order('created_at', { ascending: false });
        setClientCases(data || []);
    };

    const handleOpenCaseHistory = async (caso: Case) => {
        setActiveCaseHistory(caso);
        setLoadingUpdates(true);
        if (isContador) {
            try {
                const { data } = await supabase.from('pagos').select('*').eq('caso_id', caso.id).order('created_at', { ascending: false });
                setCaseUpdates(data || []);
            } catch (e) {
                setCaseUpdates([]);
            }
        } else {
            const { data } = await supabase.from('case_updates').select('*').eq('case_id', caso.id).order('created_at', { ascending: false });
            setCaseUpdates(data || []);
        }
        setLoadingUpdates(false);
    };

    const handleApprovePago = async (id: string) => {
        await supabase.from('pagos').update({ estado: 'aprobado' }).eq('id', id);
        setCaseUpdates(prev => prev.map(p => p.id === id ? { ...p, estado: 'aprobado' } : p));
    };

    const handleAddOrEditUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeCaseHistory || (!updateDesc.trim() && !uploadFile)) return;
        setUploadingUpdate(true);
        let final_url = editingUpdate?.file_url || null;
        let final_name = editingUpdate?.file_name || null;

        if (uploadFile) {
            if (editingUpdate?.file_url) { const oldPath = editingUpdate.file_url.split('case_files/')[1]; if (oldPath) await supabase.storage.from('case_files').remove([oldPath]); }
            const fileName = `${Date.now()}_${uploadFile.name}`;
            const filePath = `${activeCaseHistory.id}/${fileName}`;
            const { error: uploadError } = await supabase.storage.from('case_files').upload(filePath, uploadFile);
            if (!uploadError) { const { data } = supabase.storage.from('case_files').getPublicUrl(filePath); final_url = data.publicUrl; final_name = uploadFile.name; }
        }

        const payload = { case_id: activeCaseHistory.id, descripcion: updateDesc, file_url: final_url, file_name: final_name, estado_aprobacion: 'aprobado' };
        const { error } = editingUpdate ? await supabase.from('case_updates').update(payload).eq('id', editingUpdate.id) : await supabase.from('case_updates').insert([payload]);

        if (error) { alert(`Error: ${error.message}`); } else { setUpdateDesc(''); setUploadFile(null); setEditingUpdate(null); handleOpenCaseHistory(activeCaseHistory); }
        setUploadingUpdate(false);
    };

    const handleApproveUpdate = async (updateId: string) => {
        await supabase.from('case_updates').update({ estado_aprobacion: 'aprobado', observacion: null }).eq('id', updateId);
        setCaseUpdates(prev => prev.map(u => u.id === updateId ? { ...u, estado_aprobacion: 'aprobado', observacion: null } : u));
    };

    const confirmRejectUpdate = async () => {
        if (!rejectReason.trim()) return;
        setActionLoading(true);
        if (isContador) {
            await supabase.from('pagos').update({ estado: 'rechazado', motivo_rechazo: rejectReason }).eq('id', rejectDialog.updateId);
            setCaseUpdates(prev => prev.map(p => p.id === rejectDialog.updateId ? { ...p, estado: 'rechazado', motivo_rechazo: rejectReason } : p));
        } else {
            await supabase.from('case_updates').update({ estado_aprobacion: 'rechazado', observacion: rejectReason }).eq('id', rejectDialog.updateId);
            setCaseUpdates(prev => prev.map(u => u.id === rejectDialog.updateId ? { ...u, estado_aprobacion: 'rechazado', observacion: rejectReason } : u));
        }
        
        setRejectDialog({ isOpen: false, updateId: '' });
        setRejectReason('');
        setActionLoading(false);
    };

    const handleDeleteUpdate = (update: CaseUpdate) => {
        setConfirmDialog({
            isOpen: true,
            title: '¿ELIMINAR REGISTRO?',
            message: 'Esta acción eliminará permanentemente este registro de la línea de tiempo.',
            onConfirm: async () => {
                setActionLoading(true);
                if (update.file_url) { const path = update.file_url.split('case_files/')[1]; if (path) await supabase.storage.from('case_files').remove([path]); }
                await supabase.from('case_updates').delete().eq('id', update.id);
                setCaseUpdates(prev => prev.filter(u => u.id !== update.id));
                setActionLoading(false);
            }
        });
    };

    const handleCloseCase = async () => {
        if (!activeCaseHistory) return;
        setConfirmDialog({
            isOpen: true,
            title: '¿CERRAR CASO DEFINITIVAMENTE?',
            message: 'Se desasignará a todos los trabajadores, se revocarán sus permisos de acceso y el caso pasará a Solo Lectura.',
            onConfirm: async () => {
                setActionLoading(true);
                await supabase.from('cases').update({ estado: 'cerrado' }).eq('id', activeCaseHistory.id);
                await supabase.from('asignaciones_casos').delete().eq('case_id', activeCaseHistory.id);
                await supabase.from('peticiones_acceso').delete().eq('caso_id', activeCaseHistory.id);
                
                setActiveCaseHistory({ ...activeCaseHistory, estado: 'cerrado' });
                setClientCases(prev => prev.map(c => c.id === activeCaseHistory.id ? { ...c, estado: 'cerrado' } : c));
                setActionLoading(false);
            }
        });
    };

    const handleReopenCase = async () => {
        if (!activeCaseHistory) return;
        setConfirmDialog({
            isOpen: true,
            title: '¿REABRIR CASO?',
            message: 'El caso volverá a estar activo. Tendrás que asignarlo manualmente a los trabajadores de nuevo.',
            onConfirm: async () => {
                setActionLoading(true);
                await supabase.from('cases').update({ estado: 'abierto' }).eq('id', activeCaseHistory.id);
                setActiveCaseHistory({ ...activeCaseHistory, estado: 'abierto' });
                setClientCases(prev => prev.map(c => c.id === activeCaseHistory.id ? { ...c, estado: 'abierto' } : c));
                setActionLoading(false);
            }
        });
    };

    const handleOpenAssignLawyer = async (profile: Profile) => {
        setAssignLawyer(profile);
        setSelectedAssignClient(null);
        setAssignCasesList([]);
        setSelectedCaseIds([]);
        const { data } = await supabase.from('profiles').select('*').eq('categoria_usuario', 'cliente');
        setAllClients(data ? data.filter(c => c.estado_aprobacion !== 'pendiente') : []); 
    };

    const handleSelectClientForAssignment = async (client: Profile) => {
        setSelectedAssignClient(client);
        const { data: cases } = await supabase.from('cases').select('*').eq('cliente_id', client.id).eq('estado', 'abierto');
        setAssignCasesList(cases || []);
        const { data: misAsignaciones } = await supabase.from('asignaciones_casos').select('case_id').eq('abogado_id', assignLawyer?.id);
        setSelectedCaseIds(misAsignaciones ? misAsignaciones.map(a => a.case_id) : []);
    };

    const handleSaveAssignments = async () => {
        if (!assignLawyer || !selectedAssignClient) return;
        setActionLoading(true);
        
        const unassignedCases = assignCasesList.filter(c => !selectedCaseIds.includes(c.id));
        
        for (let c of unassignedCases) { 
            await supabase.from('asignaciones_casos').delete().match({ case_id: c.id, abogado_id: assignLawyer.id }); 
            await supabase.from('peticiones_acceso').delete().match({ caso_id: c.id, trabajador_id: assignLawyer.id });
        }

        if (selectedCaseIds.length === 0) {
            await supabase.from('peticiones_acceso').delete().match({ cliente_id: selectedAssignClient.id, trabajador_id: assignLawyer.id });
        }

        for (let caseId of selectedCaseIds) { 
            const { data: existing } = await supabase.from('asignaciones_casos').select('id').match({ case_id: caseId, abogado_id: assignLawyer.id });
            if (!existing || existing.length === 0) {
                await supabase.from('asignaciones_casos').insert({ case_id: caseId, abogado_id: assignLawyer.id }); 
            }
        }
        
        setActionLoading(false);
        setAssignLawyer(null);
    };

    const handleOpenViewAssignedCases = async (profile: Profile) => {
        setViewAssignedProfile(profile);
        setExpandedClientId(null);
        const { data: asignaciones } = await supabase.from('asignaciones_casos').select('case_id').eq('abogado_id', profile.id);
        if (asignaciones && asignaciones.length > 0) {
            const caseIds = asignaciones.map(a => a.case_id);
            const { data: cases } = await supabase.from('cases').select('*').in('id', caseIds);
            if (cases && cases.length > 0) {
                const clientIds = [...new Set(cases.map(c => c.cliente_id))];
                const { data: clients } = await supabase.from('profiles').select('*').in('id', clientIds);
                const dict: any = {};
                clients?.forEach(client => { dict[client.id] = { client, cases: cases.filter(c => c.cliente_id === client.id) }; });
                setAssignedClientsDict(dict);
            } else { setAssignedClientsDict({}); }
        } else { setAssignedClientsDict({}); }
    };

    const handleUnassignCase = async (e: React.MouseEvent, caseId: string, clientId: string) => {
        e.stopPropagation();
        setConfirmDialog({
            isOpen: true,
            title: '¿DESASIGNAR CASO?',
            message: 'Se quitará este caso de la lista del abogado y se revocarán los permisos extra sobre él.',
            onConfirm: async () => {
                await supabase.from('asignaciones_casos').delete().match({ case_id: caseId, abogado_id: viewAssignedProfile?.id });
                await supabase.from('peticiones_acceso').delete().match({ caso_id: caseId, trabajador_id: viewAssignedProfile?.id });

                setAssignedClientsDict(prev => {
                    const newDict = { ...prev };
                    if (newDict[clientId]) {
                        const newCases = newDict[clientId].cases.filter(c => c.id !== caseId);
                        if (newCases.length === 0) delete newDict[clientId];
                        else newDict[clientId] = { ...newDict[clientId], cases: newCases };
                    }
                    return newDict;
                });
            }
        });
    };

    const handleUnassignClient = async (e: React.MouseEvent, clientId: string) => {
        e.stopPropagation();
        setConfirmDialog({
            isOpen: true,
            title: '¿DESASIGNAR CLIENTE?',
            message: 'Se quitarán TODOS los casos de este cliente y se revocará su visibilidad activa.',
            onConfirm: async () => {
                const casesToRemove = assignedClientsDict[clientId]?.cases || [];
                setAssignedClientsDict(prev => {
                    const newDict = { ...prev };
                    delete newDict[clientId];
                    return newDict;
                });
                for (let c of casesToRemove) {
                    await supabase.from('asignaciones_casos').delete().match({ case_id: c.id, abogado_id: viewAssignedProfile?.id });
                }
                await supabase.from('peticiones_acceso').delete().match({ cliente_id: clientId, trabajador_id: viewAssignedProfile?.id });
            }
        });
    };

    const handleOpenPermissions = async (profile: Profile) => {
        setViewPermissionsProfile(profile);
        
        const { data: perms } = await supabase.from('peticiones_acceso').select(`id, tipo, cliente_id, caso_id, cliente:profiles!peticiones_acceso_cliente_id_fkey(primer_nombre, primer_apellido), caso:cases!peticiones_acceso_caso_id_fkey(id, titulo)`).eq('trabajador_id', profile.id).eq('estado', 'aprobado');
        const { data: assignments } = await supabase.from('asignaciones_casos').select('case_id').eq('abogado_id', profile.id);
        
        const assignedCaseIds = assignments ? assignments.map(a => a.case_id) : [];

        const { data: allCases } = await supabase.from('cases').select('id, cliente_id');
        const assignedClientIds = [...new Set(allCases?.filter(c => assignedCaseIds.includes(c.id)).map(c => c.cliente_id) || [])];

        const filteredPerms = (perms || []).filter(p => {
            if (p.tipo === 'acceso_caso' && assignedCaseIds.includes(p.caso_id)) return false;
            if (p.tipo === 'info_personal' && assignedClientIds.includes(p.cliente_id)) return false;
            return true;
        });

        setActivePermissions(filteredPerms);
    };

    const handleRevokePermission = async (perm: any) => {
        setConfirmDialog({
            isOpen: true,
            title: '¿BLOQUEAR VISIBILIDAD?',
            message: perm.tipo === 'info_personal' ? 'Se bloqueará la información de este cliente y TODOS los casos vinculados a los que tenía acceso.' : 'Se revocará la visibilidad de este caso específico.',
            onConfirm: async () => {
                setActionLoading(true);
                if (perm.tipo === 'info_personal') {
                    await supabase.from('peticiones_acceso').delete().match({ trabajador_id: viewPermissionsProfile?.id, cliente_id: perm.cliente_id });
                    setActivePermissions(prev => prev.filter(p => p.cliente_id !== perm.cliente_id));
                } else {
                    await supabase.from('peticiones_acceso').delete().eq('id', perm.id);
                    setActivePermissions(prev => prev.filter(p => p.id !== perm.id));
                }
                setActionLoading(false);
            }
        });
    };

    const groupedPermissions = activePermissions.reduce((acc, perm) => {
        if (!perm.cliente_id) return acc; 
        
        if (!acc[perm.cliente_id]) {
            acc[perm.cliente_id] = { 
                cliente_id: perm.cliente_id, 
                cliente: perm.cliente || {}, 
                info_personal: null, 
                casos: [] 
            };
        }
        if (perm.tipo === 'info_personal') acc[perm.cliente_id].info_personal = perm;
        if (perm.tipo === 'acceso_caso') acc[perm.cliente_id].casos.push(perm);
        return acc;
    }, {} as Record<string, any>);

    const filteredProfiles = profiles.filter(p => { const term = searchTerm.toLowerCase(); return (p.primer_nombre + ' ' + p.primer_apellido).toLowerCase().includes(term) || (p.cedula && p.cedula.toLowerCase().includes(term)); });
    const filteredAssignClients = allClients.filter(p => (p.primer_nombre + ' ' + p.primer_apellido).toLowerCase().includes(clientSearchTerm.toLowerCase()));

    return (
        <Fragment>
            <div className="max-w-4xl mx-auto animate-in fade-in duration-500 font-mono text-white">
                <header className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-900">
                    <h1 className="text-3xl font-black uppercase tracking-tighter italic">Perfiles: {role.toUpperCase()}S</h1>
                    <button onClick={onCancel} className="text-zinc-400 hover:text-white font-black py-2 px-6 transition-colors uppercase text-[10px] tracking-[0.3em]">Volver</button>
                </header>

                <div className="relative flex items-center mb-8">
                    <SearchIcon className="absolute left-0 h-5 w-5 text-zinc-600 pointer-events-none" />
                    <input type="text" placeholder="Buscar por nombre o cédula..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-transparent pl-8 pb-2 text-white placeholder-zinc-700 focus:outline-none border-b border-zinc-800 focus:border-zinc-500 transition-colors" />
                </div>

                <div className="bg-black border border-zinc-900 divide-y divide-zinc-900">
                    {filteredProfiles.map(p => (
                        <div key={p.id} className="group flex items-center p-4 hover:bg-zinc-900/50 transition-colors">
                            <div className="relative w-14 h-14">
                                <img src={p.foto_url || 'https://via.placeholder.com/150'} className="w-full h-full rounded-full border-2 border-zinc-800 object-cover" />
                                {(role === 'abogado' || role === 'estudiante') && p.color_perfil && (
                                    <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-black" style={{ backgroundColor: p.color_perfil }}></span>
                                )}
                            </div>
                            <div className="ml-6 flex-grow">
                                <p className="text-lg font-bold">{p.primer_nombre} {p.primer_apellido}</p>
                                <p className="text-sm text-zinc-500">{p.cedula} | {p.email}</p>
                            </div>
                            <div className="flex items-center gap-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                {role === 'cliente' && (
                                    <>
                                        <button onClick={() => handleOpenViewCases(p)} className="text-zinc-500 hover:text-blue-500 transition-colors" title="Ver Casos"><EyeIcon /></button>
                                        {!isContador && <button onClick={() => {setCreateCaseClient(p); setCaseTitle(''); setCaseDesc(''); setCaseType(null); setPresetOption(null);}} className="text-zinc-500 hover:text-green-400 transition-colors" title="Nuevo Caso"><PlusCircleIcon /></button>}
                                    </>
                                )}
                                {!isContador && (role === 'abogado' || role === 'estudiante') && (
                                    <>
                                        <button onClick={() => handleOpenViewAssignedCases(p)} className="text-zinc-500 hover:text-blue-500 transition-colors" title="Ver Casos Asignados"><EyeIcon /></button>
                                        <button onClick={() => handleOpenPermissions(p)} className="text-zinc-500 hover:text-yellow-500 transition-colors" title="Gestionar Visibilidad/Permisos"><ShieldIcon /></button>
                                        <button onClick={() => handleOpenAssignLawyer(p)} className="text-zinc-500 hover:text-green-500 transition-colors" title="Asignar Cliente/Caso"><DocumentAssignIcon /></button>
                                    </>
                                )}
                                {!isContador && <button onClick={() => {setProfileToEdit(p); setEditFormData(p);}} className="text-zinc-500 hover:text-white transition-colors" title="Editar Perfil"><PencilIcon /></button>}
                                {!isContador && <button onClick={() => setProfileToDelete(p)} className="text-zinc-500 hover:text-red-500 transition-colors" title="Eliminar Perfil"><TrashIcon /></button>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Modal isOpen={!!viewCasesClient || !!viewAssignedProfile} onClose={() => { setViewCasesClient(null); setViewAssignedProfile(null); setActiveCaseHistory(null); setEditingUpdate(null); }}>
                {!activeCaseHistory ? (
                    <div className="p-8 flex flex-col h-full max-h-[85vh]">
                        <div className="flex flex-col mb-6">
                            <button onClick={() => {setViewCasesClient(null); setViewAssignedProfile(null);}} className="text-zinc-500 hover:text-white text-[10px] uppercase tracking-[0.3em] mb-4 w-fit flex items-center gap-2 transition-colors">
                                ‹ Volver a Clientes
                            </button>
                            <h2 className="text-xl font-bold italic tracking-widest uppercase text-white">
                                {viewCasesClient ? `CASOS DE ${viewCasesClient.primer_nombre}` : `CASOS ASIGNADOS: ${viewAssignedProfile?.primer_nombre}`}
                            </h2>
                            <p className="text-zinc-500 text-[10px] uppercase mt-2 tracking-widest">Doble clic en el caso para ver historial</p>
                        </div>
                        
                        <div className={`space-y-4 flex-grow pr-2 ${scrollbarStyle}`}>
                            
                            {viewCasesClient && clientCases.map(c => (
                                <div key={c.id} onDoubleClick={() => handleOpenCaseHistory(c)} className="bg-zinc-900 border border-zinc-800 p-5 hover:border-zinc-500 cursor-pointer transition-colors relative">
                                    <span className={`absolute top-4 right-4 text-[10px] font-black uppercase px-2 py-1 ${c.estado === 'cerrado' ? 'bg-red-950/50 text-red-500 border border-red-900/50' : 'bg-zinc-800 text-zinc-400'}`}>
                                        {c.estado}
                                    </span>
                                    <h3 className="text-lg font-bold">{c.titulo}</h3>
                                    <p className="text-sm text-zinc-400 line-clamp-2 mt-2">{c.descripcion}</p>
                                </div>
                            ))}

                            {viewAssignedProfile && Object.values(assignedClientsDict).length === 0 && <p className="text-zinc-500">No hay casos asignados.</p>}
                            {viewAssignedProfile && Object.values(assignedClientsDict).map(({client, cases}) => (
                                <div key={client.id} className="bg-zinc-950 mb-4">
                                    <div className="flex bg-zinc-900 group items-center pr-6 hover:bg-zinc-800 transition-colors">
                                        <div onClick={() => setExpandedClientId(expandedClientId === client.id ? null : client.id)} className="flex-grow p-4 cursor-pointer">
                                            <h3 className="font-bold text-white uppercase tracking-widest">CLIENTE: {client.primer_nombre} {client.primer_apellido}</h3>
                                            <span className="text-zinc-500 text-xs">{cases.length} caso(s) asignado(s)</span>
                                        </div>
                                        <button type="button" onClick={(e) => handleUnassignClient(e, client.id)} className="p-2 text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 z-10 relative" title="Desasignar todos los casos">
                                            <TrashIcon />
                                        </button>
                                    </div>
                                    
                                    {expandedClientId === client.id && (
                                        <div className="bg-black">
                                            {cases.map(c => (
                                                <div key={c.id} className="flex group/case items-center pr-6 hover:bg-zinc-900 transition-colors border-b border-zinc-900 last:border-0">
                                                    <div className="flex-grow p-4 pl-8 cursor-pointer" onDoubleClick={() => handleOpenCaseHistory(c)}>
                                                        <h4 className="font-bold text-sm text-white flex items-center gap-2">
                                                            {c.titulo} 
                                                            {c.estado === 'cerrado' && <span className="text-red-500 border border-red-900/50 bg-red-950/30 text-[8px] font-black py-0.5 px-2 uppercase tracking-widest">CERRADO</span>}
                                                        </h4>
                                                        <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{c.descripcion}</p>
                                                    </div>
                                                    <button type="button" onClick={(e) => handleUnassignCase(e, c.id, client.id)} className="p-2 text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover/case:opacity-100 z-10 relative" title="Desasignar solo este caso">
                                                        <XMarkIcon />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <Fragment>
                        {viewCasesClient && (
                            <div className="flex flex-col h-[85vh]">
                                <div className="p-6 bg-zinc-950 border-b border-zinc-900 flex-shrink-0">
                                    <button onClick={() => {setActiveCaseHistory(null); setEditingUpdate(null);}} className="text-zinc-500 hover:text-white text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2 transition-colors">
                                        ‹ Volver a la Lista
                                    </button>
                                    <div className="flex items-center gap-4 mt-2">
                                        <h2 className="text-lg font-bold italic tracking-widest uppercase text-white">HISTORIAL: {activeCaseHistory.titulo}</h2>
                                        {!isContador && activeCaseHistory.estado !== 'cerrado' ? (
                                            <button onClick={handleCloseCase} className="bg-red-900/80 text-red-100 border border-red-900 hover:bg-red-800 text-[8px] font-black py-1 px-3 uppercase tracking-widest transition-colors shadow-lg">
                                                Cerrar Caso
                                            </button>
                                        ) : !isContador ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-red-500 border border-red-900/50 bg-red-950/30 text-[8px] font-black py-1 px-3 uppercase tracking-widest">CERRADO</span>
                                                <button onClick={handleReopenCase} className="bg-green-900/80 text-green-100 border border-green-900 hover:bg-green-800 text-[8px] font-black py-1 px-3 uppercase tracking-widest transition-colors shadow-lg">
                                                    Reabrir Caso
                                                </button>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                                <div className={`p-6 flex-grow bg-black space-y-8 ${scrollbarStyle}`}>
                                    {loadingUpdates ? <p className="text-zinc-500 text-sm">Cargando historial...</p> : 
                                        isContador ? (
                                            caseUpdates.length === 0 ? <p className="text-zinc-600 text-sm italic">No hay historial de pagos para este caso.</p> :
                                            caseUpdates.map((pago) => (
                                                <div key={pago.id} className={`relative pl-6 border-l group/item ${pago.estado === 'rechazado' ? 'border-red-900' : 'border-zinc-800'}`}>
                                                    <div className={`absolute w-2 h-2 rounded-full -left-[5px] top-1.5 ring-4 ring-black ${pago.estado === 'aprobado' ? 'bg-green-500' : pago.estado === 'rechazado' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                                                    
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-[10px] text-zinc-600 font-mono">{new Date(pago.created_at).toLocaleString()}</p>
                                                            {pago.estado === 'pendiente' && <span className="bg-yellow-900/30 text-yellow-500 text-[8px] uppercase px-1 py-0.5 rounded font-bold">Por Confirmar</span>}
                                                            {pago.estado === 'rechazado' && <span className="bg-red-900/30 text-red-500 text-[8px] uppercase px-1 py-0.5 rounded font-bold">Rechazado</span>}
                                                            {pago.estado === 'aprobado' && <span className="bg-green-900/30 text-green-500 text-[8px] uppercase px-1 py-0.5 rounded font-bold">Confirmado</span>}
                                                        </div>
                                                        
                                                        {pago.estado === 'pendiente' && (
                                                            <div className="flex gap-4 opacity-0 group-hover/item:opacity-100 transition-opacity items-center">
                                                                <button type="button" onClick={() => handleApprovePago(pago.id)} className="text-green-600 hover:text-green-400" title="Confirmar Pago"><CheckIcon /></button>
                                                                <button type="button" onClick={() => setRejectDialog({ isOpen: true, updateId: pago.id })} className="text-red-500 hover:text-red-400" title="Rechazar Pago"><XMarkIcon /></button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    <p className="text-xl font-bold text-white mt-1">${pago.monto?.toFixed(2) || '0.00'}</p>
                                                    <p className="text-sm text-zinc-300 mt-1">{pago.descripcion}</p>
                                                    
                                                    {pago.comprobante_url && (
                                                        <div className="mt-3">
                                                            <span className="inline-flex items-center text-[10px] bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-blue-400 uppercase tracking-widest rounded">
                                                                <DocumentIcon /> Comprobante Adjunto
                                                            </span>
                                                            <a href={pago.comprobante_url} target="_blank" rel="noreferrer" className="ml-2 text-[10px] text-zinc-500 hover:text-white underline">Ver</a>
                                                        </div>
                                                    )}

                                                    {pago.estado === 'rechazado' && pago.motivo_rechazo && (
                                                        <div className="mt-3 bg-red-950/30 border border-red-900 p-2 text-xs text-red-400 rounded-lg">
                                                            <strong className="uppercase text-[10px] tracking-widest block mb-1">Motivo de Rechazo:</strong>{pago.motivo_rechazo}
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            caseUpdates.filter(u => u.estado_aprobacion === 'aprobado' || !u.estado_aprobacion).length === 0 ? <p className="text-zinc-600 text-sm italic">El historial visible está vacío.</p> :
                                            caseUpdates.filter(u => u.estado_aprobacion === 'aprobado' || !u.estado_aprobacion).map((u) => (
                                                <div key={u.id} className="relative pl-6 border-l border-zinc-800 group/item">
                                                    <div className="absolute w-2 h-2 bg-zinc-700 rounded-full -left-[5px] top-1.5 ring-4 ring-black"></div>
                                                    <div className="flex justify-between items-start">
                                                        <p className="text-[10px] text-zinc-600 font-mono mb-1">{new Date(u.created_at).toLocaleString()}</p>
                                                        {activeCaseHistory.estado !== 'cerrado' && (
                                                            <div className="flex gap-3 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                                <button type="button" onClick={() => { setEditingUpdate(u); setUpdateDesc(u.descripcion); }} className="text-zinc-600 hover:text-white transition-colors" title="Editar"><PencilIcon /></button>
                                                                <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteUpdate(u); }} className="text-zinc-600 hover:text-red-500 transition-colors" title="Eliminar"><TrashIcon /></button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-zinc-300 mt-1">{u.descripcion}</p>
                                                    {u.file_url && (
                                                        <a href={u.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center text-[10px] bg-zinc-900 border border-zinc-800 px-3 py-1.5 mt-3 text-blue-400 hover:bg-zinc-800 uppercase tracking-widest transition-colors">
                                                            <DocumentIcon /> {u.file_name}
                                                        </a>
                                                    )}
                                                </div>
                                            ))
                                        )
                                    }
                                </div>
                                {!isContador && activeCaseHistory.estado !== 'cerrado' && (
                                    <div className="p-4 bg-zinc-950 border-t border-zinc-900 flex-shrink-0">
                                        <form onSubmit={handleAddOrEditUpdate} className="flex flex-col gap-3">
                                            {editingUpdate && <div className="text-[10px] text-yellow-500 uppercase font-black tracking-widest px-2">Modificando Registro... <button type="button" onClick={() => {setEditingUpdate(null); setUpdateDesc('');}} className="ml-4 text-zinc-500 hover:text-white">Cancelar</button></div>}
                                            <div className="flex items-end gap-3">
                                                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setUploadFile(e.target.files![0])} />
                                                <button type="button" onClick={() => fileInputRef.current?.click()} className={`p-3 border border-zinc-800 transition-colors ${uploadFile ? 'text-green-500' : 'text-zinc-500 hover:text-white'}`}><PaperClipIcon /></button>
                                                <input type="text" placeholder="Registrar actualización directa..." className="flex-grow bg-transparent border-b border-zinc-800 py-2 text-white focus:outline-none transition-colors" value={updateDesc} onChange={(e) => setUpdateDesc(e.target.value)} />
                                                <button disabled={uploadingUpdate} className="bg-white text-black font-black px-6 py-2 text-[10px] uppercase tracking-widest hover:bg-zinc-300 transition-colors disabled:opacity-50">
                                                    {uploadingUpdate ? '...' : (editingUpdate ? 'Guardar' : 'Enviar')}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </div>
                        )}

                        {viewAssignedProfile && (
                            <div className="flex flex-col h-[85vh]">
                                <div className="p-6 bg-zinc-950 border-b border-zinc-900 flex-shrink-0">
                                    <button onClick={() => setActiveCaseHistory(null)} className="text-zinc-500 hover:text-white text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2 transition-colors">
                                        ‹ Volver a la Lista
                                    </button>
                                    <h2 className="text-lg font-bold italic tracking-widest uppercase text-white mt-2 flex items-center gap-4">
                                        PANEL DE REVISIÓN: {activeCaseHistory.titulo}
                                        {activeCaseHistory.estado === 'cerrado' && <span className="text-red-500 border border-red-900/50 bg-red-950/30 text-[8px] font-black py-1 px-3 uppercase tracking-widest">CASO CERRADO</span>}
                                    </h2>
                                </div>
                                
                                <div className={`p-6 flex-grow bg-black space-y-8 ${scrollbarStyle}`}>
                                    {loadingUpdates ? <p className="text-zinc-500 text-sm">Cargando historial...</p> : caseUpdates.length === 0 ? <p className="text-zinc-600 text-sm italic">No hay actividad para revisar en este caso.</p> : (
                                        caseUpdates.map((u) => {
                                            const status = u.estado_aprobacion || 'pendiente';
                                            const isPending = status === 'pendiente';
                                            const isRejected = status === 'rechazado';
                                            const isApproved = status === 'aprobado';
                                            
                                            return (
                                                <div key={u.id} className={`relative pl-6 border-l group/item ${isRejected ? 'border-red-900' : 'border-zinc-800'}`}>
                                                    <div className={`absolute w-2 h-2 rounded-full -left-[5px] top-1.5 ring-4 ring-black ${isRejected ? 'bg-red-600' : (isPending ? 'bg-yellow-500' : 'bg-green-500')}`}></div>
                                                    
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-[10px] text-zinc-600 font-mono">{new Date(u.created_at).toLocaleString()}</p>
                                                            {isPending && <span className="bg-yellow-900/30 text-yellow-500 text-[8px] uppercase px-1 py-0.5 rounded font-bold">Pendiente de Revisión</span>}
                                                            {isRejected && <span className="bg-red-900/30 text-red-500 text-[8px] uppercase px-1 py-0.5 rounded font-bold">Rechazado</span>}
                                                            {isApproved && <span className="bg-green-900/30 text-green-500 text-[8px] uppercase px-1 py-0.5 rounded font-bold">Aprobado</span>}
                                                        </div>
                                                        
                                                        {activeCaseHistory.estado !== 'cerrado' && (
                                                            <div className="flex gap-4 opacity-0 group-hover/item:opacity-100 transition-opacity items-center">
                                                                {!isApproved && !isRejected && <button type="button" onClick={(e) => { e.stopPropagation(); handleApproveUpdate(u.id); }} className="text-green-600 hover:text-green-400" title="Aprobar (Dar Visto)"><CheckIcon /></button>}
                                                                {!isApproved && <button type="button" onClick={(e) => { e.stopPropagation(); setRejectDialog({ isOpen: true, updateId: u.id }); }} className="text-red-500 hover:text-red-400" title="Mandar a corregir (Rechazar)"><XMarkIcon /></button>}
                                                                <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteUpdate(u); }} className="text-zinc-600 hover:text-red-500 transition-colors ml-2" title="Eliminar permanentemente"><TrashIcon /></button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    <p className="text-sm text-zinc-300 mt-1">{u.descripcion}</p>
                                                    
                                                    {u.file_url && (
                                                        <a href={u.file_url} target="_blank" rel="noreferrer" className={`inline-flex items-center text-[10px] bg-zinc-900 border px-3 py-1.5 mt-3 uppercase tracking-widest transition-colors ${isRejected ? 'border-red-900 text-red-400 hover:bg-red-950' : 'border-zinc-800 text-blue-400 hover:bg-zinc-800'}`}>
                                                            <DocumentIcon /> {u.file_name}
                                                        </a>
                                                    )}

                                                    {isRejected && u.observacion && (
                                                        <div className="mt-3 bg-red-950/30 border border-red-900 p-2 text-xs text-red-400">
                                                            <strong className="uppercase text-[10px] tracking-widest block mb-1">Motivo de Rechazo:</strong>{u.observacion}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </Fragment>
                )}
            </Modal>

            <Modal isOpen={!!viewPermissionsProfile} onClose={() => setViewPermissionsProfile(null)}>
                <div className="p-8 flex flex-col max-h-[85vh]">
                    <div className="flex flex-col mb-6 border-b border-zinc-900 pb-4">
                        <button onClick={() => setViewPermissionsProfile(null)} className="text-zinc-500 hover:text-white text-[10px] uppercase tracking-widest mb-4 w-fit flex items-center gap-2">‹ Volver</button>
                        <h2 className="text-xl font-bold italic tracking-widest uppercase text-white">VISIBILIDAD ACTIVA: {viewPermissionsProfile?.primer_nombre}</h2>
                        <p className="text-zinc-500 text-xs mt-2">Aquí puedes revocar los accesos concedidos previamente.</p>
                    </div>
                    
                    <div className={`space-y-4 pr-2 flex-grow ${scrollbarStyle}`}>
                        {Object.values(groupedPermissions).length === 0 && <p className="text-zinc-500 italic text-sm">Este trabajador no tiene permisos de visibilidad activos adicionales a sus asignaciones.</p>}
                        
                        {Object.values(groupedPermissions).map(({cliente_id, cliente, info_personal, casos}: any) => (
                            <div key={cliente_id} className="bg-zinc-950 border border-zinc-800 flex flex-col">
                                
                                <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center group">
                                    <div>
                                        <p className="text-white font-bold uppercase tracking-widest text-xs">INFO. PERSONAL</p>
                                        <p className="text-zinc-500 text-[10px] mt-1 tracking-widest uppercase">Cliente: {cliente?.primer_nombre || 'N/A'} {cliente?.primer_apellido || ''}</p>
                                    </div>
                                    {info_personal && (
                                        <button onClick={() => handleRevokePermission(info_personal)} className="text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100" title="Bloquear Visibilidad Personal y Casos vinculados">
                                            <TrashIcon />
                                        </button>
                                    )}
                                </div>
                                
                                {casos.length > 0 && (
                                    <div className="p-4 flex flex-col gap-2 bg-black">
                                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.3em] mb-2">CASOS VISIBLES</p>
                                        {casos.map((casoPerm: any) => (
                                            <div key={casoPerm.id} className="flex justify-between items-center group/case border-b border-zinc-900 pb-2 mb-2 last:border-0 last:pb-0 last:mb-0">
                                                <p className="text-zinc-400 text-xs font-mono">- {casoPerm.caso?.titulo}</p>
                                                <button onClick={() => handleRevokePermission(casoPerm)} className="text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover/case:opacity-100" title="Bloquear Solo este Caso">
                                                    <XMarkIcon />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>

            <Modal isOpen={!!assignLawyer} onClose={() => setAssignLawyer(null)}>
                <div className="p-8 flex flex-col max-h-[85vh]">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold italic tracking-widest uppercase text-white">ASIGNAR A: {assignLawyer?.primer_nombre}</h2>
                        <button onClick={() => setAssignLawyer(null)} className="text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2">
                            Cerrar ✕
                        </button>
                    </div>
                    
                    {!selectedAssignClient ? (
                        <div className="flex-grow overflow-hidden flex flex-col">
                            <p className="text-zinc-500 text-xs mb-4 uppercase tracking-widest">1. Selecciona un Cliente</p>
                            <input type="text" placeholder="Buscar cliente..." value={clientSearchTerm} onChange={(e) => setClientSearchTerm(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 p-3 text-white focus:outline-none focus:border-zinc-500 mb-4" />
                            
                            <div className={`space-y-2 pr-2 ${scrollbarStyle}`}>
                                {filteredAssignClients.map(client => (
                                    <div key={client.id} onClick={() => handleSelectClientForAssignment(client)} className="p-4 border border-zinc-800 hover:bg-zinc-900 cursor-pointer transition-colors flex justify-between items-center group">
                                        <div>
                                            <p className="text-white font-bold">{client.primer_nombre} {client.primer_apellido}</p>
                                            <p className="text-zinc-500 text-xs font-mono">{client.cedula}</p>
                                        </div>
                                        <span className="text-zinc-600 group-hover:text-green-500 transition-colors">Seleccionar ›</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-grow overflow-hidden flex flex-col">
                            <button onClick={() => setSelectedAssignClient(null)} className="text-zinc-500 hover:text-white text-[10px] uppercase tracking-[0.3em] mb-4 w-fit flex items-center gap-2">‹ Volver a buscar clientes</button>
                            <p className="text-white mb-6">Cliente seleccionado: <span className="font-bold">{selectedAssignClient.primer_nombre}</span></p>
                            <p className="text-zinc-500 text-xs mb-4 uppercase tracking-widest">2. Selecciona los casos para asignar</p>
                            
                            <div className={`space-y-2 pr-2 flex-grow mb-6 ${scrollbarStyle}`}>
                                {assignCasesList.length === 0 && <p className="text-zinc-500 italic">Este cliente no tiene casos abiertos para asignar.</p>}
                                {assignCasesList.map(c => {
                                    const isSelected = selectedCaseIds.includes(c.id);
                                    return (
                                        <div key={c.id} onClick={() => setSelectedCaseIds(prev => isSelected ? prev.filter(id => id !== c.id) : [...prev, c.id])} className={`p-4 border cursor-pointer transition-colors flex items-center gap-4 ${isSelected ? 'border-green-500 bg-green-900/10' : 'border-zinc-800 hover:bg-zinc-900'}`}>
                                            <div className={`w-5 h-5 border flex items-center justify-center ${isSelected ? 'border-green-500 bg-green-500 text-black' : 'border-zinc-600'}`}>
                                                {isSelected && <CheckIcon />}
                                            </div>
                                            <div>
                                                <h3 className={`font-bold ${isSelected ? 'text-green-400' : 'text-white'}`}>{c.titulo}</h3>
                                                <p className="text-zinc-500 text-xs line-clamp-1">{c.descripcion}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex justify-end gap-4 border-t border-zinc-900 pt-4">
                                <button type="button" onClick={() => setAssignLawyer(null)} className="py-2 px-6 text-zinc-400 hover:text-white transition-colors font-bold uppercase text-[10px] tracking-widest">Cancelar</button>
                                <button onClick={handleSaveAssignments} disabled={actionLoading} className="bg-green-600 text-white font-bold py-2 px-6 hover:bg-green-500 transition-colors uppercase tracking-widest text-[10px] disabled:opacity-50">Guardar Asignación</button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            <Modal isOpen={!!createCaseClient} onClose={() => {setCreateCaseClient(null); setCaseType(null);}}>
                <div className="p-8 flex flex-col h-full max-h-[85vh]">
                    <h2 className="text-xl font-bold mb-8 italic tracking-widest uppercase text-white">Nuevo Caso: {createCaseClient?.primer_nombre}</h2>
                    <div className="flex-grow overflow-y-auto pr-2">
                    {caseType ? (
                        caseType === 'custom' ? (
                            <form onSubmit={handleCreateCase} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-widest mb-2">Título del Caso</label>
                                    <input type="text" value={caseTitle} onChange={e => setCaseTitle(e.target.value)} placeholder="Ej: Constitución de Empresa" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-widest mb-2">Descripción</label>
                                    <textarea value={caseDesc} onChange={e => setCaseDesc(e.target.value)} placeholder="Describe los detalles del caso..." className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors h-24 resize-none" required />
                                </div>
                                <div className="flex gap-3 pt-4 border-t border-white/10">
                                    <button type="button" onClick={() => setCaseType(null)} className="flex-1 px-4 py-3 border border-white/10 hover:bg-white/5 text-zinc-300 rounded-xl uppercase text-xs font-bold tracking-widest transition-colors">Atrás</button>
                                    <button type="submit" disabled={actionLoading || !caseTitle.trim()} className="flex-1 px-4 py-3 bg-blue-600/80 hover:bg-blue-500 text-white rounded-xl uppercase text-xs font-bold tracking-widest transition-colors">
                                        {actionLoading ? 'Creando...' : 'Crear Caso'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleCreateCase} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-widest mb-3">Selecciona un Caso Predeterminado</label>
                                    <input type="text" placeholder="Buscar por número..." value={presetSearch} onChange={e => setPresetSearch(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white mb-4 focus:outline-none focus:border-blue-500" />
                                    <div className={`space-y-2 max-h-64 overflow-y-auto pr-2 ${scrollbarStyle}`}>
                                        {fixedCostOptions.filter(opt => opt.toString().includes(presetSearch)).map(opt => {
                                            const baseHours = 0.5 + opt * 0.1;
                                            const baseRate = 30 + opt * 1.5;
                                            const hours = Math.round(baseHours * 100) / 100;
                                            const rate = Math.round((baseRate + 5) * 100) / 100;
                                            return (
                                                <div key={opt} onClick={() => setPresetOption(opt)} className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${presetOption === opt ? 'border-green-500 bg-green-900/20' : 'border-white/10 bg-black/50 hover:border-white/30'}`}>
                                                    <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-1">Caso Predeterminado #{opt}</h4>
                                                    <div className="flex justify-between text-xs text-zinc-400">
                                                        <span className="text-green-400 font-bold">Precio Sugerido: ${rate}</span>
                                                        <span>⏱️ {hours}h</span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-4 border-t border-white/10">
                                    <button type="button" onClick={() => setCaseType(null)} className="flex-1 px-4 py-3 border border-white/10 hover:bg-white/5 text-zinc-300 rounded-xl uppercase text-xs font-bold tracking-widest transition-colors">Atrás</button>
                                    <button type="submit" disabled={actionLoading || !presetOption} className="flex-1 px-4 py-3 bg-green-600/80 hover:bg-green-500 text-white rounded-xl uppercase text-xs font-bold tracking-widest transition-colors">
                                        {actionLoading ? 'Creando...' : 'Crear Caso'}
                                    </button>
                                </div>
                            </form>
                        )
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-zinc-300 mb-6">Selecciona el tipo de caso que deseas crear:</p>
                            <button onClick={() => setCaseType('custom')} className="w-full p-6 border border-white/10 hover:border-white/30 bg-black/50 hover:bg-white/5 rounded-xl transition-all text-left flex items-start gap-4">
                                <div>
                                    <h3 className="font-bold text-white uppercase tracking-widest text-sm mb-1">Caso Personalizado</h3>
                                    <p className="text-zinc-400 text-xs">Crea un caso con tu propio título y descripción manual.</p>
                                </div>
                            </button>
                            <button onClick={() => setCaseType('preset')} className="w-full p-6 border border-white/10 hover:border-green-500/50 bg-black/50 hover:bg-green-900/10 rounded-xl transition-all text-left flex items-start gap-4">
                                <div>
                                    <h3 className="font-bold text-white uppercase tracking-widest text-sm mb-1 text-green-400">Casos Predeterminados (Costos Fijos)</h3>
                                    <p className="text-zinc-400 text-xs">Elige de una lista de 50 casos con precios y tiempos auto-calculados.</p>
                                </div>
                            </button>
                        </div>
                    )}
                    </div>
                </div>
            </Modal>

            <Modal isOpen={!!profileToEdit} onClose={() => setProfileToEdit(null)}>
                <form onSubmit={handleUpdateProfile} className="p-8">
                    <h2 className="text-xl font-bold mb-8 italic tracking-widest uppercase text-white">Editar Perfil</h2>
                    <div className="grid grid-cols-2 gap-6">
                        <InputField label="Nombre" value={editFormData.primer_nombre || ''} onChange={(e: any) => setEditFormData({...editFormData, primer_nombre: e.target.value})} />
                        <InputField label="Apellido" value={editFormData.primer_apellido || ''} onChange={(e: any) => setEditFormData({...editFormData, primer_apellido: e.target.value})} />
                        <InputField label="Cédula" value={editFormData.cedula || ''} onChange={(e: any) => setEditFormData({...editFormData, cedula: e.target.value})} />
                        <InputField label="Email" value={editFormData.email || ''} onChange={(e: any) => setEditFormData({...editFormData, email: e.target.value})} />
                        
                        {(role === 'abogado' || role === 'estudiante') && (
                            <div className="col-span-2 pt-6 border-t border-zinc-900 mt-2">
                                <label className="block text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                                    Color de Identificación
                                </label>
                                <div className="flex flex-wrap gap-4">
                                    {PROFILE_COLORS.map(color => {
                                        const isUsed = usedColors.includes(color);
                                        const isSelected = editFormData.color_perfil === color;
                                        return (
                                            <button
                                                key={color}
                                                type="button"
                                                disabled={isUsed && !isSelected}
                                                onClick={() => setEditFormData({ ...editFormData, color_perfil: color })}
                                                className={`w-8 h-8 rounded-full transition-all duration-300 relative ${isUsed && !isSelected ? 'opacity-20 cursor-not-allowed grayscale' : 'hover:scale-110 cursor-pointer'} ${isSelected ? 'ring-2 ring-white scale-110' : ''}`}
                                                style={{ backgroundColor: color }}
                                                title={isUsed && !isSelected ? 'En uso por otro trabajador' : 'Seleccionar color'}
                                            >
                                                {isSelected && <CheckIcon className="absolute inset-0 m-auto text-white w-4 h-4 stroke-[3] drop-shadow-md" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="mt-8 flex justify-end gap-4">
                        <button type="button" onClick={() => setProfileToEdit(null)} className="py-2 px-6 text-zinc-400 hover:text-white transition-colors">Cancelar</button>
                        <button type="submit" disabled={actionLoading} className="bg-white text-black font-bold py-2 px-6 hover:bg-zinc-200 transition-colors disabled:opacity-50">Guardar</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={!!profileToDelete} onClose={() => setProfileToDelete(null)}>
                <div className="p-8 text-center">
                    <h2 className="text-xl font-bold text-white mb-4 italic tracking-widest uppercase">¿Eliminar Perfil?</h2>
                    <p className="text-zinc-400 mb-8">Esta acción no se puede deshacer.</p>
                    <div className="flex justify-center gap-4">
                        <button onClick={() => setProfileToDelete(null)} className="py-2 px-6 text-zinc-400 hover:text-white transition-colors text-[10px] uppercase font-bold tracking-widest">Cancelar</button>
                        <button onClick={handleDeleteProfile} disabled={actionLoading} className="bg-red-900 text-white font-bold py-2 px-6 hover:bg-red-800 transition-colors uppercase tracking-widest text-[10px] disabled:opacity-50">Eliminar</button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={confirmDialog.isOpen} onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}>
                <div className="p-8 text-center">
                    <h2 className="text-xl font-bold text-white mb-4 italic tracking-widest uppercase">{confirmDialog.title}</h2>
                    <p className="text-zinc-400 mb-8">{confirmDialog.message}</p>
                    <div className="flex justify-center gap-4">
                        <button onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} className="py-2 px-6 text-zinc-400 hover:text-white transition-colors text-[10px] uppercase font-bold tracking-widest">Cancelar</button>
                        <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog({ ...confirmDialog, isOpen: false }); }} disabled={actionLoading} className="bg-red-900 text-white font-bold py-2 px-6 hover:bg-red-800 transition-colors uppercase tracking-widest text-[10px] disabled:opacity-50">Confirmar</button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={rejectDialog.isOpen} onClose={() => { setRejectDialog({ isOpen: false, updateId: '' }); setRejectReason(''); }}>
                <div className="p-8">
                    <h2 className="text-xl font-bold mb-6 italic tracking-widest uppercase text-red-500">Motivo de Rechazo</h2>
                    <div className="mb-8">
                        <InputField label="Escribe el motivo para el trabajador" value={rejectReason} onChange={(e: any) => setRejectReason(e.target.value)} required />
                    </div>
                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={() => { setRejectDialog({ isOpen: false, updateId: '' }); setRejectReason(''); }} className="py-2 px-6 text-zinc-400 hover:text-white transition-colors font-bold uppercase text-[10px] tracking-widest">Cancelar</button>
                        <button type="button" onClick={confirmRejectUpdate} disabled={!rejectReason.trim() || actionLoading} className="bg-red-900 text-white font-bold py-2 px-6 hover:bg-red-800 transition-colors uppercase tracking-widest text-[10px] disabled:opacity-50">Rechazar</button>
                    </div>
                </div>
            </Modal>
        </Fragment>
    );
};

export default ListaPerfiles;