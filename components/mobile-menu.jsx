"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "./ui/button";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";

export default function MobileMenu({ navItems = [] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 w-9 flex items-center justify-center text-white rounded-xl shadow-md transition-all duration-200 active:scale-95"
        style={{
          background: "linear-gradient(to right, #32484F, #233A41, #CAA166)",
        }}
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-4 right-4 bg-white/95 backdrop-blur-xl border border-[#DDE4E5] shadow-2xl rounded-2xl p-3 z-50 flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-4 duration-300">
          <SignedOut>
            <a
              href="#working"
              onClick={() => setIsOpen(false)}
              className="px-4 py-3 rounded-xl text-base font-semibold text-[#32484F] hover:bg-slate-50 transition-colors"
            >
              Working
            </a>
            <a
              href="#features"
              onClick={() => setIsOpen(false)}
              className="px-4 py-3 rounded-xl text-base font-semibold text-[#32484F] hover:bg-slate-50 transition-colors"
            >
              Features
            </a>
            <div className="mt-2 flex flex-col gap-2 pt-3 border-t border-slate-100">
              <SignInButton forceRedirectUrl="/dashboard">
                <Button
                  variant="outline"
                  className="w-full h-11 justify-center rounded-xl border-[#DDE4E5] font-semibold"
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton forceRedirectUrl="/dashboard">
                <Button
                  className="w-full h-11 justify-center text-white rounded-xl font-semibold transition-transform active:scale-95"
                  style={{
                    background: "linear-gradient(to right, #32484F, #233A41, #CAA166)",
                  }}
                  onClick={() => setIsOpen(false)}
                >
                  Get Started
                </Button>
              </SignUpButton>
            </div>
          </SignedOut>

          <SignedIn>
            <div className="px-2 py-1 mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Navigation
            </div>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="px-4 py-3 rounded-xl text-base font-semibold text-[#32484F] hover:bg-slate-50 transition-all active:translate-x-1"
              >
                {item.label}
              </Link>
            ))}
          </SignedIn>
        </div>
      )}
    </div>
  );
}
