import { Link } from 'react-router-dom';
import { 
  Plus, 
  ChevronRight, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem('user'));

  const stats = [
    { label: 'Total Tickets', value: 6, icon: null },
    { label: 'Civic Score', value: 78, icon: null },
    { label: 'Open', value: 2, icon: null },
    { label: 'Resolved', value: 2, icon: null },
  ];

  const recentTickets = [
    { id: 'TKT-001', title: 'Pothole on Main Street', date: 'Feb 15, 2026', status: 'Open', statusColor: 'amber' },
    { id: 'TKT-002', title: 'Broken Streetlight', date: 'Feb 12, 2026', status: 'In Progress', statusColor: 'blue' },
    { id: 'TKT-003', title: 'Park Bench Damaged', date: 'Feb 8, 2026', status: 'Resolved', statusColor: 'emerald' },
    { id: 'TKT-004', title: 'Water Leak on Maple Drive', date: 'Feb 17, 2026', status: 'Open', statusColor: 'amber' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Banner */}
      <div className="bg-emerald-600 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl shadow-emerald-100">
        <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
          <div className="max-w-xl space-y-4">
            <span className="bg-emerald-500/30 text-emerald-50 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
              Dashboard
            </span>
            <h1 className="text-4xl font-bold">Welcome to CivicTrack</h1>
            <p className="text-emerald-50/80 text-sm leading-relaxed">
              Report civic issues, track ticket status, and monitor your community engagement score.
            </p>
            <div className="flex gap-4 pt-2">
              <Link to="/add-report" className="bg-white text-emerald-600 px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-emerald-50 transition-colors shadow-lg shadow-black/5">
                <Plus size={18} /> Create Report
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-md border border-white/10 rounded-[1.5rem] p-5 flex flex-col items-center justify-center min-w-[120px] shadow-inner">
                <span className="text-3xl font-bold">{stat.value}</span>
                <span className="text-[10px] text-emerald-100/70 font-semibold uppercase tracking-widest mt-1 text-center">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Abstract shapes for background */}
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-48 h-48 bg-emerald-400/10 rounded-full blur-2xl"></div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Open Tickets</p>
          <p className="text-4xl font-bold mt-2 text-slate-800">2</p>
          <div className="mt-4 flex items-center gap-2 text-amber-500 text-xs font-medium">
            <AlertCircle size={14} /> Needs attention
          </div>
        </div>
        <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">In Progress</p>
          <p className="text-4xl font-bold mt-2 text-slate-800">2</p>
          <div className="mt-4 flex items-center gap-2 text-blue-500 text-xs font-medium">
            <Clock size={14} /> Being addressed
          </div>
        </div>
        <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Resolved</p>
          <p className="text-4xl font-bold mt-2 text-slate-800">2</p>
          <div className="mt-4 flex items-center gap-2 text-emerald-500 text-xs font-medium">
            <CheckCircle2 size={14} /> Completed
          </div>
        </div>
      </div>

      {/* Recent Tickets List */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold text-slate-900">Recent Tickets</h2>
          <Link to="/reports" className="text-emerald-600 text-xs font-bold flex items-center gap-1 hover:underline">
            View All <ChevronRight size={14} />
          </Link>
        </div>

        <div className="space-y-3">
          {recentTickets.map((ticket) => (
            <div key={ticket.id} className="flex items-center gap-6 p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-${ticket.statusColor}-50 text-${ticket.statusColor}-500 shrink-0`}>
                {ticket.status === 'Resolved' ? <CheckCircle2 size={20} /> : 
                 ticket.status === 'In Progress' ? <Clock size={20} /> : <AlertCircle size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors uppercase text-sm tracking-tight">{ticket.title}</h3>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">{ticket.id} · {ticket.date}</p>
              </div>
              <div className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors
                ${ticket.status === 'Open' ? 'bg-amber-50 text-amber-600' : 
                  ticket.status === 'In Progress' ? 'bg-blue-50 text-blue-600' : 
                  'bg-emerald-50 text-emerald-600'}`}>
                {ticket.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
