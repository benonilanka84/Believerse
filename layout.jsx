import '../styles/globals.css';
import NavBar from '../components/NavBar';

export const metadata = {
  title: 'The Believerse',
  description: 'One Family in Christ.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="app-bg">
          <NavBar />
          <main className="container">{children}</main>
        </div>
      </body>
    </html>
  );
}
