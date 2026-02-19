import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Plus,
  ChevronRight,
  FileText
} from 'lucide-react';

const Reports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                // Note: Make sure backend endpoint works correctly
                const response = await axios.get(`http://localhost:8080/api/reports/user/${user.id}`);
                setReports(response.data);
            } catch (err) {
                console.error('Failed to fetch reports:', err);
                // For demo/fallback if backend is not ready
                // setReports(mockReports); 
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, []);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Resolved': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'In Progress': return 'bg-blue-50 text-blue-600 border-blue-100';
            default: return 'bg-amber-50 text-amber-600 border-amber-100';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Resolved': return <CheckCircle2 size={14} />;
            case 'In Progress': return <Clock size={14} />;
            default: return <AlertCircle size={14} />;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Reports</h1>
                    <p className="text-slate-500 font-medium">Manage and track your community improvement requests.</p>
                </div>
                <Link to="/add-report" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl transition-all font-bold flex items-center gap-2 shadow-lg shadow-emerald-100 active:scale-95">
                    <Plus size={20} /> Create New Report
                </Link>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search tickets by title or location..." 
                        className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all shadow-sm"
                    />
                </div>
                <button className="flex items-center justify-center space-x-2 bg-white border border-slate-200 px-6 py-3.5 rounded-2xl text-slate-600 font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95">
                    <Filter size={18} />
                    <span>Filter</span>
                </button>
            </div>

            {/* Table Card */}
            <div className="bg-white border border-slate-200 rounded-[2rem] shadow-xl shadow-slate-200/40 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Issue Details</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Location</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Category</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-8 py-20">
                                        <div className="flex flex-col items-center justify-center text-slate-400 space-y-3">
                                            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                            <p className="font-bold text-sm tracking-wide">Syncing data...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : reports.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-8 py-20 text-center">
                                        <div className="max-w-xs mx-auto space-y-4">
                                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto">
                                                <FileText size={32} />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-bold text-slate-900">No reports yet</p>
                                                <p className="text-slate-400 text-sm font-medium leading-relaxed">You haven't submitted any civic issues. Start by creating your first report.</p>
                                            </div>
                                            <Link to="/add-report" className="inline-block text-emerald-600 font-bold text-sm hover:underline">Create Report Now →</Link>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                reports.map((report) => (
                                    <tr key={report.id} className="hover:bg-slate-50 transition-all group">
                                        <td className="px-8 py-6">
                                            <div className="space-y-1">
                                                <p className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{report.title}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">TKT-{String(report.id).padStart(3, '0')}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-semibold text-slate-600">{report.location}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                                {report.category}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className={`flex items-center space-x-2 border px-3 py-1.5 rounded-xl text-[10px] w-fit font-bold uppercase tracking-wider ${getStatusStyle(report.status)}`}>
                                                {getStatusIcon(report.status)}
                                                <span>{report.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-medium text-slate-400">
                                                {new Date(report.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="text-slate-400 hover:text-slate-900 transition-all p-2 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100">
                                                <MoreVertical size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reports;
