import React from 'react';
import { 
  Plus, 
  Pencil, 
  Cloud, 
  Search, 
  Settings, 
  Home,
  FileCog
} from 'lucide-react';

const SidebarIcon = ({ icon: Icon, active, onClick, tooltip }) => (
  <div className="relative group">
    <button
      onClick={onClick}
      className={`
        w-12 h-12 rounded-full flex items-center justify-center mb-6 transition-all duration-300 shadow-md z-20 relative
        ${active 
          ? 'bg-black text-gray-200 scale-110 ring-2 ring-gray-400' 
          : 'bg-gradient-to-br from-gray-100 to-gray-300 text-black hover:scale-105 hover:shadow-lg'}
      `}
    >
      <Icon size={20} strokeWidth={2} />
    </button>
    <div className="absolute left-14 top-1/4 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30">
      {tooltip}
    </div>
  </div>
);

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <div className="w-20 bg-gray-200 border-r border-gray-300 flex flex-col items-center py-8 shrink-0 z-20 shadow-xl">
      <div className="mb-10 font-black text-2xl tracking-tighter text-gray-400">TILT</div>
      
      <div className="flex-1 flex flex-col w-full items-center space-y-2">
        <SidebarIcon 
          icon={Home} 
          active={activeTab === 'dashboard'} 
          onClick={() => setActiveTab('dashboard')} 
          tooltip="Dashboard" 
        />
        <SidebarIcon 
          icon={Plus} 
          active={activeTab === 'add'} 
          onClick={() => setActiveTab('add')} 
          tooltip="Add New Vendor" 
        />
        <SidebarIcon 
          icon={Cloud} 
          active={activeTab === 'cloud_fill'} 
          onClick={() => setActiveTab('cloud_fill')} 
          tooltip="Cloud Scorecard" 
        />
        <div className="h-px w-10 bg-gray-300 my-2"></div>
        <SidebarIcon 
          icon={Pencil} 
          active={activeTab === 'edit_qs'} 
          onClick={() => setActiveTab('edit_qs')} 
          tooltip="Edit Questions" 
        />
        <SidebarIcon 
          icon={FileCog} 
          active={activeTab === 'cloud_edit'} 
          onClick={() => setActiveTab('cloud_edit')} 
          tooltip="Edit Cloud Matrix" 
        />
        <div className="h-px w-10 bg-gray-300 my-2"></div>
        <SidebarIcon 
          icon={Search} 
          active={activeTab === 'osint'} 
          onClick={() => setActiveTab('osint')} 
          tooltip="OSINT Tools" 
        />
      </div>

      <div className="mt-auto">
        <SidebarIcon 
          icon={Settings} 
          active={activeTab === 'settings'} 
          onClick={() => setActiveTab('settings')} 
          tooltip="Settings" 
        />
      </div>
    </div>
  );
}

