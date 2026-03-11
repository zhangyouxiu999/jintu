export interface Student {
  id: string;
  name: string;
  attendanceStatus: number; // 0: 未到, 1: 已到, 2: 请假, 3: 晚到
}

export interface ClassInfo {
  id: string;
  name: string;
  students: Student[];
}

export interface AnnouncementItem {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  expiration_type?: "today" | "permanent" | "custom";
  starts_at?: string;
  expires_at?: string;
}

export interface AttendanceProps {
  id: string;
}
