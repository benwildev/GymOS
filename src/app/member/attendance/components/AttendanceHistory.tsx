"use client";

import { format, differenceInMinutes, differenceInHours } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type AttendanceRecord = {
  id: string;
  checkInAt: Date;
  checkOutAt: Date | null;
  method: string;
};

export default function AttendanceHistory({ records }: { records: AttendanceRecord[] }) {
  if (records.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        You haven't checked into the gym yet.
      </div>
    );
  }

  const getDuration = (start: Date, end: Date | null) => {
    if (!end) return "Current Visit";
    
    const minutes = differenceInMinutes(end, start);
    if (minutes < 60) {
      return `${minutes}m`;
    }
    
    const hours = differenceInHours(end, start);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Check-in Time</TableHead>
          <TableHead>Check-out Time</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead className="text-right">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((record) => (
          <TableRow key={record.id}>
            <TableCell className="font-medium">
              {format(new Date(record.checkInAt), "MMM d, yyyy")}
            </TableCell>
            <TableCell>
              {format(new Date(record.checkInAt), "h:mm a")}
            </TableCell>
            <TableCell>
              {record.checkOutAt 
                ? format(new Date(record.checkOutAt), "h:mm a") 
                : "—"}
            </TableCell>
            <TableCell>
              {getDuration(new Date(record.checkInAt), record.checkOutAt ? new Date(record.checkOutAt) : null)}
            </TableCell>
            <TableCell className="text-right">
              {!record.checkOutAt ? (
                <Badge className="bg-green-600">In Gym</Badge>
              ) : (
                <Badge variant="secondary">Completed</Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
