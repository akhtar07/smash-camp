import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SMASH CAMP",
  description: "Elite Badminton Training & Analysis",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen" style={{ background: '#0f1511', color: '#dee4de' }}>
        {children}
      </body>
    </html>
  );
}
