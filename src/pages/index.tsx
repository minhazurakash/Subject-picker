import { useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import toast, { Toaster } from "react-hot-toast";

export default function Home() {
  const [selectedSubject, setSelectedSubject] = useState<string>(null);
  const subjectList = [
    { name: "Programming Language I", code: "CSE161.35" },
    { name: "Programming Language I Lab", code: "CSE162.34" },
    { name: "Advanced English Skills", code: "ENG103.51" },
    { name: "Differential & Integral Calculus", code: "MAT141.25" },
    { name: "Engineering Ethics", code: "SOC341.11" },
  ];
  return (
    <main className="container mx-auto p-5">
      <div className="text-center my-16">
        <h1 className="text-3xl md:text-4xl font-medium mb-2">Subject list</h1>
        <p className="text-gray-600">
          Click on Subject name to copy subject code
        </p>
      </div>
      <div className="flex flex-wrap gap-5">
        {subjectList.map((item) => {
          return (
            <CopyToClipboard
              key={item.code}
              text={item.code}
              onCopy={(value) => {
                setSelectedSubject(value);
                toast.success(`${item.name} code is copied!`);
              }}
            >
              <button
                className={`px-6 py-3 text-white font-bold text-md ${
                  selectedSubject === item.code ? "bg-green-500" : "bg-blue-500"
                }`}
              >
                {item.name}
              </button>
            </CopyToClipboard>
          );
        })}
      </div>
      <Toaster />
    </main>
  );
}
