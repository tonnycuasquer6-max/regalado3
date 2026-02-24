import React, { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import UserManagementView from './UserManagementView';
import ApprovalsView from './ApprovalsView';
import ReportsView from './ReportsView';
import AdminHome from './AdminHome';
import TimeBillingMaestro from './TimeBillingMaestro';
import ListaPerfiles from './ListaPerfiles';
import AdminProfile from './AdminProfile'; 

interface ViewConfig {
    name: string;
    params?: { [key: string]: any };
}

const AdminDashboard: React.FC<{ session: Session }> = ({ session }) => {
    
    const [activeViewConfig, setActiveViewConfig] = useState<ViewConfig>(() => {
        const savedView = sessionStorage.getItem('adminActiveView');
        return savedView ? JSON.parse(savedView) : { name: 'HOME' };
    });

    useEffect(() => {
        sessionStorage.setItem('adminActiveView', JSON.stringify(activeViewConfig));
    }, [activeViewConfig]);

    const { name: activeView, params = {} } = activeViewConfig;

    const renderContent = () => {
        // SOLUCIÓN PUNTO 2: Esta 'key' obliga a React a refrescar el componente si cambian los parámetros del menú
        const componentKey = `${activeView}-${JSON.stringify(params)}`;

        switch (activeView) {
            case 'USERS':
                return <UserManagementView key={componentKey} {...params} onCancel={() => setActiveViewConfig({ name: 'HOME' })} />;
            case 'PROFILES':
                return <ListaPerfiles key={componentKey} {...params} onCancel={() => setActiveViewConfig({ name: 'HOME' })} />;
            case 'APPROVALS':
                return <ApprovalsView key={componentKey} setActiveView={setActiveViewConfig} onCancel={() => setActiveViewConfig({ name: 'HOME' })} />;
            case 'REPORTS':
                return <ReportsView key={componentKey} onCancel={() => setActiveViewConfig({ name: 'HOME' })} />;
            case 'TIME_BILLING': 
                return <TimeBillingMaestro key={componentKey} onCancel={() => setActiveViewConfig({ name: 'HOME' })} />;
            case 'PROFILE': 
                return <AdminProfile key={componentKey} session={session} onCancel={() => setActiveViewConfig({ name: 'HOME' })} />;
            default:
                return null;
        }
    };
    
    if (activeView === 'HOME') {
        return <AdminHome setActiveView={setActiveViewConfig} />;
    }

    return (
        <div className="bg-black min-h-screen text-white">
            <main className="py-8 px-4 sm:px-8 w-full">
                {renderContent()}
            </main>
        </div>
    );
};

export default AdminDashboard;