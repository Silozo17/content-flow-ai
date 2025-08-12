import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TrendRadar from './components/TrendRadar';
import AIGenerator from './components/AIGenerator';
import ContentCalendar from './components/ContentCalendar';
import HashtagLab from './components/HashtagLab';
import InspirationFeed from './components/InspirationFeed';
import Analytics from './components/Analytics';
import ClientPortal from './components/ClientPortal';
import MediaLibrary from './components/MediaLibrary';

export type UserRole = 'solo' | 'agency' | 'client';
export type ActiveView = 'dashboard' | 'trends' | 'ai' | 'calendar' | 'hashtags' | 'inspiration' | 'analytics' | 'clients' | 'media';

function App() {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [userRole, setUserRole] = useState<UserRole>('solo');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderActiveView = () => {
    switch (activeView) {
      case 'trends':
        return <TrendRadar />;
      case 'ai':
        return <AIGenerator />;
      case 'calendar':
        return <ContentCalendar />;
      case 'hashtags':
        return <HashtagLab />;
      case 'inspiration':
        return <InspirationFeed />;
      case 'analytics':
        return <Analytics />;
      case 'clients':
        return <ClientPortal />;
      case 'media':
        return <MediaLibrary />;
      default:
        return <Dashboard userRole={userRole} setActiveView={setActiveView} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        userRole={userRole}
        setUserRole={setUserRole}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />
      
      <main className={`flex-1 transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      } lg:ml-64`}>
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {renderActiveView()}
        </div>
      </main>
    </div>
  );
}

export default App;