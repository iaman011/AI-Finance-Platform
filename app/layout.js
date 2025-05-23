import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";


const inter = Inter({ subsets: ["latin"]});

export const metadata = {
  title: "QuantEdge",
  description: "AI finance platform with smart insights and strategies.",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
    <html lang="en">
      <body className={`${inter.className}`}>
          <Header />
          <main className="min-h-screen">
            {children}
          </main>
          <Toaster richColors />
          {/* richColors to automatically deduct the colors for warning , errors etc */}
          {/* footer */}
        <footer className="bg-blue-50 py-6">
            <div className="container mx-auto px-4 text-center text-gray-600">
              <p>©Aman Singh | India</p>
            </div>
          </footer>
      </body>
    </html>
    </ClerkProvider>
  );
}
