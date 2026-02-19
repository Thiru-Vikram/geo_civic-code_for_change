import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { useNavigate, Outlet } from 'react-router-dom';
import { PanelLeft, Bell, Search as SearchIcon } from 'lucide-react';
import { getNotifications } from '../services/userService';

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await getNotifications(user.id);
        setNotifications(response.data.filter(n => !n.isRead));
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };
    if (user) fetchNotifications();
  }, [user.id]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      {/* Sidebar with premium slow-easing transition */}
      <div 
        className={`transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          isSidebarOpen ? 'w-64' : 'w-0'
        }`}
      >
        <Sidebar isOpen={isSidebarOpen} />
      </div>

      <main className="flex-1 overflow-auto relative">
        {/* Toggle Button Header */}
        <div className="sticky top-0 z-20 bg-[#f8fafc]/80 backdrop-blur-md px-8 py-4 flex items-center justify-between border-b border-slate-100/50">
          <div className="flex items-center">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-300 active:scale-90 flex items-center justify-center group"
              title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              <PanelLeft size={20} className={`transition-transform duration-500 ${!isSidebarOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <div className="ml-4 font-extrabold text-slate-900 tracking-tight">
              CivicTrack
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Civic Coins Badge */}
            <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 shadow-sm shadow-emerald-50">
              <div className="w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center text-[10px] font-black text-white italic">CC</div>
              <span className="text-xs font-extrabold text-emerald-700 tracking-tight">
                {user?.civicCoins || 0}
              </span>
            </div>

            <div className="hidden sm:flex items-center bg-slate-100/50 rounded-xl px-3 py-1.5 border border-slate-200/50">
              <SearchIcon size={16} className="text-slate-400" />
              <input type="text" placeholder="Quick search..." className="bg-transparent border-none text-xs ml-2 focus:ring-0 w-32" />
            </div>

            <button className="relative p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                  {notifications.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
