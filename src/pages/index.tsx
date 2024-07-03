import { Inter } from "next/font/google";
import { useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import toast, { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const [selectedSubject, setSelectedSubject] = useState<string>(null);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const subjectList = [
    { name: "Java Language", code: "CSE281.7" },
    { name: "Discreate Math", code: "CSE181.20" },
    { name: "Java Language Lab", code: "CSE282.7" },
    { name: "Management Info", code: "CSE475.3" },
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

        <div className="mt-20">
          <h2 className="text-lg text-center mb-5">
            Backup for Programming Language 2
          </h2>
          <CopyToClipboard
            key="CSE281.8"
            text="CSE281.8"
            onCopy={(value) => {
              setSelectedSubject(value);
              toast.success(`Java Language code is copied!`);
              if (selectedCodes.some((c) => c === "CSE281.8")) return;
              setSelectedCodes((prev) => [...prev, value]);
            }}
          >
            <button
              className={`px-2 py-3 text-white font-bold w-full md:w-[400px] text-[16px] rounded-sm ${
                selectedSubject === "CSE281.8" && "text-black/70"
              } ${
                selectedCodes.some((c) => c === "CSE281.8")
                  ? "bg-green-500"
                  : "bg-blue-500"
              }`}
            >
              Java Language
            </button>
          </CopyToClipboard>
        </div>
      </div>
      <Toaster />
    </main>
  );
}
