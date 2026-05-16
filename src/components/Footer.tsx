"use client";

import Link from "next/link";
import { Globe, Users, Info } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-zinc-50 border-t mt-auto">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tighter bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
              IN-NAIJA
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Nigeria's first AI-automated news platform. delivering zero-plagiarism, 
              localized, and trending stories in Standard English and Pidgin.
            </p>
            <div className="flex space-x-4 mt-6">
              <Link href="#" className="text-muted-foreground hover:text-green-600 transition-colors">
                <Globe className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-green-600 transition-colors">
                <Users className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-green-600 transition-colors">
                <Info className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4">Platform</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-green-600">About Us</Link></li>
              <li><Link href="/newsroom" className="hover:text-green-600">Newsroom</Link></li>
              <li><Link href="/elections" className="hover:text-green-600">Election Hub</Link></li>
              <li><Link href="/advertise" className="hover:text-green-600">Advertise</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4">Categories</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/category/politics" className="hover:text-green-600">Politics</Link></li>
              <li><Link href="/category/entertainment" className="hover:text-green-600">Entertainment</Link></li>
              <li><Link href="/category/tech" className="hover:text-green-600">Technology</Link></li>
              <li><Link href="/category/sports" className="hover:text-green-600">Sports</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4">Stay Updated</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Get the latest Nigerian news delivered to your inbox daily.
            </p>
            <form className="flex gap-2">
              <input 
                type="email" 
                placeholder="Email address" 
                className="flex-1 bg-background border rounded px-3 py-1 text-sm outline-none focus:border-green-600"
              />
              <button className="bg-green-700 text-white px-3 py-1 rounded text-sm hover:bg-green-800">
                Join
              </button>
            </form>
          </div>
        </div>

        <div className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} In-Naija Media. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-green-600">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-green-600">Terms of Service</Link>
            <Link href="/cookies" className="hover:text-green-600">Cookie Settings</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
