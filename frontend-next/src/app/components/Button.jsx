"use client";

export default function CustomButton({ label, onClick }) {
  return (
    <button className="btn btn-secondary rounded-full px-6" onClick={onClick}>
      {label}
    </button>
  );
}
