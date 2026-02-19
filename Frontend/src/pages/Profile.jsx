import { useState, useEffect } from 'react';
import { getUserProfile, updateUserProfile } from '../services/userService';
import { User, Mail, Phone, MapPin, Save, Award } from 'lucide-react';

const Profile = () => {
    const userLocal = JSON.parse(localStorage.getItem('user'));
    const [userData, setUserData] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        area: '',
        civicCoins: 0
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await getUserProfile(userLocal.id);
                setUserData(response.data);
            } catch (err) {
                console.error('Failed to fetch profile:', err);
                setMessage('Error loading profile. Check backend connection.');
            } finally {
                setLoading(false);
            }
        };
        if (userLocal?.id) fetchProfile();
    }, [userLocal?.id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        try {
            const response = await updateUserProfile(userLocal.id, userData);
            setUserData(response.data);
            // Also update local storage so navbar/sidebar see the new data
            localStorage.setItem('user', JSON.stringify(response.data));
            setMessage('Profile updated successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error('Failed to update profile:', err);
            setMessage('Error updating profile. Check if server is running!');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-slate-500">Loading profile...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Your Profile</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Score Card */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-emerald-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-emerald-100 flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 mb-4">
                            <Award size={40} className="text-white" />
                        </div>
                        <h2 className="text-2xl font-black">{userData.civicCoins || 0} <span className="text-lg">CC</span></h2>
                        <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mt-1">Civic Coins</p>
                        <p className="text-emerald-50/70 text-[10px] mt-4 leading-relaxed font-medium">
                            Earn CC by reporting issues and helping your community.
                        </p>
                    </div>
                </div>

                {/* Form Card */}
                <div className="md:col-span-2">
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-xl shadow-slate-200/40 p-10">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {message && (
                                <div className={`px-4 py-3 rounded-2xl text-sm font-medium ${
                                    message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                                }`}>
                                    {message}
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input 
                                            type="text"
                                            value={userData.fullName || ''}
                                            onChange={(e) => setUserData({...userData, fullName: e.target.value})}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email (Locked)</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input 
                                            type="email"
                                            value={userData.email || ''}
                                            disabled
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-slate-400"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                    <div className="relative group flex">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-400 group-focus-within:text-emerald-500 transition-colors z-10 pointer-events-none">
                                            <Phone size={18} />
                                            <span className="text-sm font-bold border-r border-slate-200 pr-2">+91</span>
                                        </div>
                                        <input 
                                            type="text"
                                            value={userData.phoneNumber || ''}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, ''); // Only digits
                                                if (val.length <= 10) {
                                                    setUserData({...userData, phoneNumber: val});
                                                }
                                            }}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-24 pr-4 text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all font-medium tracking-wider"
                                            placeholder="9876543210"
                                            maxLength={10}
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400 ml-1 font-medium">Enter 10 digit mobile number</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Your Area/Ward</label>
                                    <div className="relative group">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input 
                                            type="text"
                                            value={userData.area || ''}
                                            onChange={(e) => setUserData({...userData, area: e.target.value})}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all"
                                            placeholder="Springfield West"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={saving}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                            >
                                {saving ? 'Saving Changes...' : <><Save size={20} /> Update Profile</>}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
