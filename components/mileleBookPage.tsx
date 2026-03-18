import React from "react";

export default function MileleBookPage({ title, content }: { title: string; content: string }) {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6 text-gray-800 leading-relaxed">
      <h1 className="text-3xl font-bold mb-6">{title}</h1>
      <pre className="whitespace-pre-wrap text-lg">{content}</pre>
    </div>
  );
}