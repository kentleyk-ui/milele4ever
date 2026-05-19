import RequireStaffAuth from "@/components/staff/RequireStaffAuth";
import StaffDashboardHome from "@/components/staff/StaffDashboardHome";
import StaffHub from "@/components/staff/StaffHub";

type StaffPageProps = {
  searchParams?: Promise<{
    view?: string | string[];
  }>;
};

export default async function StaffPage({ searchParams }: StaffPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const view = Array.isArray(resolvedSearchParams?.view) ? resolvedSearchParams.view[0] : resolvedSearchParams?.view;

  return (
    <RequireStaffAuth>
      {view ? <StaffHub /> : <StaffDashboardHome />}
    </RequireStaffAuth>
  );
}

