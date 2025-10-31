"use client";
import { useState } from "react";

export default function ProductLookup() {
  const [barcode, setBarcode] = useState("");
  const [product, setProduct] = useState(null);
  const [esg, setEsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setProduct(null);
    setEsg(null);

    try {
      // 1️⃣ Get product by barcode
      const res = await fetch(`/api/products/barcode/${barcode}`);
      if (!res.ok) throw new Error("Product not found");
      const productData = await res.json();
      setProduct(productData);

      // 2️⃣ Get ESG breakdown
      const esgRes = await fetch(`/api/products/${productData._id || productData.id}/esg`);
      if (esgRes.ok) {
        const esgData = await esgRes.json();
        setEsg(esgData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-6">
      <h2 className="text-2xl font-semibold mb-4">🔍 Product Lookup</h2>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="text"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="Enter product barcode..."
          className="border border-gray-300 rounded p-2 w-64"
        />
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
        >
          Search
        </button>
      </form>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {product && (
        <div className="border rounded p-4 w-80 bg-gray-50 mt-4">
          <h3 className="font-bold text-lg">{product.name}</h3>
          <p><strong>Brand:</strong> {product.brand}</p>
          <p><strong>Category:</strong> {product.category || "N/A"}</p>
          <p><strong>ESG Level:</strong> {product.esgLevel || "N/A"}</p>

          {esg && (
            <div className="mt-3">
              <h4 className="font-semibold">🌍 ESG Breakdown</h4>
              <ul className="list-disc list-inside text-sm text-gray-700">
                {Object.entries(esg).map(([key, value]) => (
                  <li key={key}>
                    <strong>{key}:</strong> {value}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
