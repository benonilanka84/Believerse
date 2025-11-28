import "@/styles/globals.css";
import NavBar from "@/components/NavBar";

export const metadata = {
  title: "The Believerse",
  description: "The Believerse - Community App",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <NavBar />
        <main>{children}</main>
      </body>
    </html>
  );
}
