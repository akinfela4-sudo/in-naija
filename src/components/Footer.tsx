import Link from "next/link";
import { Globe, Users, Newspaper, Info } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t bg-muted/30 pt-12 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand and About */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <span className="text-xl font-bold tracking-tighter text-green-800">
                IN-NAIJA
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Nigeria's #1 AI-powered news platform. Delivering verified, 
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
              <li><Link href="/category/trending" className="hover:text-green-600">Trending News</Link></li>
              <li><Link href="/advertise" className="hover:text-green-600">Advertise</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4">Categories</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/category/politics" className="hover:text-green-600">Politics & Power</Link></li>
              <li><Link href="/category/trending" className="hover:text-green-600">Naija Pulse (Trending)</Link></li>
              <li><Link href="/category/business" className="hover:text-green-600">Business & Economy</Link></li>
              <li><Link href="/category/tech" className="hover:text-green-600">Tech & Innovation</Link></li>
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
          <p>© {new Date().getFullYear()} In-Naija Media. All rights reserved.</p>
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
