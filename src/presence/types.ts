export interface AttendanceRecord {
  status: string;
  time?: string;
}

export type AttendanceByPeriod = Record<string, Record<string, AttendanceRecord>>;
