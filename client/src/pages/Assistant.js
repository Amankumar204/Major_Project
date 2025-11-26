import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useContext,
} from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useNavigate } from "react-router-dom";
import API from "../api";
import { AuthContext } from "../context/AuthContext";

// --- SLEEK ICONS (Monochrome/White) ---
const Icons = {
  Cart: ({ count }) => (
    <div className="relative group">
      <svg
        className="w-6 h-6 text-gray-200 transition-colors group-hover:text-white"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <path d="M16 10a4 4 0 0 1-8 0"></path>
      </svg>
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-lg">
          {count}
        </span>
      )}
    </div>
  ),
  Send: () => (
    <svg
      className="w-5 h-5 text-black"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="22" y1="2" x2="11" y2="13"></line>
      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
  ),
  Close: () => (
    <svg
      className="w-6 h-6 text-gray-400 hover:text-white transition-colors"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  ),
  Bot: () => (
    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-400 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"></path>
      </svg>
    </div>
  ),
};

const Assistant = () => {
  const navigate = useNavigate();
  const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);
  const { user } = useContext(AuthContext);

  // ── UI STATE ───────────────────────────────
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);

  // ── MENU DATA ───────────────────────────────
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState("");

  const menuGrouped = useMemo(() => {
    const g = { starters: [], maincourse: [], desserts: [], others: [] };
    for (const it of menuItems) {
      const cat = String(it.category || "").toLowerCase().trim();
      if (cat.includes("starter")) g.starters.push(it);
      else if (cat.includes("main")) g.maincourse.push(it);
      else if (cat.includes("dessert")) g.desserts.push(it);
      else g.others.push(it);
    }
    return g;
  }, [menuItems]);

  const allMenuItems = useMemo(() => {
    return menuItems.map((i) => i.name);
  }, [menuItems]);

  useEffect(() => {
    (async () => {
      try {
        setMenuLoading(true);
        setMenuError("");
        let res;
        try {
          res = await API.get("/menu/items");
        } catch {
          res = await API.get("/menu");
        }
        const list = Array.isArray(res.data?.items)
          ? res.data.items
          : Array.isArray(res.data)
          ? res.data
          : [];
        setMenuItems(list);
      } catch (e) {
        console.error("Failed to fetch menu", e);
        setMenuError("Failed to load menu.");
        setMenuItems([]);
      } finally {
        setMenuLoading(false);
      }
    })();
  }, []);

  // ── CHAT + ORDER LOGIC ─────────────────────
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  // cart: [{ name, qty }]
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({
    mealType: "",
    preference: "",
    allergy: "",
    spice: "",
    request: "",
  });
  const [stage, setStage] = useState("start");
  const [hasOrderedOnce, setHasOrderedOnce] = useState(false);
  const [hasShownProceedPrompt, setHasShownProceedPrompt] = useState(false); // per-round flag
  const chatEndRef = useRef(null);

  // total item count for cart icon
  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.qty, 0),
    [cart]
  );

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (messages.length > 0) return;
    const displayName = user?.name || "Guest";
    const initialMessages = [
      { from: "bot", text: `Good evening, ${displayName}. Welcome to DineOut.` },
      {
        from: "bot",
        text: "How may I assist you with your dining experience?",
        options: ["Suggest dishes", "Show full menu"],
      },
    ];
    setMessages(initialMessages);
    setStage("start");
    setHasShownProceedPrompt(false);
  }, [user, messages.length]);

  const addMessage = (from, text, options = null) => {
    setMessages((prev) => [...prev, { from, text, options }]);
  };

  // ── CART: ADD ITEM (with quantity + per-round proceed prompt) ──────
  const addToCart = (itemName) => {
    const alreadyInCart = cart.some((i) => i.name === itemName);

    setCart((prev) => {
      const existing = prev.find((i) => i.name === itemName);
      if (existing) {
        return prev.map((i) =>
          i.name === itemName ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { name: itemName, qty: 1 }];
    });

    if (!alreadyInCart) {
      addMessage("bot", `I've added the ${itemName} to your selection.`);
    } else {
      // optional line – delete if you don't want this extra message
      addMessage("bot", `Added one more ${itemName}.`);
    }

    // 🔥 show "Shall we proceed?" at most once per suggestion/menu round
    if (!hasShownProceedPrompt) {
      setHasShownProceedPrompt(true);
      setStage("afterDishes");
      addMessage("bot", "Shall we proceed?", ["Browse more", "Place Order"]);
    }
  };

  const showFullMenu = () => {
    if (menuLoading) return addMessage("bot", "Retrieving our menu...");
    if (menuError)
      return addMessage(
        "bot",
        "I apologize, the menu is currently unavailable."
      );

    // new menu browsing round → allow one proceed prompt
    setHasShownProceedPrompt(false);
    setIsMenuModalOpen(true);
    addMessage("bot", "Here is our complete selection for your perusal.");
  };

  const handleOrder = async () => {
    if (cart.length === 0) return alert("Cart is empty.");
    if (!user) {
      alert("Please log in to finalize your order.");
      return navigate("/login");
    }

    // flatten items for backend (simple array of names)
    const flatItems = cart.flatMap((item) => Array(item.qty).fill(item.name));

    const orderData = {
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      items: flatItems,
      totalCost: flatItems.length * 150,
      tableNo: "T1",
    };

    try {
      const res = await API.post("/orders/create", orderData);
      const orderId = res.data?.order?._id;
      setCart([]);
      setIsCartOpen(false);
      setMessages([
        {
          from: "bot",
          text: "Your order has been confirmed. Thank you.",
          options: ["New Order", "Finish"],
        },
      ]);
      setStage("start");
      setHasShownProceedPrompt(false); // new order, reset
      navigate("/after-order", { replace: true, state: { orderId } });
    } catch (error) {
      console.error("Error saving order:", error);
      alert(error?.response?.data?.message || "Error placing order.");
    }
  };

  const handleOptionClick = async (option) => {
    addMessage("user", option);

    // global handlers for Browse more / Place Order
    if (option.includes("Browse more")) {
      setStage("mealType");
      addMessage("bot", "What else would you like to explore?", [
        "Light & Fresh",
        "Rich & Hearty",
        "Chef's Special",
        "Surprise Me",
      ]);
      return;
    }

    if (option.includes("Place Order")) {
      setIsCartOpen(true);
      return;
    }

    if (stage === "start") {
      if (option === "Show full menu") {
        showFullMenu();
        setStage("start");
      } else if (option === "Suggest dishes") {
        addMessage(
          "bot",
          "Certainly. What style of cuisine do you prefer?",
          ["Light & Fresh", "Rich & Hearty", "Chef's Special", "Surprise Me"]
        );
        setStage("mealType");
      }
    } else if (stage === "mealType") {
      setUserData((prev) => ({ ...prev, mealType: option }));
      if (hasOrderedOnce) {
        addMessage("bot", "Any new preferences?");
        setStage("preferenceOnly");
      } else {
        addMessage(
          "bot",
          "Any specific dietary requirements or cravings? (e.g. 'Spicy', 'Vegetarian')"
        );
        setStage("preference");
      }
    } else if (stage === "spice") {
      setUserData((prev) => ({ ...prev, spice: option }));
      addMessage("bot", "Any special requests for the kitchen?");
      setStage("request");
    } else if (stage === "afterDishes") {
      // Browse more / Place Order already handled above
      return;
    } else if (option.includes("New Order")) {
      setMessages([
        { from: "bot", text: `Welcome back.` },
        {
          from: "bot",
          text: "How can I help?",
          options: ["Suggest dishes", "Show full menu"],
        },
      ]);
      setStage("start");
      setHasShownProceedPrompt(false); // reset for new flow
    } else if (option.includes("Finish")) {
      addMessage("bot", "Have a wonderful meal.");
      setMessages([]);
      setStage("inactive");
    }
  };

  const handleUserInput = (text) => {
    addMessage("user", text);
    if (stage === "preference") {
      setUserData((prev) => ({ ...prev, preference: text }));
      addMessage("bot", "Noted. Do you have any allergies?");
      setStage("allergy");
    } else if (stage === "allergy") {
      setUserData((prev) => ({ ...prev, allergy: text }));
      addMessage("bot", "How would you like the spice level?", [
        "Mild",
        "Medium",
        "Spicy",
      ]);
      setStage("spice");
    } else if (stage === "request") {
      setUserData((prev) => ({ ...prev, request: text }));
      generateDishSuggestions();
    } else if (stage === "preferenceOnly") {
      setUserData((prev) => ({ ...prev, preference: text }));
      generateDishSuggestions();
    }
  };

  const generateDishSuggestions = async () => {
    setLoading(true);
    const { mealType, preference, allergy, spice, request } = userData;
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite",
      });
      const prompt = `Context: Upscale dark-themed restaurant. Menu: ${allMenuItems.join(
        ", "
      )}. User info: Meal: ${mealType}, Pref: ${preference}, Allergy: ${allergy}, Spice: ${spice}, Req: ${request}. Suggest 3 dishes. Return ONLY a JSON array e.g. ["Dish A", "Dish B"].`;

      const result = await model.generateContent(prompt);
      let aiOptions = [];
      try {
        const text = result.response
          .text()
          .trim()
          .replace(/```json|```/g, "")
          .match(/\[.*\]/s);
        aiOptions = text ? JSON.parse(text[0]) : [];
      } catch {
        aiOptions = [];
      }

      aiOptions = aiOptions.filter((opt) =>
        allMenuItems.some(
          (menuItem) => menuItem.toLowerCase() === opt.toLowerCase()
        )
      );

      if (aiOptions.length === 0) {
        aiOptions = [
          "Chef's Special Pasta",
          "Seasonal Salad",
          "Signature Burger",
        ];
        addMessage("bot", "I recommend these signature dishes:", aiOptions);
      } else {
        addMessage("bot", "Based on your preferences, I suggest:", aiOptions);
      }

      // new suggestion round → allow one proceed prompt again
      setHasShownProceedPrompt(false);
      setStage("afterDishes");
      setHasOrderedOnce(true);
    } catch (e) {
      console.error("Gemini API error:", e);
      addMessage(
        "bot",
        "I am having trouble connecting to the kitchen. Please check the menu."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    if (userInput.trim() !== "") {
      handleUserInput(userInput.trim());
      setUserInput("");
    }
  };

  // ── STYLES ───────────────────────────────
  const bgImage =
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80";

  return (
    <div
      className="flex flex-col h-screen bg-black text-gray-100 font-sans relative overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-0"></div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-enter { animation: fadeIn 0.4s ease-out forwards; }
      `}</style>

      {/* 1. TOP HEADER */}
      <header className="flex justify-between items-center px-6 py-4 fixed top-0 w-full z-20 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🍽️</span>
          <h1 className="text-xl font-bold tracking-widest uppercase text-white">
            Dine<span className="text-orange-500">Out</span>
          </h1>
        </div>
        <button
          className="p-2 rounded-full hover:bg-white/10 transition-all duration-200"
          onClick={() => setIsCartOpen(true)}
        >
          <Icons.Cart count={cartCount} />
        </button>
      </header>

      {/* 2. MAIN CHAT AREA */}
      <main className="flex-grow overflow-y-auto px-4 pt-24 pb-32 flex flex-col no-scrollbar relative z-10">
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 animate-enter ${
                msg.from === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div className="flex-shrink-0 mt-1">
                {msg.from === "bot" ? <Icons.Bot /> : null}
              </div>

              <div
                className={`flex flex-col max-w-[85%] ${
                  msg.from === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`py-3 px-5 text-[15px] leading-relaxed shadow-lg backdrop-blur-md
                    ${
                      msg.from === "user"
                        ? "bg-white text-black rounded-2xl rounded-tr-sm font-medium"
                        : "bg-white/10 border border-white/10 text-gray-100 rounded-2xl rounded-tl-sm"
                    }`}
                >
                  {msg.text}
                </div>

                {msg.options && (
                  <div className="flex flex-wrap gap-2 mt-3 justify-start">
                    {msg.options.map((opt, idx) => {
                      const isMenuItem = allMenuItems.some(
                        (m) => m.toLowerCase() === opt.toLowerCase()
                      );
                      return (
                        <button
                          key={idx}
                          className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all duration-200 border
                            ${
                              isMenuItem
                                ? "bg-orange-500 text-white border-orange-500 hover:bg-orange-600 shadow-md"
                                : "bg-transparent text-gray-300 border-gray-600 hover:border-white hover:text-white hover:bg-white/5"
                            }`}
                          onClick={() =>
                            isMenuItem ? addToCart(opt) : handleOptionClick(opt)
                          }
                        >
                          {opt} {isMenuItem && "+"}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-4 animate-enter ml-1">
              <Icons.Bot />
              <div className="bg-white/10 border border-white/10 px-5 py-4 rounded-2xl rounded-tl-sm flex items-center gap-1.5 h-12">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-75"></div>
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </main>

      {/* 3. INPUT AREA */}
      {["preference", "allergy", "request", "preferenceOnly"].includes(
        stage
      ) && (
        <footer className="fixed bottom-0 left-0 right-0 p-6 z-20 bg-gradient-to-t from-black via-black/90 to-transparent">
          <div className="w-full max-w-2xl mx-auto relative group">
            <input
              type="text"
              placeholder="Type your preferences..."
              className="w-full bg-gray-900/90 border border-gray-700 shadow-xl text-white text-base py-4 pl-6 pr-16 rounded-full outline-none focus:ring-2 focus:ring-orange-500/50 transition-all placeholder:text-gray-500 backdrop-blur-xl"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              autoFocus
            />
            <button
              onClick={handleSend}
              className="absolute right-2 top-2 bg-white w-10 h-10 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            >
              <Icons.Send />
            </button>
          </div>
        </footer>
      )}

      {stage === "inactive" && (
        <footer className="fixed bottom-10 left-0 right-0 flex justify-center z-20">
          <button
            className="bg-orange-500 text-white py-3 px-8 rounded-full text-sm font-bold tracking-wider shadow-lg hover:bg-orange-600 transition-all transform hover:-translate-y-1"
            onClick={() => handleOptionClick("New Order")}
          >
            START NEW ORDER
          </button>
        </footer>
      )}

      {/* 4. MODALS (Dark Theme) */}

      {/* FULL MENU MODAL */}
      {isMenuModalOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4"
          onClick={() => setIsMenuModalOpen(false)}
        >
          <div
            className="bg-[#121212] border border-gray-800 w-full max-w-2xl h-[85vh] rounded-2xl flex flex-col shadow-2xl animate-enter overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-800 bg-[#1a1a1a]">
              <h2 className="text-xl font-bold text-white tracking-widest">
                MENU
              </h2>
              <button
                className="p-2 hover:bg-white/10 rounded-full"
                onClick={() => setIsMenuModalOpen(false)}
              >
                <Icons.Close />
              </button>
            </div>
            <div className="p-6 overflow-y-auto no-scrollbar">
              {Object.entries(menuGrouped).map(([category, items]) =>
                items.length > 0 ? (
                  <div key={category} className="mb-10">
                    <h3 className="text-xs font-bold text-orange-500 uppercase tracking-[0.2em] mb-4 border-b border-gray-800 pb-2">
                      {category}
                    </h3>
                    <div className="grid gap-3">
                      {items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center p-3 rounded-lg hover:bg-white/5 transition-colors group"
                        >
                          <div>
                            <p className="font-medium text-gray-200 text-lg">
                              {item.name}
                            </p>
                            <p className="text-sm text-gray-500 font-mono">
                              ₹150
                            </p>
                          </div>
                          <button
                            className="text-xs font-bold text-black bg-white px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0"
                            onClick={() => addToCart(item.name)}
                          >
                            ADD
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null
              )}
            </div>
          </div>
        </div>
      )}

      {/* CART MODAL */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsCartOpen(false)}
          ></div>
          <div className="relative w-full max-w-md bg-[#121212] border-l border-gray-800 h-full shadow-2xl flex flex-col animate-enter">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#1a1a1a]">
              <h2 className="text-lg font-bold text-white tracking-widest">
                YOUR ORDER
              </h2>
              <button onClick={() => setIsCartOpen(false)}>
                <Icons.Close />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4">
                  <Icons.Cart count={0} />
                  <p className="text-sm">Cart is empty</p>
                </div>
              ) : (
                <ul className="space-y-0 divide-y divide-gray-800">
                  {cart.map((item, i) => (
                    <li
                      key={i}
                      className="flex justify-between items-center py-4"
                    >
                      <span className="text-gray-300 font-medium">
                        {item.name}
                        <span className="text-gray-500 text-sm ml-2">
                          × {item.qty}
                        </span>
                      </span>
                      <span className="text-gray-500 font-mono">
                        ₹{item.qty * 150}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="p-6 bg-[#1a1a1a] border-t border-gray-800">
              <div className="flex justify-between font-mono text-lg mb-6 text-gray-400">
                <span>Total</span>
                <span className="text-white">
                  ₹{cart.reduce((sum, item) => sum + item.qty * 150, 0)}
                </span>
              </div>
              <button
                className="w-full bg-white text-black py-4 rounded-full font-bold tracking-widest hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleOrder}
                disabled={cart.length === 0}
              >
                CONFIRM ORDER
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assistant;
