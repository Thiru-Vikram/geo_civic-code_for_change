import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

const StaffMyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  };
  const user = getUser();

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    axios
      .get(`http://localhost:8080/api/reports/staff/${user.id}`)
      .then((r) => {
        if (Array.isArray(r.data)) setTasks(r.data);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const getStatusStyle = (s) => {
    const sl = s?.toLowerCase();
    if (sl === "closed")
      return "bg-slate-700/40 text-slate-300 border-slate-600/40";
    if (sl === "resolved")
      return "bg-emerald-900/30 text-emerald-400 border-emerald-700/30";
    return "bg-amber-900/30 text-amber-400 border-amber-700/30";
  };

  const getStatusIcon = (s) => {
    const sl = s?.toLowerCase();
    if (sl === "closed" || sl === "resolved") return <CheckCircle2 size={12} />;
    return <Clock size={12} />;
  };

  const formatStatus = (s) =>
    s === "Progress" ? "IN PROGRESS" : s?.toUpperCase() || "ASSIGNED";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">
          My Tasks
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {tasks.length} reports assigned to you
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Ticket
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Location
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Category
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Status
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-500">
                      <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm font-bold">Loading tasks...</p>
                    </div>
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <FileText
                      size={32}
                      className="text-slate-700 mx-auto mb-3"
                    />
                    <p className="text-slate-500 font-bold text-sm">
                      No tasks assigned yet
                    </p>
                    <p className="text-slate-600 text-xs mt-1">
                      Wait for the admin to assign reports to you.
                    </p>
                  </td>
                </tr>
              ) : (
                tasks.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => navigate(`/staff/reports/${r.id}`)}
                    className="hover:bg-slate-800/40 transition-all cursor-pointer group"
                  >
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-slate-200 group-hover:text-white">
                        {r.title}
                      </p>
                      <p className="text-[10px] text-slate-600 font-bold mt-0.5">
                        TKT-{String(r.id).padStart(3, "0")}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs text-slate-400 max-w-[200px] truncate">
                        {r.location}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <span className="bg-slate-800 text-slate-400 px-3 py-1 rounded-lg text-[10px] font-bold uppercase">
                        {r.category}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div
                        className={`flex items-center gap-1.5 border px-3 py-1.5 rounded-xl text-[10px] w-fit font-bold uppercase tracking-wider ${getStatusStyle(r.status)}`}
                      >
                        {getStatusIcon(r.status)}
                        <span>{formatStatus(r.status)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <ArrowRight
                        size={16}
                        className="text-slate-600 group-hover:text-violet-400 transition-colors ml-auto"
                      />
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

export default StaffMyTasks;
