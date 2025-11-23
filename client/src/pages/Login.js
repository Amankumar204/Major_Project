// src/pages/SmartDineLogin.jsx  (or Login.jsx if you replace the old one)

import React, {
  useState,
  useEffect,
  useRef,
  useContext
} from "react";
import * as THREE from "three";
import {
  Utensils,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle
} from "lucide-react";

import API from "../api";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const SmartDineLogin = () => {
  const canvasRef = useRef(null);

  // --- auth state (same functionality as your old Login.jsx) ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  // --- UI state (design sugar) ---
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("Login Failed");
  const [modalMessage, setModalMessage] = useState("");

  const hideModal = () => setModalOpen(false);

  // 🔐 REAL LOGIN USING YOUR BACKEND
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setIsSuccess(false);

    try {
      // send email + password to your backend
      const res = await API.post("/auth/login", { email, password });

      const { token, user } = res.data;

      // same as your old component
      localStorage.setItem("token", token);
      localStorage.setItem("role", user.role);
      setUser(user);

      setIsSuccess(true);
      setModalOpen(false);

      // redirect to TableSelector
      navigate("/TableSelector");
    } catch (err) {
      console.error(err);
      setIsSuccess(false);
      setModalTitle("Auth Failed");
      setModalMessage("Invalid user credentials");
      setModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  // --- THREE.JS BACKGROUND (unchanged design part) ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.03);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    const foodGroup = new THREE.Group();
    scene.add(foodGroup);

    const createBurger = () => {
      const group = new THREE.Group();

      const bunMat = new THREE.MeshStandardMaterial({
        color: 0xf6ad55,
        roughness: 0.6
      });
      const meatMat = new THREE.MeshStandardMaterial({
        color: 0x5d4037,
        roughness: 0.8
      });
      const cheeseMat = new THREE.MeshStandardMaterial({
        color: 0xf6e05e,
        roughness: 0.4
      });
      const lettuceMat = new THREE.MeshStandardMaterial({
        color: 0x48bb78,
        roughness: 0.7
      });

      const botBun = new THREE.Mesh(
        new THREE.CylinderGeometry(0.9, 0.8, 0.3, 16),
        bunMat
      );
      botBun.position.y = -0.4;
      group.add(botBun);

      const meat = new THREE.Mesh(
        new THREE.CylinderGeometry(0.95, 0.95, 0.25, 16),
        meatMat
      );
      meat.position.y = -0.15;
      group.add(meat);

      const cheese = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.05, 1.8),
        cheeseMat
      );
      cheese.position.y = 0.0;
      cheese.rotation.y = Math.PI / 4;
      group.add(cheese);

      const lettuce = new THREE.Mesh(
        new THREE.CylinderGeometry(1.0, 1.0, 0.05, 12),
        lettuceMat
      );
      lettuce.position.y = 0.1;
      group.add(lettuce);

      const topBun = new THREE.Mesh(
        new THREE.SphereGeometry(0.9, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
        bunMat
      );
      topBun.position.y = 0.15;
      topBun.scale.y = 0.6;
      group.add(topBun);

      return group;
    };

    const createFries = () => {
      const group = new THREE.Group();

      const boxMat = new THREE.MeshStandardMaterial({ color: 0xe53e3e });
      const boxGeo = new THREE.BoxGeometry(1, 1.2, 0.5);
      const box = new THREE.Mesh(boxGeo, boxMat);
      box.position.y = -0.2;
      group.add(box);

      const fryMat = new THREE.MeshStandardMaterial({ color: 0xf6e05e });
      const fryGeo = new THREE.BoxGeometry(0.1, 1.2, 0.1);

      for (let i = 0; i < 8; i++) {
        const fry = new THREE.Mesh(fryGeo, fryMat);
        fry.position.y = 0.3 + Math.random() * 0.3;
        fry.position.x = (Math.random() - 0.5) * 0.8;
        fry.position.z = (Math.random() - 0.5) * 0.3;
        fry.rotation.z = (Math.random() - 0.5) * 0.3;
        group.add(fry);
      }
      return group;
    };

    const createDonut = () => {
      const doughMat = new THREE.MeshStandardMaterial({ color: 0xe2a76f });
      const icingMat = new THREE.MeshStandardMaterial({ color: 0xf687b3 });

      const donut = new THREE.Mesh(
        new THREE.TorusGeometry(0.6, 0.25, 12, 24),
        doughMat
      );
      const icing = new THREE.Mesh(
        new THREE.TorusGeometry(0.6, 0.26, 12, 24, Math.PI * 2),
        icingMat
      );
      icing.position.y = 0.05;
      icing.rotation.x = -Math.PI / 2;
      donut.rotation.x = -Math.PI / 2;

      const group = new THREE.Group();
      group.add(donut);
      group.add(icing);
      return group;
    };

    const createPizzaSlice = () => {
      const group = new THREE.Group();

      const crustMat = new THREE.MeshStandardMaterial({ color: 0xf6ad55 });
      const pepMat = new THREE.MeshStandardMaterial({ color: 0xc53030 });

      const sliceGeo = new THREE.CylinderGeometry(0, 1.2, 0.1, 3, 1);
      const slice = new THREE.Mesh(sliceGeo, crustMat);
      group.add(slice);

      const pep = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 0.12, 8),
        pepMat
      );
      pep.position.set(0, 0, 0.5);
      group.add(pep);

      const pep2 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 0.12, 8),
        pepMat
      );
      pep2.position.set(0.3, 0, 0.2);
      group.add(pep2);

      group.rotation.x = Math.PI / 2;
      return group;
    };

    const createIceCream = () => {
      const group = new THREE.Group();

      const coneMat = new THREE.MeshStandardMaterial({ color: 0xd69e2e });
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.5, 1.5, 16),
        coneMat
      );
      cone.rotation.x = Math.PI;
      cone.position.y = -0.5;
      group.add(cone);

      const scoopMat = new THREE.MeshStandardMaterial({ color: 0xfffff0 });
      const scoop = new THREE.Mesh(
        new THREE.SphereGeometry(0.55, 16, 16),
        scoopMat
      );
      scoop.position.y = 0.3;
      group.add(scoop);

      return group;
    };

    const itemGenerators = [
      createBurger,
      createFries,
      createDonut,
      createPizzaSlice,
      createIceCream
    ];

    const items = [];
    const itemCount = 20;

    for (let i = 0; i < itemCount; i++) {
      const generator =
        itemGenerators[Math.floor(Math.random() * itemGenerators.length)];
      const mesh = generator();

      mesh.position.x = (Math.random() - 0.5) * 25;
      mesh.position.y = (Math.random() - 0.5) * 25;
      mesh.position.z = (Math.random() - 0.5) * 10 - 5;

      mesh.rotation.x = Math.random() * Math.PI;
      mesh.rotation.y = Math.random() * Math.PI;

      mesh.userData = {
        rotSpeedX: (Math.random() - 0.5) * 0.02,
        rotSpeedY: (Math.random() - 0.5) * 0.02,
        floatSpeed: Math.random() * 0.02 + 0.01
      };

      foodGroup.add(mesh);
      items.push(mesh);
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xff9900, 0.8, 20);
    pointLight.position.set(-5, 0, 5);
    scene.add(pointLight);

    camera.position.z = 12;

    let mouseX = 0;
    let mouseY = 0;

    const onMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    document.addEventListener("mousemove", onMouseMove);

    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      foodGroup.rotation.x += (mouseY * 0.1 - foodGroup.rotation.x) * 0.05;
      foodGroup.rotation.y += (mouseX * 0.1 - foodGroup.rotation.y) * 0.05;

      items.forEach((item) => {
        item.rotation.x += item.userData.rotSpeedX;
        item.rotation.y += item.userData.rotSpeedY;
        item.position.y += item.userData.floatSpeed;

        if (item.position.y > 15) {
          item.position.y = -15;
          item.position.x = (Math.random() - 0.5) * 25;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("mousemove", onMouseMove);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="min-h-screen overflow-hidden font-sans antialiased text-gray-900 relative">
      {/* BACKGROUND LAYERS */}
      <div
        className="bg-image-container"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          backgroundImage:
            "url('https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      />
      <div
        className="bg-overlay"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 1,
          backgroundColor: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(3px)"
        }}
      />
      <canvas
        ref={canvasRef}
        id="three-canvas"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 2,
          pointerEvents: "none"
        }}
      />

      {/* MAIN CONTENT */}
      <div
        id="main-content"
        className="flex items-center justify-center w-full h-screen animate-fade-in-up relative z-10"
      >
        <div
          id="login-wrapper"
          className="relative w-full max-w-[450px] z-20"
        >
          {/* LOGIN CARD */}
          <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 sm:p-12 border border-white/50 ring-1 ring-white/60 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600" />

            <div className="text-center mb-10">
              <div className="mx-auto w-fit mb-5 flex items-center gap-3 justify-center transform hover:scale-105 transition-transform duration-300">
                <div className="relative flex items-center justify-center w-14 h-14">
                  <Utensils className="w-8 h-8 absolute z-10 text-orange-600 stroke-[2]" />
                  <div className="w-12 h-12 border-2 rounded-2xl flex items-center justify-center border-orange-600 bg-orange-50 rotate-45 shadow-lg" />
                </div>
                <div className="text-left">
                  <h1 className="text-3xl font-black tracking-tight text-gray-900">
                    SmartDine
                  </h1>
                  <p className="text-[11px] font-bold tracking-widest uppercase text-orange-600">
                    Premium Experience
                  </p>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
              <p className="text-gray-500 mt-2 text-sm">
                Enter your credentials to access your dashboard.
              </p>
            </div>

            {/* FORM */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label
                  htmlFor="email"
                  className="block text-xs font-bold uppercase text-gray-500 ml-1 tracking-wider"
                >
                  Email Address
                </label>
                <div className="relative group">
                  <input
                    type="email"
                    id="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-gray-900 bg-gray-50/50 focus:bg-white outline-none font-medium"
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="password"
                  className="block text-xs font-bold uppercase text-gray-500 ml-1 tracking-wider"
                >
                  Password
                </label>
                <div className="relative group">
                  <input
                    type="password"
                    id="password"
                    placeholder="Enter your password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-gray-900 bg-gray-50/50 focus:bg-white outline-none font-medium"
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 cursor-pointer transition-colors"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <span className="ml-2 text-sm font-medium text-gray-500 group-hover:text-gray-700 transition-colors">
                    Remember me
                  </span>
                </label>

                <button
                  type="button"
                  className="text-sm text-orange-500 hover:text-orange-600 font-semibold transition-colors hover:underline bg-transparent p-0"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                id="loginbtn"
                type="submit"
                disabled={isLoading}
                className={`w-full flex items-center justify-center gap-2 py-4 px-6 text-white font-bold text-lg rounded-xl shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] ${
                  isSuccess
                    ? "bg-gradient-to-r from-green-500 to-green-600 shadow-green-500/30"
                    : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-500/30"
                } ${isLoading ? "opacity-90 cursor-wait" : ""}`}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : isSuccess ? (
                  "Success!"
                ) : (
                  <>
                    Login <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* extra text like old login */}
              <div className="text-xs text-gray-400 text-center mt-4">
                Admin?{" "}
                <Link
                  to="/login-admin"
                  className="text-orange-500 hover:text-orange-600 font-semibold hover:underline"
                >
                  Login here
                </Link>{" "}
                • Staff?{" "}
                <Link
                  to="/login-cw"
                  className="text-orange-500 hover:text-orange-600 font-semibold hover:underline"
                >
                  Login here
                </Link>
              </div>
            </form>
          </div>

          {/* Footer Links */}
          <div className="text-center mt-8 space-y-4">
            <p className="text-white/80 text-sm font-medium">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-orange-500 hover:text-orange-400 font-semibold hover:underline bg-transparent p-0"
              >
                Register Now
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Alert Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm animate-bounce-small">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
              {modalTitle}
            </h3>
            <p className="text-gray-500 mb-6 text-center text-sm">
              {modalMessage}
            </p>
            <button
              onClick={hideModal}
              className="w-full py-3 bg-gray-100 text-gray-900 font-bold rounded-xl hover:bg-gray-200 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartDineLogin;
