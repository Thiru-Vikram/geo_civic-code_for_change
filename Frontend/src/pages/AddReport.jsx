import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Plus, 
  MapPin, 
  Type, 
  AlignLeft, 
  Layers, 
  Camera, 
  X,
  Navigation2,
  Loader2
} from 'lucide-react';

const AddReport = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const [formData, setFormData] = useState({
    title: '',
    category: 'Roads',
    location: '',
    description: '',
    latitude: null,
    longitude: null
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState('');

  const handleLocationFetch = () => {
    setLocating(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      setFormData(prev => ({ ...prev, latitude, longitude }));

      try {
        // Reverse Geocoding using Nominatim (Free)
        const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const address = response.data.display_name;
        setFormData(prev => ({ ...prev, location: address }));
      } catch (err) {
        console.error("Geocoding failed", err);
        setFormData(prev => ({ ...prev, location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }));
      } finally {
        setLocating(false);
      }
    }, (error) => {
      console.error(error);
      alert("Unable to retrieve your location");
      setLocating(false);
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const data = new FormData();
    data.append('title', formData.title);
    data.append('category', formData.category);
    data.append('location', formData.location);
    data.append('description', formData.description);
    data.append('userId', user.id);
    if (formData.latitude) data.append('latitude', formData.latitude);
    if (formData.longitude) data.append('longitude', formData.longitude);
    if (image) data.append('image', image);

    try {
      await axios.post('http://localhost:8080/api/reports', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage('Report submitted successfully!');
      setTimeout(() => navigate('/reports'), 2000);
    } catch (err) {
      console.error(err);
      setMessage('Failed to submit report. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create New Report</h1>
        <p className="text-slate-500 font-medium">Be the eyes of your community. Report issues as you see them.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-xl shadow-slate-200/40 overflow-hidden">
        {/* Banner Section */}
        <div className="bg-emerald-600 p-8 text-white relative">
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <Plus size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100">Quick Submission</p>
              <h2 className="text-xl font-bold">Issue Details</h2>
            </div>
          </div>
          <div className="absolute top-0 right-0 p-8 opacity-20 invisible md:visible">
            <Layers size={80} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-10">
          {message && (
            <div className={`p-4 rounded-2xl text-sm font-bold ${message.includes('success') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Title */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                <Type size={14} className="text-emerald-500" /> What's the issue?
              </label>
              <input 
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="e.g. Large pothole near entrance"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all font-medium"
              />
            </div>

            {/* Category */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                <Layers size={14} className="text-emerald-500" /> Category
              </label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-50"
              >
                <option>Roads</option>
                <option>Waste Management</option>
                <option>Street Lighting</option>
                <option>Water Leakage</option>
                <option>Public Parks</option>
              </select>
            </div>

            {/* Location */}
            <div className="space-y-3 md:col-span-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                <MapPin size={14} className="text-emerald-500" /> Where did you find this?
              </label>
              <div className="relative group">
                <input 
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="e.g. 123 Main St, Springfield"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-6 pr-44 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all font-medium"
                />
                <button 
                  type="button"
                  onClick={handleLocationFetch}
                  disabled={locating}
                  className="absolute right-3 top-1.5 bottom-1.5 bg-emerald-50 text-emerald-700 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-100 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {locating ? <Loader2 size={14} className="animate-spin" /> : <Navigation2 size={14} />}
                  {locating ? "Locating..." : "Get Location"}
                </button>
              </div>
            </div>

            {/* Photo Upload */}
            <div className="space-y-3 md:col-span-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                <Camera size={14} className="text-emerald-500" /> Attach Photo (Optional)
              </label>
              
              {!imagePreview ? (
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50/50 hover:bg-slate-50 hover:border-emerald-200 transition-all cursor-pointer group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <div className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 group-hover:text-emerald-500 transition-colors mb-2">
                      <Camera size={24} />
                    </div>
                    <p className="text-xs font-bold text-slate-500">Tap to upload a photo</p>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-black tracking-tighter">PNG, JPG or JPEG</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
              ) : (
                <div className="relative w-full h-64 rounded-[2rem] overflow-hidden border border-slate-100 shadow-lg">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={removeImage}
                    className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white p-2 rounded-xl hover:bg-red-500 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-3 md:col-span-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                <AlignLeft size={14} className="text-emerald-500" /> Tell us more
              </label>
              <textarea 
                rows="4"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Please provide details to help authorities identify and fix the issue faster..."
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all font-medium resize-none"
              ></textarea>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button 
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex-1 bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-all active:scale-[0.98]"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-[2] bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? <Loader2 size={24} className="animate-spin" /> : <>Publish Report <Plus size={20} /></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddReport;
