import { AttendanceService } from "@/services/attendanceService";

jest.mock("@/models/Class", () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
  },
}));

jest.mock("@/models/Student", () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
  },
}));

jest.mock("@/models/Category", () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
  },
}));

jest.mock("@/models/AttendanceLog", () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findOneAndUpdate: jest.fn(),
    bulkWrite: jest.fn(),
  },
}));

const MockedClass = require("@/models/Class").default as {
  findOne: jest.Mock;
};
const MockedStudent = require("@/models/Student").default as {
  find: jest.Mock;
};
const MockedCategory = require("@/models/Category").default as {
  find: jest.Mock;
};
const MockedAttendanceLog = require("@/models/AttendanceLog").default as {
  find: jest.Mock;
  findOneAndUpdate: jest.Mock;
  bulkWrite: jest.Mock;
};

describe("AttendanceService.getDailyAttendance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when class does not exist", async () => {
    MockedClass.findOne.mockResolvedValue(null);

    const result = await AttendanceService.getDailyAttendance("unknown", "2024-01-01");
    expect(result).toBeNull();
    expect(MockedStudent.find).not.toHaveBeenCalled();
  });

  it("returns students with attendance map and respects student_order", async () => {
    const classDoc = {
      code: "C1",
      name: "Class 1",
      major_categories: [],
      student_order: ["s2", "s1"],
      _id: "class-object-id",
    };
    MockedClass.findOne.mockResolvedValue(classDoc);

    const students = [
      { _id: "id1", student_id: "s1", name: "Alice" },
      { _id: "id2", student_id: "s2", name: "Bob" },
    ];
    MockedStudent.find.mockResolvedValue(students);

    const logs = [
      { student_id: "s1", period: 0, status: 1 },
      { student_id: "s2", period: 1, status: 0 },
    ];
    MockedAttendanceLog.find.mockResolvedValue(logs);

    const result = await AttendanceService.getDailyAttendance("C1", "2024-01-01");

    expect(result).not.toBeNull();
    expect(result!.id).toBe("C1");
    expect(result!.name).toBe("Class 1");

    // 应按 student_order 排序：s2 在前，s1 在后
    expect(result!.students.map((s) => s.id)).toEqual(["s2", "s1"]);
    // 考勤映射正确
    expect(result!.students[0].attendance).toEqual({ 1: 0 });
    expect(result!.students[1].attendance).toEqual({ 0: 1 });
  });
});

describe("AttendanceService.updateAttendance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws when student_id missing for single update", async () => {
    await expect(
      AttendanceService.updateAttendance({
        classCode: "C1",
        action: "update_attendance",
        period: 0,
        status: 1,
        date: "2024-01-01",
      } as any)
    ).rejects.toThrow("student_id is required for update_attendance");
  });

  it("updates single attendance log", async () => {
    const mockedLog = { _id: "log1" };
    MockedAttendanceLog.findOneAndUpdate.mockResolvedValue(mockedLog);

    const result = await AttendanceService.updateAttendance({
      classCode: "C1",
      action: "update_attendance",
      student_id: "s1",
      period: 0,
      status: 1,
      date: "2024-01-01",
    });

    expect(MockedAttendanceLog.findOneAndUpdate).toHaveBeenCalledWith(
      {
        class_code: "C1",
        student_id: "s1",
        date: "2024-01-01",
        period: 0,
      },
      expect.objectContaining({ status: 1 }),
      { upsert: true, new: true }
    );
    expect(result).toBe(mockedLog);
  });

  it("performs batch update with bulkWrite", async () => {
    MockedAttendanceLog.bulkWrite.mockResolvedValue({});

    const result = await AttendanceService.updateAttendance({
      classCode: "C1",
      action: "batch_update_attendance",
      student_ids: ["s1", "s2"],
      period: 1,
      status: 0,
      date: "2024-01-01",
    });

    expect(MockedAttendanceLog.bulkWrite).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ success: true });
  });
});

