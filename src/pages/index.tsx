import { Inter } from "next/font/google";
import { useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import toast, { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const [selectedSubject, setSelectedSubject] = useState<string>(null);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const subjectList = [
    { name: "Advanced English Skills", code: "ENG103.49" },
    { name: "Differential & Integral Calculus", code: "MAT141.23" },
    { name: "Programming Language I", code: "CSE161.34" },
    { name: "Programming Language I Lab", code: "CSE162.40" },
    { name: "Engineering Ethics", code: "SOC341.10" },
  ];
  return (
    <main className={`container mx-auto p-10 ${inter.className}`}>
      <div className="text-center my-16">
        <h1 className="text-3xl md:text-4xl font-medium mb-2 text-green-500">
          Subject List
        </h1>
        <p className="text-lg font-norma lg:text-xl ">
          Click on Subject name
          <span className="text-blue-600"> to copy subject code</span>
        </p>
      </div>
      <div className="flex flex-col items-center gap-5">
        {subjectList.map((item) => {
          return (
            <CopyToClipboard
              key={item.code}
              text={item.code}
              onCopy={(value) => {
                setSelectedSubject(value);
                toast.success(`${item.name} code is copied!`);
                if (selectedCodes.some((c) => c === item.code)) return;
                setSelectedCodes((prev) => [...prev, value]);
              }}
            >
              <button
                className={`px-2 py-3 text-white font-bold w-full md:w-[400px] text-[16px] rounded-sm ${
                  selectedSubject === item.code && "text-black/70"
                } ${
                  selectedCodes.some((c) => c === item.code)
                    ? "bg-green-500"
                    : "bg-blue-500"
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
