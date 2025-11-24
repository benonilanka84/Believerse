// app/layout.jsx
import "@/styles/globals.css"; // your existing globals
import ProfileAvatar from "@/components/ProfileAvatar"; // this is a client component

export const metadata = {
  title: "The Believerse",
  description: "One Family in Christ",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          {/* left: nothing, header occupies top bar; avatar on right */}
          <div className="header-inner">
            <div className="header-left" />
            <div className="header-right">
              {/* ProfileAvatar is a client component, will render only once user logs in */}
              <ProfileAvatar />
            </div>
          </div>
        </header>

        <main>{children}</main>
      </body>
    </html>
  );
}
