export const metadata = {
  title: "The Believerse",
  description: "One Family in Christ",
};

import "../styles/styles.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
