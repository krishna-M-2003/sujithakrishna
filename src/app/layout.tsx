import { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sujitha | A Cinematic Birthday Celebration",
  description: "A premium luxury interactive journey made exclusively for Sujitha on her special day.",
  authors: [{ name: "A boy who loved her" }],
  openGraph: {
    title: "Sujitha | A Cinematic Birthday Celebration",
    description: "A premium luxury interactive journey made exclusively for Sujitha on her special day.",
    type: "website",
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
