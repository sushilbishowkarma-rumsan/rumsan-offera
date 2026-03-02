// "use client";

// import { useState } from "react";
// import { mockAuditEntries } from "@/lib/mock-data";
// import { formatDateTime } from "@/lib/leave-helpers";
// import { Switch } from "@/components/ui/switch";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { useToast } from "@/hooks/use-toast";
// import {
//   Settings,
//   Mail,
//   Shield,
//   Save,
//   Calendar,
//   Building2,
//   Globe,
//   CheckCircle2,
//   XCircle,
//   Bell,
//   BarChart3,
//   Clock,
// } from "lucide-react";

// const TABS = [
//   { key: "general",       label: "General",       icon: <Settings className="h-3.5 w-3.5" /> },
//   { key: "notifications", label: "Notifications",  icon: <Mail className="h-3.5 w-3.5" /> },
//   { key: "audit",         label: "Audit Trail",    icon: <Shield className="h-3.5 w-3.5" /> },
// ];

// /** Badge style per audit action keyword */
// function getActionStyle(action: string): React.CSSProperties {
//   if (action.includes("APPROVE"))  return { background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a" };
//   if (action.includes("REJECT"))   return { background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" };
//   if (action.includes("SUBMIT") || action.includes("CREATE"))
//                                     return { background: "#eef2ff", border: "1px solid #c7d2fe", color: "#4f46e5" };
//   if (action.includes("DELETE") || action.includes("CANCEL"))
//                                     return { background: "#fffbeb", border: "1px solid #fde68a", color: "#d97706" };
//   return { background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#475569" };
// }

// export default function SettingsPage() {
//   const { toast } = useToast();

//   /** General settings state */
//   const [companyName, setCompanyName]   = useState("Rumsan Associates");
//   const [fiscalStart, setFiscalStart]   = useState("january");
//   const [timezone, setTimezone]         = useState("Asia/Kathmandu");

//   /** Notification preferences */
//   const [emailOnSubmit,   setEmailOnSubmit]   = useState(true);
//   const [emailOnApproval, setEmailOnApproval] = useState(true);
//   const [emailOnRejection,setEmailOnRejection]= useState(true);
//   const [lowBalanceAlert, setLowBalanceAlert] = useState(true);
//   const [weeklyDigest,    setWeeklyDigest]    = useState(false);

//   const [activeTab, setActiveTab] = useState("general");

//   const handleSave = () => {
//     toast({
//       title: "Settings Saved",
//       description: "Your changes have been saved successfully.",
//     });
//   };

//   // Shared select trigger style
//   const selectTriggerStyle: React.CSSProperties = {
//     background: "#f8f9fc",
//     border: "1px solid #e2e8f0",
//     color: "#334155",
//     borderRadius: "12px",
//   };

//   const selectContentStyle: React.CSSProperties = {
//     background: "#ffffff",
//     border: "1px solid #e2e8f0",
//     boxShadow: "0 8px 24px rgba(15,23,42,0.10)",
//   };

//   return (
//     <div className="min-h-screen" style={{ background: "#f8f9fc" }}>
//       {/* <div className="max-w-4xl mx-auto flex flex-col gap-6 p-4 sm:p-6 lg:p-8"> */}
//     <div className="space-y-4 mb-3 mt-3 sm:space-y-6 max-w-5xl mx-auto px-2 sm:px-4">

//         {/* ── Page Header ── */}
//         <p className="text-[13px]" style={{ color: "#64748b" }}>
//           Configure system-wide preferences, notifications, and view audit logs.
//         </p>

//         {/* ── Main Card ── */}
//         <div
//           className="flex flex-col rounded-2xl overflow-hidden"
//           style={{
//             background: "#ffffff",
//             border: "1px solid #e2e8f0",
//             boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
//           }}
//         >
//           {/* ── Tab Bar ── */}
//           <div
//             className="flex items-center gap-1 px-5 py-3 flex-wrap"
//             style={{ borderBottom: "1px solid #f1f5f9" }}
//           >
//             {TABS.map((tab) => (
//               <button
//                 key={tab.key}
//                 onClick={() => setActiveTab(tab.key)}
//                 className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all duration-150"
//                 style={{
//                   background: activeTab === tab.key ? "#eef2ff" : "transparent",
//                   color:      activeTab === tab.key ? "#4f46e5" : "#64748b",
//                   border:     activeTab === tab.key ? "1px solid #c7d2fe" : "1px solid transparent",
//                 }}
//                 onMouseEnter={(e) => {
//                   if (activeTab !== tab.key)
//                     (e.currentTarget as HTMLButtonElement).style.color = "#334155";
//                 }}
//                 onMouseLeave={(e) => {
//                   if (activeTab !== tab.key)
//                     (e.currentTarget as HTMLButtonElement).style.color = "#64748b";
//                 }}
//               >
//                 {tab.icon}
//                 {tab.label}
//               </button>
//             ))}
//           </div>

//           {/* ══════════════════════════════════════
//               GENERAL TAB
//           ══════════════════════════════════════ */}
//           {activeTab === "general" && (
//             <div className="flex flex-col">
//               {/* Section header */}
//               <div className="flex items-center gap-2.5 px-5 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
//                 <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "#eef2ff", color: "#4f46e5" }}>
//                   <Settings className="h-4 w-4" />
//                 </div>
//                 <div>
//                   <h2 className="text-[13px] font-semibold" style={{ color: "#0f172a" }}>General Configuration</h2>
//                   <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }}>Organization details and fiscal year configuration.</p>
//                 </div>
//               </div>

//               <div className="flex flex-col gap-0">

//                 {/* Company Name */}
//                 <div
//                   className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 transition-colors duration-100"
//                   style={{ borderBottom: "1px solid #f8fafc" }}
//                   onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "#f8f9fc")}
//                   onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
//                 >
//                   <div className="flex items-center gap-3 sm:w-56 shrink-0">
//                     <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "#f0f9ff", color: "#0284c7" }}>
//                       <Building2 className="h-4 w-4" />
//                     </div>
//                     <div>
//                       <p className="text-[13px] font-medium" style={{ color: "#1e293b" }}>Company Name</p>
//                       <p className="text-[11px]" style={{ color: "#94a3b8" }}>Your organization name</p>
//                     </div>
//                   </div>
//                   <input
//                     value={companyName}
//                     onChange={(e) => setCompanyName(e.target.value)}
//                     className="flex-1 rounded-xl px-3.5 py-2 text-[13px] outline-none transition-all"
//                     style={{ background: "#f8f9fc", border: "1px solid #e2e8f0", color: "#1e293b" }}
//                     onFocus={(e) => { e.currentTarget.style.border = "1px solid #a5b4fc"; e.currentTarget.style.background = "#ffffff"; }}
//                     onBlur={(e)  => { e.currentTarget.style.border = "1px solid #e2e8f0"; e.currentTarget.style.background = "#f8f9fc"; }}
//                   />
//                 </div>

//                 {/* Timezone */}
//                 <div
//                   className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 transition-colors duration-100"
//                   style={{ borderBottom: "1px solid #f8fafc" }}
//                   onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "#f8f9fc")}
//                   onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
//                 >
//                   <div className="flex items-center gap-3 sm:w-56 shrink-0">
//                     <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "#faf5ff", color: "#7c3aed" }}>
//                       <Globe className="h-4 w-4" />
//                     </div>
//                     <div>
//                       <p className="text-[13px] font-medium" style={{ color: "#1e293b" }}>Timezone</p>
//                       <p className="text-[11px]" style={{ color: "#94a3b8" }}>System default timezone</p>
//                     </div>
//                   </div>
//                   <Select value={timezone} onValueChange={setTimezone}>
//                     <SelectTrigger className="flex-1 text-[13px]" style={selectTriggerStyle}>
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent style={selectContentStyle}>
//                       {[
//                         ["Asia/Kathmandu", "Asia/Kathmandu (UTC+5:45)"],
//                         ["Asia/Kolkata",   "Asia/Kolkata (UTC+5:30)"],
//                         ["UTC",            "UTC"],
//                         ["America/New_York","America/New York (UTC-5)"],
//                       ].map(([val, label]) => (
//                         <SelectItem key={val} value={val} className="text-[13px]" style={{ color: "#334155" }}>{label}</SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 {/* Fiscal Year Start */}
//                 <div
//                   className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 transition-colors duration-100"
//                   onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "#f8f9fc")}
//                   onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
//                 >
//                   <div className="flex items-center gap-3 sm:w-56 shrink-0">
//                     <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "#f0fdf4", color: "#16a34a" }}>
//                       <Calendar className="h-4 w-4" />
//                     </div>
//                     <div>
//                       <p className="text-[13px] font-medium" style={{ color: "#1e293b" }}>Fiscal Year Start</p>
//                       <p className="text-[11px]" style={{ color: "#94a3b8" }}>First month of the fiscal year</p>
//                     </div>
//                   </div>
//                   <Select value={fiscalStart} onValueChange={setFiscalStart}>
//                     <SelectTrigger className="flex-1 sm:max-w-[200px] text-[13px]" style={selectTriggerStyle}>
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent style={selectContentStyle}>
//                       {["january","february","march","april","may","june","july","august","september","october","november","december"].map((m) => (
//                         <SelectItem key={m} value={m} className="text-[13px] capitalize" style={{ color: "#334155" }}>
//                           {m.charAt(0).toUpperCase() + m.slice(1)}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>

//               {/* Save button */}
//               <div className="px-5 py-4" style={{ borderTop: "1px solid #f1f5f9" }}>
//                 <button
//                   onClick={handleSave}
//                   className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white transition-all duration-200"
//                   style={{ background: "#4f46e5", boxShadow: "0 1px 3px rgba(79,70,229,0.3)" }}
//                   onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#4338ca")}
//                   onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#4f46e5")}
//                 >
//                   <Save className="h-3.5 w-3.5" />
//                   Save Changes
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* ══════════════════════════════════════
//               NOTIFICATIONS TAB
//           ══════════════════════════════════════ */}
//           {activeTab === "notifications" && (
//             <div className="flex flex-col">
//               {/* Section header */}
//               <div className="flex items-center gap-2.5 px-5 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
//                 <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "#f0f9ff", color: "#0284c7" }}>
//                   <Mail className="h-4 w-4" />
//                 </div>
//                 <div>
//                   <h2 className="text-[13px] font-semibold" style={{ color: "#0f172a" }}>Email Notification Preferences</h2>
//                   <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }}>Control which events trigger email notifications.</p>
//                 </div>
//               </div>

//               {/* Toggle rows */}
//               {[
//                 {
//                   label: "On Leave Submission",
//                   desc: "Notify managers when a new request is submitted",
//                   checked: emailOnSubmit,
//                   onChange: setEmailOnSubmit,
//                   iconBg: "#eef2ff", iconColor: "#4f46e5",
//                   icon: <Bell className="h-4 w-4" />,
//                 },
//                 {
//                   label: "On Approval",
//                   desc: "Notify employees when their request is approved",
//                   checked: emailOnApproval,
//                   onChange: setEmailOnApproval,
//                   iconBg: "#f0fdf4", iconColor: "#16a34a",
//                   icon: <CheckCircle2 className="h-4 w-4" />,
//                 },
//                 {
//                   label: "On Rejection",
//                   desc: "Notify employees when their request is rejected",
//                   checked: emailOnRejection,
//                   onChange: setEmailOnRejection,
//                   iconBg: "#fef2f2", iconColor: "#dc2626",
//                   icon: <XCircle className="h-4 w-4" />,
//                 },
//                 {
//                   label: "Low Balance Alerts",
//                   desc: "Alert admins when employees have low leave balances",
//                   checked: lowBalanceAlert,
//                   onChange: setLowBalanceAlert,
//                   iconBg: "#fffbeb", iconColor: "#d97706",
//                   icon: <Bell className="h-4 w-4" />,
//                 },
//                 {
//                   label: "Weekly Digest",
//                   desc: "Send weekly summary of leave activities to admins",
//                   checked: weeklyDigest,
//                   onChange: setWeeklyDigest,
//                   iconBg: "#faf5ff", iconColor: "#7c3aed",
//                   icon: <BarChart3 className="h-4 w-4" />,
//                 },
//               ].map((row, idx, arr) => (
//                 <div
//                   key={row.label}
//                   className="flex items-center justify-between gap-4 px-5 py-4 transition-colors duration-100"
//                   style={{ borderBottom: idx < arr.length - 1 ? "1px solid #f8fafc" : "none" }}
//                   onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "#f8f9fc")}
//                   onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
//                 >
//                   <div className="flex items-center gap-3 min-w-0">
//                     <div
//                       className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
//                       style={{ background: row.iconBg, color: row.iconColor }}
//                     >
//                       {row.icon}
//                     </div>
//                     <div className="min-w-0">
//                       <p className="text-[13px] font-medium" style={{ color: "#1e293b" }}>{row.label}</p>
//                       <p className="text-[11px] truncate" style={{ color: "#94a3b8" }}>{row.desc}</p>
//                     </div>
//                   </div>
//                   <Switch
//                     checked={row.checked}
//                     onCheckedChange={row.onChange}
//                     className="shrink-0"
//                   />
//                 </div>
//               ))}

//               {/* Save button */}
//               <div className="px-5 py-4" style={{ borderTop: "1px solid #f1f5f9" }}>
//                 <button
//                   onClick={handleSave}
//                   className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white transition-all duration-200"
//                   style={{ background: "#4f46e5", boxShadow: "0 1px 3px rgba(79,70,229,0.3)" }}
//                   onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#4338ca")}
//                   onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#4f46e5")}
//                 >
//                   <Save className="h-3.5 w-3.5" />
//                   Save Preferences
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* ══════════════════════════════════════
//               AUDIT TRAIL TAB
//           ══════════════════════════════════════ */}
//           {activeTab === "audit" && (
//             <div className="flex flex-col">
//               {/* Section header */}
//               <div className="flex items-center gap-2.5 px-5 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
//                 <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "#fffbeb", color: "#d97706" }}>
//                   <Shield className="h-4 w-4" />
//                 </div>
//                 <div>
//                   <h2 className="text-[13px] font-semibold" style={{ color: "#0f172a" }}>Audit Trail</h2>
//                   <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }}>Chronological log of all system actions for compliance and tracking.</p>
//                 </div>
//               </div>

//               {/* Column headers */}
//               <div
//                 className="grid grid-cols-[1fr_1fr_1fr_2fr] gap-4 px-5 py-2.5"
//                 style={{ borderBottom: "1px solid #f1f5f9", background: "#f8f9fc" }}
//               >
//                 {["Timestamp", "User", "Action", "Details"].map((h) => (
//                   <span key={h} className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: "#94a3b8" }}>
//                     {h}
//                   </span>
//                 ))}
//               </div>

//               {/* Audit rows */}
//               <div className="flex flex-col">
//                 {mockAuditEntries.map((entry, idx) => (
//                   <div
//                     key={entry.id}
//                     className="grid grid-cols-[1fr_1fr_1fr_2fr] gap-4 px-5 py-3 transition-colors duration-100 items-center"
//                     style={{
//                       borderBottom: idx < mockAuditEntries.length - 1 ? "1px solid #f8fafc" : "none",
//                     }}
//                     onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "#f8f9fc")}
//                     onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
//                   >
//                     {/* Timestamp */}
//                     <div className="flex items-center gap-1.5 min-w-0">
//                       <Clock className="h-3 w-3 shrink-0" style={{ color: "#94a3b8" }} />
//                       <span className="font-mono text-[11px] truncate" style={{ color: "#64748b" }}>
//                         {formatDateTime(entry.timestamp)}
//                       </span>
//                     </div>

//                     {/* User */}
//                     <span className="text-[12px] font-semibold truncate" style={{ color: "#1e293b" }}>
//                       {entry.userName}
//                     </span>

//                     {/* Action badge */}
//                     <span
//                       className="inline-flex items-center self-start rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold w-fit"
//                       style={getActionStyle(entry.action)}
//                     >
//                       {entry.action}
//                     </span>

//                     {/* Details */}
//                     <span className="text-[12px] truncate" style={{ color: "#64748b" }}>
//                       {entry.details}
//                     </span>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>

//       </div>
//     </div>
//   );
// }