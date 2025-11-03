import { Geist, Geist_Mono, Fredoka } from "next/font/google";
import "./globals.css";

// Geist fonts
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fredoka = Fredoka({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-fredoka" });

export const metadata = {
  title: "Impactly",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={fredoka.variable}>{children}</body>
    </html>
  );
}
