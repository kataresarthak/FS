import React from "react";

export const metadata = {
  title: "Terms of Service - FinSight",
  description: "Review the terms and conditions for using FinSight's financial platform.",
};

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-white pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-[#32484F] tracking-tight">
          Terms of Service
        </h1>
        
        <div className="space-y-12 text-[#6E858B] leading-relaxed">
          <section id="acceptance-of-terms">
            <h2 className="text-2xl font-semibold mb-4 text-[#32484F]">Acceptance of Terms</h2>
            <p>
              By accessing or using the FinSight platform, you agree to be bound by these Terms of Service. 
              If you disagree with any part of the terms, then you may not access the service. These terms 
              apply to all visitors, users, and others who access or use the Service.
            </p>
          </section>

          <section id="use-of-service">
            <h2 className="text-2xl font-semibold mb-4 text-[#32484F]">Use of Service</h2>
            <p>
              You must provide accurate and complete information when you create an account with us. 
              You are responsible for safeguarding the password that you use to access the Service and for 
              any activities or actions under your password.
            </p>
            <p className="mt-4">
              FinSight is a tool for tracking and managing personal finances. We do not provide financial 
              advice, and any insights provided are for informational purposes only.
            </p>
          </section>

          <section id="user-responsibilities">
            <h2 className="text-2xl font-semibold mb-4 text-[#32484F]">User Responsibilities</h2>
            <p>
              When using FinSight, you agree not to:
            </p>
            <ul className="list-disc ml-6 mt-4 space-y-2">
              <li>Use the Service for any illegal purpose or in violation of any local, state, national, or international law.</li>
              <li>Attempt to gain unauthorized access to any portion of the Service or any other accounts, systems, or networks connected to the Service.</li>
              <li>Provide false, inaccurate, or misleading information.</li>
              <li>Transmit any viruses, worms, defects, Trojan horses, or any items of a destructive nature.</li>
            </ul>
          </section>

          <section id="limitations-of-liability">
            <h2 className="text-2xl font-semibold mb-4 text-[#32484F]">Limitations of Liability</h2>
            <p>
              In no event shall FinSight, nor its directors, employees, partners, agents, suppliers, or affiliates, 
              be liable for any indirect, incidental, special, consequential or punitive damages, including without 
              limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your 
              access to or use of or inability to access or use the Service; (ii) any conduct or content of any 
              third party on the Service.
            </p>
          </section>

          <section id="changes-to-terms">
            <h2 className="text-2xl font-semibold mb-4 text-[#32484F]">Changes to Terms</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. 
              If a revision is material, we will try to provide at least 30 days&apos; notice prior to any new 
              terms taking effect. What constitutes a material change will be determined at our sole discretion.
            </p>
            <p className="mt-4 italic">
              Last updated: April 16, 2026
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
