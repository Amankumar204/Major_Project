import React, { useState } from "react";
import API from "../../api";
import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/Card";

export default function AddDish() {
  const [dish, setDish] = useState({
    name: "",
    category: "",
    price: "",
  });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleChange = (e) => {
    setDish((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!dish.name || !dish.category || !dish.price) {
      alert("Please fill out all fields");
      return;
    }

    setLoading(true);
    try {
      const res = await API.post("/admin-dashboard/add-dish", {
        name: dish.name.trim(),
        category: dish.category,
        price: Number(dish.price),
      });
      setSuccessMsg(`✅ ${res.data?.dish?.name || "Dish"} added successfully!`);
      setDish({ name: "", category: "", price: "" });
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Error adding dish:", err);
      alert("Failed to add dish. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh] bg-gradient-to-br from-indigo-50 to-purple-100 px-4">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-md border border-indigo-100 shadow-lg">
        <CardContent className="p-6">
          <h2 className="text-2xl font-semibold text-indigo-700 mb-4 text-center">
            🍽️ Add New Dish
          </h2>
          <p className="text-gray-500 text-center mb-6">
            Add new items to your restaurant menu here.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Dish Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dish Name
              </label>
              <input
                type="text"
                name="name"
                placeholder="Enter dish name"
                value={dish.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 outline-none transition"
              />
            </div>

            {/* Category Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                name="category"
                value={dish.category}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition"
              >
                <option value="">Select a category</option>
                <option value="Starters">Starters</option>
                <option value="Main Course">Main Course</option>
                <option value="Desserts">Desserts</option>
                <option value="Beverages">Beverages</option>
                <option value="Snacks">Snacks</option>
              </select>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (₹)
              </label>
              <input
                type="number"
                name="price"
                placeholder="Enter price"
                value={dish.price}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 outline-none transition"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transform transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              {loading ? "Adding..." : "Add Dish 🍛"}
            </Button>
          </form>

          {/* Success Message */}
          {successMsg && (
            <div className="mt-4 bg-green-100 border border-green-300 text-green-700 rounded-lg p-2 text-center text-sm animate-fadeIn">
              {successMsg}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
