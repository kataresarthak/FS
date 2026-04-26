"use client";

import { useEffect, useState } from "react";
import { UserButton } from "@clerk/nextjs";

export default function UserButtonSafe() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <UserButton
      appearance={{
        elements: {
          userButtonBox: "flex items-center justify-center",
          avatarBox:
            "w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-[#CAA166] shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg",
        },
      }}
    />
  );
}
