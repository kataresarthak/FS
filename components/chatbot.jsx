"use client";

import { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Bot, X, Send, Loader2 } from "lucide-react";
import Link from "next/link";

export default function Chatbot() {
  const { user, isLoaded } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [isHiddenByDrawer, setIsHiddenByDrawer] = useState(false);
  const [showTeaser, setShowTeaser] = useState(true);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTeaser(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  useEffect(() => {
    const onDrawerToggle = (event) => {
      const isDrawerOpen = Boolean(event?.detail?.open);
      setIsHiddenByDrawer(isDrawerOpen);

      if (isDrawerOpen) {
        setIsOpen(false);
        setShowTeaser(false);
      }
    };

    window.addEventListener("add-transaction-drawer-toggle", onDrawerToggle);
    return () => {
      window.removeEventListener(
        "add-transaction-drawer-toggle",
        onDrawerToggle,
      );
    };
  }, []);

  const sendMessage = async (messageText) => {
    if (!messageText?.trim() || isLoading) return;

    const userMessage = { role: "user", content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const apiMessage =
          typeof errorData?.error === "string" ? errorData.error : "";
        throw new Error(apiMessage || "Unable to respond right now.");
      }

      const data = await response.json();
      setMessages((prev) => [...prev, data]);
    } catch (error) {
      const rawMessage = (error?.message || "").toLowerCase();
      const isQuotaOrLoadIssue =
        rawMessage.includes("usage limit") ||
        rawMessage.includes("quota") ||
        rawMessage.includes("resource_exhausted") ||
        rawMessage.includes("high demand") ||
        rawMessage.includes("temporarily unavailable") ||
        rawMessage.includes("rate limit") ||
        rawMessage.includes("timeout");

      const friendlyMessage = isQuotaOrLoadIssue
        ? "Chat limit reached. Please try again after some time."
        : "Something went wrong. Please try again after some time.";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: friendlyMessage,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    await sendMessage(input);
  };

  if (!isLoaded) return null;
  if (isHiddenByDrawer) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[80] flex flex-col items-end space-y-2">
      {!isOpen && showTeaser && (
        <div className="w-[390px] max-w-[calc(100vw-2rem)]">
          <div
            className="mb-2 flex items-center justify-evenly rounded-3xl border bg-white px-3 py-4 shadow-xl"
            style={{ borderColor: "#DDE4E5" }}
          >
            <p
              className="text-base whitespace-nowrap"
              style={{ color: "#32484F" }}
            >
              Hi! Need help managing your finances?
            </p>
            <button
              type="button"
              aria-label="Close chatbot teaser"
              className="rounded-full p-1 transition-colors"
              style={{ color: "#6E858B" }}
              onClick={() => setShowTeaser(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {isOpen && (
        <Card
          className="w-[360px] max-w-[calc(100vw-2rem)] h-[520px] shadow-2xl flex flex-col rounded-3xl overflow-hidden"
          style={{ borderColor: "#DDE4E5" }}
        >
          <CardHeader
            className="p-4 border-b flex flex-row items-center justify-between"
            style={{ backgroundColor: "#EEF6F8", borderColor: "#DDE4E5" }}
          >
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bot className="w-4 h-4" style={{ color: "#CAA166" }} />
              AI Assistant
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, index) => (
              <div
                key={index}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    m.role === "user" ? "text-white" : ""
                  }`}
                  style={
                    m.role === "user"
                      ? { backgroundColor: "#32484F" }
                      : { backgroundColor: "#EEF6F8", color: "#32484F" }
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div
                  className="rounded-lg px-3 py-2 text-sm flex items-center gap-2"
                  style={{ backgroundColor: "#EEF6F8", color: "#32484F" }}
                >
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>
          <CardFooter className="p-3 border-t bg-background">
            {!user && messages.length > 2 ? (
              <div className="w-full text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  Sign up for personalized financial advice.
                </p>
                <Button asChild className="w-full" size="sm">
                  <Link href="/sign-in">Sign In / Sign Up</Link>
                </Button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex w-full gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask something..."
                  className="flex-1 h-9 text-sm"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-9 w-9 shrink-0 text-white"
                  style={{ backgroundColor: "#32484F" }}
                  disabled={isLoading || !input.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            )}
          </CardFooter>
        </Card>
      )}

      <Button
        size="icon"
        className="h-14 w-14 rounded-full shadow-xl border-4 border-white text-white"
        style={{
          background: "linear-gradient(to right, #32484F, #233A41, #CAA166)",
        }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close chatbot" : "Open chatbot"}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Bot className="w-6 h-6" />}
      </Button>
    </div>
  );
}
