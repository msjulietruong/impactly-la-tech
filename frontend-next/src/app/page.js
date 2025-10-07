"use client";
import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Button from "../components/Button";
import Input from "../components/Input";
import Modal from "../components/Modal";

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const handleSearch = () => {
    alert(`Searching for "${inputValue}"...`);
    // Here you can call your API or lookup function for ethical data
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-base-100 text-base-content">
      {/* Navbar */}
      <Navbar onOpenModal={() => setIsOpen(true)} />

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center flex-1 gap-6 p-10">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type product name or barcode..."
        />
        <Button label="Search" onClick={handleSearch} />
      </main>

      {/* Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Help">
        <p>Enter a product name or barcode to check its ethical rating.</p>
      </Modal>

      {/* Footer */}
      <Footer />
    </div>
  );
}
