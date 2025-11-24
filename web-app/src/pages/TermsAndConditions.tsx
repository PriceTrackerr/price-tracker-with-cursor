import React from 'react';
import { Link } from 'react-router-dom';

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl p-8 space-y-8">
        <div>
          <p className="text-sm text-gray-500">Last updated: Nov 23, 2025</p>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Terms &amp; Conditions</h1>
          <p className="text-gray-600 mt-4">
            Business Name: Price Tracker
          </p>
        </div>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold text-gray-900">1. Introduction</h2>
          <p>
            Welcome to Price Tracker (“Price Tracker”, “we”, “us”, “our”). By accessing or using our website, browser
            extension, or related services (the “Service”), you agree to be bound by these Terms &amp; Conditions. If
            you do not agree, please stop using the Service immediately.
          </p>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold text-gray-900">2. Description of the Service</h2>
          <p>Price Tracker provides digital tools that allow users to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Track product prices from supported online stores</li>
            <li>View price history and analytics</li>
            <li>Receive price drop and match notifications</li>
            <li>Save and manage tracked products</li>
          </ul>
          <p>We do not sell or ship products. We only display data from third-party websites.</p>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold text-gray-900">3. Eligibility</h2>
          <p>To use Price Tracker, you must be at least 13 years old. If you use the Service on behalf of a business, you confirm you have authority to do so.</p>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold text-gray-900">4. User Responsibilities</h2>
          <p>You agree that you will:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Use the Service for lawful purposes only</li>
            <li>Not attempt to reverse engineer or harm the platform</li>
            <li>Not interfere with price tracking systems</li>
            <li>Keep your login credential(s) secure</li>
          </ul>
          <p>You are responsible for any activity under your account.</p>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold text-gray-900">5. Accuracy of Information</h2>
          <p>We work to provide accurate and timely pricing data, but we cannot guarantee:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Real-time accuracy</li>
            <li>Availability of product information</li>
            <li>Uninterrupted service</li>
            <li>Complete price history for all products</li>
          </ul>
          <p>Price Tracker is not responsible for decisions or purchases made based on tracked data.</p>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold text-gray-900">6. Accounts &amp; Security</h2>
          <p>If you create an account, you agree to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Provide accurate information</li>
            <li>Keep your password confidential</li>
            <li>Notify us immediately of unauthorized access</li>
          </ul>
          <p>We may suspend or terminate accounts that violate these Terms.</p>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold text-gray-900">7. Third-Party Websites</h2>
          <p>
            Price Tracker tracks data from third-party stores such as Amazon, AliExpress, eBay, Walmart, etc. We do not
            own or control these websites, and we are not responsible for their content, product accuracy, or changes in
            price or availability. All trademarks belong to their respective owners.
          </p>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold text-gray-900">8. Refund Policy</h2>
          <p>Since Price Tracker provides digital services (price tracking, history storage, notifications, analytics), refunds are handled according to the following rules:</p>
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-gray-900">A. Subscription Refunds</h3>
              <p>You may request a refund within 14 days of your first subscription payment if you have not heavily used the service. Examples of acceptable refund reasons:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>You purchased a plan by mistake</li>
                <li>You are unable to use the service due to technical issues that we cannot resolve</li>
                <li>You were charged incorrectly</li>
              </ul>
              <p className="mt-2">Refunds will not be issued for:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Renewal payments after the initial subscription period</li>
                <li>Extensive usage of the service before requesting a refund</li>
                <li>Change of mind after using premium features</li>
                <li>Misunderstanding of features already clearly described on the website</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">B. Cancellation</h3>
              <p>You may cancel your subscription at any time. After cancellation, your plan remains active until the end of the billing cycle. No partial or prorated refunds are provided for unused time.</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">C. How to Request a Refund</h3>
              <p>
                To request a refund, contact us at <span className="font-medium">realpricetracker94@gmail.com</span> and include your transaction ID, account email, and reason for the refund.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold text-gray-900">9. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, Price Tracker is not responsible for:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Loss of data</li>
            <li>Incorrect pricing information</li>
            <li>Missed notifications</li>
            <li>Business or financial losses</li>
            <li>Service interruptions or downtime</li>
          </ul>
          <p>You use the Service at your own risk.</p>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold text-gray-900">10. Termination</h2>
          <p>We may suspend or terminate accounts for:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Abuse</li>
            <li>Violations of these Terms</li>
            <li>Fraudulent or harmful activity</li>
          </ul>
          <p>You may delete your account at any time.</p>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold text-gray-900">11. Changes to Terms</h2>
          <p>We may update these Terms occasionally. Your continued use of the Service means you accept the updated Terms.</p>
        </section>

        <section className="space-y-4 text-gray-700">
          <h2 className="text-xl font-semibold text-gray-900">12. Contact Information</h2>
          <p>If you have questions about these Terms or the Refund Policy, contact us:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Business Name: Price Tracker</li>
            <li>Email: realpricetracker94@gmail.com</li>
          </ul>
        </section>

        <div className="pt-4">
          <Link to="/auth" className="text-blue-600 hover:text-blue-700 underline">
            Back to authentication
          </Link>
        </div>
      </div>
    </div>
  );
}

