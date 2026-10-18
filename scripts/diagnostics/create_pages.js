const fs = require('fs');
const path = require('path');

const pages = [
  { path: 'sale/discounts', title: 'Discounts' },
  { path: 'sale/news', title: 'News' },
  { path: 'sale/register-discounts', title: 'Register Discounts' },
  { path: 'about', title: 'About Us' },
  { path: 'about/careers', title: 'Work With Us' },
  { path: 'about/company-profile', title: 'Company Profile' },
  { path: 'buying/loyalty-card', title: 'Loyalty Card' },
  { path: 'buying/complaints', title: 'Complaints' },
  { path: 'buying/partners', title: 'Partners' },
  { path: 'support/contact', title: 'Contact Us' },
  { path: 'support/how-to-buy', title: 'How to Buy' },
  { path: 'support/faq', title: 'FAQ' }
];

pages.forEach(page => {
  const dirPath = path.join(__dirname, 'app', '(storefront)', page.path);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const filePath = path.join(dirPath, 'page.tsx');
  const content = `import React from 'react';

export default function ${page.title.replace(/\s+/g, '')}Page() {
  return (
    <div className="mx-auto max-w-screen-2xl px-6 lg:px-12 pt-32 pb-24 min-h-[60vh]">
      <h1 className="text-4xl font-serif text-vamika-charcoal uppercase tracking-widest mb-8">
        ${page.title}
      </h1>
      <div className="prose prose-stone max-w-none">
        <p className="text-stone-600 font-sans leading-relaxed">
          This page is currently under construction. Please check back later.
        </p>
      </div>
    </div>
  );
}
`;
  
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Created: ${filePath}`);
  }
});

console.log('All missing pages created successfully.');
