"use client";

import dynamic from "next/dynamic";
import RequireStaffAuth from "@/components/staff/RequireStaffAuth";

const LiquidDash = dynamic(() => import("@/components/staff/LiquidDash"), { ssr: false });

export default function StaffLiquidDashPage() {
  return (
    <RequireStaffAuth>
      <LiquidDash />
    </RequireStaffAuth>
  );
}
