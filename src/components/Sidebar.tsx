import React from 'react';
import {
  BarChart3,
  Brain,
  Calendar,
  Hash,
  Home,
  Image,
  Menu,
  Radar,
  Sparkles,
  Users,
  X,
  ChevronDown,
} from 'lucide-react';
import { ActiveView, UserRole } from '../App';

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  userRole,
  setUserRole,
  collapsed,
  setCollapsed,
}) => {
  const navigationItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'trends', icon: Radar, label: 'TrendRadar™' },
    { id: 'ai', icon: Brain, label: 'AI Generator' },
    { id: 'calendar', icon: Calendar, label: 'Content Calendar' },
    { id: 'hashtags', icon: Hash, label: 'Hashtag Lab' },
    { id: 'inspiration', icon: Sparkles, label: 'Inspiration Feed' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    ...(userRole === 'agency' ? [{ id: 'clients', icon: Users, label: 'Client Portal' }] : []),
    { id: 'media', icon: Image, label: 'Media Library' },
  ] as const;

  const roleLabels = {
    solo: 'Solo Creator',
    agency: 'Agency',
    client: 'Client'
  };

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-50 transition-all duration-300 ease-in-out ${
        collapsed ? '-translate-x-full lg:translate-x-0 lg:w-16' : 'translate-x-0 w-64'
      }`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  ContentFlow AI
                </h1>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
            >
              {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {!collapsed && (
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as UserRole)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg appearance-none cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <option value="solo">Solo Creator</option>
                <option value="agency">Agency</option>
                <option value="client">Client</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        )}

        <nav className="p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as ActiveView)}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                    : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${collapsed ? 'mx-auto' : ''}`} />
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile menu button */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="lg:hidden fixed top-4 left-4 z-30 p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}
    </>
  );
};

export default Sidebar;