import { Fredoka } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-fredoka",
  display: "swap",
});

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
