import "@/styles/globals.css";

export const metadata = {
  title: "The Believerse",
  description: "The Believerse - community",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
