// "use client";

// import { useAuth } from "@/lib/auth-context";
// import { useLeaveBalances } from "@/hooks/use-leave-queries";
// import { useLeavePolicies } from "@/hooks/use-leave-queries";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Progress } from "@/components/ui/progress";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Skeleton } from "@/components/ui/skeleton";
// import { Wallet, CalendarPlus, ArrowRight } from "lucide-react";
// import Link from "next/link";

// export default function LeaveBalancePage() {
//   const { user } = useAuth();
//   const { data: balances = [], isLoading: balancesLoading } = useLeaveBalances(
//     user?.id,
//   );
//   const { data: policies = [], isLoading: policiesLoading } =
//     useLeavePolicies();

//   const isLoading = balancesLoading || policiesLoading;

//   // Summary totals
//   const totalAllocated = balances.reduce((s, b) => s + b.total, 0);
//   const totalRemaining = balances.reduce((s, b) => s + b.remaining, 0);
//   const totalUsed = totalAllocated - totalRemaining;

//   return (
//     <div className="min-h-screen" style={{ background: "#f8f9fc" }}>
//       <div className="flex flex-col gap-8 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
//         {/* ── Summary Strip ── */}
//         <div className="grid grid-cols-3 gap-3 sm:gap-4">
//           {isLoading ? (
//             Array.from({ length: 3 }).map((_, i) => (
//               <Skeleton
//                 key={i}
//                 className="h-24 rounded-2xl"
//                 style={{ background: "#e8eaf0" }}
//               />
//             ))
//           ) : (
//             <>
//               {/* Total Allocated */}
//               <div
//                 className="relative overflow-hidden rounded-2xl p-4 text-center transition-all duration-200 hover:-translate-y-0.5 cursor-default"
//                 style={{
//                   background: "#ffffff",
//                   border: "1px solid #6e7075",
//                   boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
//                 }}
//                 onMouseEnter={(e) => {
//                   (e.currentTarget as HTMLDivElement).style.boxShadow =
//                     "0 8px 24px rgba(15,23,42,0.10)";
//                   (e.currentTarget as HTMLDivElement).style.borderColor =
//                     "#cbd5e1";
//                 }}
//                 onMouseLeave={(e) => {
//                   (e.currentTarget as HTMLDivElement).style.boxShadow =
//                     "0 1px 3px rgba(15,23,42,0.05)";
//                   (e.currentTarget as HTMLDivElement).style.borderColor =
//                     "#e2e8f0";
//                 }}
//               >
//                 <div
//                   className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
//                   style={{ background: "#6366f1" }}
//                 />
//                 <p
//                   className="text-[10px] font-bold uppercase tracking-[0.12em] mt-1"
//                   style={{ color: "#94a3b8" }}
//                 >
//                   Allocated
//                 </p>
//                 <p
//                   className="text-[30px] font-bold leading-tight tabular-nums mt-1"
//                   style={{ color: "#0f172a" }}
//                 >
//                   {totalAllocated}
//                 </p>
//                 <p className="text-[10px]" style={{ color: "#cbd5e1" }}>
//                   days
//                 </p>
//               </div>

//               {/* Used */}
//               <div
//                 className="relative overflow-hidden rounded-2xl p-4 text-center transition-all duration-200 hover:-translate-y-0.5 cursor-default"
//                 style={{
//                   background: "#ffffff",
//                   border: "1px solid #e2e8f0",
//                   boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
//                 }}
//                 onMouseEnter={(e) => {
//                   (e.currentTarget as HTMLDivElement).style.boxShadow =
//                     "0 8px 24px rgba(15,23,42,0.10)";
//                   (e.currentTarget as HTMLDivElement).style.borderColor =
//                     "#cbd5e1";
//                 }}
//                 onMouseLeave={(e) => {
//                   (e.currentTarget as HTMLDivElement).style.boxShadow =
//                     "0 1px 3px rgba(15,23,42,0.05)";
//                   (e.currentTarget as HTMLDivElement).style.borderColor =
//                     "#e2e8f0";
//                 }}
//               >
//                 <div
//                   className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
//                   style={{ background: "#f59e0b" }}
//                 />
//                 <p
//                   className="text-[10px] font-bold uppercase tracking-[0.12em] mt-1"
//                   style={{ color: "#94a3b8" }}
//                 >
//                   Used
//                 </p>
//                 <p
//                   className="text-[30px] font-bold leading-tight tabular-nums mt-1"
//                   style={{ color: "#0f172a" }}
//                 >
//                   {totalUsed}
//                 </p>
//                 <p className="text-[10px]" style={{ color: "#cbd5e1" }}>
//                   days
//                 </p>
//               </div>

//               {/* Remaining */}
//               <div
//                 className="relative overflow-hidden rounded-2xl p-4 text-center transition-all duration-200 hover:-translate-y-0.5 cursor-default"
//                 style={{
//                   background: "#ffffff",
//                   border: "1px solid #e2e8f0",
//                   boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
//                 }}
//                 onMouseEnter={(e) => {
//                   (e.currentTarget as HTMLDivElement).style.boxShadow =
//                     "0 8px 24px rgba(15,23,42,0.10)";
//                   (e.currentTarget as HTMLDivElement).style.borderColor =
//                     "#cbd5e1";
//                 }}
//                 onMouseLeave={(e) => {
//                   (e.currentTarget as HTMLDivElement).style.boxShadow =
//                     "0 1px 3px rgba(15,23,42,0.05)";
//                   (e.currentTarget as HTMLDivElement).style.borderColor =
//                     "#e2e8f0";
//                 }}
//               >
//                 <div
//                   className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
//                   style={{ background: "#22c55e" }}
//                 />
//                 <p
//                   className="text-[10px] font-bold uppercase tracking-[0.12em] mt-1"
//                   style={{ color: "#94a3b8" }}
//                 >
//                   Remaining
//                 </p>
//                 <p
//                   className="text-[30px] font-bold leading-tight tabular-nums mt-1"
//                   style={{ color: "#16a34a" }}
//                 >
//                   {totalRemaining}
//                 </p>
//                 <p className="text-[10px]" style={{ color: "#cbd5e1" }}>
//                   days
//                 </p>
//               </div>
//             </>
//           )}
//         </div>

//         {/* ── Per-type Balance Cards ── */}
//         <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//           {isLoading ? (
//             Array.from({ length: 4 }).map((_, i) => (
//               <Skeleton
//                 key={i}
//                 className="h-52 rounded-2xl"
//                 style={{ background: "#e8eaf0" }}
//               />
//             ))
//           ) : balances.length === 0 ? (
//             <div className="col-span-2 flex flex-col items-center justify-center gap-3 py-16">
//               <div
//                 className="flex h-12 w-12 items-center justify-center rounded-2xl"
//                 style={{ background: "#eef2ff" }}
//               >
//                 <Wallet className="h-6 w-6" style={{ color: "#6366f1" }} />
//               </div>
//               <p
//                 className="text-[13px] font-medium"
//                 style={{ color: "#94a3b8" }}
//               >
//                 No leave balances found. Contact HR to set up your leave policy.
//               </p>
//             </div>
//           ) : (
//             balances.map((bal) => {
//               const policy = policies.find(
//                 (p) => p.leaveType === bal.leaveType,
//               );
//               const used = bal.total - bal.remaining;
//               const usedPercent =
//                 bal.total > 0 ? Math.round((used / bal.total) * 100) : 0;
//               const isLow = bal.remaining <= 2;

//               const barColor =
//                 usedPercent > 80
//                   ? "linear-gradient(90deg, #f87171, #ef4444)"
//                   : usedPercent > 50
//                     ? "linear-gradient(90deg, #fbbf24, #f59e0b)"
//                     : "linear-gradient(90deg, #6366f1, #8b5cf6)";

//               return (
//                 <div
//                   key={bal.id}
//                   className="flex flex-col rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
//                   style={{
//                     background: "#ffffff",
//                     border: isLow ? "1px solid #fecdd3" : "1px solid #e2e8f0",
//                     boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
//                   }}
//                   onMouseEnter={(e) => {
//                     (e.currentTarget as HTMLDivElement).style.boxShadow =
//                       "0 8px 24px rgba(15,23,42,0.10)";
//                   }}
//                   onMouseLeave={(e) => {
//                     (e.currentTarget as HTMLDivElement).style.boxShadow =
//                       "0 1px 3px rgba(15,23,42,0.05)";
//                   }}
//                 >
//                   {/* Card top accent */}
//                   <div
//                     className="h-[3px] w-full"
//                     style={{
//                       background: isLow
//                         ? "#f43f5e"
//                         : usedPercent > 50
//                           ? "#f59e0b"
//                           : "#6366f1",
//                     }}
//                   />

//                   {/* Card header */}
//                   <div
//                     className="flex items-center justify-between px-5 py-4"
//                     style={{ borderBottom: "1px solid #f1f5f9" }}
//                   >
//                     <h2
//                       className="text-[14px] font-semibold"
//                       style={{ color: "#0f172a" }}
//                     >
//                       {bal.leaveType.charAt(0) +
//                         bal.leaveType.slice(1).toLowerCase()}
//                     </h2>
//                     <div className="flex items-center gap-2">
//                       {isLow && (
//                         <span
//                           className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
//                           style={{
//                             background: "#fff1f2",
//                             border: "1px solid #fecdd3",
//                             color: "#e11d48",
//                           }}
//                         >
//                           ⚠ Low
//                         </span>
//                       )}
//                       <span
//                         className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
//                         style={{
//                           background: "#f1f5f9",
//                           border: "1px solid #e2e8f0",
//                           color: "#475569",
//                         }}
//                       >
//                         {bal.remaining} / {bal.total} left
//                       </span>
//                     </div>
//                   </div>

//                   {/* Card body */}
//                   <div className="flex flex-col gap-4 px-5 py-4">
//                     {/* Progress bar */}
//                     <div className="flex flex-col gap-1.5">
//                       <div
//                         className="h-2 w-full rounded-full overflow-hidden"
//                         style={{ background: "#f1f5f9" }}
//                       >
//                         <div
//                           className="h-full rounded-full transition-all duration-500"
//                           style={{
//                             width: `${usedPercent}%`,
//                             background: barColor,
//                           }}
//                         />
//                       </div>
//                       <div
//                         className="flex justify-between text-[11px]"
//                         style={{ color: "#94a3b8" }}
//                       >
//                         <span>{usedPercent}% used</span>
//                         <span>{bal.remaining} days available</span>
//                       </div>
//                     </div>

//                     {/* Breakdown boxes */}
//                     <div className="grid grid-cols-2 gap-2">
//                       <div
//                         className="rounded-xl p-3 text-center"
//                         style={{
//                           background: "#f8f9fc",
//                           border: "1px solid #f1f5f9",
//                         }}
//                       >
//                         <p
//                           className="text-[22px] font-bold tabular-nums"
//                           style={{ color: "#1e293b" }}
//                         >
//                           {used}
//                         </p>
//                         <p
//                           className="text-[10px] font-semibold uppercase tracking-[0.1em] mt-0.5"
//                           style={{ color: "#94a3b8" }}
//                         >
//                           Used
//                         </p>
//                       </div>
//                       <div
//                         className="rounded-xl p-3 text-center"
//                         style={{
//                           background: "#f0fdf4",
//                           border: "1px solid #bbf7d0",
//                         }}
//                       >
//                         <p
//                           className="text-[22px] font-bold tabular-nums"
//                           style={{ color: "#16a34a" }}
//                         >
//                           {bal.remaining}
//                         </p>
//                         <p
//                           className="text-[10px] font-semibold uppercase tracking-[0.1em] mt-0.5"
//                           style={{ color: "#16a34a", opacity: 0.7 }}
//                         >
//                           Remaining
//                         </p>
//                       </div>
//                     </div>

//                     {/* Policy info */}
//                     {policy && (
//                       <div
//                         className="rounded-xl p-3 space-y-1"
//                         style={{
//                           background: "#f8f9fc",
//                           border: "1px solid #f1f5f9",
//                         }}
//                       >
//                         {(policy as any).maxConsecutiveDays && (
//                           <p
//                             className="text-[11px]"
//                             style={{ color: "#64748b" }}
//                           >
//                             <span style={{ color: "#94a3b8" }}>
//                               Max consecutive:
//                             </span>{" "}
//                             {(policy as any).maxConsecutiveDays} days
//                           </p>
//                         )}
//                         {(policy as any).carryForwardLimit > 0 && (
//                           <p
//                             className="text-[11px]"
//                             style={{ color: "#64748b" }}
//                           >
//                             <span style={{ color: "#94a3b8" }}>
//                               Carry forward:
//                             </span>{" "}
//                             up to {(policy as any).carryForwardLimit} days
//                           </p>
//                         )}
//                         {(policy as any).accrualRate > 0 && (
//                           <p
//                             className="text-[11px]"
//                             style={{ color: "#64748b" }}
//                           >
//                             <span style={{ color: "#94a3b8" }}>Accrual:</span>{" "}
//                             {(policy as any).accrualRate} days/month
//                           </p>
//                         )}
//                         <p
//                           className="text-[11px] capitalize"
//                           style={{ color: "#64748b" }}
//                         >
//                           <span style={{ color: "#94a3b8" }}>Resets:</span>{" "}
//                           monthly
//                         </p>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               );
//             })
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
