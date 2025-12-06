import "../styles/globals.css";
import NavWrapper from "@/components/NavWrapper";

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
      <head>
        <link rel="icon" href="/images/final-logo.png" sizes="any" />
        <link rel="apple-touch-icon" href="/images/final-logo.png" />
      </head>
      <body>
        <NavWrapper />
        {children}
      </body>
    </html>
  );
}