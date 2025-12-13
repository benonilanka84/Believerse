import "../styles/globals.css";
import NavWrapper from "@/components/NavWrapper";
// Assuming Footer is in src/components/Footer.js, using '@' is safer than relative paths
import Footer from "@/components/Footer"; 

export const metadata = {
  title: "The Believerse - One Family in Christ",
  description: "A Christian faith-based community platform for fellowship, prayer, and spiritual growth.",
  icons: {
    icon: '/images/final-logo.png',
    apple: '/images/final-logo.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* Navigation Bar at the top */}
        <NavWrapper />
        
        {/* Main Content Area */}
        <div style={{ minHeight: "calc(100vh - 300px)" }}>
            {children}
        </div>
        
        {/* Footer at the bottom */}
        <Footer />
      </body>
    </html>
  );
}