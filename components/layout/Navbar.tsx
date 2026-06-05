"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/buildings", label: "Buildings" },
  { href: "/properties", label: "Units" },
  { href: "/contact", label: "About" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white">
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="font-semibold text-brand-navy text-[1.05rem] tracking-tight">
            YourKey<span className="text-brand-blue">MTL</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-xl text-sm transition-colors ${
                  pathname === link.href
                    ? "text-brand-navy font-medium"
                    : "text-gray-500 hover:text-brand-navy"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center">
            <Link
              href="/contact"
              className="px-5 py-2.5 bg-brand-navy text-white text-sm font-medium rounded-xl hover:bg-brand-blue transition-colors"
            >
              Get in touch
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-xl hover:bg-gray-50 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="w-5 h-5 text-brand-navy" />
            ) : (
              <Menu className="w-5 h-5 text-brand-navy" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-3 rounded-xl text-sm transition-colors ${
                  pathname === link.href
                    ? "text-brand-navy font-medium bg-gray-50"
                    : "text-gray-500 hover:bg-gray-50 hover:text-brand-navy"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2">
              <Link
                href="/contact"
                onClick={() => setMobileOpen(false)}
                className="block w-full text-center px-5 py-3 bg-brand-navy text-white text-sm font-medium rounded-xl hover:bg-brand-blue transition-colors"
              >
                Get in touch
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
