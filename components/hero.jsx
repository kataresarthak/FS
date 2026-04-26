"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

const HeroSection = () => {
  return (
    <section className="min-h-screen flex items-center justify-center px-4 relative pt-20 overflow-hidden">
      <Image
        src="/banner.png"
        alt="Background"
        fill
        className="object-cover"
        priority
      />
      {/* Gradient Overlay with enhanced effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/70 to-white/80 backdrop-blur-md"></div>

      {/* Decorative gradient orbs */}
      <div
        className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl animate-pulse"
        style={{ backgroundColor: "rgba(110, 133, 139, 0.15)" }}
      ></div>
      <div
        className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl animate-pulse"
        style={{
          animationDelay: "1s",
          backgroundColor: "rgba(202, 161, 102, 0.15)",
        }}
      ></div>

      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      ></div>

      {/* Content with relative positioning to appear above overlay */}
      <div className="container mx-auto px-4 text-center md:text-left relative z-10 py-12 md:py-20">
        {/* Main Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-[105px] pb-6 gradient-title mb-4 leading-[1.1] tracking-tight">
          Intelligent Finance{" "}
          <br className="hidden sm:block" />
          Management Platform
        </h1>

        {/* Description */}
        <p
          className="text-lg md:text-xl lg:text-2xl mb-10 max-w-2xl mx-auto md:mx-0 leading-relaxed font-light"
          style={{ color: "#32484F" }}
        >
          An AI-powered Personalized Finance Platform That Helps You Track,
          Analyze, And Optimize Your Spending With <br className="hidden md:block" />
          Real Time Insights.
        </p>

        {/* CTA Button */}
        <div className="flex justify-center md:justify-start">
          <Button
            asChild
            size="lg"
            className="group relative px-10 py-6 text-lg font-semibold rounded-full text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden hover-gradient-button"
            style={{
              background:
                "linear-gradient(to right, #32484F, #233A41, #CAA166)",
            }}
          >
            <Link href="/sign-up">
              <span className="relative z-10 flex items-center gap-2">
                GET STARTED
                <svg
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </span>
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
