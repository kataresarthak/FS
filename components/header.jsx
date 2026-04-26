import React from "react";
import { Button } from "./ui/button";
import Link from "next/link";
import { PenBox } from "lucide-react";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import Image from "next/image";
import MainNavbar from "@/components/main-navbar";
import UserButtonSafe from "@/components/user-button-safe";
import AddTransactionDrawer from "@/components/add-transaction-drawer";
import MobileMenu from "./mobile-menu";

const Header = () => {

  return (
    <header
      className="fixed top-0 w-full z-50 border-b bg-white/70 backdrop-blur-xl shadow-sm"
      style={{ borderColor: "rgba(221, 228, 229, 0.5)" }}
    >
      {/* Decorative gradient line at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[1px]"
        style={{
          background:
            "linear-gradient(to right, transparent, #6E858B, transparent)",
        }}
      ></div>

      <nav className="container mx-auto px-4 py-2.5 md:py-3 relative">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Logo */}
          <Link href="/" className="group shrink-0 relative">
            <div
              className="absolute -inset-1 rounded-lg opacity-0 group-hover:opacity-100 blur transition-opacity duration-300"
              style={{
                background:
                  "linear-gradient(to right, rgba(50, 72, 79, 0.1), rgba(202, 161, 102, 0.1))",
              }}
            ></div>
            <Image
              src={"/logo.png"}
              alt="FinSight Logo"
              width={160}
              height={40}
              priority
              className="relative h-8 w-auto sm:h-11 md:h-12 transition-transform duration-300 group-hover:scale-105 object-contain"
            />
          </Link>

          {/* Center: Navigation (Visible above mobile) */}
          <SignedIn>
            <div className="hidden md:flex flex-1 justify-center px-2">
              <MainNavbar />
            </div>
          </SignedIn>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <SignedOut>
              <div className="hidden sm:flex items-center gap-2 md:gap-3">
                <SignInButton forceRedirectUrl="/dashboard">
                  <Button
                    variant="ghost"
                    className="h-9 px-4 text-[#32484F] hover:bg-slate-50 transition-colors"
                  >
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton forceRedirectUrl="/dashboard">
                  <Button
                    className="h-9 px-5 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 font-medium rounded-xl"
                    style={{
                      background:
                        "linear-gradient(to right, #32484F, #233A41, #CAA166)",
                    }}
                  >
                    Get Started
                  </Button>
                </SignUpButton>
              </div>
              <div className="sm:hidden">
                <MobileMenu />
              </div>
            </SignedOut>

            <SignedIn>
              <AddTransactionDrawer>
                <Button
                  className="h-9 w-9 md:w-auto md:px-4 flex items-center justify-center gap-2 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover-gradient-button rounded-xl border-none shrink-0"
                  style={{
                    background:
                      "linear-gradient(to right, #32484F, #233A41, #CAA166)",
                  }}
                >
                  <PenBox className="h-4 w-4" />
                  <span className="hidden md:inline font-semibold text-sm">
                    Add Transaction
                  </span>
                </Button>
              </AddTransactionDrawer>

              <div className="shrink-0 flex items-center justify-center">
                <UserButtonSafe />
              </div>

              {/* Hamburger Menu for SignedIn Mobile Users */}
              <div className="md:hidden shrink-0">
                <MobileMenu
                  navItems={[
                    { href: "/dashboard", label: "Dashboard" },
                    { href: "/transactions", label: "Transactions" },
                    { href: "/reports", label: "Reports" },
                  ]}
                />
              </div>
            </SignedIn>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
