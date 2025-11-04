"use client";

export default function InputBox({ value, onChange, placeholder, className }) {
  return (
    <input
      type="text"
      placeholder={placeholder || "Product name or barcode"}
      className={className || "input input-bordered w-full rounded-lg"}
      value={value}
      onChange={onChange}
    />
  );
}
