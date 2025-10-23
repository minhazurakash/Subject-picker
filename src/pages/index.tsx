import { useEffect, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import toast, { Toaster } from "react-hot-toast";

type Subject = { name: string; code: string };
const STORAGE_KEY = "subjectList_v1";

const DEFAULT_SUBJECTS: Subject[] = [
  { name: "Complex Variables", code: "MAT241.15" },
  { name: "Algorithm", code: "CSE265.15" },
  { name: "Theory of Computing", code: "CSE441.4" },
  { name: "Algorithm Lab", code: "CSE266.14" },
  { name: "Physics II", code: "PHY181.15" },
  { name: "Physics II Lab", code: "PHY182.23" },
];

export default function Home() {
  // Start with SSR-safe state; hydrate from localStorage after mount
  const [subjectList, setSubjectList] = useState<Subject[]>(DEFAULT_SUBJECTS);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);

  useEffect(() => {
    try {
      const raw = window?.localStorage?.getItem?.(STORAGE_KEY);
      if (!raw) {
        setHasLoadedStorage(true);
        return;
      }
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const arr = parsed
          .filter(
            (it): it is Record<string, unknown> =>
              !!it && typeof it === "object" && "name" in it && "code" in it
          )
          .map((it) => ({
            name: String((it as any)?.name ?? "").trim(),
            code: String((it as any)?.code ?? "").trim(),
          }))
          .filter((it) => it?.name && it?.code);
        setSubjectList(arr?.length ? arr : DEFAULT_SUBJECTS);
      }
    } catch {
      // ignore parse/storage errors
    } finally {
      setHasLoadedStorage(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedStorage) return;
    try {
      window?.localStorage?.setItem?.(STORAGE_KEY, JSON.stringify(subjectList));
    } catch {
      // ignore localStorage errors
    }
  }, [subjectList, hasLoadedStorage]);

  const [_selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [cols, setCols] = useState<number>(2); // 3, 2 or 1 columns

  const [isEditing, setIsEditing] = useState(false);

  // Edit form state
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [jsonInput, setJsonInput] = useState("");

  const handleCopy = (text: string, name: string) => {
    setSelectedSubject(text ?? null);
    toast.success(`${name} code copied!`);
    if (!selectedCodes?.includes?.(text)) {
      setSelectedCodes((prev) => [...prev, text]);
    }
  };

  const addSubject = (s: Subject) => {
    const name = s?.name?.trim?.() ?? "";
    const code = s?.code?.trim?.() ?? "";
    if (!name || !code) {
      toast.error("Both name and code are required.");
      return false;
    }
    const exists = subjectList?.some?.((it) => it?.code === code);
    if (exists) {
      toast.error("A subject with that code already exists.");
      return false;
    }
    setSubjectList((prev) => [...(prev ?? []), { name, code }]);
    toast.success("Subject added.");
    return true;
  };

  const handleAddSingle = (e?: React.FormEvent) => {
    e?.preventDefault?.();
    const added = addSubject({ name: newName, code: newCode });
    if (added) {
      setNewName("");
      setNewCode("");
    }
  };

  const deleteSubject = (code: string) => {
    setSubjectList((prev) => prev?.filter?.((it) => it?.code !== code) ?? []);
    setSelectedCodes((prev) => prev?.filter?.((c) => c !== code) ?? []);
    toast.success("Subject deleted.");
  };

  const handleImportJson = () => {
    if (!jsonInput?.trim?.()) {
      toast.error("Paste a JSON array of subjects to import.");
      return;
    }
    try {
      const parsed = JSON.parse(jsonInput ?? "[]");
      if (!Array.isArray(parsed)) {
        toast.error("JSON must be an array of { name, code } objects.");
        return;
      }
      const toAdd: Subject[] = [];
      const duplicates: string[] = [];
      for (const item of parsed) {
        if (!item || typeof item !== "object") continue;
        const name = String((item as any)?.name ?? "").trim();
        const code = String((item as any)?.code ?? "").trim();
        if (!name || !code) continue;
        if (
          subjectList?.some?.((s) => s?.code === code) ||
          toAdd?.some?.((s) => s?.code === code)
        ) {
          duplicates?.push?.(code);
          continue;
        }
        toAdd?.push?.({ name, code });
      }
      if (!toAdd?.length) {
        toast.error(
          duplicates?.length
            ? `All items were duplicates (e.g. ${duplicates?.[0]}).`
            : "No valid items to import."
        );
        return;
      }
      setSubjectList((prev) => [...(prev ?? []), ...toAdd]);
      toast.success(`Imported ${toAdd?.length} subject(s).`);
      setJsonInput("");
    } catch {
      toast.error(
        "Invalid JSON. Make sure it's a JSON array of { name, code }."
      );
    }
  };

  // Move item up/down helpers (also persist immediately)
  const moveSubject = (code: string, dir: number) => {
    setSubjectList((prev) => {
      const list = [...(prev ?? [])];
      const idx = list.findIndex((s) => s?.code === code);
      if (idx === -1) return prev ?? [];
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= list.length) return prev ?? [];
      const [item] = list.splice(idx, 1);
      list.splice(newIdx, 0, item);
      try {
        // write immediately so picker + localStorage stay in sync
        window?.localStorage?.setItem?.(STORAGE_KEY, JSON.stringify(list));
      } catch {
        // ignore
      }
      return list;
    });
  };

  // Tailwind-safe grid classes for each mode
  const gridModeClass =
    cols === 3
      ? "grid-cols-1 sm:grid-cols-3"
      : cols === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : "grid-cols-1";

  return (
    <main
      className={`max-w-3xl mx-auto p-4 sm:p-6 ${
        cols === 3 ? "max-w-4xl" : ""
      }`}
    >
      <header className="mb-6">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">
            Subject List
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Tap any card to copy the code. Copied items are highlighted.
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Stats */}
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-700 border border-gray-200">
              {subjectList?.length ?? 0} subjects
            </span>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs border ${
                (selectedCodes?.length ?? 0) > 0
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-gray-50 text-gray-500 border-gray-200"
              }`}
            >
              {selectedCodes?.length ?? 0} selected
            </span>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {/* Layout: compact select on small screens */}
            {/* Radio group for column view */}
            <div className="flex items-center gap-2">
              {/* Mobile: simple select */}
              <label
                htmlFor="colsSelect"
                className="md:hidden text-xs text-gray-500"
              >
                View
              </label>
              <select
                id="colsSelect"
                value={cols}
                onChange={(e) => setCols(Number(e.target.value))}
                className="md:hidden px-2 py-1 rounded-md border border-gray-200 bg-white/80 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-300"
                aria-label="Change column view"
              >
                <option value={3}>3 columns</option>
                <option value={2}>2 columns</option>
                <option value={1}>1 column</option>
              </select>

              {/* Desktop: segmented toggle */}
              <div
                aria-label="Change column view"
                className="hidden md:inline-flex items-center gap-2"
              >
                <span className="text-xs text-gray-500">View:</span>
                <div className="inline-flex rounded-md border border-gray-200 bg-white/80 overflow-hidden">
                  {[3, 2, 1].map((n, i) => {
                    const active = cols === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setCols(n)}
                        aria-pressed={active}
                        className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors ${
                          active
                            ? "bg-green-600 text-white"
                            : "text-gray-700 hover:bg-gray-50"
                        } ${i < 2 ? "border-r border-gray-200" : ""}`}
                      >
                        <span className="sr-only">
                          {n} column{n === 1 ? "" : "s"}
                        </span>
                        <svg
                          aria-hidden
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          {n === 3 && (
                            <>
                              <rect
                                x="3"
                                y="4"
                                width="4.5"
                                height="16"
                                rx="1"
                              />
                              <rect
                                x="9.75"
                                y="4"
                                width="4.5"
                                height="16"
                                rx="1"
                              />
                              <rect
                                x="16.5"
                                y="4"
                                width="4.5"
                                height="16"
                                rx="1"
                              />
                            </>
                          )}
                          {n === 2 && (
                            <>
                              <rect x="4" y="4" width="7" height="16" rx="1" />
                              <rect x="13" y="4" width="7" height="16" rx="1" />
                            </>
                          )}
                          {n === 1 && (
                            <rect x="4" y="4" width="16" height="16" rx="1" />
                          )}
                        </svg>
                        <span>{n}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Clear selection */}
            <button
              type="button"
              onClick={() => {
                if (!selectedCodes?.length) return;
                setSelectedCodes([]);
                toast.success("Selection cleared.");
              }}
              className="px-3 py-1 rounded-md text-xs font-medium bg-white/80 text-gray-700 border border-gray-200 hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2"
              aria-label="Clear selection"
            >
              Clear Selection
            </button>

            {/* Edit toggle */}
            <button
              type="button"
              onClick={() => setIsEditing((v) => !v)}
              className={`px-3 py-1 rounded-md text-xs font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isEditing
                  ? "bg-yellow-500 text-white"
                  : "bg-white/80 text-gray-700 border border-gray-200"
              }`}
              aria-pressed={isEditing}
              aria-label="Edit subjects"
            >
              {isEditing ? "Done" : "Edit"}
            </button>
          </div>
        </div>
      </header>

      {/* Editing UI */}
      {isEditing ? (
        <section className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white/80 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-medium text-gray-800 mb-1">
                  Add a subject
                </h2>
                <p className="text-xs text-gray-500">
                  Add a single subject that will appear in the picker.
                </p>
              </div>
              <div className="text-right text-xs text-gray-500">
                <div>{subjectList?.length} subjects</div>
                <div className="mt-1">
                  Copied / Selected: {selectedCodes?.length}
                </div>
              </div>
            </div>

            <form
              onSubmit={handleAddSingle}
              className="mt-3 flex flex-col md:flex-row gap-2"
            >
              <input
                aria-label="Subject name"
                value={newName}
                onChange={(e) => setNewName(e?.target?.value ?? "")}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-300"
                placeholder="Subject name"
              />
              <input
                aria-label="Subject code"
                value={newCode}
                onChange={(e) => setNewCode(e?.target?.value ?? "")}
                className="w-full md:w-40 px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-300"
                placeholder="Code (e.g. CSE123.4)"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700"
              >
                Add
              </button>
            </form>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white/80 p-4">
            <h2 className="text-lg font-medium text-gray-800 mb-3">
              Import JSON array
            </h2>
            <p className="text-xs text-gray-500 mb-2">
              Paste a JSON array of objects like {"{ name, code }"}. Duplicates
              are ignored.
            </p>
            <textarea
              aria-label="JSON import"
              value={jsonInput}
              onChange={(e) => setJsonInput(e?.target?.value ?? "")}
              className="w-full h-32 px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-300"
              placeholder='[{"name":"Foo","code":"ABC123"}]'
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleImportJson}
                className="px-3 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700"
              >
                Import
              </button>
              <button
                type="button"
                onClick={() => {
                  setJsonInput("");
                }}
                className="px-3 py-2 rounded-md bg-white text-sm font-medium border border-gray-200"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  setJsonInput(
                    `[{"name":"Linear Algebra","code":"MAT201.1"},{"name":"Data Structures","code":"CSE210.2"}]`
                  );
                }}
                className="px-3 py-2 rounded-md bg-blue-50 text-sm text-blue-700 border border-blue-100"
              >
                Insert sample
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white/80 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium text-gray-800">
                Existing subjects
              </h2>
            </div>
            {/* <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium text-gray-800">
                Existing subjects
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCodes(subjectList?.map?.((s) => s?.code) ?? []);
                    toast.success("All subjects selected.");
                  }}
                  className="px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-700 border border-blue-200"
                  aria-label="Select all subjects"
                >
                  Select all
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedCodes([]);
                    toast.success("Selection cleared.");
                  }}
                  className="px-2 py-1 rounded-md text-xs bg-white text-sm font-medium border border-gray-200"
                  aria-label="Clear selection"
                >
                  Clear
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if ((selectedCodes?.length ?? 0) === 0) {
                      toast.error("No subjects selected.");
                      return;
                    }
                    setSubjectList(
                      (prev) =>
                        prev?.filter?.(
                          (s) => !selectedCodes?.includes?.(s?.code)
                        ) ?? []
                    );
                    setSelectedCodes([]);
                    toast.success("Selected subjects deleted.");
                  }}
                  className="px-2 py-1 rounded-md text-xs bg-red-100 text-red-700 border border-red-200"
                  aria-label="Delete selected subjects"
                >
                  Delete selected
                </button>
              </div>
            </div> */}

            <ul className="space-y-2">
              {subjectList?.map?.((s, idx) => {
                const isSelected = selectedCodes?.includes?.(s?.code) ?? false;
                const isFirst = idx === 0;
                const isLast = idx === (subjectList?.length ?? 0) - 1;
                return (
                  <li
                    key={s?.code}
                    className="flex items-center justify-between gap-3 border border-gray-100 rounded-md p-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => moveSubject(s?.code, -1)}
                          disabled={isFirst}
                          className="w-7 h-6 flex items-center justify-center rounded-md text-xs border bg-white text-gray-600 border-gray-200 disabled:opacity-40"
                          aria-label={`Move ${s?.name} up`}
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSubject(s?.code, 1)}
                          disabled={isLast}
                          className="w-7 h-6 flex items-center justify-center rounded-md text-xs border bg-white text-gray-600 border-gray-200 disabled:opacity-40"
                          aria-label={`Move ${s?.name} down`}
                        >
                          ▼
                        </button>
                      </div>

                      {/* <button
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedCodes(
                              (prev) =>
                                prev?.filter?.((c) => c !== s?.code) ?? []
                            );
                            toast.success("Deselected");
                          } else {
                            setSelectedCodes((prev) =>
                              prev?.includes?.(s?.code)
                                ? prev
                                : [...(prev ?? []), s?.code]
                            );
                            setSelectedSubject(s?.code ?? null);
                            toast.success("Selected");
                          }
                        }}
                        className={`w-6 h-6 flex items-center justify-center rounded-md text-xs border ${
                          isSelected
                            ? "bg-green-500 text-white border-green-500"
                            : "bg-white text-gray-500 border-gray-200"
                        }`}
                        aria-pressed={isSelected}
                        aria-label={`Toggle select ${s?.name}`}
                      >
                        {isSelected ? "-" : "✓"}
                      </button> */}

                      <div>
                        <div className="font-medium text-gray-800">
                          {s?.name}
                        </div>
                        <div className="text-xs text-gray-500">{s?.code}</div>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSubject(s?.code ?? null);
                          if (!selectedCodes?.includes?.(s?.code)) {
                            setSelectedCodes((prev) => [
                              ...(prev ?? []),
                              s?.code,
                            ]);
                          }
                          toast.success("Copied to selection");
                        }}
                        className="px-2 py-1 rounded-md text-xs bg-blue-500 text-white"
                        aria-label={`Select ${s?.name}`}
                      >
                        Select
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          deleteSubject(s?.code);
                        }}
                        className="px-2 py-1 rounded-md text-xs bg-red-100 text-red-700 border border-red-200"
                        aria-label={`Delete ${s?.name}`}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                );
              })}
              {(subjectList?.length ?? 0) === 0 && (
                <li className="text-sm text-gray-500">
                  No subjects. Add some above.
                </li>
              )}
            </ul>
          </div>

          <div className="flex justify-between items-center flex-wrap gap-2">
            <div className="text-sm text-gray-500">
              Tip: Selected subjects will be highlighted in the picker.
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-md bg-white text-sm font-medium border border-gray-200"
              >
                Back to picker
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubjectList([...DEFAULT_SUBJECTS]);
                  setSelectedCodes([]);
                  toast.success("Reset to defaults.");
                }}
                className="px-4 py-2 rounded-md bg-yellow-500 text-white text-sm font-medium"
              >
                Reset defaults
              </button>
            </div>
          </div>
        </section>
      ) : (
        <>
          <>
            <section className={`grid ${gridModeClass} gap-4`}>
              {subjectList?.map?.((item) => {
                const isCopied = selectedCodes?.includes?.(item?.code) ?? false;
                return (
                  <CopyToClipboard
                    key={item?.code}
                    text={item?.code}
                    onCopy={(text) => handleCopy(text, item?.name)}
                  >
                    <button
                      type="button"
                      aria-pressed={isCopied}
                      aria-label={`Copy ${item?.name} code`}
                      className={`w-full text-left rounded-lg p-4 flex items-center justify-between gap-4 transition transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-300
                        ${
                          isCopied
                            ? "bg-green-50 border border-green-200"
                            : "bg-white/80 border border-gray-200"
                        }
                      `}
                      style={{ WebkitTapHighlightColor: "transparent" }}
                    >
                      <div className="flex flex-col">
                        <span className="text-base sm:text-lg font-medium text-gray-800">
                          {item?.name}
                        </span>
                        <span className="mt-1 text-xs text-gray-500 sm:text-sm">
                          Tap to copy subject code
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                            ${
                              isCopied
                                ? "bg-green-500 text-white"
                                : "bg-blue-500 text-white"
                            }
                          `}
                        >
                          {item?.code}
                        </span>

                        {/* icon: check when copied, copy icon otherwise */}
                        <span className="w-6 h-6 flex items-center justify-center">
                          {isCopied ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-5 h-5 text-green-600"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              aria-hidden
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 10-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-5 h-5 text-blue-600"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              aria-hidden
                            >
                              <path d="M8 2a2 2 0 00-2 2v1H5a2 2 0 00-2 2v7a2 2 0 002 2h7a2 2 0 002-2v-1h1a2 2 0 002-2V8l-6-6H8zM7 4h2l4 4v1H7V4z" />
                            </svg>
                          )}
                        </span>
                      </div>
                    </button>
                  </CopyToClipboard>
                );
              })}
            </section>

            <div className="mt-6 flex justify-center">
              <a
                href="https://facebook.com/minhazurakash"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit developer profile on Facebook"
                className="group inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 px-3 py-1.5 text-xs text-gray-600 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:bg-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <span className="inline">
                  Made by{" "}
                  <span className="font-medium text-gray-800 group-hover:text-blue-700">
                    Minhazur Rahman Akash
                  </span>
                </span>

                <span
                  aria-hidden
                  className="ml-1 text-gray-400 transition-colors group-hover:text-blue-600"
                >
                  ↗
                </span>
              </a>
            </div>
          </>

          <footer className="mt-6 text-center text-xs text-gray-500">
            Pro tip: Use landscape on small phones for easier tapping.
          </footer>
        </>
      )}

      <Toaster position="top-right" />
    </main>
  );
}
