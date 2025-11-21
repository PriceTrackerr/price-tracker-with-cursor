import React from 'react';
import { Link } from 'react-router-dom';

const sections = [
  {
    title: '1. Introduction',
    content: [
      'Welcome to Real Price Tracker (“the Service”). By accessing or using our website, browser extension, or related services, you agree to be bound by these Terms & Conditions.',
      'If you do not agree, please stop using the Service immediately.'
    ]
  },
  {
    title: '2. Description of the Service',
    content: [
      'Real Price Tracker allows users to:',
      '• Track prices of products from supported online stores',
      '• View price history',
      '• Receive notifications when prices drop or match criteria',
      '• Save and manage tracked products',
      '• Get similar or matched products',
      'We do not sell products directly. We only provide data aggregation and notifications.'
    ]
  },
  {
    title: '3. Eligibility',
    content: [
      'You must be at least 13 years old to use the Service. If you use the Service on behalf of a company, you confirm that you are legally authorized to do so.'
    ]
  },
  {
    title: '4. User Responsibilities',
    content: [
      'You agree that you will:',
      '• Use the Service only for lawful purposes',
      '• Not attempt to bypass scraping protections',
      '• Not misuse or overload the system',
      '• Not copy or redistribute our system, code, or data without permission',
      'You are responsible for the accuracy of the links or products you track.'
    ]
  },
  {
    title: '5. Data Accuracy',
    content: [
      'We attempt to provide accurate pricing information, but:',
      '• Prices may be delayed',
      '• Data may be incomplete due to store-side blocking',
      '• We do not guarantee 100% accuracy',
      'We are not responsible for financial decisions made based on tracked pricing.'
    ]
  },
  {
    title: '6. Account & Security',
    content: [
      'If the app uses accounts:',
      '• You are responsible for keeping your login credentials secure',
      '• You must notify us immediately if you suspect unauthorized access',
      'We may suspend accounts if we detect abuse.'
    ]
  },
  {
    title: '7. Third-Party Websites',
    content: [
      'Our service tracks product data from third-party websites (Amazon, eBay, AliExpress, etc.).',
      'We do not control or own any of these platforms.',
      'Their trademarks, content, and prices belong to them.'
    ]
  },
  {
    title: '8. Notifications & Emails',
    content: [
      'By using the Service, you agree that we may send:',
      '• Price drop alerts',
      '• Price match notifications',
      '• System messages (e.g., welcome emails)',
      'You can opt out at any time.'
    ]
  },
  {
    title: '9. Limitation of Liability',
    content: [
      'To the maximum extent permitted by law:',
      'We are not responsible for any financial loss, incorrect data, missed alerts, or system downtime.',
      'You use the Service at your own risk.'
    ]
  },
  {
    title: '10. Termination',
    content: [
      'We may suspend or terminate your access for:',
      '• Abuse',
      '• Attempts to harm the system',
      '• Violating these Terms',
      'You may delete your account at any time.'
    ]
  },
  {
    title: '11. Changes to Terms',
    content: [
      'We may update these Terms occasionally.',
      'Continued use of the Service means you accept the updated Terms.'
    ]
  },
  {
    title: '12. Contact Information',
    content: [
      'If you have questions, contact us:',
      'Email: realpricetracker94@gmail.com'
    ]
  }
];

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl p-8">
        <p className="text-sm text-gray-500 mb-2">Last updated: Nov 20, 2025</p>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms &amp; Conditions</h1>
        <p className="text-gray-600 mb-8">
          These Terms govern your access to and use of the Price Tracker website, browser extension, and related services.
        </p>
        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{section.title}</h2>
              <div className="space-y-2 text-gray-700">
                {section.content.map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
        <div className="mt-10">
          <Link to="/auth" className="text-blue-600 hover:text-blue-700 underline">
            Back to authentication
          </Link>
        </div>
      </div>
    </div>
  );
}

