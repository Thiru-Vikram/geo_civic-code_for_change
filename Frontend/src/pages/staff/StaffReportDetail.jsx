import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, MapPin, Loader2, CheckCircle2, Clock, AlertCircle,
  Upload, Navigation, ShieldCheck, Calendar, Tag, Camera, AlertTriangle
} from 'lucide-react';

const StaffReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const getUser = () => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  };

  const [report, setReport] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [message, setMessage] = useState('');
  const [proofImage, setProofImage] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);

  // GPS State
  const [gpsStatus, setGpsStatus] = useState('idle'); // idle | checking | near | far | error
  const [userLocation, setUserLocation] = useState(null);
  const [distanceToIssue, setDistanceToIssue] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [repRes, updRes] = await Promise.all([
          axios.get(`http://localhost:8080/api/reports/${id}`),
          axios.get(`http://localhost:8080/api/reports/${id}/updates`),
        ]);
        setReport(repRes.data);
        if (Array.isArray(updRes.data)) setUpdates(updRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const haversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const checkLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      setMessage('Geolocation is not supported by your browser.');
      return;
    }
    setGpsStatus('checking');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        if (report?.latitude && report?.longitude) {
          const dist = haversine(report.latitude, report.longitude, latitude, longitude);
          setDistanceToIssue(Math.round(dist));
          setGpsStatus(dist <= 200 ? 'near' : 'far');
        } else {
          // No GPS on report — allow resolve anyway
          setGpsStatus('near');
        }
      },
      () => {
        setGpsStatus('error');
        setMessage('Could not get your location. Please enable GPS and try again.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProofImage(file);
      setProofPreview(URL.createObjectURL(file));
    }
  };

  const handleResolve = async () => {
    if (gpsStatus !== 'near') {
      setMessage('⚠ Please verify your location first before resolving.');
      return;
    }
    if (!proofImage) {
      setMessage('⚠ Please upload a proof photo before resolving.');
      return;
    }

    setResolving(true);
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('staffLat', userLocation.lat);
      formData.append('staffLng', userLocation.lng);
      formData.append('proofImage', proofImage);

      const res = await axios.put(`http://localhost:8080/api/reports/${id}/resolve`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.status === 400) {
        setMessage(`❌ ${res.data}`);
        setGpsStatus('far');
        return;
      }

      setReport(res.data);
      const updRes = await axios.get(`http://localhost:8080/api/reports/${id}/updates`);
      if (Array.isArray(updRes.data)) setUpdates(updRes.data);
      setMessage('✓ Report marked as Resolved! The citizen has been notified to verify.');
      setTimeout(() => setMessage(''), 5000);
    } catch (e) {
      const errMsg = e.response?.data || 'Error resolving report. Please try again.';
      setMessage(`❌ ${errMsg}`);
      if (e.response?.status === 400 && errMsg.includes('away')) setGpsStatus('far');
    } finally {
      setResolving(false);
    }
  };

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
    </div>
  );

  if (!report) return <div className="p-8 text-center text-slate-500">Report not found.</div>;

  const isResolved = report.status === 'Resolved' || report.status === 'Closed';

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <button onClick={() => navigate('/staff/tasks')}
        className="flex items-center gap-2 text-slate-400 hover:text-violet-400 font-bold transition-colors group text-sm">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to My Tasks
      </button>

      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-10 relative">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-violet-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full text-white">
                  TKT-{String(report.id).padStart(3, '0')}
                </span>
                <span className="bg-slate-700 text-slate-300 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                  <Tag size={10} className="inline mr-1" />{report.category}
                </span>
              </div>
              <h1 className="text-2xl font-black text-white uppercase">{report.title}</h1>
              <p className="flex items-center gap-2 text-slate-400 text-sm">
                <MapPin size={14} className="text-violet-400" /> {report.location}
              </p>
              <p className="flex items-center gap-2 text-slate-500 text-xs">
                <Calendar size={13} /> {report.createdAt ? new Date(report.createdAt).toLocaleString() : '—'}
              </p>
            </div>
            <span className={`px-6 py-2.5 rounded-2xl font-black uppercase text-sm tracking-widest
              ${isResolved ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
              {isResolved ? 'Resolved' : 'In Progress'}
            </span>
          </div>
          <div className="absolute top-0 right-0 p-10 opacity-5"><ShieldCheck size={120} /></div>
        </div>

        {/* Description + Photos */}
        <div className="p-8 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-2">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Issue Description</p>
            <p className="text-sm font-medium text-slate-300 leading-relaxed bg-slate-800/50 rounded-2xl px-5 py-4 border border-slate-700/50 italic">
              "{report.description || 'No description.'}"
            </p>
          </div>
          {report.imagePath && (
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Citizen Evidence Photo</p>
              <img src={`http://localhost:8080${report.imagePath}`}
                className="w-full h-36 object-cover rounded-2xl border border-slate-700" alt="Evidence" />
            </div>
          )}
          {report.proofImagePath && (
            <div className="space-y-2">
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Your Proof Photo ✓</p>
              <img src={`http://localhost:8080${report.proofImagePath}`}
                className="w-full h-36 object-cover rounded-2xl border border-emerald-700/50" alt="Proof" />
            </div>
          )}
        </div>
      </div>

      {!isResolved ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* GPS Check */}
          <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 space-y-6">
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-tight">Step 1: Verify Location</h2>
              <p className="text-xs text-slate-500 mt-1">You must be within 200m of the issue to resolve it.</p>
            </div>

            {gpsStatus === 'idle' && (
              <button onClick={checkLocation}
                className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-violet-900/50">
                <Navigation size={18} /> Check My Location
              </button>
            )}

            {gpsStatus === 'checking' && (
              <div className="flex items-center justify-center gap-3 py-6">
                <Loader2 className="animate-spin text-violet-400" size={24} />
                <p className="text-slate-300 font-bold">Getting your GPS location...</p>
              </div>
            )}

            {gpsStatus === 'near' && (
              <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-2xl p-6 text-center space-y-2">
                <CheckCircle2 size={36} className="text-emerald-400 mx-auto" />
                <p className="text-emerald-400 font-black text-lg">Location Verified! ✓</p>
                {distanceToIssue !== null && (
                  <p className="text-emerald-300/60 text-xs font-bold">You are {distanceToIssue}m from the issue</p>
                )}
                <button onClick={checkLocation} className="text-slate-500 text-xs underline mt-2">Re-check location</button>
              </div>
            )}

            {gpsStatus === 'far' && (
              <div className="bg-red-900/20 border border-red-700/30 rounded-2xl p-6 text-center space-y-2">
                <AlertTriangle size={36} className="text-red-400 mx-auto" />
                <p className="text-red-400 font-black">Wrong Location!</p>
                <p className="text-red-300/80 text-sm font-medium">
                  You are {distanceToIssue !== null ? `${distanceToIssue}m` : 'too far'} away from the issue.
                  Please go to the correct location.
                </p>
                <button onClick={checkLocation}
                  className="mt-3 flex items-center justify-center gap-2 mx-auto bg-slate-800 text-slate-300 hover:text-white font-bold text-sm px-5 py-2 rounded-xl transition-all border border-slate-700">
                  <Navigation size={15} /> Try Again
                </button>
              </div>
            )}

            {gpsStatus === 'error' && (
              <div className="bg-red-900/20 border border-red-700/30 rounded-2xl p-6 text-center">
                <AlertTriangle size={32} className="text-red-400 mx-auto mb-3" />
                <p className="text-red-400 font-bold text-sm">GPS Error — Enable location access and try again.</p>
                <button onClick={checkLocation}
                  className="mt-3 bg-slate-800 text-slate-300 font-bold text-xs px-5 py-2 rounded-xl hover:bg-slate-700 transition-all">
                  Retry
                </button>
              </div>
            )}
          </div>

          {/* Photo Upload + Resolve */}
          <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 space-y-6">
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-tight">Step 2: Upload Proof & Resolve</h2>
              <p className="text-xs text-slate-500 mt-1">Take a photo showing the issue has been fixed.</p>
            </div>

            {/* Image Upload */}
            <label className={`block cursor-pointer border-2 border-dashed rounded-2xl transition-all
              ${proofPreview ? 'border-violet-600/50' : 'border-slate-700 hover:border-violet-600/40'}`}>
              <input type="file" accept="image/*" capture="environment" onChange={handleImageChange} className="hidden" />
              {proofPreview ? (
                <div className="relative">
                  <img src={proofPreview} className="w-full h-48 object-cover rounded-2xl" alt="Preview" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl opacity-0 hover:opacity-100 transition-opacity">
                    <p className="text-white font-bold text-sm">Click to change photo</p>
                  </div>
                </div>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center gap-3 text-slate-500">
                  <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center">
                    <Camera size={28} />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-sm text-slate-400">Tap to take / select a photo</p>
                    <p className="text-xs text-slate-600 mt-1">JPG, PNG accepted</p>
                  </div>
                </div>
              )}
            </label>

            {message && (
              <div className={`px-4 py-3 rounded-2xl text-sm font-bold border ${
                message.startsWith('✓') ? 'bg-emerald-900/30 text-emerald-400 border-emerald-700/30'
                : 'bg-red-900/30 text-red-400 border-red-700/30'}`}>
                {message}
              </div>
            )}

            <button
              onClick={handleResolve}
              disabled={resolving || gpsStatus !== 'near'}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-emerald-900/50 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed">
              {resolving ? <Loader2 className="animate-spin" size={18} /> : <><CheckCircle2 size={18} /> Mark as Resolved & Notify Citizen</>}
            </button>

            {gpsStatus !== 'near' && (
              <p className="text-center text-xs text-slate-600 font-bold">Complete location check first to enable resolve.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-[2rem] p-10 text-center space-y-3">
          <CheckCircle2 size={48} className="text-emerald-400 mx-auto" />
          <h2 className="text-2xl font-black text-emerald-400">Issue Resolved!</h2>
          <p className="text-slate-400 font-medium">
            {report.status === 'Closed' ? 'This ticket has been verified and closed by the citizen.' : 'Awaiting citizen verification at the location.'}
          </p>
        </div>
      )}

      {/* Update History */}
      {updates.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 space-y-5">
          <h2 className="text-base font-black text-white uppercase tracking-tight">Update History</h2>
          <div className="relative space-y-5">
            <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-800 rounded-full" />
            {updates.map((upd, idx) => (
              <div key={upd.id || idx} className="flex gap-5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center z-10 shrink-0 border
                  ${upd.status?.toLowerCase() === 'closed' ? 'bg-slate-700 border-slate-600 text-slate-300' :
                    upd.status?.toLowerCase() === 'resolved' ? 'bg-emerald-900/40 border-emerald-700/30 text-emerald-400'
                    : 'bg-amber-900/40 border-amber-700/30 text-amber-400'}`}>
                  {upd.status?.toLowerCase() === 'closed' || upd.status?.toLowerCase() === 'resolved'
                    ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm font-black text-slate-200 uppercase">{upd.status}</p>
                  {upd.comment && <p className="text-xs text-slate-400 mt-0.5">{upd.comment}</p>}
                  <p className="text-[10px] text-slate-600 mt-1">{upd.createdAt ? new Date(upd.createdAt).toLocaleString() : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffReportDetail;
