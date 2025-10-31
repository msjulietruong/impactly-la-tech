"use client";
import { useState } from "react";
import Button from "../components/Button";
import Input from "../components/Input";
import Modal from "../components/Modal";
import BarcodeScanner from "../components/BarcodeScanner";


export default function Home() {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const [productInfo, setProductInfo] = useState(null);

  const handleSearch = async () => {
  if (!inputValue.trim()) return;


  try {
    const res = await fetch(`http://localhost:3000/api/products/${inputValue}/esg`);
    if (res.status === 404) {
      if (!res.ok) throw new Error("HTTP error: ${res.status}");
  setProductInfo({
    productName: inputValue,
    brandName: "N/A",
    companyName: "unmapped",
    esgScore: "N/A",
  });
  return;
}

    const data = await res.json();
    console.log("Raw API response:", data);

    setProductInfo({
  productName: data.productName || "N/A",
  brandName: data.brand || "N/A",
  companyName: data.companyName || "N/A",
  esgScore: data.esgData.total?.score ?? "N/A",
});

  } catch (err) {
    console.error("Fetch error:", err);
    setProductInfo(null);
  }
};
  
  const handleScan = async (code) => {
  console.log("Scanned barcode:", code);
  setIsScannerOpen(false);
  setInputValue(code);
  await handleSearch();
};

  return (
    <div className="min-h-screen flex flex-col justify-between bg-base-100 text-base-content">
      <main className="flex flex-col items-center justify-center flex-1 gap-6 p-10">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type product name or barcode..."
        />
        <Button label="Search" onClick={handleSearch} />
        <Button label="Scan Barcode" onClick={() => setIsScannerOpen(true)} />
          {productInfo && (
          <div className="mt-6 p-4 border rounded w-full max-w-md">
            <p><strong>Product:</strong> {productInfo.productName}</p>
            <p><strong>Brand:</strong> {productInfo.brandName}</p>
            <p><strong>Company:</strong> {productInfo.companyName}</p>
            <p><strong>ESG Score:</strong> {productInfo.esgScore}</p>
          </div>
        )}
      </main>
    
    {/* Barcode Scanner Modal */}
    <Modal
      isOpen={isScannerOpen}
      onClose={() => setIsScannerOpen(false)}
      title="Scan Barcode"
    >
     <BarcodeScanner
          onScan={handleScan}
          onClose={() => setIsScannerOpen(false)}
        />
    </Modal>

    </div>
  );
}
