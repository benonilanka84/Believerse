// app/layout.jsx
import "@/styles/globals.css";
import ProfileAvatar from "@/components/ProfileAvatar";

export const metadata = {
  title: "The Believerse",
  description: "One Family in Christ",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* Top-right avatar area (ProfileAvatar is a client component) */}
        <header className="site-header">
          <div className="header-inner">
            <div className="header-left" />
            <div className="header-right">
              <ProfileAvatar />
            </div>
          </div>
        </header>

        <main>{children}</main>

        {/* small footer spacer to avoid fixed elements covering content */}
        <div style={{ height: 16 }} />
      </body>
    </html>
  );
}
