// app/layout.js
import "@/styles/globals.css";
import Header from "@/components/Header";

export const metadata = {
  title: "The Believerse",
  description: "One Family in Christ",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Header /> {/* <-- Now Header handles client logic */}
        {children}
      </body>
    </html>
  );
}
