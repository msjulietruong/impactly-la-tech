"use client";

import Link from "next/link";

export default function Navbar({ onOpenModal }) {
  return (
    <nav className="navbar bg-base-100 px-6 shadow-md">
      <div className="flex-1">
        <Link href="/" className="text-xl font-bold">
          MyApp
        </Link>
      </div>
      <div className="flex-none gap-2">
        <Link href="/about" className="btn btn-ghost rounded-btn">
          About
        </Link>
        <button className="btn btn-primary" onClick={onOpenModal}>
          Open Modal
        </button>
      </div>
    </nav>
  );
}
