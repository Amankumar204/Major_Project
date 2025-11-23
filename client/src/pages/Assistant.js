import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useContext,              // 👈 added
} from "react";
import "../styles/Assistant.css";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useNavigate } from "react-router-dom";
import API from "../api"; // ✅ use your axios instance
import { AuthContext } from "../context/AuthContext";  // 👈 added

const Assistant = () => {
  const navigate = useNavigate();
  const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

  const { user } = useContext(AuthContext);  // 👈 logged-in user: { id, name, email, phone, role }

  // ── menu fetched from backend ───────────────────────────────
  const [menuItems, setMenuItems] = useState([]);     // flat array from DB
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState("");

  // grouped for easy display
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

  // names list (for AI matching + “Add” buttons)
  const allMenuItems = useMemo(() => {
    return menuItems.map((i) => i.name);
  }, [menuItems]);

  // fetch menu on mount
  useEffect(() => {
    (async () => {
      try {
        setMenuLoading(true);
        setMenuError("");

        // Try /api/menu/items first, fall back to /api/menu
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

  // ── chat + ordering state ───────────────────────────────────
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);   // 👈 start empty; we’ll set first msg in useEffect
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({
    // we keep only preference-related stuff here
    mealType: "",
    preference: "",
    allergy: "",
    spice: "",
    request: "",
  });
  const [stage, setStage] = useState("start");    // 👈 no askName/askEmail
  const [hasOrderedOnce, setHasOrderedOnce] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Set initial greeting based on logged-in user
  useEffect(() => {
    if (messages.length > 0) return; // don’t override if already set

    const displayName = user?.name || "there";
    const initialMessages = [
      {
        from: "bot",
        text: `👋 Hi ${displayName}! Welcome to DineOut.`,
      },
      {
        from: "bot",
        text: "How would you like to continue?",
        options: ["Proceed with me", "Display full menu"],
      },
    ];
    setMessages(initialMessages);
    setStage("start");
  }, [user, messages.length]);

  const addMessage = (from, text, options = null) => {
    setMessages((prev) => [...prev, { from, text, options }]);
  };

  const addToCart = (item) => {
    if (!cart.includes(item)) {
      setCart((prev) => [...prev, item]);
      addMessage("bot", `✅ ${item} added to your cart.`);
      addMessage("bot", "Would you like to add another dish?", [
        "Yes, show me more 🍲",
        "No, proceed to order 🛒",
      ]);
    }
  };

  const handleOrder = async () => {
    if (cart.length === 0) return alert("Your cart is empty!");

    // if user not logged in, block order (optional but recommended)
    if (!user) {
      alert("Please log in to place an order.");
      return navigate("/login");
    }

    const orderData = {
      name: user.name || "",     // 👈 from logged-in user
      email: user.email || "",
      phone: user.phone || "",
      items: cart,                        // array of strings
      totalCost: cart.length * 150,       // Example cost
      tableNo: "T1",
    };

    try {
      const res = await API.post("/orders/create", orderData);
      alert("✅ Order stored successfully!");
      const orderId = res.data?.order?._id;
      setCart([]);
      setMessages([
        {
          from: "bot",
          text: "Would you like to start a new order?",
          options: ["Yes 🍽️", "No, thank you 🙏"],
        },
      ]);
      setStage("start");
      navigate("/after-order", { replace: true, state: { orderId } });
    } catch (error) {
      console.error("Error saving order:", error);
      alert(error?.response?.data?.message || "Server error while saving order");
    }
  };

  const showFullMenu = () => {
    if (menuLoading) return addMessage("bot", "⏳ Loading menu…");
    if (menuError) return addMessage("bot", "⚠️ Could not load menu.");
    const { starters, maincourse, desserts, others } = menuGrouped;

    addMessage("bot", "📜 Here’s our full menu:");
    if (starters.length)
      addMessage("bot", "🍽️ Starters:", starters.map((i) => i.name));
    if (maincourse.length)
      addMessage("bot", "🥘 Main Course:", maincourse.map((i) => i.name));
    if (desserts.length)
      addMessage("bot", "🍰 Desserts:", desserts.map((i) => i.name));
    if (others.length)
      addMessage("bot", "🧺 Others:", others.map((i) => i.name));
  };

  const handleOptionClick = async (option) => {
    addMessage("user", option);

    if (stage === "start") {
      if (option === "Display full menu") {
        showFullMenu();
        setStage("start");
      } else if (option === "Proceed with me") {
        addMessage("bot", "What are you looking for today?", [
          "Healthy meal",
          "Budget meal",
          "Popular dishes",
          "Surprise me",
        ]);
        setStage("mealType");
      }
    } else if (stage === "mealType") {
      setUserData((prev) => ({ ...prev, mealType: option }));
      if (hasOrderedOnce) {
        addMessage("bot", "Do you have any new preferences? (Type below 👇)");
        setStage("preferenceOnly");
      } else {
        addMessage("bot", "Do you have any specific preferences? (Type below 👇)");
        setStage("preference");
      }
    } else if (stage === "spice") {
      setUserData((prev) => ({ ...prev, spice: option }));
      addMessage("bot", "Any additional requests?");
      setStage("request");
    } else if (stage === "afterDishes") {
      if (option.includes("show me more")) {
        setStage("mealType");
        addMessage("bot", "What kind of dishes would you like next?", [
          "Healthy meal",
          "Budget meal",
          "Popular dishes",
          "Surprise me",
        ]);
      } else if (option.includes("proceed")) {
        handleOrder();
      }
    }
  };

  const handleUserInput = (text) => {
    addMessage("user", text);

    // 🔥 Removed askName / askEmail stages
    if (stage === "preference") {
      setUserData((prev) => ({ ...prev, preference: text }));
      addMessage("bot", "Do you have any allergies?");
      setStage("allergy");
    } else if (stage === "allergy") {
      setUserData((prev) => ({ ...prev, allergy: text }));
      addMessage("bot", "What’s your preferred spice level?", [
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
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
      const prompt = `
Suggest 3–5 dishes from this menu based on:
Meal: ${mealType}, Preference: ${preference},
Allergy: ${allergy}, Spice: ${spice}, Request: ${request}.
Menu items: ${allMenuItems.join(", ")}.
Return only a JSON array like ["Dish1", "Dish2"].
`;
      const result = await model.generateContent(prompt);

      let aiOptions = [];
      try {
        const text = result.response
          .text()
          .trim()
          .replace(/\n/g, "")
          .replace(/“|”/g, '"')
          .match(/\[.*\]/);
        aiOptions = text ? JSON.parse(text[0]) : [];
      } catch {
        aiOptions = [];
      }

      // keep only dishes that exist in DB menu
      aiOptions = aiOptions.filter((opt) =>
        allMenuItems.some((menuItem) => menuItem.toLowerCase() === opt.toLowerCase())
      );
      if (aiOptions.length === 0) aiOptions = ["No matching dishes found 🍽️"];

      addMessage("bot", "Here are some dishes for you:", aiOptions);
      setStage("afterDishes");
      setHasOrderedOnce(true);
    } catch {
      addMessage("bot", "⚠️ Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="assistant-container">
      <div className="chat-card">
        <div className="chat-header">
          <div className="bot-icon">🤖</div>
          <h2>Restaurant AI Waiter</h2>
        </div>

        <div className="chat-box">
          {/* show a one-time banner if menu failed */}
          {!messages.length && menuError && (
            <div className="chat-bubble bot">⚠️ {menuError}</div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`chat-bubble ${msg.from === "user" ? "user" : "bot"}`}>
              {msg.text}
              {msg.from === "bot" && msg.options && (
                <div className="food-options">
                  {msg.options.map((opt, idx) => {
                    const isMenuItem = allMenuItems.some(
                      (menuItem) => menuItem.toLowerCase() === opt.toLowerCase()
                    );
                    return (
                      <div key={idx} className="food-item">
                        <span>{opt}</span>
                        {isMenuItem ? (
                          <button className="add-btn" onClick={() => addToCart(opt)}>
                            ➕ Add
                          </button>
                        ) : (
                          <button className="add-btn" onClick={() => handleOptionClick(opt)}>
                            👉
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
          {loading && <div className="chat-bubble bot">Thinking... 🍳</div>}
          <div ref={chatEndRef} />
        </div>

        {/* text input only for preference/allergy/request stages */}
        {["preference", "allergy", "request", "preferenceOnly"].includes(stage) && (
          <div className="chat-input-box">
            <input
              className="chat-input"
              type="text"
              placeholder="Type your answer and press Enter..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && userInput.trim() !== "") {
                  handleUserInput(userInput.trim());
                  setUserInput("");
                }
              }}
            />
            <button
              className="send-btn"
              onClick={() => {
                if (userInput.trim() !== "") {
                  handleUserInput(userInput.trim());
                  setUserInput("");
                }
              }}
            >
              ➤
            </button>
          </div>
        )}
      </div>

      <div className="cart-box">
        <h3>🛒 Your Cart</h3>
        {menuLoading && <p className="empty">Loading menu…</p>}
        {cart.length === 0 ? (
          <p className="empty">No items yet</p>
        ) : (
          <ul>
            {cart.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        )}
        <button className="order-btn" onClick={handleOrder}>
          Order Now 🚀
        </button>
      </div>
    </div>
  );
};

export default Assistant;
