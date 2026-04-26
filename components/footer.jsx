"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const Footer = () => {
  const pathname = usePathname();
  
  // Hide footer on authentication pages
  const isAuthPage = pathname?.startsWith("/sign-in") || pathname?.startsWith("/sign-up");
  
  if (isAuthPage) {
    return null;
  }
  
  return (
    <footer className="relative py-8 overflow-hidden border-t" style={{ background: 'linear-gradient(to bottom, #EEF6F8, #ffffff)', borderColor: 'rgba(221, 228, 229, 0.5)' }}>
      {/* Decorative Top Border */}
      <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(to right, transparent, #6E858B, transparent)' }}></div>
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-20" style={{ backgroundColor: 'rgba(167, 184, 189, 0.1)' }}></div>
      
      <div className="container mx-auto px-4 text-center relative z-10">
        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mb-6 text-sm sm:text-base">
          <Link 
            href="/privacy"
            className="font-medium transition-all duration-300 hover:scale-105 relative group"
            style={{ color: '#6E858B' }}
          >
            <span className="relative z-10 hover:text-[#32484F] transition-colors">Privacy</span>
            <span className="absolute bottom-[-2px] left-0 w-0 h-0.5 bg-[#CAA166] transition-all duration-300 group-hover:w-full"></span>
          </Link>
          
          <span className="hidden sm:block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#DDE4E5' }}></span>
          
          <Link 
            href="/terms"
            className="font-medium transition-all duration-300 hover:scale-105 relative group"
            style={{ color: '#6E858B' }}
          >
            <span className="relative z-10 hover:text-[#32484F] transition-colors">Terms</span>
            <span className="absolute bottom-[-2px] left-0 w-0 h-0.5 bg-[#CAA166] transition-all duration-300 group-hover:w-full"></span>
          </Link>
          
          <span className="hidden sm:block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#DDE4E5' }}></span>
          
          <Link 
            href="/contact"
            className="font-medium transition-all duration-300 hover:scale-105 relative group"
            style={{ color: '#6E858B' }}
          >
            <span className="relative z-10 hover:text-[#32484F] transition-colors">Contact</span>
            <span className="absolute bottom-[-2px] left-0 w-0 h-0.5 bg-[#CAA166] transition-all duration-300 group-hover:w-full"></span>
          </Link>
        </div>
        
        {/* Copyright */}
        <p className="text-sm sm:text-base font-medium" style={{ color: '#6E858B' }}>
          © 2026 FinSight. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;

