import React from "react";
import { Button } from "@/components/ui/button";
import { howItWorksData } from "@/data/landing";
import HeroSection from "@/components/hero";
import Link from "next/link";
import { PieChart, BarChart3, Receipt, Zap, Globe, Bell } from "lucide-react";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <HeroSection />
      {/* How It Works Section */}
      <section
        id="working"
        className="relative py-24 md:py-28 overflow-hidden"
        style={{
          background: "linear-gradient(to bottom, #EEF6F8, #ffffff, #EEF6F8)",
        }}
      >
        {/* Decorative Background Elements */}
        <div
          className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-30"
          style={{ backgroundColor: "rgba(167, 184, 189, 0.15)" }}
        ></div>
        <div
          className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-30"
          style={{ backgroundColor: "rgba(202, 161, 102, 0.15)" }}
        ></div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Header */}
          <div className="text-center mb-12 md:mb-20">
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
              style={{ color: "#32484F" }}
            >
              How It Works
            </h2>
            <p
              className="text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
              style={{ color: "#6E858B" }}
            >
              Get started in three simple steps and take control of your
              finances
            </p>
          </div>

          <div className="relative max-w-6xl mx-auto">
            {/* Enhanced Connection Line - Desktop Only */}
            <div
              className="hidden md:block absolute top-32 left-0 right-0 h-1 transform -translate-y-1/2 z-0"
              style={{
                background:
                  "linear-gradient(to right, transparent, #6E858B, #CAA166, #6E858B, transparent)",
              }}
            >
              <div
                className="absolute inset-0 animate-pulse"
                style={{
                  background:
                    "linear-gradient(to right, transparent, rgba(110, 133, 139, 0.3), rgba(202, 161, 102, 0.3), rgba(110, 133, 139, 0.3), transparent)",
                }}
              ></div>
              <div className="absolute left-0 top-0 h-full w-1/3 bg-gradient-to-r from-[#6E858B] to-transparent opacity-50 animate-shimmer"></div>
            </div>

            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-8">
              {howItWorksData.map((step, index) => (
                <div key={index} className="relative group">
                  {/* Enhanced Step Number Badge */}
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="relative">
                      {/* Glow effect */}
                      <div
                        className="absolute inset-0 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300"
                        style={{
                          background:
                            "linear-gradient(to bottom right, #32484F, #CAA166)",
                        }}
                      ></div>
                      {/* Badge */}
                      <div
                        className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl border-4 border-white group-hover:scale-110 transition-transform duration-300"
                        style={{
                          background:
                            "linear-gradient(to bottom right, #32484F, #233A41, #CAA166)",
                        }}
                      >
                        <span className="text-white font-bold text-lg">
                          {index + 1}
                        </span>
                        {/* Animated ring */}
                        <div
                          className="absolute inset-0 rounded-full border-2 opacity-50 animate-ping"
                          style={{ borderColor: "#CAA166" }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Card */}
                  <div
                    className="relative mt-10 bg-white rounded-3xl p-8 md:p-10 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border overflow-hidden group"
                    style={{ borderColor: "#DDE4E5" }}
                  >
                    {/* Animated gradient background */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{
                        background:
                          "linear-gradient(to bottom right, rgba(238, 246, 248, 0.8), rgba(221, 228, 229, 0.8))",
                      }}
                    ></div>

                    {/* Decorative gradient blob */}
                    <div
                      className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-2xl opacity-30 group-hover:opacity-50 group-hover:scale-150 transition-all duration-500"
                      style={{ backgroundColor: "rgba(167, 184, 189, 0.3)" }}
                    ></div>

                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                    {/* Content */}
                    <div className="relative z-10">
                      {/* Enhanced Icon Container */}
                      <div
                        className="w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center shadow-lg border-2 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500"
                        style={{
                          background:
                            "linear-gradient(to bottom right, #EEF6F8, #DDE4E5)",
                          borderColor: "#A7B8BD",
                        }}
                      >
                        <div
                          className="transition-colors duration-300"
                          style={{ color: "#32484F" }}
                        >
                          {step.icon}
                        </div>
                        {/* Icon glow */}
                        <div
                          className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{
                            background:
                              "linear-gradient(to bottom right, rgba(50, 72, 79, 0.1), rgba(202, 161, 102, 0.1))",
                          }}
                        ></div>
                      </div>

                      {/* Title */}
                      <h3
                        className="text-xl md:text-2xl font-bold mb-4 text-center transition-colors duration-300"
                        style={{ color: "#32484F" }}
                      >
                        {step.title.replace(/^\d+\.\s*/, "")}
                      </h3>

                      {/* Description */}
                      <p
                        className="text-center leading-relaxed text-base md:text-lg"
                        style={{ color: "#6E858B" }}
                      >
                        {step.description}
                      </p>
                    </div>

                    {/* Enhanced Decorative Corner Elements */}
                    <div
                      className="absolute top-3 right-3 w-12 h-12 border-t-2 border-r-2 rounded-tr-3xl transition-colors duration-300"
                      style={{ borderColor: "#A7B8BD" }}
                    ></div>
                    <div
                      className="absolute bottom-3 left-3 w-12 h-12 border-b-2 border-l-2 rounded-bl-3xl transition-colors duration-300"
                      style={{ borderColor: "#CAA166" }}
                    ></div>
                  </div>

                  {/* Enhanced Arrow Connector - Between Cards (Desktop) */}
                  {index < howItWorksData.length - 1 && (
                    <div className="hidden md:block absolute top-32 -right-4 z-30 group-hover:scale-110 transition-transform duration-300">
                      <div className="relative">
                        {/* Glow effect */}
                        <div
                          className="absolute inset-0 rounded-full blur-md opacity-50"
                          style={{
                            background:
                              "linear-gradient(to right, #6E858B, #CAA166)",
                          }}
                        ></div>
                        {/* Arrow circle */}
                        <div
                          className="relative w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white"
                          style={{
                            background:
                              "linear-gradient(to right, #6E858B, #CAA166)",
                          }}
                        >
                          <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="relative pt-8 pb-12 md:pt-24 md:pb-20 overflow-hidden"
        style={{
          background: "linear-gradient(to bottom, #ffffff, #EEF6F8, #ffffff)",
        }}
      >
        {/* Decorative Background Elements */}
        <div
          className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: "rgba(167, 184, 189, 0.1)" }}
        ></div>
        <div
          className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: "rgba(202, 161, 102, 0.1)" }}
        ></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-10 md:mb-16">
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4 px-2"
              style={{ color: "#32484F" }}
            >
              Everything you need to manage your finances
            </h2>
            <p
              className="text-base md:text-lg max-w-2xl mx-auto mb-4 md:mb-10 px-4"
              style={{ color: "#6E858B" }}
            >
              Powerful AI-driven features designed to help you take complete
              control of your financial future
            </p>
          </div>

          <div className="relative max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Feature 1 - Smart Budgeting */}
              <div
                className="group relative overflow-hidden rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border"
                style={{
                  background:
                    "linear-gradient(to bottom right, #EEF6F8, #DDE4E5)",
                  borderColor: "rgba(167, 184, 189, 0.5)",
                }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background:
                      "linear-gradient(to bottom right, rgba(50, 72, 79, 0.05), rgba(202, 161, 102, 0.05))",
                  }}
                ></div>

                <div className="relative z-10 flex flex-col h-full">
                  <div className="mb-6">
                    <div className="inline-flex items-center gap-2 mb-3 bg-white/50 px-3 py-1 rounded-full border border-[#A7B8BD]/30">
                      <div
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: "#32484F" }}
                      ></div>
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: "#233A41" }}
                      >
                        Optimization
                      </span>
                    </div>
                    <h3
                      className="text-xl md:text-2xl font-bold mb-3"
                      style={{ color: "#32484F" }}
                    >
                      Intelligent Budgeting
                    </h3>
                    <p
                      className="text-sm leading-relaxed mb-6"
                      style={{ color: "#6E858B" }}
                    >
                      Create adaptive budgets that learn from your habits. Get
                      real-time alerts when you&apos;re approaching limits.
                    </p>
                  </div>

                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex -space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-md flex items-center justify-center border border-[#A7B8BD]/20 group-hover:scale-110 transition-transform">
                        <PieChart
                          className="w-5 h-5"
                          style={{ color: "#32484F" }}
                        />
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-[#32484F] shadow-md flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform delay-75">
                        <BarChart3 className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 2 - AI Insights */}
              <div
                className="group relative overflow-hidden rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border"
                style={{
                  background:
                    "linear-gradient(to bottom right, #32484F, #10262E)",
                  borderColor: "#233A41",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                <div className="relative z-10 flex flex-col h-full">
                  <div className="mb-6">
                    <div className="inline-flex items-center gap-2 mb-3 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                      <div
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: "#CAA166" }}
                      ></div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#CAA166]">
                        Gemini AI
                      </span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
                      Deep AI Analytics
                    </h3>
                    <p
                      className="text-sm leading-relaxed mb-6"
                      style={{ color: "rgba(255, 255, 255, 0.8)" }}
                    >
                      Leverage Gemini AI to decode your financial DNA. Spot
                      hidden trends and get personalized wealth-building advice.
                    </p>
                  </div>

                  <div className="mt-auto flex items-center justify-between">
                    <Zap className="w-6 h-6 text-[#CAA166] animate-pulse" />
                    <div className="text-[10px] font-mono text-white/40 uppercase tracking-tighter">
                      AI Core v2.5
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 3 - Budget Alerts */}
              <div
                className="group relative overflow-hidden rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border"
                style={{
                  background:
                    "linear-gradient(to bottom right, #EDF5F7, #ffffff)",
                  borderColor: "rgba(202, 161, 102, 0.2)",
                }}
              >
                <div className="relative z-10 flex flex-col h-full">
                  <div className="mb-6">
                    <div className="inline-flex items-center gap-2 mb-3 bg-[#CAA166]/10 px-3 py-1 rounded-full border border-[#CAA166]/20">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: "#32484F" }}
                      ></div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#32484F]">
                        Protection
                      </span>
                    </div>
                    <h3
                      className="text-xl md:text-2xl font-bold mb-3"
                      style={{ color: "#32484F" }}
                    >
                      Smart Budget Alerts
                    </h3>
                    <p
                      className="text-sm leading-relaxed mb-6"
                      style={{ color: "#6E858B" }}
                    >
                      FinSight monitors your spending across categories. Receive
                      instant alerts via email when you exceed 80% of your set
                      thresholds.
                    </p>
                  </div>

                  <div className="mt-auto">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#CAA166]/20 flex items-center justify-center text-[#CAA166] scale-90 group-hover:scale-100 transition-transform">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div className="h-[1px] flex-1 bg-gradient-to-r from-[#CAA166]/50 to-transparent"></div>
                      <div className="text-xs font-semibold text-[#32484F]/60">
                        Email & Push
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 4 - Recurring & Automation */}
              <div
                className="group relative overflow-hidden rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border"
                style={{
                  background:
                    "linear-gradient(to bottom right, #233A41, #32484F)",
                  borderColor: "#10262E",
                }}
              >
                <div className="relative z-10 flex flex-col h-full">
                  <div className="mb-6">
                    <div className="inline-flex items-center gap-2 mb-3 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: "#6E858B" }}
                      ></div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#DDE4E5]">
                        Automation
                      </span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
                      Sub & Bill Tracking
                    </h3>
                    <p
                      className="text-sm leading-relaxed mb-6"
                      style={{ color: "rgba(255, 255, 255, 0.8)" }}
                    >
                      Automatically track rentals and recurring bills with smart
                      reminders and automated balance updates.
                    </p>
                  </div>

                  <div className="mt-auto">
                    <div className="w-full h-10 bg-white/5 rounded-xl border border-white/10 flex items-center px-4 overflow-hidden relative">
                      <span className="text-[10px] text-white/70">
                        Netflix • $15.99
                      </span>
                      <div className="ml-auto text-[10px] text-[#CAA166] italic">
                        Next: Oct 24
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 5 - Receipt Scanner */}
              <div
                className="group relative overflow-hidden rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border"
                style={{
                  background:
                    "linear-gradient(to bottom right, #ffffff, #EEF6F8)",
                  borderColor: "rgba(110, 133, 139, 0.2)",
                }}
              >
                <div className="relative z-10 flex flex-col h-full">
                  <div className="mb-6">
                    <div className="inline-flex items-center gap-2 mb-3 bg-[#EEF6F8] px-3 py-1 rounded-full border border-[#DDE4E5]">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: "#32484F" }}
                      ></div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#32484F]">
                        OCR Scan
                      </span>
                    </div>
                    <h3
                      className="text-xl md:text-2xl font-bold mb-3"
                      style={{ color: "#32484F" }}
                    >
                      Smart Receipt Scanner
                    </h3>
                    <p
                      className="text-sm leading-relaxed mb-6"
                      style={{ color: "#6E858B" }}
                    >
                      Snap and save. Our high-precision OCR extracts every
                      detail from receipts and categorizes them instantly.
                    </p>
                  </div>

                  <div className="mt-auto flex items-end justify-between">
                    <div className="w-12 h-12 rounded-full bg-[#32484F] flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform">
                      <Receipt className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 6 - Reports */}
              <div
                className="group relative overflow-hidden rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border"
                style={{
                  background:
                    "linear-gradient(to bottom right, #32484F, #10262E)",
                  borderColor: "#233A41",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                <div className="relative z-10 flex flex-col h-full text-white">
                  <div className="mb-6">
                    <div className="inline-flex items-center gap-2 mb-3 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                      <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#CAA166]">
                        Insights
                      </span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold mb-3">
                      Financial Reports
                    </h3>
                    <p className="text-sm leading-relaxed mb-6 text-white/90">
                      Receive detailed monthly digests via email, featuring
                      AI-generated insights to keep your financial health in
                      check.
                    </p>
                  </div>

                  <div className="mt-auto flex justify-between items-center">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-[#CAA166]" />
                    </div>
                    <div className="text-xs font-bold uppercase text-white/40">
                      Weekly / Monthly
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* CTA Section */}
      <section
        className="relative py-16 md:py-24 overflow-hidden"
        style={{
          background:
            "linear-gradient(to bottom right, #32484F, #233A41, #10262E)",
        }}
      >
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: "40px 40px",
            }}
          ></div>
        </div>

        {/* Decorative Blobs */}
        <div
          className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl animate-pulse"
          style={{ backgroundColor: "rgba(110, 133, 139, 0.2)" }}
        ></div>
        <div
          className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl animate-pulse"
          style={{
            animationDelay: "1s",
            backgroundColor: "rgba(202, 161, 102, 0.2)",
          }}
        ></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            {/* <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white/90 text-sm font-semibold">Join 50,000+ Happy Users</span>
            </div> */}

            {/* Main Heading */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight px-4">
              Ready to Transform
              <br className="hidden sm:block" />
              <span
                className="bg-clip-text text-transparent"
                style={{
                  background:
                    "linear-gradient(to right, #CAA166, #EEF6F8, #CAA166)",
                  WebkitBackgroundClip: "text",
                }}
              >
                Your Finances?
              </span>
            </h2>

            {/* Description */}
            <p
              className="text-xl mb-6 max-w-2xl mx-auto leading-relaxed"
              style={{ color: "rgba(238, 246, 248, 0.9)" }}
            >
              Achieve smarter financial management with AI-powered insights and
              automation that simplify Budgeting, Optimize spending, and enhance
              Decision-making.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-2">
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="group relative px-8 py-6 text-lg bg-white hover:bg-[#EEF6F8] font-semibold rounded-full shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden"
                  style={{ color: "#32484F" }}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Let&apos;s Get Started
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
                  {/* Hover Effect */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: "linear-gradient(to right, #EEF6F8, #DDE4E5)",
                    }}
                  ></div>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
