import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { 
  ChefHat, 
  UtensilsCrossed, 
  BellRing, 
  Receipt, 
  CheckCircle2, 
  Clock, 
  Plus, 
  ArrowRight 
} from "lucide-react";

// --- SOCKET CONFIGURATION ---
const socket = io(process.env.REACT_APP_API_BASE || "http://localhost:5000", {
  transports: ["websocket"],
});

// --- CONSTANTS ---
const STATUSES = ["waiting", "accepted", "preparing", "cooked", "served"];

const STATUS_CONFIG = {
  waiting: { label: "Waiting for Confirmation", icon: Clock, desc: "Sending your request to the kitchen..." },
  accepted: { label: "Order Accepted", icon: CheckCircle2, desc: " The chef has seen your order." },
  preparing: { label: "Preparing Your Meal", icon: ChefHat, desc: "Ingredients are being chopped and cooked." },
  cooked: { label: "Order Cooked", icon: UtensilsCrossed, desc: "Plating up your delicious meal." },
  served: { label: "Served", icon: BellRing, desc: "Enjoy your dining experience!" },
};

export default function AfterOrder() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State from props/location
  const orderId = location.state?.orderId || "ORD-#8821"; // Fallback for preview
  const tableId = localStorage.getItem("tableId") || "walkin";

  // Logic State
  const [status, setStatus] = useState("preparing"); // Defaulting to 'preparing' for preview visualization
  const [etaSeconds, setEtaSeconds] = useState(185); // Default sample time
  const [initialEta, setInitialEta] = useState(null);

  // --- SOCKET LOGIC ---
  useEffect(() => {
    // If no real orderId is present in a real app, we might return here. 
    // For this UI demo, we allow it to render with defaults if orderId is missing.
    if (!orderId) return;

    socket.emit("order:subscribe", { orderId });

    const handleUpdate = (data) => {
      if (data?.status) setStatus(data.status);
      if (typeof data?.etaSeconds === "number") {
        setEtaSeconds(data.etaSeconds);
        setInitialEta(data.etaSeconds);
      }
    };

    socket.on("order:update", handleUpdate);
    socket.on("orderServed", () => setStatus("served"));

    return () => {
      socket.emit("order:unsubscribe", { orderId });
      socket.off("order:update", handleUpdate);
      socket.off("orderServed");
    };
  }, [orderId]);

  // --- TIMER LOGIC ---
  useEffect(() => {
    if (etaSeconds == null || etaSeconds <= 0) return;
    const t = setInterval(() => {
      setEtaSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [etaSeconds]);

  const etaStr = useMemo(() => {
    if (etaSeconds == null) return "—";
    const m = Math.floor(etaSeconds / 60);
    const s = etaSeconds % 60;
    return `${m}m ${s}s`;
  }, [etaSeconds]);

  // --- HANDLERS ---
  const handleOrderMore = () => navigate("/");
  const handleProceedToBill = () => navigate("/bill", { state: { orderId } });
  
  const callWaiter = () => {
    socket.emit("callWaiter", { tableId, orderId });
    // Using a custom toast/notification would be better, but alert works for now
    alert("🛎️ Waiter has been notified!");
  };

  // --- RENDER HELPERS ---
  const stepIndex = STATUSES.indexOf(status);
  const currentProgress = ((stepIndex) / (STATUSES.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-orange-500 selection:text-white overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/90 to-slate-900/80"></div>
      </div>

      {/* Navbar Placeholder */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
           <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xl">
             <UtensilsCrossed size={20} />
           </div>
           <span className="text-xl font-bold tracking-tight">SmartDine</span>
        </div>
        <div className="text-sm text-slate-400">Table: <span className="text-orange-400 font-semibold">{tableId}</span></div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[80vh]">
        
        {/* Status Card */}
        <div className="w-full max-w-2xl bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden">
          
          {/* Header Section */}
          <div className="p-8 text-center border-b border-slate-700/50">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Order Received
            </h1>
            <p className="text-slate-400">
              Order ID: <span className="font-mono text-orange-400">{orderId}</span>
            </p>

            {/* ETA Display */}
            {status !== "served" && status !== "waiting" && (
              <div className="mt-6 inline-flex items-center gap-3 px-6 py-3 bg-slate-900/50 rounded-full border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
                <Clock className="text-orange-500 animate-pulse" size={20} />
                <span className="text-lg font-medium text-slate-200">
                  Estimated Time: <span className="text-white font-bold">{etaStr}</span>
                </span>
              </div>
            )}
            
             {status === "served" && (
               <div className="mt-6 inline-flex items-center gap-3 px-6 py-3 bg-green-900/30 rounded-full border border-green-500/30">
                 <BellRing className="text-green-500" size={20} />
                 <span className="text-lg font-medium text-green-100">
                   Bon Appétit!
                 </span>
               </div>
             )}
          </div>

          {/* Timeline Section */}
          <div className="p-8 bg-slate-800/40">
            <div className="relative">
              {/* Vertical Line Background */}
              <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-slate-700" />
              
              {/* Progress Line (Dynamic) */}
               <div 
                className="absolute left-8 top-4 w-0.5 bg-orange-500 transition-all duration-1000 ease-out"
                style={{ height: `${Math.max(0, (stepIndex / (STATUSES.length - 1)) * 100 - 10)}%` }}
              />

              <div className="space-y-8 relative">
                {STATUSES.map((s, i) => {
                  const isCompleted = i < stepIndex;
                  const isCurrent = i === stepIndex;
                  const config = STATUS_CONFIG[s];
                  const Icon = config.icon;

                  return (
                    <div key={s} className={`flex items-start gap-6 group ${i > stepIndex ? 'opacity-40 grayscale' : 'opacity-100'}`}>
                      {/* Icon Circle */}
                      <div className={`
                        relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-all duration-500
                        ${isCurrent 
                          ? "bg-slate-900 border-orange-500 text-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.3)] scale-110" 
                          : isCompleted 
                            ? "bg-orange-500 border-orange-500 text-white" 
                            : "bg-slate-800 border-slate-600 text-slate-500"
                        }
                      `}>
                        <Icon size={28} strokeWidth={isCurrent ? 2.5 : 2} />
                        
                        {/* Pulse effect for current item */}
                        {isCurrent && (
                          <span className="absolute inset-0 rounded-2xl bg-orange-400 opacity-20 animate-ping"></span>
                        )}
                      </div>

                      {/* Text Content */}
                      <div className={`pt-2 transition-all duration-500 ${isCurrent ? 'translate-x-2' : ''}`}>
                        <h3 className={`text-lg font-bold mb-1 ${isCurrent ? "text-orange-400" : "text-white"}`}>
                          {config.label}
                        </h3>
                        <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
                          {config.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-6 bg-slate-900/50 border-t border-slate-700/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
             <div className="flex gap-3 w-full sm:w-auto">
               <button 
                onClick={handleOrderMore}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-all border border-slate-700 hover:border-slate-500"
               >
                 <Plus size={18} />
                 Add Items
               </button>
               
               <button 
                onClick={callWaiter}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-all border border-slate-700 hover:border-slate-500"
               >
                 <BellRing size={18} />
                 Call Waiter
               </button>
             </div>

             <button
              onClick={handleProceedToBill}
              disabled={status !== "served"}
              className={`
                w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold transition-all shadow-lg
                ${status === "served"
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white shadow-orange-500/20 cursor-pointer transform hover:-translate-y-0.5"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                }
              `}
             >
               <span>View Bill</span>
               <ArrowRight size={18} />
             </button>
          </div>

        </div>
      </main>
    </div>
  );
}