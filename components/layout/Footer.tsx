import Link from "next/link";
import { Building2, Phone, Mail, MapPin, Share2, MessageSquare, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-brand-navy text-white mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-white text-lg">
                YourKey<span className="text-blue-300">MTL</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Your dedicated leasing agent in Montreal. We help you find the perfect rental home — from cozy studios to spacious family apartments.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <a
                href="#"
                className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="Instagram"
              >
                <Share2 className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="Facebook"
              >
                <MessageSquare className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="LinkedIn"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-semibold text-white mb-4">Navigation</h3>
            <ul className="space-y-3">
              {[
                { href: "/", label: "Home" },
                { href: "/buildings", label: "Browse Buildings" },
                { href: "/properties", label: "Available Units" },
                { href: "/contact", label: "Contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 text-sm hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Neighbourhoods */}
          <div>
            <h3 className="font-semibold text-white mb-4">Neighbourhoods</h3>
            <ul className="space-y-3">
              {[
                "Downtown",
                "Plateau",
                "Mile-End",
                "Rosemont",
                "Griffintown",
                "Saint-Henri",
                "Hochelaga",
              ].map((n) => (
                <li key={n}>
                  <Link
                    href={`/buildings?neighbourhood=${encodeURIComponent(n)}`}
                    className="text-gray-400 text-sm hover:text-white transition-colors"
                  >
                    {n}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white mb-4">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-blue-300 mt-0.5 shrink-0" />
                <span className="text-gray-400 text-sm">
                  Montreal, Québec<br />
                  Canada
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-blue-300 shrink-0" />
                <a
                  href="tel:+15141234567"
                  className="text-gray-400 text-sm hover:text-white transition-colors"
                >
                  (514) 123-4567
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-blue-300 shrink-0" />
                <a
                  href="mailto:hello@yourkeymtl.com"
                  className="text-gray-400 text-sm hover:text-white transition-colors"
                >
                  hello@yourkeymtl.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} YourKeyMTL. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm">
            Licensed Real Estate Leasing Agent — Québec
          </p>
        </div>
      </div>
    </footer>
  );
}
