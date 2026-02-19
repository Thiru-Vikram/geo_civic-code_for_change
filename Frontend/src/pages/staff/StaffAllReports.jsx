import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Filter, AlertCircle, Clock, CheckCircle2, FileText, ArrowRight, X } from 'lucide-react';

const StaffAllReports = () => {
  const [reports, setReports] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await axios.get('http://localhost:8080/api/reports');
        if (Array.isArray(res.data)) {
          setReports(res.data);
          setFiltered(res.data);
        }
      } catch (e) {
        console.error('Failed to fetch reports', e);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  useEffect(() => {
    let result = reports;
    if (searchQuery) {
      result = result.filter(r =>
        r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (statusFilter !== 'All') {
      result = result.filter(r => {
        const s = r.status?.toLowerCase();
        if (statusFilter === 'Open') return s === 'open' || s === 'pending';
        if (statusFilter === 'Progress') return s === 'progress' || s === 'in progress';
        if (statusFilter === 'Resolved') return s === 'resolved' || s === 'solved';
        return true;
      });
    }
    setFiltered(result);
  }, [searchQuery, statusFilter, reports]);

  const getStatusStyle = (status) => {
    const s = status?.toLowerCase();
    if (s === 'resolved' || s === 'solved') return 'bg-emerald-900/30 text-emerald-400 border-emerald-700/30';
    if (s === 'progress' || s === 'in progress') return 'bg-amber-900/30 text-amber-400 border-amber-700/30';
    return 'bg-red-900/30 text-red-400 border-red-700/30';
  };

  const getStatusIcon = (status) => {
    const s = status?.toLowerCase();
    if (s === 'resolved' || s === 'solved') return <CheckCircle2 size={13} />;
    if (s === 'progress' || s === 'in progress') return <Clock size={13} />;
    return <AlertCircle size={13} />;
  };

  const formatStatus = (status) => {
    const s = status?.toLowerCase();
    if (s === 'pending') return 'OPEN';
    if (s === 'in progress') return 'PROGRESS';
    return status?.toUpperCase() || 'OPEN';
  };

  const statuses = ['All', 'Open', 'Progress', 'Resolved'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">All Reports</h1>
          <p className="text-slate-400 text-sm mt-1">{filtered.length} total · Click a report to manage it</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors" size={17} />
            <input
              type="text"
              placeholder="Search by title, location, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-3 pl-11 pr-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-600/40 focus:border-violet-600 transition-all text-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl border font-bold text-sm transition-all ${
              showFilters || statusFilter !== 'All'
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-600'
            }`}
          >
            <Filter size={16} /> Filter
            {statusFilter !== 'All' && <span className="w-2 h-2 bg-white rounded-full" />}
          </button>
        </div>

        {showFilters && (
          <div className="bg-slate-900 border border-slate-700 rounded-[1.5rem] p-5 flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">Status:</span>
            {statuses.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === s ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {s}
              </button>
            ))}
            <button
              onClick={() => { setStatusFilter('All'); setSearchQuery(''); }}
              className="ml-auto text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-red-400 transition-colors flex items-center gap-1"
            >
              <X size={12} /> Clear
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Ticket</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Location</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Submitted</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-500">
                      <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm font-bold">Loading reports...</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <FileText size={32} className="text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-500 font-bold text-sm">No reports found</p>
                  </td>
                </tr>
              ) : filtered.map((report) => (
                <tr
                  key={report.id}
                  onClick={() => navigate(`/staff/reports/${report.id}`)}
                  className="hover:bg-slate-800/40 transition-all cursor-pointer group"
                >
                  <td className="px-6 py-5">
                    <p className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{report.title}</p>
                    <p className="text-[10px] text-slate-600 font-bold mt-0.5">TKT-{String(report.id).padStart(3, '0')}</p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xs text-slate-400 font-medium max-w-[200px] truncate">{report.location}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span className="bg-slate-800 text-slate-400 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                      {report.category}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className={`flex items-center gap-1.5 border px-3 py-1.5 rounded-xl text-[10px] w-fit font-bold uppercase tracking-wider ${getStatusStyle(report.status)}`}>
                      {getStatusIcon(report.status)}
                      <span>{formatStatus(report.status)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xs text-slate-500 font-medium">
                      {report.createdAt ? new Date(report.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </p>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className="text-slate-600 group-hover:text-violet-400 transition-colors">
                      <ArrowRight size={16} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StaffAllReports;
