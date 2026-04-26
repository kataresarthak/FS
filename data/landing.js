import {
  BarChart3,
  Receipt,
  PieChart,
  CreditCard,
  Globe,
  Zap,
} from "lucide-react";

// Stats Data
export const statsData = [
  {
    value: "50K+",
    label: "Active Users",
  },
  {
    value: "$2B+",
    label: "Transactions Tracked",
  },
  {
    value: "99.9%",
    label: "Uptime",
  },
  {
    value: "4.9/5",
    label: "User Rating",
  },
];

// Features Data
export const featuresData = [
  {
    icon: <BarChart3 className="h-8 w-8 text-[#32484F]" />,
    title: "Advanced Analytics",
    description:
      "Get detailed insights into your spending patterns with AI-powered analytics",
  },
  {
    icon: <Receipt className="h-8 w-8 text-[#32484F]" />,
    title: "Smart Receipt Scanner",
    description:
      "Extract data automatically from receipts using advanced AI technology",
  },
  {
    icon: <PieChart className="h-8 w-8 text-[#32484F]" />,
    title: "Budget Planning",
    description: "Create and manage budgets with intelligent recommendations",
  },
  {
    icon: <CreditCard className="h-8 w-8 text-[#32484F]" />,
    title: "Multi-Account Support",
    description: "Manage multiple accounts and credit cards in one place",
  },
  {
    icon: <Globe className="h-8 w-8 text-[#32484F]" />,
    title: "Multi-Currency",
    description: "Support for multiple currencies with real-time conversion",
  },
  {
    icon: <Zap className="h-8 w-8 text-[#32484F]" />,
    title: "Automated Insights",
    description: "Get automated financial insights and recommendations",
  },
];

// How It Works Data
export const howItWorksData = [
  {
    icon: <CreditCard className="h-8 w-8 text-[#32484F]" />,
    title: "1. Create Your Profile",
    description:
      "Get started in seconds by setting up your profile and adding your bank accounts and credit cards manually.",
  },
  {
    icon: <BarChart3 className="h-8 w-8 text-[#32484F]" />,
    title: "2. Track & Categorize",
    description:
      "Log your daily expenses and watch as FinSight automatically organizes them into smart categories with AI precision.",
  },
  {
    icon: <PieChart className="h-8 w-8 text-[#32484F]" />,
    title: "3. Optimize with AI",
    description:
      "Receive automated weekly reports and personalized insights to help you save more and spend smarter.",
  },
];
