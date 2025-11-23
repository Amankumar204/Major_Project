import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { 
  Utensils, 
  ChefHat, 
  CreditCard, 
  ShoppingBag, 
  Star,
  CheckCircle,
  Menu,
  Facebook,
  Twitter,
  Instagram,
  MapPin,
  Phone,
  Mail,
  ArrowRight
} from 'lucide-react';

// --- Mock Data ---

const REVIEWS = [
  { id: 1, name: "Sarah J.", role: "Food Critic", text: "The most immersive dining experience I've had in years. The digital menu is a game changer.", rating: 5, img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80" },
  { id: 2, name: "Michael C.", role: "Frequent Diner", text: "Incredible UX. Ordering is seamless, and the food visuals are mouth-watering.", rating: 5, img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80" },
  { id: 3, name: "Emily R.", role: "Chef", text: "A perfect blend of technology and culinary art. Highly recommended.", rating: 4, img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80" },
];

// --- Shared UI Components ---

const Logo = ({ className = "", light = false }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <div className="relative flex items-center justify-center w-12 h-12">
      <Utensils className={`w-8 h-8 absolute z-10 ${light ? 'text-white' : 'text-gray-900'}`} strokeWidth={1.5} />
      <div className={`w-10 h-10 border-2 rounded-full flex items-center justify-center ${light ? 'border-white' : 'border-gray-900'}`}>
        <div className={`w-6 h-6 border-r-2 border-b-2 rounded-full transform rotate-45 ${light ? 'border-white' : 'border-gray-900'}`}></div>
      </div>
    </div>
    <div>
      <h1 className={`text-xl font-bold tracking-tight ${light ? 'text-white' : 'text-gray-900'}`}>SmartDine</h1>
      <p className={`text-[10px] font-serif italic ${light ? 'text-orange-200' : 'text-orange-600'}`}>Experience Crafted for You.</p>
    </div>
  </div>
);

// ✅ FIXED Button: forwards onClick and other props
const Button = ({
  children,
  className = "",
  variant = "primary",
  icon: Icon,
  fullWidth = false,
  ...props
}) => {
  const baseStyle = `${fullWidth ? 'w-full' : 'w-auto'} py-3 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 text-sm tracking-wide cursor-pointer`;
  const variants = {
    primary: "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50",
    secondary: "bg-white text-gray-800 border border-gray-200 hover:bg-gray-50 shadow-sm",
    outline: "bg-transparent border-2 border-orange-500 text-orange-500 hover:bg-orange-50",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100"
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
      {Icon && <Icon size={18} />}
    </button>
  );
};

// --- Special 3D Tilt Component ---
const TiltCard = ({ children, className = "" }) => {
  const [transform, setTransform] = useState('');
  const ref = useRef(null);

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    setTransform(`perspective(1000px) rotateY(${x * 10}deg) rotateX(${y * -10}deg) scale3d(1.02, 1.02, 1.02)`);
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)');
  };

  return (
    <div 
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`transition-transform duration-200 ease-out will-change-transform ${className}`}
      style={{ transform }}
    >
      {children}
    </div>
  );
};

// --- Page Sections ---

const Navbar = ({ transparent = false }) => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navClass = transparent && !isScrolled 
    ? "bg-transparent text-white border-transparent py-6" 
    : "bg-white/90 backdrop-blur-md text-gray-900 border-gray-100 shadow-sm py-4";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${navClass}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <div className="cursor-pointer">
          <Logo light={transparent && !isScrolled} />
        </div>
        
        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#" className="font-medium hover:text-orange-500 transition-colors">Home</a>
          <a href="#about" className="font-medium hover:text-orange-500 transition-colors">About Us</a>
          <a href="#reviews" className="font-medium hover:text-orange-500 transition-colors">Reviews</a>
          <div className="flex items-center gap-3 ml-4">
            <Button 
              variant={transparent && !isScrolled ? "outline" : "ghost"} 
              className={transparent && !isScrolled ? "border-white text-white hover:bg-white hover:text-gray-900" : ""}
              onClick={() => navigate('/login')}
            >
              Log In
            </Button>

            <Button variant="primary" onClick={() => navigate('/signup')}>
              Sign Up
            </Button>
          </div>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-xl p-6 md:hidden flex flex-col gap-4">
          <a href="#" className="text-left py-2 font-medium text-gray-700">Home</a>
          <a href="#about" className="text-left py-2 font-medium text-gray-700">About Us</a>
          <a href="#reviews" className="text-left py-2 font-medium text-gray-700">Reviews</a>
          <hr />
          <Button 
            variant="secondary"
            onClick={() => {
              setMobileMenuOpen(false);
              navigate('/login');
            }}
          >
            Log In
          </Button>
          <Button 
            variant="primary"
            onClick={() => {
              setMobileMenuOpen(false);
              navigate('/signup');
            }}
          >
            Sign Up
          </Button>
        </div>
      )}
    </nav>
  );
};

const Footer = () => (
  <footer className="bg-gray-900 text-gray-300 py-16">
    <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
      <div className="col-span-1 md:col-span-1">
        <Logo light className="mb-6" />
        <p className="text-gray-400 text-sm leading-relaxed">
          Revolutionizing the dining experience with smart technology and culinary excellence.
        </p>
      </div>
      
      <div>
        <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Quick Links</h4>
        <ul className="space-y-3 text-sm">
          <li><a href="#" className="hover:text-orange-500 transition-colors">Our Menu</a></li>
          <li><a href="#" className="hover:text-orange-500 transition-colors">Book a Table</a></li>
          <li><a href="#" className="hover:text-orange-500 transition-colors">Gift Cards</a></li>
          <li><a href="#" className="hover:text-orange-500 transition-colors">Careers</a></li>
        </ul>
      </div>

      <div>
        <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Contact</h4>
        <ul className="space-y-4 text-sm">
          <li className="flex items-center gap-3"><MapPin size={16} className="text-orange-500" /> 123 Gourmet Ave, Food District</li>
          <li className="flex items-center gap-3"><Phone size={16} className="text-orange-500" /> +91 987 654 3210</li>
          <li className="flex items-center gap-3"><Mail size={16} className="text-orange-500" /> hello@smartdine.com</li>
        </ul>
      </div>

      <div>
        <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Follow Us</h4>
        <div className="flex gap-4">
          <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all"><Facebook size={18} /></a>
          <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all"><Twitter size={18} /></a>
          <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all"><Instagram size={18} /></a>
        </div>
      </div>
    </div>
    <div className="border-t border-gray-800 mt-12 pt-8 text-center text-xs text-gray-500">
      © 2025 SmartDine. All rights reserved.
    </div>
  </footer>
);

// --- Main Home Page Component ---

export default function HomePage() {
  return (
    <div className="bg-white min-h-screen font-sans">
      <Navbar transparent={true} />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-900 pt-20 pb-10">
        {/* Background Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80" 
            className="w-full h-full object-cover opacity-30 animate-pan-slow"
            alt="Restaurant Ambience" 
          />
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900/80 to-black/60"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center w-full">
          
          {/* Left Text Content - Default Flow */}
          <div className="space-y-8 animate-fade-in-up flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 backdrop-blur-sm border border-orange-500/30 rounded-full text-orange-400 text-sm font-semibold tracking-wide self-start">
              <Star size={14} fill="currentColor" /> #1 Restaurant App of 2025
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-[1.1]">
              Taste the <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">SmartDine</span> way.
            </h1>
            <p className="text-gray-300 text-lg md:text-xl leading-relaxed max-w-lg">
              Experience a culinary journey where smart technology meets artisanal flavors. Order seamlessly, dine elegantly, and pay effortlessly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button variant="primary" className="h-14 px-8 text-lg" fullWidth={false} icon={ArrowRight}>
                View Menu
              </Button>
              <Button variant="outline" className="h-14 px-8 text-lg border-white text-white hover:bg-white hover:text-gray-900" fullWidth={false}>
                Our Story
              </Button>
            </div>
            
            {/* Trust Indicators */}
            <div className="pt-8 flex items-center gap-6 text-gray-400 text-sm font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-orange-500" /> 10k+ Happy Diners
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-orange-500" /> Instant Ordering
              </div>
            </div>
          </div>

          {/* Right Visual Content (Interactive Bowl) - Default Flow */}
          <div className="relative flex justify-center items-center h-full w-full">
            {/* Decorative Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px] pointer-events-none"></div>
            
            {/* The Bowl Container - Hover Trigger */}
            <div className="relative group cursor-pointer animate-float">
              
              {/* Fork Animation Container */}
              <div className="absolute -right-8 -top-16 z-20 transition-all duration-700 ease-in-out transform group-hover:translate-y-12 group-hover:-rotate-45 group-hover:scale-110">
                <div className="bg-white p-3 rounded-full shadow-2xl border-4 border-gray-100">
                  <Utensils className="w-12 h-12 text-orange-500 transform -rotate-45" />
                </div>
              </div>

              {/* The Bowl */}
              <div className="relative w-72 h-72 md:w-96 md:h-96 rounded-full border-8 border-white/10 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden bg-gray-900">
                <img 
                  src="https://images.unsplash.com/photo-1591814468924-caf88d1232e1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-3"
                  alt="Delicious Ramen Bowl" 
                />
                
                {/* Steam Effect (CSS Only) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60"></div>
              </div>

              {/* Floating Price Tag */}
              <div className="absolute -bottom-6 -left-4 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-xl transform transition-transform duration-500 group-hover:scale-105">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-500 p-2 rounded-lg text-white font-bold text-sm">₹350</div>
                  <div>
                    <p className="text-white text-sm font-bold">Spicy Miso Ramen</p>
                    <div className="flex text-orange-400 text-xs">★★★★★</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-orange-50 skew-x-12 translate-x-20"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-orange-500 font-bold tracking-widest uppercase text-sm mb-2">About Us</h2>
            <h3 className="text-4xl font-bold text-gray-900">Revolutionizing How You Eat</h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Smart Ordering", desc: "No waiting for waiters. Order directly from your table with our interactive digital menu.", icon: ShoppingBag },
              { title: "Fresh Ingredients", desc: "We source our produce daily from local organic farms to ensure maximum freshness.", icon: ChefHat },
              { title: "Instant Payments", desc: "Settle your bill in seconds with secure integrated payment gateways.", icon: CreditCard }
            ].map((feature, idx) => (
              <TiltCard key={idx} className="bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl border border-gray-100 group">
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon size={32} />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h4>
                <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Food Parallax */}
      <section className="py-24 bg-gray-900 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-white text-4xl font-bold mb-6">Visuals That Make You Hungry</h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                Our app features high-fidelity 3D-like imagery for every dish. You eat with your eyes first, so we made sure the view is spectacular.
              </p>
              <ul className="space-y-4 mb-8">
                {['360° View of Dishes', 'Detailed Ingredient Lists', 'Calorie & Nutrition Info'].map((item, i) => (
                  <li key={i} className="flex items-center text-gray-300 gap-3">
                    <CheckCircle className="text-orange-500" size={20} /> {item}
                  </li>
                ))}
              </ul>
              <Button variant="primary" fullWidth={false}>Explore Menu</Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80" className="rounded-2xl transform translate-y-12 shadow-2xl hover:scale-105 transition-transform duration-500" alt="Dish 1" />
              <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=500&q=80" className="rounded-2xl shadow-2xl hover:scale-105 transition-transform duration-500" alt="Dish 2" />
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section id="reviews" className="py-24 bg-orange-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-center text-3xl font-bold text-gray-900 mb-16">What Our Customers Say</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {REVIEWS.map((review) => (
              <div key={review.id} className="bg-white p-8 rounded-2xl shadow-lg relative mt-6">
                <div className="absolute -top-6 left-8">
                  <img src={review.img} className="w-12 h-12 rounded-full border-4 border-white shadow-md object-cover" alt={review.name} />
                </div>
                <div className="flex text-orange-400 mb-4 mt-2">
                  {[...Array(review.rating)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                </div>
                <p className="text-gray-600 italic mb-6">"{review.text}"</p>
                <div>
                  <h5 className="font-bold text-gray-900">{review.name}</h5>
                  <span className="text-xs text-orange-500 uppercase tracking-wide font-semibold">{review.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
