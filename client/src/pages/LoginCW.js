// src/pages/LoginCW.jsx

import React, {
  useState,
  useEffect,
  useRef,
  useContext
} from "react";
import * as THREE from "three";
import {
  ChefHat,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react";

import API from "../api";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom"; // Removed 'Link' as it is no longer used

export default function LoginCW() {
  const canvasRef = useRef(null);

  // --- Auth State ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  // --- UI State ---
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // --- Modal State ---
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("Login Failed");
  const [modalMessage, setModalMessage] = useState("");

  const hideModal = () => setModalOpen(false);

  // 🔐 STAFF LOGIN LOGIC
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setIsSuccess(false);

    try {
      // 🔑 Staff Endpoint
      const res = await API.post("/auth/staff-login", { email, password });

      // ✅ Get role from the API response
      const role = res.data.user?.role || "staff";

      // store in localStorage
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", role);
      setUser(res.data.user);

      setIsSuccess(true);
      setModalOpen(false);

      // ✅ Navigate based on role
      setTimeout(() => {
        if (role === "cook") {
          navigate("/cook-dashboard");
        } else if (role === "waiter") {
          navigate("/waiter-dashboard");
        } else {
          navigate("/TableSelector"); // Fallback
        }
      }, 800); 

    } catch (err) {
      console.error("Staff login error:", err);
      setIsSuccess(false);
      setModalTitle("Access Denied");
      setModalMessage("Invalid staff credentials. Please check your email and password.");
      setModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  // --- THREE.JS BACKGROUND ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0f172a, 0.002);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      1,
      1000
    );
    camera.position.z = 100;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const particleCount = 700;
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const sizes = [];
    const speeds = [];

    for (let i = 0; i < particleCount; i++) {
      positions.push((Math.random() * 2 - 1) * 300);
      positions.push((Math.random() * 2 - 1) * 200);
      positions.push((Math.random() * 2 - 1) * 100);

      sizes.push(Math.random() * 2);
      speeds.push(Math.random() * 0.2 + 0.05);
    }

    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1));
    geometry.userData = { speeds: speeds };

    const getTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext("2d");
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);
      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    };

    const material = new THREE.PointsMaterial({
      color: 0xf59e0b, // Amber-500
      size: 1.5,
      map: getTexture(),
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    let mouseX = 0;
    let mouseY = 0;

    const onMouseMove = (event) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const positions = particles.geometry.attributes.position.array;
      const speeds = particles.geometry.userData.speeds;

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += speeds[i];
        if (positions[i * 3 + 1] > 100) {
          positions[i * 3 + 1] = -100;
          positions[i * 3] = (Math.random() * 2 - 1) * 300;
        }
      }
      particles.geometry.attributes.position.needsUpdate = true;

      particles.rotation.x += 0.0005;
      particles.rotation.y += 0.0005;

      camera.position.x += (mouseX * 10 - camera.position.x) * 0.05;
      camera.position.y += (-mouseY * 10 - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    animate();
    document.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", onResize);

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    return () => {
      cancelAnimationFrame(animationId);
      document.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  return (
    <div className="min-h-screen overflow-hidden font-sans antialiased text-white relative">

      <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1556910103-1c02745a30bf?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')",
        }}
      />
      <div className="fixed inset-0 z-1"
        style={{ backgroundColor: "rgba(15, 23, 42, 0.90)" }}
      />
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-2 pointer-events-none opacity-80"
      />

      <div className="flex items-center justify-center w-full h-screen relative z-10 px-4">
        <div className="w-full max-w-[420px] animate-fade-in-up">

          <div className="bg-gray-900/60 backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-10 border border-white/10 relative overflow-hidden">
            {/* Gradient Top Bar */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600" />

            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 shadow-lg shadow-amber-500/20 mb-6 transform rotate-3 hover:rotate-6 transition-transform">
                <ChefHat className="w-8 h-8 text-white" />
              </div>

              <h1 className="text-3xl font-black tracking-tight text-white mb-2">
                Staff Portal
              </h1>
              <p className="text-gray-400 text-sm font-medium">
                Cook / Waiter — Access your station.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>

              {/* EMAIL */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-gray-400 tracking-wider ml-1">
                  Email
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-amber-500 transition-colors" />
                  </div>
                  <input
                    type="email"
                    placeholder="staff@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all outline-none text-sm font-medium"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-gray-400 tracking-wider ml-1">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-amber-500 transition-colors" />
                  </div>

                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Staff password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    // Hiding the browser's native eye icon
                    className="w-full pl-11 pr-12 py-3.5 bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all outline-none text-sm font-medium [&::-webkit-password-reveal-button]:hidden [&::-ms-reveal]:hidden"
                  />

                  {/* CUSTOM EYE BUTTON */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-1 right-1 px-2 flex items-center 
                      bg-gray-700/40 hover:bg-amber-500/20 
                      rounded-lg transition-all text-amber-300 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* REMEMBER ME */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-amber-500 focus:ring-offset-gray-900 focus:ring-amber-500 transition-colors"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <span className="ml-2 text-gray-400 group-hover:text-gray-300 transition-colors">
                    Remember me
                  </span>
                </label>
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl shadow-lg font-bold text-white transition-all duration-200 transform active:scale-[0.98] ${isLoading
                    ? "opacity-80 cursor-wait"
                    : isSuccess
                      ? "bg-green-600 hover:bg-green-500 shadow-green-900/20"
                      : "bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 shadow-amber-900/20"
                  }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : isSuccess ? (
                  <span>Welcome Back</span>
                ) : (
                  <>
                    <span>Login as Staff</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
            
            {/* FOOTER REMOVED */}

          </div>
        </div>
      </div>

      {/* ERROR MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-gray-900 border border-white/10 p-6 rounded-2xl shadow-2xl w-full max-w-xs text-center relative">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{modalTitle}</h3>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              {modalMessage}
            </p>
            <button
              onClick={hideModal}
              className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors border border-gray-700"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

    </div>
  );
}