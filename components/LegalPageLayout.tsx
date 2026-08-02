import React from 'react';
import { SectionTitle } from "@/components";

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export default function LegalPageLayout({ title, lastUpdated, children }: LegalPageLayoutProps) {
  return (
    <div className="bg-white min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif text-gray-900 mb-4">{title}</h1>
          <p className="text-sm text-gray-500 uppercase tracking-wider">Last Updated: {lastUpdated}</p>
        </div>
        
        <div className="prose prose-lg prose-blue mx-auto text-gray-600 prose-headings:font-serif prose-headings:text-gray-900 prose-a:text-blue-600 hover:prose-a:text-blue-500">
          {children}
        </div>
      </div>
    </div>
  );
}
