import { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  MapPin,
  Calendar,
  Loader2,
  Award,
  Activity,
  Target,
  Minus,
} from "lucide-react";

const AdminAnalytics = () => {
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  useEffect(() => {
    Promise.all([
      axios.get("http://localhost:8080/api/reports"),
      axios.get("http://localhost:8080/api/users/staff"),
    ])
      .then(([repRes, usrRes]) => {
        if (Array.isArray(repRes.data)) setReports(repRes.data);
        if (Array.isArray(usrRes.data)) setUsers(usrRes.data);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  // ── Core Counts ──────────────────────────────────────────────────────────
  const total = reports.length;
  const open = reports.filter(
    (r) => r.status === "Open" || r.status === "Pending",
  ).length;
  const inProgress = reports.filter(
    (r) => r.status === "Progress" || r.status === "In Progress",
  ).length;
  const pendingVerify = reports.filter(
    (r) => r.status === "PendingVerification",
  ).length;
  const resolved = reports.filter((r) => r.status === "Resolved").length;
  const resRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
  const assignedCount = reports.filter((r) => r.assignedAgentName).length;
  const unassignedCount = total - assignedCount;

  // ── Category breakdown ───────────────────────────────────────────────────
  const categoryCounts = reports.reduce((acc, r) => {
    if (r.category) acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {});
  const sortedCategories = Object.entries(categoryCounts).sort(
    (a, b) => b[1] - a[1],
  );
  const maxCatCount = sortedCategories[0]?.[1] || 1;

  // ── Monthly trend (last 6 months) ─────────────────────────────────────────
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      label: d.toLocaleString("default", { month: "short" }),
      year: d.getFullYear(),
      month: d.getMonth(),
    };
  });
  const monthlyData = months.map(({ label, year, month }) => {
    const count = reports.filter((r) => {
      if (!r.createdAt) return false;
      const d = new Date(r.createdAt);
      return d.getFullYear() === year && d.getMonth() === month;
    }).length;
    const resolvedCount = reports.filter((r) => {
      if (!r.createdAt) return false;
      const d = new Date(r.createdAt);
      return (
        d.getFullYear() === year &&
        d.getMonth() === month &&
        r.status === "Resolved"
      );
    }).length;
    return { label, count, resolvedCount };
  });
  const maxMonthly = Math.max(...monthlyData.map((m) => m.count), 1);

  // ── Staff performance ────────────────────────────────────────────────────
  const staffPerf = users
    .map((staff) => {
      const name = staff.fullName || staff.email;
      const assigned = reports.filter(
        (r) => r.assignedAgentName === name || r.assignedStaffId === staff.id,
      );
      const done = assigned.filter((r) => r.status === "Resolved").length;
      const pending = assigned.filter(
        (r) =>
          r.status === "Progress" ||
          r.status === "In Progress" ||
          r.status === "PendingVerification",
      ).length;
      return {
        name: staff.fullName || staff.email?.split("@")[0] || "Staff",
        email: staff.email,
        total: assigned.length,
        done,
        pending,
        rate:
          assigned.length > 0 ? Math.round((done / assigned.length) * 100) : 0,
      };
    })
    .sort((a, b) => b.total - a.total);

  // ── Top locations ────────────────────────────────────────────────────────
  const locationCounts = reports.reduce((acc, r) => {
    if (r.location) {
      // Use first segment (city/area) as key
      const loc = r.location.split(",")[0]?.trim() || r.location;
      acc[loc] = (acc[loc] || 0) + 1;
    }
    return acc;
  }, {});
  const topLocations = Object.entries(locationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // ── Recent 7-day vs prior 7-day comparison ───────────────────────────────
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000);
  const last7 = reports.filter(
    (r) => r.createdAt && new Date(r.createdAt) >= sevenDaysAgo,
  ).length;
  const prev7 = reports.filter((r) => {
    if (!r.createdAt) return false;
    const d = new Date(r.createdAt);
    return d >= fourteenDaysAgo && d < sevenDaysAgo;
  }).length;
  const weekTrend =
    prev7 === 0 ? null : Math.round(((last7 - prev7) / prev7) * 100);

  if (loading)
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-10 h-10 text-rose-400 animate-spin" />
      </div>
    );

  const CATEGORY_COLORS = [
    "bg-rose-500",
    "bg-blue-500",
    "bg-amber-500",
    "bg-emerald-500",
    "bg-violet-500",
    "bg-cyan-500",
    "bg-pink-500",
    "bg-orange-500",
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <BarChart3 size={28} className="text-rose-500" /> Analytics
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            System-wide insights — {total} total reports across all time.
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Last updated
          </p>
          <p className="text-sm font-bold text-slate-700">
            {new Date().toLocaleString()}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Reports",
            value: total,
            icon: <FileText size={20} />,
            bg: "bg-rose-50",
            iconCol: "text-rose-600",
            trend: weekTrend,
            sub: `${last7} this week`,
          },
          {
            label: "Resolution Rate",
            value: `${resRate}%`,
            icon: <Target size={20} />,
            bg: "bg-emerald-50",
            iconCol: "text-emerald-600",
            sub: `${resolved} of ${total} resolved`,
          },
          {
            label: "Active Staff",
            value: users.length,
            icon: <Users size={20} />,
            bg: "bg-blue-50",
            iconCol: "text-blue-600",
            sub: `${assignedCount} reports assigned`,
          },
          {
            label: "Pending Action",
            value: open + unassignedCount,
            icon: <AlertCircle size={20} />,
            bg: "bg-amber-50",
            iconCol: "text-amber-600",
            sub: `${unassignedCount} unassigned`,
          },
        ].map((kpi, i) => (
          <div
            key={i}
            className="bg-white border border-slate-100 rounded-[1.5rem] p-5 shadow-sm"
          >
            <div
              className={`w-10 h-10 ${kpi.bg} rounded-xl flex items-center justify-center ${kpi.iconCol} mb-3`}
            >
              {kpi.icon}
            </div>
            <p className="text-3xl font-black text-slate-900">{kpi.value}</p>
            <p className="text-xs font-bold text-slate-400 mt-0.5">
              {kpi.label}
            </p>
            <div className="mt-2 flex items-center gap-1.5">
              {kpi.trend != null ? (
                kpi.trend > 0 ? (
                  <span className="flex items-center gap-1 text-[10px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                    <TrendingUp size={10} /> +{kpi.trend}% vs last week
                  </span>
                ) : kpi.trend < 0 ? (
                  <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <TrendingDown size={10} /> {kpi.trend}% vs last week
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                    <Minus size={10} /> No change
                  </span>
                )
              ) : (
                <span className="text-[10px] text-slate-400 font-medium">
                  {kpi.sub}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Status Pipeline */}
      <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2">
          <Activity size={17} className="text-rose-500" />
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            Status Pipeline
          </h2>
        </div>
        {/* Pipeline Flow */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Open",
              value: open,
              color: "bg-red-500",
              light: "bg-red-50 text-red-700 border-red-100",
            },
            {
              label: "In Progress",
              value: inProgress,
              color: "bg-amber-400",
              light: "bg-amber-50 text-amber-700 border-amber-100",
            },
            {
              label: "Await Verify",
              value: pendingVerify,
              color: "bg-violet-500",
              light: "bg-violet-50 text-violet-700 border-violet-100",
            },
            {
              label: "Resolved",
              value: resolved,
              color: "bg-emerald-500",
              light: "bg-emerald-50 text-emerald-700 border-emerald-100",
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`border rounded-2xl p-4 text-center space-y-2 ${s.light}`}
            >
              <p className="text-3xl font-black">{s.value}</p>
              <div
                className={`h-1.5 ${s.color} rounded-full mx-auto`}
                style={{
                  width: `${total > 0 ? Math.max(8, Math.round((s.value / total) * 100)) : 8}%`,
                  minWidth: "8px",
                  maxWidth: "100%",
                }}
              />
              <p className="text-[10px] font-black uppercase tracking-widest">
                {s.label}
              </p>
              <p className="text-[10px] font-bold opacity-70">
                {total > 0 ? Math.round((s.value / total) * 100) : 0}%
              </p>
            </div>
          ))}
        </div>
        {/* Full-width progress bar */}
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex">
          {[
            { value: open, color: "bg-red-500" },
            { value: inProgress, color: "bg-amber-400" },
            { value: pendingVerify, color: "bg-violet-500" },
            { value: resolved, color: "bg-emerald-500" },
          ].map((s, i) =>
            s.value > 0 ? (
              <div
                key={i}
                className={`${s.color} h-full transition-all`}
                style={{ width: `${total > 0 ? (s.value / total) * 100 : 0}%` }}
              />
            ) : null,
          )}
        </div>
        <div className="flex flex-wrap gap-3 text-[10px] font-black">
          {[
            { label: "Open", color: "bg-red-500" },
            { label: "In Progress", color: "bg-amber-400" },
            { label: "Await Verify", color: "bg-violet-500" },
            { label: "Resolved", color: "bg-emerald-500" },
          ].map((l) => (
            <div
              key={l.label}
              className="flex items-center gap-1.5 text-slate-500"
            >
              <div className={`w-2.5 h-2.5 rounded-full ${l.color}`} />{" "}
              {l.label}
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Trend + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Line Chart */}
        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={17} className="text-rose-500" />
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Monthly Trend
              </h2>
            </div>
            <div className="flex gap-3 text-[10px] font-black text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />{" "}
                Reported
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />{" "}
                Resolved
              </span>
            </div>
          </div>
          {(() => {
            const W = 500,
              H = 140,
              padL = 28,
              padR = 16,
              padT = 16,
              padB = 28;
            const chartW = W - padL - padR;
            const chartH = H - padT - padB;
            const n = monthlyData.length;
            const xOf = (i) => padL + (i / (n - 1)) * chartW;
            const yOf = (v) =>
              padT + chartH - (maxMonthly > 0 ? (v / maxMonthly) * chartH : 0);
            const reportedPts = monthlyData
              .map((m, i) => `${xOf(i)},${yOf(m.count)}`)
              .join(" ");
            const resolvedPts = monthlyData
              .map((m, i) => `${xOf(i)},${yOf(m.resolvedCount)}`)
              .join(" ");
            const reportedFill =
              monthlyData.map((m, i) => `${xOf(i)},${yOf(m.count)}`).join(" ") +
              ` ${xOf(n - 1)},${padT + chartH} ${xOf(0)},${padT + chartH}`;
            const resolvedFill =
              monthlyData
                .map((m, i) => `${xOf(i)},${yOf(m.resolvedCount)}`)
                .join(" ") +
              ` ${xOf(n - 1)},${padT + chartH} ${xOf(0)},${padT + chartH}`;
            const gridLines = 4;
            return (
              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="w-full"
                style={{ height: 160 }}
              >
                <defs>
                  <linearGradient id="roseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fb7185" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#fb7185" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Grid lines */}
                {Array.from({ length: gridLines + 1 }, (_, i) => {
                  const y = padT + (i / gridLines) * chartH;
                  const val = Math.round(
                    maxMonthly - (i / gridLines) * maxMonthly,
                  );
                  return (
                    <g key={i}>
                      <line
                        x1={padL}
                        y1={y}
                        x2={W - padR}
                        y2={y}
                        stroke="#f1f5f9"
                        strokeWidth="1"
                      />
                      {val > 0 && (
                        <text
                          x={padL - 4}
                          y={y + 4}
                          textAnchor="end"
                          fontSize="8"
                          fill="#94a3b8"
                          fontWeight="700"
                        >
                          {val}
                        </text>
                      )}
                    </g>
                  );
                })}
                {/* Fill areas */}
                <polygon points={reportedFill} fill="url(#roseGrad)" />
                <polygon points={resolvedFill} fill="url(#emeraldGrad)" />
                {/* Lines */}
                <polyline
                  points={reportedPts}
                  fill="none"
                  stroke="#fb7185"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                <polyline
                  points={resolvedPts}
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {/* Vertical hover guide line */}
                {hoveredPoint !== null && (
                  <line
                    x1={xOf(hoveredPoint)}
                    y1={padT}
                    x2={xOf(hoveredPoint)}
                    y2={padT + chartH}
                    stroke="#e2e8f0"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                  />
                )}
                {/* Dots + X-axis labels */}
                {monthlyData.map((m, i) => {
                  const isHovered = hoveredPoint === i;
                  return (
                    <g key={m.label}>
                      {/* X-axis label */}
                      <text
                        x={xOf(i)}
                        y={H - 4}
                        textAnchor="middle"
                        fontSize="8.5"
                        fill={isHovered ? "#64748b" : "#94a3b8"}
                        fontWeight="700"
                      >
                        {m.label.toUpperCase()}
                      </text>
                      {/* Reported dot */}
                      <circle
                        cx={xOf(i)}
                        cy={yOf(m.count)}
                        r={isHovered ? 6 : 4}
                        fill={isHovered ? "#fb7185" : "#fff"}
                        stroke="#fb7185"
                        strokeWidth="2.5"
                        style={{ transition: "r 0.15s, fill 0.15s" }}
                      />
                      {/* Resolved dot */}
                      <circle
                        cx={xOf(i)}
                        cy={yOf(m.resolvedCount)}
                        r={isHovered ? 6 : 4}
                        fill={isHovered ? "#34d399" : "#fff"}
                        stroke="#34d399"
                        strokeWidth="2.5"
                        style={{ transition: "r 0.15s, fill 0.15s" }}
                      />
                      {/* Invisible wide hit area */}
                      <rect
                        x={xOf(i) - 18}
                        y={padT}
                        width={36}
                        height={chartH}
                        fill="transparent"
                        style={{ cursor: "crosshair" }}
                        onMouseEnter={() => setHoveredPoint(i)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    </g>
                  );
                })}
                {/* Floating tooltip */}
                {hoveredPoint !== null &&
                  (() => {
                    const m = monthlyData[hoveredPoint];
                    const tx = Math.min(
                      Math.max(xOf(hoveredPoint) - 44, 2),
                      W - 92,
                    );
                    const ty = padT;
                    return (
                      <g style={{ pointerEvents: "none" }}>
                        <rect
                          x={tx}
                          y={ty}
                          width={88}
                          height={46}
                          rx={6}
                          ry={6}
                          fill="#1e293b"
                          opacity="0.9"
                        />
                        <text
                          x={tx + 44}
                          y={ty + 13}
                          textAnchor="middle"
                          fontSize="9"
                          fill="#94a3b8"
                          fontWeight="700"
                        >
                          {m.label.toUpperCase()}
                        </text>
                        <circle
                          cx={tx + 12}
                          cy={ty + 25}
                          r="3.5"
                          fill="#fb7185"
                        />
                        <text
                          x={tx + 18}
                          y={ty + 29}
                          fontSize="9"
                          fill="#fecdd3"
                          fontWeight="700"
                        >
                          Reported
                        </text>
                        <text
                          x={tx + 76}
                          y={ty + 29}
                          textAnchor="end"
                          fontSize="9"
                          fill="#fff"
                          fontWeight="900"
                        >
                          {m.count}
                        </text>
                        <circle
                          cx={tx + 12}
                          cy={ty + 39}
                          r="3.5"
                          fill="#34d399"
                        />
                        <text
                          x={tx + 18}
                          y={ty + 43}
                          fontSize="9"
                          fill="#a7f3d0"
                          fontWeight="700"
                        >
                          Resolved
                        </text>
                        <text
                          x={tx + 76}
                          y={ty + 43}
                          textAnchor="end"
                          fontSize="9"
                          fill="#fff"
                          fontWeight="900"
                        >
                          {m.resolvedCount}
                        </text>
                      </g>
                    );
                  })()}
              </svg>
            );
          })()}
          {total === 0 && (
            <p className="text-center text-slate-400 text-xs font-bold py-4">
              No data yet
            </p>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <BarChart3 size={17} className="text-rose-500" />
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              By Category
            </h2>
          </div>
          {sortedCategories.length === 0 ? (
            <p className="text-slate-400 text-xs font-bold text-center py-8">
              No category data
            </p>
          ) : (
            <div className="space-y-3">
              {sortedCategories.map(([cat, count], i) => (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}`}
                      />
                      <p className="text-xs font-bold text-slate-700">{cat}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900">
                        {count}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold w-8 text-right">
                        {total > 0 ? Math.round((count / total) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]} rounded-full transition-all`}
                      style={{
                        width: `${Math.max(3, (count / maxCatCount) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Staff Performance + Top Locations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Staff Performance Table */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 flex items-center gap-2">
            <Award size={17} className="text-rose-500" />
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Staff Performance
            </h2>
          </div>
          {staffPerf.length === 0 ? (
            <div className="p-12 text-center">
              <Users size={32} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 font-bold text-sm">
                No staff accounts yet
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Staff
                    </th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                      Assigned
                    </th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                      Active
                    </th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                      Done
                    </th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Resolution
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {staffPerf.map((s, i) => (
                    <tr
                      key={s.email}
                      className="hover:bg-rose-50/20 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 font-black text-xs flex items-center justify-center shrink-0">
                            {s.name[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">
                              {s.name}
                            </p>
                            {i === 0 && s.total > 0 && (
                              <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                                TOP
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm font-black text-slate-800">
                          {s.total}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          {s.pending}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {s.done}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${s.rate >= 70 ? "bg-emerald-500" : s.rate >= 40 ? "bg-amber-400" : "bg-red-400"}`}
                              style={{ width: `${s.rate}%` }}
                            />
                          </div>
                          <span className="text-xs font-black text-slate-700 w-9 text-right">
                            {s.rate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Locations */}
        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <MapPin size={17} className="text-rose-500" />
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Top Locations
            </h2>
          </div>
          {topLocations.length === 0 ? (
            <p className="text-slate-400 text-xs font-bold text-center py-8">
              No location data
            </p>
          ) : (
            <div className="space-y-3">
              {topLocations.map(([loc, count], i) => (
                <div key={loc} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 font-black text-[11px] flex items-center justify-center shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-700 truncate">
                      {loc}
                    </p>
                    <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full bg-rose-400 rounded-full"
                        style={{
                          width: `${(count / (topLocations[0]?.[1] || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-black text-slate-700 shrink-0">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Assignment ratio */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Assignment Status
            </p>
            <div className="space-y-2">
              {[
                {
                  label: "Assigned",
                  count: assignedCount,
                  color: "bg-emerald-500",
                },
                {
                  label: "Unassigned",
                  count: unassignedCount,
                  color: "bg-red-400",
                },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${row.color} rounded-full`}
                      style={{
                        width: `${total > 0 ? (row.count / total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-black text-slate-500 w-20 text-right">
                    {row.label} ({row.count})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary footer strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            icon: <CheckCircle2 size={16} className="text-emerald-600" />,
            label: "Resolved",
            value: resolved,
            bg: "bg-emerald-50 border-emerald-100",
          },
          {
            icon: <Clock size={16} className="text-amber-600" />,
            label: "In Progress",
            value: inProgress + pendingVerify,
            bg: "bg-amber-50 border-amber-100",
          },
          {
            icon: <AlertCircle size={16} className="text-red-600" />,
            label: "Open / Unassigned",
            value: open,
            bg: "bg-red-50 border-red-100",
          },
          {
            icon: <TrendingUp size={16} className="text-rose-600" />,
            label: "Resolution Rate",
            value: `${resRate}%`,
            bg: "bg-rose-50 border-rose-100",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`border rounded-2xl px-5 py-4 flex items-center gap-3 ${s.bg}`}
          >
            <div>{s.icon}</div>
            <div>
              <p className="text-lg font-black text-slate-900">{s.value}</p>
              <p className="text-[10px] font-bold text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminAnalytics;
