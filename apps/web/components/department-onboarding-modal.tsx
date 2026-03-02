"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Building2, ChevronDown, ArrowRight, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

const DEPARTMENTS = [
  "Engineering",
  "Product",
  "Design",
  "Data & Analytics",
  "DevOps & Infrastructure",
  "Research & Development",
  "Innovation Consulting",
  "Rahat Tech",      // Brand/Project specific
  "Rahat Business",  // Brand/Project specific
  "Sales",
  "Marketing",
  "Growth & Strategy", // Suggested: Combines Sales/Marketing/BizDev
  "Customer Support",
  "Finance",
  "Legal",
  "People & Culture",  // Improved: Replacing "Admin and people" and "Human Resources"
  "Operations",
  "Administration",
  "Executive",
];
interface DepartmentOnboardingModalProps {
  onComplete?: () => void;
}

export function DepartmentOnboardingModal({
  onComplete,
}: DepartmentOnboardingModalProps) {
  const { user, refreshUser } = useAuth();
  const [selected, setSelected] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [visible, setVisible] = useState(false);

  // Show modal with entrance animation
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const handleSave = async () => {
    if (!selected || !user?.id) return;
    setIsSaving(true);
    try {
      await api.patch(`/users/${user.id}/department`, { department: selected });
      toast.success("Department saved!");
      await refreshUser?.();
      onComplete?.();
    } catch {
      toast.error("Failed to save department. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(15, 23, 42, 0.55)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.3s ease",
      }}
    >
      {/* Modal card */}
      <div
        className="relative w-full max-w-md overflow-hidden"
        style={{
          background: "#ffffff",
          borderRadius: "24px",
          boxShadow:
            "0 32px 80px rgba(15,23,42,0.18), 0 0 0 1px rgba(99,102,241,0.08)",
          transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.97)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease",
        }}
      >
        {/* Top gradient bar */}
        <div
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{
            background: "linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)",
          }}
        />

        {/* Decorative background blobs */}
        <div
          className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, #6366f1, transparent)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle, #8b5cf6, transparent)" }}
        />

        <div className="relative px-8 pb-8 pt-9">
          {/* Icon */}
          <div
            className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{
              background: "linear-gradient(135deg, #eef2ff 0%, #ede9fe 100%)",
              boxShadow: "0 4px 12px rgba(99,102,241,0.15)",
            }}
          >
            <Building2 className="h-7 w-7" style={{ color: "#6366f1" }} />
          </div>

          {/* Heading */}
          <div className="mb-1.5 flex items-center gap-2">
            <h2
              className="text-[22px] font-bold tracking-tight"
              style={{ color: "#0f172a" }}
            >
              One last step
            </h2>
            <Sparkles className="h-4 w-4" style={{ color: "#a78bfa" }} />
          </div>
          <p className="text-[13.5px] leading-relaxed" style={{ color: "#64748b" }}>
            Hi <span className="font-semibold" style={{ color: "#334155" }}>{user?.name?.split(" ")[0] || "there"}</span>! Tell us which department you belong to so we can set up your leave management correctly.
          </p>

          {/* Divider */}
          <div className="my-6 h-px" style={{ background: "#f1f5f9" }} />

          {/* Label */}
          <label
            className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: "#475569" }}
          >
            Your Department
          </label>

          {/* Custom Select */}
          <div className="relative">
            <button
              onClick={() => setIsOpen((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-left text-[14px] transition-all duration-150"
              style={{
                background: selected ? "#f8f9ff" : "#f8f9fc",
                border: isOpen
                  ? "1.5px solid #6366f1"
                  : selected
                    ? "1.5px solid #c7d2fe"
                    : "1.5px solid #e2e8f0",
                color: selected ? "#1e293b" : "#94a3b8",
                boxShadow: isOpen ? "0 0 0 3px rgba(99,102,241,0.12)" : "none",
              }}
            >
              <span className={selected ? "font-medium" : ""}>
                {selected || "Select your department…"}
              </span>
              <ChevronDown
                className="h-4 w-4 shrink-0 transition-transform duration-200"
                style={{
                  color: "#94a3b8",
                  transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </button>

            {/* Dropdown */}
            {isOpen && (
              <div
                className="absolute left-0 right-0 top-full z-10 mt-1.5 overflow-hidden rounded-xl py-1.5"
                style={{
                  background: "#ffffff",
                  border: "1.5px solid #e2e8f0",
                  boxShadow: "0 12px 32px rgba(15,23,42,0.12)",
                  maxHeight: "220px",
                  overflowY: "auto",
                }}
              >
                {DEPARTMENTS.map((dept) => (
                  <button
                    key={dept}
                    onClick={() => {
                      setSelected(dept);
                      setIsOpen(false);
                    }}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left text-[13.5px] transition-colors duration-75"
                    style={{
                      background: selected === dept ? "#eef2ff" : "transparent",
                      color: selected === dept ? "#4f46e5" : "#334155",
                      fontWeight: selected === dept ? 600 : 400,
                    }}
                    onMouseEnter={(e) => {
                      if (selected !== dept)
                        (e.currentTarget as HTMLButtonElement).style.background = "#f8f9fc";
                    }}
                    onMouseLeave={(e) => {
                      if (selected !== dept)
                        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    }}
                  >
                    {dept}
                    {selected === dept && (
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: "#6366f1" }}
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Help text */}
          <p className="mt-2.5 text-[11.5px]" style={{ color: "#94a3b8" }}>
            You can update this later in your profile settings.
          </p>

          {/* CTA Button */}
          <button
            onClick={handleSave}
            disabled={!selected || isSaving}
            className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl py-3 text-[14px] font-semibold text-white transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              background: selected
                ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                : "#e2e8f0",
              boxShadow: selected
                ? "0 4px 16px rgba(99,102,241,0.35)"
                : "none",
              color: selected ? "#ffffff" : "#94a3b8",
            }}
          >
            {isSaving ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Saving…
              </>
            ) : (
              <>
                Continue to Dashboard
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}