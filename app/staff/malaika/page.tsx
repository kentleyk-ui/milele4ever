import MalaikaChat from "@/components/MalaikaChat";
import RequireStaffAuth from "@/components/staff/RequireStaffAuth";

export default function StaffMalaikaPage() {
  return (
    <RequireStaffAuth>
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <MalaikaChat mode="staff" />
      </div>
    </RequireStaffAuth>
  );
}
