import "./globals.css"; // optional: your Tailwind or global styles

export const metadata = {
  title: "SoldiumX Token Dashboard",
  description: "Real-time buy/sell transactions for SoldiumX token",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>SoldiumX Token Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="bg-gray-100 text-gray-800 font-sans">
        {/* Header */}
        <header className="bg-white shadow-md py-4 mb-6">
          <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              SoldiumX Token Dashboard
            </h1>
            <nav>
              <a
                href="#"
                className="text-gray-700 hover:text-gray-900 ml-4 font-medium"
              >
                Home
              </a>
              <a
                href="#"
                className="text-gray-700 hover:text-gray-900 ml-4 font-medium"
              >
                Telegram Alerts
              </a>
            </nav>
          </div>
        </header>

        {/* Page content */}
        <main className="max-w-6xl mx-auto px-6">{children}</main>

        {/* Footer */}
        <footer className="mt-12 py-6 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} SoldiumX. All rights reserved.
        </footer>
      </body>
    </html>
  );
}
