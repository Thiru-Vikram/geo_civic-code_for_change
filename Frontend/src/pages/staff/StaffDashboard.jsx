import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, AlertCircle, Clock, CheckCircle2, User, ArrowRight, Loader2 } from 'lucide-react';

const StaffDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const getUser = () => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  };
  const user = getUser();

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    axios.get(`http://localhost:8080/api/reports/staff/${user.id}`)
      .then(r => { if (Array.isArray(r.data)) setTasks(r.data); })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const open = tasks.filter(r => r.status === 'Progress' || r.status === 'In Progress').length;
  const resolved = tasks.filter(r => r.status === 'Resolved').length;
  const closed = tasks.filter(r => r.status === 'Closed').length;

  const getStatusStyle = (s) => {
    const sl = s?.toLowerCase();
    if (sl === 'closed') return 'bg-slate-700/40 text-slate-300 border-slate-600/40';
    if (sl === 'resolved') return 'bg-emerald-900/30 text-emerald-400 border-emerald-700/30';
    return 'bg-amber-900/30 text-amber-400 border-amber-700/30';
  };

  const formatStatus = (s) => s === 'Progress' ? 'IN PROGRESS' : s?.toUpperCase() || 'ASSIGNED';

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">
          Welcome, {user?.fullName || user?.email?.split('@')[0] || 'Staff'}
        </h1>
        <p className="text-slate-400 font-medium mt-1">Here are your assigned tasks.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Active Tasks', value: open, icon: <Clock size={20} />, color: 'amber' },
          { label: 'Await Verify', value: resolved, icon: <AlertCircle size={20} />, color: 'violet' },
          { label: 'Completed', value: closed, icon: <CheckCircle2 size={20} />, color: 'emerald' },
        ].map((s, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-[1.5rem] p-6 hover:border-slate-700 transition-all">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3
              ${s.color === 'amber' ? 'bg-amber-900/40 text-amber-400' :
                s.color === 'violet' ? 'bg-violet-900/40 text-violet-400' :
                'bg-emerald-900/40 text-emerald-400'}`}>{s.icon}</div>
            <p className="text-3xl font-black text-white">{s.value}</p>
            <p className="text-xs font-bold text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Task List */}
      <div className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-sm font-black text-white uppercase tracking-wider">My Assigned Reports</h2>
          <Link to="/staff/tasks" className="text-violet-400 text-xs font-bold flex items-center gap-1 hover:text-violet-300 transition-colors">
            View All <ArrowRight size={13} />
          </Link>
        </div>
        <div className="divide-y divide-slate-800">
          {tasks.length === 0 ? (
            <div className="p-12 text-center">
              <User size={32} className="text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 font-bold">No tasks assigned yet</p>
              <p className="text-slate-600 text-xs mt-1">The admin will assign reports to you.</p>
            </div>
          ) : tasks.slice(0, 6).map((r) => (
            <div key={r.id} onClick={() => navigate(`/staff/tasks/${r.id}`)}
              className="flex items-center gap-4 px-6 py-4 hover:bg-slate-800/50 transition-all group cursor-pointer">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors truncate">{r.title}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{r.category} · TKT-{String(r.id).padStart(3, '0')}</p>
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border whitespace-nowrap ${getStatusStyle(r.status)}`}>
                {formatStatus(r.status)}
              </span>
              <ArrowRight size={13} className="text-slate-600 group-hover:text-violet-400 transition-colors shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
