import { ClipboardCheck } from "lucide-react";
import { getAttendanceSeries } from "@/services/dashboard.service";
import { AttendanceChart } from "./AttendanceChart";
import {
  EmptyState,
  ErrorState,
  Panel,
  PanelBody,
  PanelHeader,
  PanelLink,
  loadPanel,
} from "./primitives";

export async function AttendancePanel() {
  const result = await loadPanel(getAttendanceSeries);

  return (
    <Panel className="h-full">
      <PanelHeader
        title="Attendance"
        description="Check-in volume across your gym"
        action={<PanelLink href="/dashboard/attendance">View logs</PanelLink>}
      />
      <PanelBody>
        {!result.ok ? (
          <ErrorState label="attendance" />
        ) : !result.data.hasAnyData ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No check-ins recorded yet"
            description="Once members start checking in, their visit trend appears here."
            actionLabel="Open check-in terminal"
            actionHref="/dashboard/attendance"
          />
        ) : (
          <AttendanceChart series={result.data} />
        )}
      </PanelBody>
    </Panel>
  );
}
