// app/layout.js
import "@/styles/globals.css";

export const metadata = {
  title: "The Believerse",
  description: "One Family in Christ.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
