// app/layout.jsx
import "@/styles/globals.css"; // IMPORTANT: this path assumes you have styles/globals.css at repo root
export const metadata = {
  title: "The Believerse",
  description: "One Family in Christ",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
