// // /**
// //  * Reports & Analytics Page - /dashboard/reports
// //  * Shows leave utilization charts, department breakdown, and export options.
// //  * Accessible to managers and HR admins for data-driven insights.
// //  * Uses Recharts through shadcn chart components for visualizations.
// //  */

// // "use client";

// // import { useState } from "react";
// // import { useAuth } from "@/lib/auth-context";
// // import {
// //   mockMonthlyLeaveData,
// //   mockDepartmentLeaveData,
// //   mockLeaveRequests,
// //   mockDashboardStats,
// // } from "@/lib/mock-data";
// // import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// // import { Badge } from "@/components/ui/badge";
// // import { Button } from "@/components/ui/button";
// // import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// // import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// // import {
// //   Table,
// //   TableBody,
// //   TableCell,
// //   TableHead,
// //   TableHeader,
// //   TableRow,
// // } from "@/components/ui/table";
// // import {
// //   BarChart,
// //   Bar,
// //   XAxis,
// //   YAxis,
// //   CartesianGrid,
// //   Tooltip,
// //   Legend,
// //   ResponsiveContainer,
// //   PieChart,
// //   Pie,
// //   Cell,
// //   LineChart,
// //   Line,
// // } from "recharts";
// // import { BarChart3, Download, TrendingUp, Users, Calendar, FileText } from "lucide-react";

// // /** Colors used for chart segments */
// // const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

// // /** Pie chart data derived from mock leave requests */
// // const statusBreakdown = [
// //   { name: "Approved", value: mockLeaveRequests.filter((r) => r.status === "approved").length },
// //   { name: "Pending", value: mockLeaveRequests.filter((r) => r.status === "pending").length },
// //   { name: "Rejected", value: mockLeaveRequests.filter((r) => r.status === "rejected").length },
// // ];

// // export default function ReportsPage() {
// //   const { user } = useAuth();
// //   const [year, setYear] = useState("2026");

// //   /** Calculate total leave days from monthly data */
// //   const totalLeaveDays = mockMonthlyLeaveData.reduce(
// //     (sum, m) => sum + m.annual + m.sick + m.casual + m.emergency + m.unpaid,
// //     0
// //   );

// //   return (
// //     <div className="space-y-6">
// //       {/* Page Header */}
// //       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
// //         <div>
// //           <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
// //           <p className="text-sm text-muted-foreground mt-1">
// //             Leave utilization data, trends, and department breakdowns.
// //           </p>
// //         </div>
// //         <div className="flex items-center gap-3">
// //           <Select value={year} onValueChange={setYear}>
// //             <SelectTrigger className="w-28">
// //               <SelectValue />
// //             </SelectTrigger>
// //             <SelectContent>
// //               <SelectItem value="2026">2026</SelectItem>
// //               <SelectItem value="2025">2025</SelectItem>
// //             </SelectContent>
// //           </Select>
// //           <Button variant="outline" size="sm" className="gap-1.5">
// //             <Download className="h-4 w-4" />
// //             <span className="hidden sm:inline">Export</span>
// //           </Button>
// //         </div>
// //       </div>

// //       {/* Summary Stats */}
// //       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
// //         <Card>
// //           <CardContent className="flex items-center gap-3 pt-6">
// //             <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
// //               <Calendar className="h-5 w-5 text-primary" />
// //             </div>
// //             <div>
// //               <p className="text-xl font-bold text-foreground">{totalLeaveDays}</p>
// //               <p className="text-xs text-muted-foreground">Total Leave Days</p>
// //             </div>
// //           </CardContent>
// //         </Card>
// //         <Card>
// //           <CardContent className="flex items-center gap-3 pt-6">
// //             <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-emerald-500/10">
// //               <TrendingUp className="h-5 w-5 text-emerald-600" />
// //             </div>
// //             <div>
// //               <p className="text-xl font-bold text-foreground">82%</p>
// //               <p className="text-xs text-muted-foreground">Approval Rate</p>
// //             </div>
// //           </CardContent>
// //         </Card>
// //         <Card>
// //           <CardContent className="flex items-center gap-3 pt-6">
// //             <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-amber-500/10">
// //               <Users className="h-5 w-5 text-amber-600" />
// //             </div>
// //             <div>
// //               <p className="text-xl font-bold text-foreground">{mockDashboardStats.totalEmployees}</p>
// //               <p className="text-xs text-muted-foreground">Total Employees</p>
// //             </div>
// //           </CardContent>
// //         </Card>
// //         <Card>
// //           <CardContent className="flex items-center gap-3 pt-6">
// //             <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-red-500/10">
// //               <FileText className="h-5 w-5 text-red-600" />
// //             </div>
// //             <div>
// //               <p className="text-xl font-bold text-foreground">{mockLeaveRequests.length}</p>
// //               <p className="text-xs text-muted-foreground">Total Requests</p>
// //             </div>
// //           </CardContent>
// //         </Card>
// //       </div>

// //       {/* Charts Tabs */}
// //       <Tabs defaultValue="monthly" className="space-y-4">
// //         <TabsList>
// //           <TabsTrigger value="monthly">Monthly Trends</TabsTrigger>
// //           <TabsTrigger value="department">By Department</TabsTrigger>
// //           <TabsTrigger value="status">Status Breakdown</TabsTrigger>
// //         </TabsList>

// //         {/* Monthly Bar Chart */}
// //         <TabsContent value="monthly">
// //           <Card>
// //             <CardHeader>
// //               <CardTitle className="text-base">Monthly Leave Trends - {year}</CardTitle>
// //               <CardDescription>Leave days taken per month by type</CardDescription>
// //             </CardHeader>
// //             <CardContent>
// //               <div className="h-80 w-full">
// //                 <ResponsiveContainer width="100%" height="100%">
// //                   <BarChart data={mockMonthlyLeaveData} barCategoryGap="20%">
// //                     <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
// //                     <XAxis dataKey="month" className="text-xs" tick={{ fill: "var(--color-muted-foreground)" }} />
// //                     <YAxis className="text-xs" tick={{ fill: "var(--color-muted-foreground)" }} />
// //                     <Tooltip
// //                       contentStyle={{
// //                         backgroundColor: "var(--color-card)",
// //                         border: "1px solid var(--color-border)",
// //                         borderRadius: "8px",
// //                         fontSize: "12px",
// //                       }}
// //                     />
// //                     <Legend wrapperStyle={{ fontSize: "12px" }} />
// //                     <Bar dataKey="annual" fill={CHART_COLORS[0]} name="Annual" radius={[2, 2, 0, 0]} />
// //                     <Bar dataKey="sick" fill={CHART_COLORS[1]} name="Sick" radius={[2, 2, 0, 0]} />
// //                     <Bar dataKey="casual" fill={CHART_COLORS[2]} name="Casual" radius={[2, 2, 0, 0]} />
// //                     <Bar dataKey="emergency" fill={CHART_COLORS[3]} name="Emergency" radius={[2, 2, 0, 0]} />
// //                   </BarChart>
// //                 </ResponsiveContainer>
// //               </div>
// //             </CardContent>
// //           </Card>
// //         </TabsContent>

// //         {/* Department Line Chart */}
// //         <TabsContent value="department">
// //           <Card>
// //             <CardHeader>
// //               <CardTitle className="text-base">Department Leave Usage</CardTitle>
// //               <CardDescription>Total leaves and average per employee by department</CardDescription>
// //             </CardHeader>
// //             <CardContent>
// //               <div className="h-80 w-full">
// //                 <ResponsiveContainer width="100%" height="100%">
// //                   <BarChart data={mockDepartmentLeaveData} layout="vertical" barCategoryGap="30%">
// //                     <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
// //                     <XAxis type="number" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
// //                     <YAxis dataKey="department" type="category" width={100} tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
// //                     <Tooltip
// //                       contentStyle={{
// //                         backgroundColor: "var(--color-card)",
// //                         border: "1px solid var(--color-border)",
// //                         borderRadius: "8px",
// //                         fontSize: "12px",
// //                       }}
// //                     />
// //                     <Legend wrapperStyle={{ fontSize: "12px" }} />
// //                     <Bar dataKey="totalLeaves" fill={CHART_COLORS[0]} name="Total Leaves" radius={[0, 4, 4, 0]} />
// //                     <Bar dataKey="avgPerEmployee" fill={CHART_COLORS[1]} name="Avg/Employee" radius={[0, 4, 4, 0]} />
// //                   </BarChart>
// //                 </ResponsiveContainer>
// //               </div>
// //             </CardContent>
// //           </Card>
// //         </TabsContent>

// //         {/* Status Pie Chart */}
// //         <TabsContent value="status">
// //           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
// //             <Card>
// //               <CardHeader>
// //                 <CardTitle className="text-base">Request Status Distribution</CardTitle>
// //                 <CardDescription>Breakdown of all leave request statuses</CardDescription>
// //               </CardHeader>
// //               <CardContent>
// //                 <div className="h-64 w-full">
// //                   <ResponsiveContainer width="100%" height="100%">
// //                     <PieChart>
// //                       <Pie
// //                         data={statusBreakdown}
// //                         cx="50%"
// //                         cy="50%"
// //                         outerRadius={80}
// //                         innerRadius={40}
// //                         dataKey="value"
// //                         label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
// //                         labelLine={false}
// //                       >
// //                         {statusBreakdown.map((_, index) => (
// //                           <Cell key={`cell-${index}`} fill={[CHART_COLORS[1], CHART_COLORS[2], CHART_COLORS[3]][index]} />
// //                         ))}
// //                       </Pie>
// //                       <Tooltip />
// //                     </PieChart>
// //                   </ResponsiveContainer>
// //                 </div>
// //               </CardContent>
// //             </Card>

// //             {/* Summary Table */}
// //             <Card>
// //               <CardHeader>
// //                 <CardTitle className="text-base">Department Summary</CardTitle>
// //                 <CardDescription>Quick overview of leave usage by department</CardDescription>
// //               </CardHeader>
// //               <CardContent>
// //                 <Table>
// //                   <TableHeader>
// //                     <TableRow>
// //                       <TableHead>Department</TableHead>
// //                       <TableHead className="text-right">Total</TableHead>
// //                       <TableHead className="text-right">Avg/Employee</TableHead>
// //                     </TableRow>
// //                   </TableHeader>
// //                   <TableBody>
// //                     {mockDepartmentLeaveData.map((dept) => (
// //                       <TableRow key={dept.department}>
// //                         <TableCell className="font-medium">{dept.department}</TableCell>
// //                         <TableCell className="text-right">{dept.totalLeaves}</TableCell>
// //                         <TableCell className="text-right">{dept.avgPerEmployee}</TableCell>
// //                       </TableRow>
// //                     ))}
// //                   </TableBody>
// //                 </Table>
// //               </CardContent>
// //             </Card>
// //           </div>
// //         </TabsContent>
// //       </Tabs>
// //     </div>
// //   );
// // }
// //////////////////////////////////////////////////

// /**
//  * Reports & Analytics Page - /dashboard/reports
//  * Shows leave utilization charts, department breakdown, and export options.
//  * Accessible to managers and HR admins for data-driven insights.
//  * Uses Recharts for visualizations.
//  */

// "use client";

// import { useState } from "react";
// import { useAuth } from "@/lib/auth-context";
// import {
//   mockMonthlyLeaveData,
//   mockDepartmentLeaveData,
//   mockLeaveRequests,
//   mockDashboardStats,
// } from "@/lib/mock-data";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
//   PieChart,
//   Pie,
//   Cell,
// } from "recharts";
// import {
//   BarChart3,
//   Download,
//   TrendingUp,
//   Users,
//   Calendar,
//   FileText,
// } from "lucide-react";

// /** Colors used for chart segments */
// const CHART_COLORS = ["#4f46e5", "#16a34a", "#d97706", "#dc2626", "#7c3aed"];

// /** Pie chart data derived from mock leave requests */
// const statusBreakdown = [
//   {
//     name: "Approved",
//     value: mockLeaveRequests.filter((r) => r.status === "approved").length,
//   },
//   {
//     name: "Pending",
//     value: mockLeaveRequests.filter((r) => r.status === "pending").length,
//   },
//   {
//     name: "Rejected",
//     value: mockLeaveRequests.filter((r) => r.status === "rejected").length,
//   },
// ];

// const STATUS_COLORS = ["#16a34a", "#d97706", "#dc2626"];

// const TABS = [
//   { key: "monthly", label: "Monthly Trends" },
//   { key: "department", label: "By Department" },
//   { key: "status", label: "Status Breakdown" },
// ];

// export default function ReportsPage() {
//   const { user } = useAuth();
//   const [year, setYear] = useState("2026");
//   const [activeTab, setActiveTab] = useState("monthly");

//   const totalLeaveDays = mockMonthlyLeaveData.reduce(
//     (sum, m) => sum + m.annual + m.sick + m.casual + m.emergency + m.unpaid,
//     0,
//   );

//   const statCards = [
//     {
//       label: "Total Leave Days",
//       value: totalLeaveDays,
//       icon: <Calendar className="h-5 w-5" />,
//       iconBg: "#eef2ff",
//       iconColor: "#4f46e5",
//       accentBar: "#4f46e5",
//     },
//     {
//       label: "Approval Rate",
//       value: "82%",
//       icon: <TrendingUp className="h-5 w-5" />,
//       iconBg: "#f0fdf4",
//       iconColor: "#16a34a",
//       accentBar: "#22c55e",
//     },
//     {
//       label: "Total Employees",
//       value: mockDashboardStats.totalEmployees,
//       icon: <Users className="h-5 w-5" />,
//       iconBg: "#fffbeb",
//       iconColor: "#d97706",
//       accentBar: "#f59e0b",
//     },
//     {
//       label: "Total Requests",
//       value: mockLeaveRequests.length,
//       icon: <FileText className="h-5 w-5" />,
//       iconBg: "#fef2f2",
//       iconColor: "#dc2626",
//       accentBar: "#ef4444",
//     },
//   ];

//   // Shared tooltip style for all charts
//   const tooltipStyle = {
//     backgroundColor: "#ffffff",
//     border: "1px solid #e2e8f0",
//     borderRadius: "12px",
//     fontSize: "12px",
//     boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
//     color: "#1e293b",
//   };

//   return (
//     <div className="min-h-screen" style={{ background: "#f8f9fc" }}>
//       <div className="max-w-7xl mx-auto flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
//         {/* ── Page Header ── */}
//         <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//           <p className="text-[13px]" style={{ color: "#64748b" }}>
//             Leave utilization data, trends, and department breakdowns.
//           </p>

//           <div className="flex items-center gap-3">
//             {/* Year selector */}
//             <Select value={year} onValueChange={setYear}>
//               <SelectTrigger
//                 className="w-28 rounded-xl text-[13px]"
//                 style={{
//                   background: "#ffffff",
//                   border: "1px solid #e2e8f0",
//                   color: "#334155",
//                   boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
//                 }}
//               >
//                 <SelectValue />
//               </SelectTrigger>
//               <SelectContent
//                 style={{
//                   background: "#ffffff",
//                   border: "1px solid #e2e8f0",
//                   boxShadow: "0 8px 24px rgba(15,23,42,0.10)",
//                 }}
//               >
//                 <SelectItem
//                   value="2026"
//                   className="text-[13px]"
//                   style={{ color: "#334155" }}
//                 >
//                   2026
//                 </SelectItem>
//                 <SelectItem
//                   value="2025"
//                   className="text-[13px]"
//                   style={{ color: "#334155" }}
//                 >
//                   2025
//                 </SelectItem>
//               </SelectContent>
//             </Select>

//             {/* Export button */}
//             <button
//               className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-semibold transition-all duration-200"
//               style={{
//                 background: "#ffffff",
//                 border: "1px solid #e2e8f0",
//                 color: "#334155",
//                 boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
//               }}
//               onMouseEnter={(e) => {
//                 (e.currentTarget as HTMLButtonElement).style.borderColor =
//                   "#c7d2fe";
//                 (e.currentTarget as HTMLButtonElement).style.boxShadow =
//                   "0 4px 12px rgba(15,23,42,0.08)";
//               }}
//               onMouseLeave={(e) => {
//                 (e.currentTarget as HTMLButtonElement).style.borderColor =
//                   "#e2e8f0";
//                 (e.currentTarget as HTMLButtonElement).style.boxShadow =
//                   "0 1px 3px rgba(15,23,42,0.05)";
//               }}
//             >
//               <Download className="h-3.5 w-3.5" style={{ color: "#4f46e5" }} />
//               <span className="hidden sm:inline">Export</span>
//             </button>
//           </div>
//         </div>

//         {/* ── Summary Stat Cards ── */}
//         <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
//           {statCards.map((card) => (
//             <div
//               key={card.label}
//               className="group relative overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 cursor-default"
//               style={{
//                 background: "#ffffff",
//                 border: "1px solid #e2e8f0",
//                 boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
//               }}
//               onMouseEnter={(e) => {
//                 (e.currentTarget as HTMLDivElement).style.boxShadow =
//                   "0 8px 24px rgba(15,23,42,0.10)";
//                 (e.currentTarget as HTMLDivElement).style.borderColor =
//                   "#cbd5e1";
//               }}
//               onMouseLeave={(e) => {
//                 (e.currentTarget as HTMLDivElement).style.boxShadow =
//                   "0 1px 3px rgba(15,23,42,0.05)";
//                 (e.currentTarget as HTMLDivElement).style.borderColor =
//                   "#e2e8f0";
//               }}
//             >
//               {/* Colored top bar */}
//               <div
//                 className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
//                 style={{ background: card.accentBar }}
//               />

//               <div className="flex flex-col gap-4 pt-1">
//                 <div
//                   className="flex h-9 w-9 items-center justify-center rounded-xl"
//                   style={{ background: card.iconBg, color: card.iconColor }}
//                 >
//                   {card.icon}
//                 </div>
//                 <div>
//                   <p
//                     className="text-[32px] font-bold leading-none tabular-nums"
//                     style={{ color: "#0f172a" }}
//                   >
//                     {card.value}
//                   </p>
//                   <p
//                     className="mt-2 text-[11px] font-semibold uppercase tracking-[0.1em]"
//                     style={{ color: "#475569" }}
//                   >
//                     {card.label}
//                   </p>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* ── Charts Section ── */}
//         <div
//           className="flex flex-col rounded-2xl overflow-hidden"
//           style={{
//             background: "#ffffff",
//             border: "1px solid #e2e8f0",
//             boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
//           }}
//         >
//           {/* Tab header */}
//           <div
//             className="flex items-center gap-1 px-5 py-3"
//             style={{ borderBottom: "1px solid #f1f5f9" }}
//           >
//             <div
//               className="flex h-7 w-7 items-center justify-center rounded-lg mr-2"
//               style={{ background: "#eef2ff", color: "#4f46e5" }}
//             >
//               <BarChart3 className="h-3.5 w-3.5" />
//             </div>
//             {TABS.map((tab) => (
//               <button
//                 key={tab.key}
//                 onClick={() => setActiveTab(tab.key)}
//                 className="rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all duration-150"
//                 style={{
//                   background: activeTab === tab.key ? "#eef2ff" : "transparent",
//                   color: activeTab === tab.key ? "#4f46e5" : "#64748b",
//                   border:
//                     activeTab === tab.key
//                       ? "1px solid #c7d2fe"
//                       : "1px solid transparent",
//                 }}
//                 onMouseEnter={(e) => {
//                   if (activeTab !== tab.key)
//                     (e.currentTarget as HTMLButtonElement).style.color =
//                       "#334155";
//                 }}
//                 onMouseLeave={(e) => {
//                   if (activeTab !== tab.key)
//                     (e.currentTarget as HTMLButtonElement).style.color =
//                       "#64748b";
//                 }}
//               >
//                 {tab.label}
//               </button>
//             ))}
//           </div>

//           {/* ── Monthly Trends Tab ── */}
//           {activeTab === "monthly" && (
//             <div className="p-5">
//               <div className="mb-4">
//                 <h2
//                   className="text-[13px] font-semibold"
//                   style={{ color: "#0f172a" }}
//                 >
//                   Monthly Leave Trends — {year}
//                 </h2>
//                 <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }}>
//                   Leave days taken per month by type
//                 </p>
//               </div>
//               <div className="h-80 w-full">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <BarChart data={mockMonthlyLeaveData} barCategoryGap="20%">
//                     <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
//                     <XAxis
//                       dataKey="month"
//                       tick={{ fill: "#94a3b8", fontSize: 11 }}
//                       axisLine={false}
//                       tickLine={false}
//                     />
//                     <YAxis
//                       tick={{ fill: "#94a3b8", fontSize: 11 }}
//                       axisLine={false}
//                       tickLine={false}
//                     />
//                     <Tooltip
//                       contentStyle={tooltipStyle}
//                       cursor={{ fill: "#f8f9fc" }}
//                     />
//                     <Legend
//                       wrapperStyle={{ fontSize: "12px", color: "#475569" }}
//                     />
//                     <Bar
//                       dataKey="annual"
//                       fill={CHART_COLORS[0]}
//                       name="Annual"
//                       radius={[3, 3, 0, 0]}
//                     />
//                     <Bar
//                       dataKey="sick"
//                       fill={CHART_COLORS[1]}
//                       name="Sick"
//                       radius={[3, 3, 0, 0]}
//                     />
//                     <Bar
//                       dataKey="casual"
//                       fill={CHART_COLORS[2]}
//                       name="Casual"
//                       radius={[3, 3, 0, 0]}
//                     />
//                     <Bar
//                       dataKey="emergency"
//                       fill={CHART_COLORS[3]}
//                       name="Emergency"
//                       radius={[3, 3, 0, 0]}
//                     />
//                   </BarChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>
//           )}

//           {/* ── Department Tab ── */}
//           {activeTab === "department" && (
//             <div className="p-5">
//               <div className="mb-4">
//                 <h2
//                   className="text-[13px] font-semibold"
//                   style={{ color: "#0f172a" }}
//                 >
//                   Department Leave Usage
//                 </h2>
//                 <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }}>
//                   Total leaves and average per employee by department
//                 </p>
//               </div>
//               <div className="h-80 w-full">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <BarChart
//                     data={mockDepartmentLeaveData}
//                     layout="vertical"
//                     barCategoryGap="30%"
//                   >
//                     <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
//                     <XAxis
//                       type="number"
//                       tick={{ fill: "#94a3b8", fontSize: 11 }}
//                       axisLine={false}
//                       tickLine={false}
//                     />
//                     <YAxis
//                       dataKey="department"
//                       type="category"
//                       width={110}
//                       tick={{ fill: "#64748b", fontSize: 11 }}
//                       axisLine={false}
//                       tickLine={false}
//                     />
//                     <Tooltip
//                       contentStyle={tooltipStyle}
//                       cursor={{ fill: "#f8f9fc" }}
//                     />
//                     <Legend
//                       wrapperStyle={{ fontSize: "12px", color: "#475569" }}
//                     />
//                     <Bar
//                       dataKey="totalLeaves"
//                       fill={CHART_COLORS[0]}
//                       name="Total Leaves"
//                       radius={[0, 3, 3, 0]}
//                     />
//                     <Bar
//                       dataKey="avgPerEmployee"
//                       fill={CHART_COLORS[1]}
//                       name="Avg/Employee"
//                       radius={[0, 3, 3, 0]}
//                     />
//                   </BarChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>
//           )}

//           {/* ── Status Breakdown Tab ── */}
//           {activeTab === "status" && (
//             <div className="p-5">
//               <div className="mb-4">
//                 <h2
//                   className="text-[13px] font-semibold"
//                   style={{ color: "#0f172a" }}
//                 >
//                   Status Breakdown
//                 </h2>
//                 <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }}>
//                   Breakdown of all leave request statuses
//                 </p>
//               </div>

//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                 {/* Pie chart */}
//                 <div className="h-64 w-full">
//                   <ResponsiveContainer width="100%" height="100%">
//                     <PieChart>
//                       <Pie
//                         data={statusBreakdown}
//                         cx="50%"
//                         cy="50%"
//                         outerRadius={90}
//                         innerRadius={45}
//                         dataKey="value"
//                         label={({ name, percent }) =>
//                           `${name} ${(percent * 100).toFixed(0)}%`
//                         }
//                         labelLine={false}
//                       >
//                         {statusBreakdown.map((_, index) => (
//                           <Cell
//                             key={`cell-${index}`}
//                             fill={STATUS_COLORS[index]}
//                           />
//                         ))}
//                       </Pie>
//                       <Tooltip contentStyle={tooltipStyle} />
//                     </PieChart>
//                   </ResponsiveContainer>
//                 </div>

//                 {/* Department summary table */}
//                 <div
//                   className="flex flex-col rounded-2xl overflow-hidden"
//                   style={{ border: "1px solid #e2e8f0" }}
//                 >
//                   {/* Table header */}
//                   <div
//                     className="px-4 py-3"
//                     style={{
//                       borderBottom: "1px solid #f1f5f9",
//                       background: "#f8f9fc",
//                     }}
//                   >
//                     <h3
//                       className="text-[12px] font-semibold"
//                       style={{ color: "#0f172a" }}
//                     >
//                       Department Summary
//                     </h3>
//                     <p
//                       className="text-[11px] mt-0.5"
//                       style={{ color: "#94a3b8" }}
//                     >
//                       Quick overview by department
//                     </p>
//                   </div>

//                   {/* Table rows */}
//                   <div className="flex flex-col">
//                     {/* Column headers */}
//                     <div
//                       className="grid grid-cols-3 px-4 py-2"
//                       style={{ borderBottom: "1px solid #f1f5f9" }}
//                     >
//                       <span
//                         className="text-[10px] font-semibold uppercase tracking-[0.1em]"
//                         style={{ color: "#94a3b8" }}
//                       >
//                         Department
//                       </span>
//                       <span
//                         className="text-[10px] font-semibold uppercase tracking-[0.1em] text-right"
//                         style={{ color: "#94a3b8" }}
//                       >
//                         Total
//                       </span>
//                       <span
//                         className="text-[10px] font-semibold uppercase tracking-[0.1em] text-right"
//                         style={{ color: "#94a3b8" }}
//                       >
//                         Avg/Emp
//                       </span>
//                     </div>

//                     {mockDepartmentLeaveData.map((dept, idx) => (
//                       <div
//                         key={dept.department}
//                         className="grid grid-cols-3 px-4 py-2.5 transition-colors duration-100"
//                         style={{
//                           borderBottom:
//                             idx < mockDepartmentLeaveData.length - 1
//                               ? "1px solid #f8fafc"
//                               : "none",
//                         }}
//                         onMouseEnter={(e) =>
//                           ((
//                             e.currentTarget as HTMLDivElement
//                           ).style.background = "#f8f9fc")
//                         }
//                         onMouseLeave={(e) =>
//                           ((
//                             e.currentTarget as HTMLDivElement
//                           ).style.background = "transparent")
//                         }
//                       >
//                         <span
//                           className="text-[12px] font-medium truncate"
//                           style={{ color: "#1e293b" }}
//                         >
//                           {dept.department}
//                         </span>
//                         <span
//                           className="text-[12px] font-semibold text-right tabular-nums"
//                           style={{ color: "#4f46e5" }}
//                         >
//                           {dept.totalLeaves}
//                         </span>
//                         <span
//                           className="text-[12px] text-right tabular-nums"
//                           style={{ color: "#64748b" }}
//                         >
//                           {dept.avgPerEmployee}
//                         </span>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>

//               {/* Status pill summary */}
//               <div className="mt-5 flex flex-wrap gap-3">
//                 {statusBreakdown.map((s, i) => (
//                   <div
//                     key={s.name}
//                     className="flex items-center gap-2 rounded-xl px-4 py-2.5"
//                     style={{
//                       background:
//                         i === 0 ? "#f0fdf4" : i === 1 ? "#fffbeb" : "#fef2f2",
//                       border: `1px solid ${i === 0 ? "#bbf7d0" : i === 1 ? "#fde68a" : "#fecaca"}`,
//                     }}
//                   >
//                     <span
//                       className="h-2 w-2 rounded-full"
//                       style={{ background: STATUS_COLORS[i] }}
//                     />
//                     <span
//                       className="text-[12px] font-semibold"
//                       style={{ color: STATUS_COLORS[i] }}
//                     >
//                       {s.name}
//                     </span>
//                     <span
//                       className="text-[18px] font-bold tabular-nums leading-none"
//                       style={{ color: "#0f172a" }}
//                     >
//                       {s.value}
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
