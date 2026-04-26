import React from "react";

export const metadata = {
  title: "Privacy Policy - FinSight",
  description: "Read about how FinSight protects your data and privacy.",
};

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-white pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-[#32484F] tracking-tight">
          Privacy Policy
        </h1>
        
        <div className="space-y-12 text-[#6E858B] leading-relaxed">
          <section id="introduction">
            <h2 className="text-2xl font-semibold mb-4 text-[#32484F]">Introduction</h2>
            <p>
              Welcome to FinSight. We are committed to protecting your personal information and your right to privacy. 
              If you have any questions or concerns about our policy, or our practices with regards to your personal 
              information, please contact us.
            </p>
            <p className="mt-4">
              When you visit our website and use our services, you trust us with your personal information. 
              We take your privacy very seriously. In this privacy notice, we describe our privacy policy. 
              We seek to explain to you in the clearest way possible what information we collect, how we use it 
              and what rights you have in relation to it.
            </p>
          </section>

          <section id="information-we-collect">
            <h2 className="text-2xl font-semibold mb-4 text-[#32484F]">Information We Collect</h2>
            <p>
              We collect personal information that you voluntarily provide to us when registering at the Services 
              expressing an interest in obtaining information about us or our products and services, when 
              participating in activities on the Services or otherwise contacting us.
            </p>
            <ul className="list-disc ml-6 mt-4 space-y-2">
              <li><strong>Personal Data:</strong> Name, email address, and contact details.</li>
              <li><strong>Financial Data:</strong> Transaction history, account balances, and budget information when you link your accounts.</li>
              <li><strong>Log Data:</strong> Your IP address, browser type, and usage patterns.</li>
            </ul>
          </section>

          <section id="how-we-use-information">
            <h2 className="text-2xl font-semibold mb-4 text-[#32484F]">How We Use Information</h2>
            <p>
              We use personal information collected via our Services for a variety of business purposes described below. 
              We process your personal information for these purposes in reliance on our legitimate business interests, 
              in order to enter into or perform a contract with you, with your consent, and/or for compliance with our 
              legal obligations.
            </p>
            <ul className="list-disc ml-6 mt-4 space-y-2">
              <li>To provide and maintain our Service.</li>
              <li>To manage your User Account.</li>
              <li>To provide you with personalized financial insights and recommendations.</li>
              <li>To send you administrative information, such as security alerts or update notifications.</li>
            </ul>
          </section>

          <section id="data-protection">
            <h2 className="text-2xl font-semibold mb-4 text-[#32484F]">Data Protection</h2>
            <p>
              The security of your data is important to us, but remember that no method of transmission over the 
              Internet, or method of electronic storage is 100% secure. While we strive to use commercially 
              acceptable means to protect your Personal Data (including end-to-end encryption), we cannot guarantee 
              its absolute security.
            </p>
            <p className="mt-4">
              All financial data is handled through secure, third-party processors and we never store your 
              raw bank credentials on our servers.
            </p>
          </section>

          <section id="contact-information">
            <h2 className="text-2xl font-semibold mb-4 text-[#32484F]">Contact Information</h2>
            <p>
              If you have questions or comments about this policy, you may email us at 
              <span className="text-[#CAA166] ml-1">privacy@finsight.com</span> or by post to:
            </p>
            <address className="not-italic mt-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              FinSight Inc.<br />
              123 Finance Way, Suite 400<br />
              San Francisco, CA 94103<br />
              United States
            </address>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
