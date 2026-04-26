"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageSquare, User, Send, CheckCircle2 } from "lucide-react";

const ContactPage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Mocking an API call
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white pt-24 pb-16 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-50 text-green-600 mb-2">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-[#32484F]">Message Sent!</h1>
          <p className="text-[#6E858B]">
            Thank you for reaching out to FinSight. Our team will get back to you within 24-48 hours.
          </p>
          <Button 
            onClick={() => setSubmitted(false)}
            variant="outline"
            className="mt-6 border-[#DDE4E5] text-[#32484F] hover:bg-slate-50"
          >
            Send another message
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Left Side: Info */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-[#32484F] tracking-tight">
                Contact Us
              </h1>
              <p className="text-lg text-[#6E858B] leading-relaxed">
                Have questions about our platform? Need technical support? Or just want to say hi? 
                We&apos;re here to help you gain better control over your finances.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#EEF6F8] flex items-center justify-center shrink-0 border border-[#DDE4E5]">
                  <Mail className="w-6 h-6 text-[#32484F]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#32484F]">Email Us</h3>
                  <p className="text-[#6E858B]">support@finsight.com</p>
                  <p className="text-sm text-[#CAA166] mt-1">Average response: 24h</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#F8F5EE] flex items-center justify-center shrink-0 border border-[#EDDFCB]">
                  <MessageSquare className="w-6 h-6 text-[#32484F]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#32484F]">Community</h3>
                  <p className="text-[#6E858B]">Join our Discord server</p>
                  <p className="text-sm text-[#CAA166] mt-1">Real-time discussion</p>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-gradient-to-br from-[#32484F] to-[#233A41] text-white">
              <h3 className="text-xl font-semibold mb-2">Our Office</h3>
              <p className="text-slate-300">
                123 Finance Way, Suite 400<br />
                San Francisco, CA 94103<br />
                United States
              </p>
            </div>
          </div>

          {/* Right Side: Form */}
          <div className="bg-white rounded-3xl border border-[#DDE4E5] p-8 md:p-10 shadow-xl shadow-slate-100/50">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#32484F] flex items-center gap-2">
                  <User className="w-4 h-4" /> Name
                </label>
                <Input 
                  required
                  placeholder="John Doe"
                  className="bg-slate-50 border-[#DDE4E5] focus:ring-[#CAA166] focus:border-[#CAA166] rounded-xl h-12"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#32484F] flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email
                </label>
                <Input 
                  required
                  type="email"
                  placeholder="john@example.com"
                  className="bg-slate-50 border-[#DDE4E5] focus:ring-[#CAA166] focus:border-[#CAA166] rounded-xl h-12"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#32484F] flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Message
                </label>
                <Textarea 
                  required
                  placeholder="How can we help you today?"
                  className="bg-slate-50 border-[#DDE4E5] focus:ring-[#CAA166] focus:border-[#CAA166] rounded-xl min-h-[150px] resize-none"
                />
              </div>

              <Button 
                disabled={loading}
                type="submit"
                className="w-full h-12 rounded-xl text-white font-semibold shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] gap-2"
                style={{
                  background: "linear-gradient(to right, #32484F, #233A41, #CAA166)",
                }}
              >
                {loading ? "Sending..." : (
                  <>
                    <Send className="w-4 h-4" /> Send Message
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
