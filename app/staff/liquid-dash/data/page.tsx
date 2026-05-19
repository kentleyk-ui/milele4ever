"use client";

import dynamic from "next/dynamic";

import RequireStaffAuth from "@/components/staff/RequireStaffAuth";

const LiquidDashData = dynamic(() => import("@/components/staff/LiquidDashData"), { ssr: false });

export default function StaffLiquidDashDataPage() {
  return (
    <RequireStaffAuth>
      <LiquidDashData />
    </RequireStaffAuth>
  );
}
