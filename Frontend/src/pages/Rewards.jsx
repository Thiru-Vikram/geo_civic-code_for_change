import { useState, useEffect } from "react";
import { redeemReward, getUserDetails } from "../services/userService";
import {
  Coins,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  Star,
  Sparkles,
  Lock,
  Trophy,
  Gift,
  X,
} from "lucide-react";

const REWARDS = [
  {
    id: 1,
    name: "GeoCivic Badge",
    emoji: "🏅",
    description: "Exclusive enamel pin badge for active civic reporters.",
    cost: 100,
    category: "Accessory",
    color: "amber",
    stock: "Available",
  },
  {
    id: 2,
    name: "GeoCivic Cap",
    emoji: "🧢",
    description: "Embroidered cap — show your civic pride everywhere you go.",
    cost: 300,
    category: "Apparel",
    color: "blue",
    stock: "Available",
  },
  {
    id: 3,
    name: "GeoCivic Tote Bag",
    emoji: "👜",
    description: "Eco-friendly canvas tote bag printed with the GeoCivic logo.",
    cost: 200,
    category: "Accessory",
    color: "emerald",
    stock: "Available",
  },
  {
    id: 4,
    name: "GeoCivic Water Bottle",
    emoji: "🍶",
    description: "Stainless steel insulated bottle. Stay hydrated, stay civic!",
    cost: 250,
    category: "Lifestyle",
    color: "cyan",
    stock: "Available",
  },
  {
    id: 5,
    name: "GeoCivic T-Shirt",
    emoji: "👕",
    description: "Premium cotton tee. The ultimate badge of a civic champion.",
    cost: 500,
    category: "Apparel",
    color: "violet",
    stock: "Available",
  },
  {
    id: 6,
    name: "GeoCivic Hoodie",
    emoji: "🧥",
    description: "Heavyweight zip-up hoodie for the most dedicated civic hero.",
    cost: 700,
    category: "Apparel",
    color: "rose",
    stock: "Limited",
  },
  {
    id: 7,
    name: "Civic Champion Trophy",
    emoji: "🏆",
    description: "A real engraved trophy for the top contributor of the month.",
    cost: 1000,
    category: "Award",
    color: "amber",
    stock: "Rare",
  },
  {
    id: 8,
    name: "Gift Hamper",
    emoji: "🎁",
    description: "A curated box of GeoCivic goodies — the full collection!",
    cost: 1500,
    category: "Bundle",
    color: "pink",
    stock: "Limited",
  },
];

const COLOR_MAP = {
  amber: {
    bg: "bg-amber-50",
    border: "border-amber-100",
    icon: "bg-amber-100 text-amber-600",
    badge: "bg-amber-100 text-amber-700",
    btn: "bg-amber-500 hover:bg-amber-600",
    shadow: "shadow-amber-100",
  },
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-100",
    icon: "bg-blue-100 text-blue-600",
    badge: "bg-blue-100 text-blue-700",
    btn: "bg-blue-600 hover:bg-blue-700",
    shadow: "shadow-blue-100",
  },
  emerald: {
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    icon: "bg-emerald-100 text-emerald-600",
    badge: "bg-emerald-100 text-emerald-700",
    btn: "bg-emerald-600 hover:bg-emerald-700",
    shadow: "shadow-emerald-100",
  },
  cyan: {
    bg: "bg-cyan-50",
    border: "border-cyan-100",
    icon: "bg-cyan-100 text-cyan-600",
    badge: "bg-cyan-100 text-cyan-700",
    btn: "bg-cyan-600 hover:bg-cyan-700",
    shadow: "shadow-cyan-100",
  },
  violet: {
    bg: "bg-violet-50",
    border: "border-violet-100",
    icon: "bg-violet-100 text-violet-600",
    badge: "bg-violet-100 text-violet-700",
    btn: "bg-violet-600 hover:bg-violet-700",
    shadow: "shadow-violet-100",
  },
  rose: {
    bg: "bg-rose-50",
    border: "border-rose-100",
    icon: "bg-rose-100 text-rose-600",
    badge: "bg-rose-100 text-rose-700",
    btn: "bg-rose-600 hover:bg-rose-700",
    shadow: "shadow-rose-100",
  },
  pink: {
    bg: "bg-pink-50",
    border: "border-pink-100",
    icon: "bg-pink-100 text-pink-600",
    badge: "bg-pink-100 text-pink-700",
    btn: "bg-pink-600 hover:bg-pink-700",
    shadow: "shadow-pink-100",
  },
};

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const Rewards = () => {
  const [coins, setCoins] = useState(0);
  const [confirmItem, setConfirmItem] = useState(null);
  const [redeeming, setRedeeming] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', msg }
  const [redeemed, setRedeemed] = useState([]); // ids redeemed this session

  useEffect(() => {
    const user = getUser();
    if (user?.civicCoins != null) setCoins(user.civicCoins);
    if (user?.id) {
      getUserDetails(user.id)
        .then((res) => {
          if (res.data?.civicCoins != null) setCoins(res.data.civicCoins);
        })
        .catch(() => {});
    }
  }, []);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handleRedeem = async () => {
    if (!confirmItem) return;
    const user = getUser();
    if (!user?.id) return;
    setRedeeming(true);
    try {
      const res = await redeemReward(
        user.id,
        confirmItem.cost,
        confirmItem.name,
      );
      const updatedUser = res.data;
      const newCoins = updatedUser.civicCoins ?? 0;
      setCoins(newCoins);
      // Sync localStorage
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.civicCoins = newCoins;
        localStorage.setItem("user", JSON.stringify(parsed));
        window.dispatchEvent(new Event("storage"));
      }
      setRedeemed((prev) => [...prev, confirmItem.id]);
      setConfirmItem(null);
      showToast(
        "success",
        `🎉 ${confirmItem.emoji} "${confirmItem.name}" redeemed! It will be delivered to your registered address.`,
      );
    } catch (e) {
      const errMsg = e.response?.data || "Failed to redeem. Please try again.";
      setConfirmItem(null);
      showToast("error", errMsg);
    } finally {
      setRedeeming(false);
    }
  };

  const stockBadge = (stock) => {
    if (stock === "Limited") return "bg-orange-100 text-orange-700";
    if (stock === "Rare") return "bg-red-100 text-red-700";
    return "bg-emerald-100 text-emerald-700";
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 max-w-sm px-5 py-4 rounded-2xl shadow-xl border text-sm font-bold flex items-start gap-3 transition-all animate-fade-in
            ${toast.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"}`}
        >
          {toast.type === "success" ? (
            <CheckCircle2
              size={18}
              className="text-emerald-600 shrink-0 mt-0.5"
            />
          ) : (
            <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
          )}
          <p className="flex-1 leading-relaxed">{toast.msg}</p>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl space-y-6 border border-slate-100">
            <div className="text-center space-y-3">
              <div className="text-6xl">{confirmItem.emoji}</div>
              <h2 className="text-lg font-black text-slate-900">
                {confirmItem.name}
              </h2>
              <p className="text-sm text-slate-500">
                {confirmItem.description}
              </p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4 flex justify-between items-center">
              <span className="text-sm font-bold text-slate-600">Cost</span>
              <span className="text-lg font-black text-emerald-700 flex items-center gap-1.5">
                <Coins size={17} className="text-emerald-500" />{" "}
                {confirmItem.cost} CC
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 flex justify-between items-center">
              <span className="text-sm font-bold text-slate-600">
                Your Balance After
              </span>
              <span
                className={`text-lg font-black flex items-center gap-1.5 ${coins - confirmItem.cost < 0 ? "text-red-600" : "text-slate-800"}`}
              >
                <Coins size={17} className="text-slate-400" />{" "}
                {coins - confirmItem.cost} CC
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmItem(null)}
                className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleRedeem}
                disabled={redeeming}
                className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {redeeming ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Redeeming…
                  </span>
                ) : (
                  <>
                    <Gift size={16} /> Confirm Redeem
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Trophy size={30} className="text-amber-500" /> Rewards Store
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Exchange your CC Coins for exclusive GeoCivic goodies.
          </p>
        </div>
        {/* Coin balance */}
        <div className="flex items-center gap-3 bg-white border border-emerald-100 rounded-2xl px-5 py-3 shadow-sm self-start">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Coins size={20} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Your Balance
            </p>
            <p className="text-2xl font-black text-emerald-700 leading-tight">
              {coins}{" "}
              <span className="text-sm font-bold text-emerald-500">CC</span>
            </p>
          </div>
        </div>
      </div>

      {/* How it works banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-[2rem] p-6 flex flex-col sm:flex-row items-center gap-5 text-white">
        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
          <Sparkles size={28} />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h3 className="font-black text-lg">How to earn CC Coins?</h3>
          <p className="text-emerald-100 text-sm mt-0.5 font-medium">
            Report civic issues (+10 CC) · Get issue resolved (+25 CC) · Verify
            fix at location (+50 CC). Spend them here!
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          {[
            { label: "Report", coins: "+10" },
            { label: "Resolved", coins: "+25" },
            { label: "Verified", coins: "+50" },
          ].map((s) => (
            <div
              key={s.label}
              className="text-center bg-white/20 rounded-xl px-3 py-2"
            >
              <p className="text-lg font-black">{s.coins}</p>
              <p className="text-[10px] font-bold text-emerald-100 uppercase">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {REWARDS.map((item) => {
          const c = COLOR_MAP[item.color] || COLOR_MAP.emerald;
          const canAfford = coins >= item.cost;
          const isRedeemed = redeemed.includes(item.id);
          return (
            <div
              key={item.id}
              className={`bg-white border rounded-[2rem] overflow-hidden shadow-sm transition-all duration-300
                ${isRedeemed ? "border-emerald-200 ring-2 ring-emerald-300/50" : canAfford ? `${c.border} hover:shadow-lg hover:shadow-slate-100 hover:-translate-y-0.5` : "border-slate-100 opacity-70"}`}
            >
              {/* Card top */}
              <div className={`${c.bg} p-6 flex flex-col items-center gap-3`}>
                <div className="text-5xl">{item.emoji}</div>
                <div
                  className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${stockBadge(item.stock)}`}
                >
                  {item.stock}
                </div>
              </div>
              {/* Card body */}
              <div className="p-5 space-y-3">
                <div>
                  <span
                    className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${c.badge}`}
                  >
                    {item.category}
                  </span>
                  <h3 className="text-sm font-black text-slate-900 mt-2">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5">
                    <Coins size={15} className="text-emerald-500" />
                    <span className="text-base font-black text-slateald-900">
                      {item.cost}
                    </span>
                    <span className="text-xs font-bold text-slate-400">CC</span>
                  </div>
                  {isRedeemed ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-black">
                      <CheckCircle2 size={16} /> Redeemed
                    </div>
                  ) : canAfford ? (
                    <button
                      onClick={() => setConfirmItem(item)}
                      className={`${c.btn} text-white text-xs font-black px-4 py-2 rounded-xl transition-all active:scale-95 flex items-center gap-1.5 shadow-sm`}
                    >
                      <ShoppingBag size={13} /> Redeem
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                      <Lock size={13} /> Need {item.cost - coins} more
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom tip */}
      <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-5">
        <Star size={20} className="text-amber-500 shrink-0" />
        <p className="text-sm font-medium text-amber-800">
          <span className="font-black">Pro tip:</span> Items marked{" "}
          <span className="font-bold">Limited</span> or{" "}
          <span className="font-bold">Rare</span> may sell out — redeem early to
          secure yours!
        </p>
      </div>
    </div>
  );
};

export default Rewards;
