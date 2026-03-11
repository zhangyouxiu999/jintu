import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import logger from "@/lib/logger";
import Class from "@/models/Class";
import Student, { IStudent } from "@/models/Student";
import Announcement from "@/models/Announcement";
import AttendanceLog from "@/models/AttendanceLog";
import AttendanceHistory from "@/models/AttendanceHistory";
import Category from "@/models/Category";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    await dbConnect();
    const { code } = await params;
    const { searchParams } = new URL(request.url);
    const date =
      searchParams.get("date") || new Date().toISOString().split("T")[0];

    // 查找班级
    const classData = await Class.findOne({ code });

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const classCode = classData.code;

    // 根据大类分配学生：查找班级所属大类对应的所有学生
    let students = [];
    if (classData.major_categories && classData.major_categories.length > 0) {
      const categories = await Category.find({
        name: { $in: classData.major_categories },
      });
      const categoryIds = categories.map((cat) => cat._id);
      students = await Student.find({ category_id: { $in: categoryIds } });
    } else {
      // 如果没有配置大类，则按原逻辑查找直接关联的学生
      students = await Student.find({ current_class_id: classData._id });
    }

    // 查找当天的考勤记录（根据当前时间计算时段）
    let period = 0;
    const nowTime = new Date();
    const hour = nowTime.getHours();
    const minutes = nowTime.getMinutes();
    const totalMinutes = hour * 60 + minutes;

    if (searchParams.has("period")) {
      period = parseInt(searchParams.get("period")!);
    } else {
      // 默认根据时间计算：0-上午, 1-下午, 2-晚一, 3-晚二
      if (hour >= 12 && hour < 18) {
        period = 1;
      } else if (totalMinutes >= 18 * 60 && totalMinutes < 19 * 60 + 30) {
        period = 2;
      } else if (totalMinutes >= 19 * 60 + 30 || hour < 5) {
        period = 3;
      }
    }

    const attendanceLogs = await AttendanceLog.find({
      class_code: classCode,
      date: date,
      period: period,
    });

    const attendanceMap = new Map(
      attendanceLogs.map((log) => [log.student_id, log.status])
    );

    // 处理排序逻辑
    let sortedStudents = students;
    if (classData.student_order && classData.student_order.length > 0) {
      const orderMap = new Map(
        classData.student_order.map((id, index) => [id, index])
      );
      sortedStudents = [...students].sort((a: IStudent, b: IStudent) => {
        const idA = (a.student_id || a._id?.toString()) as string;
        const idB = (b.student_id || b._id?.toString()) as string;
        const orderA = orderMap.get(idA) ?? 1000;
        const orderB = orderMap.get(idB) ?? 1000;
        return orderA - orderB;
      });
    }

    // 查找该班级的所有公告
    const now = new Date();
    const announcements = await Announcement.find({
      class_id: classData.code,
      is_active: true,
      $and: [
        {
          $or: [{ starts_at: null }, { starts_at: { $lte: now } }],
        },
        {
          $or: [{ expires_at: null }, { expires_at: { $gt: now } }],
        },
      ],
    }).sort({ created_at: -1 });

    return NextResponse.json({
      id: classData.code,
      name: classData.name,
      major_categories: classData.major_categories || [],
      announcements: announcements.map((a) => ({
        id: a._id,
        content: a.content,
        created_at: a.created_at,
        expiration_type: a.expiration_type,
        starts_at: a.starts_at,
        expires_at: a.expires_at,
      })),
      students: sortedStudents.map((s: IStudent) => {
        const sId = (s.student_id || s._id?.toString()) as string;
        return {
          id: sId,
          name: s.name,
          attendanceStatus: attendanceMap.get(sId) || 0,
        };
      }),
      student_order: classData.student_order || [],
    });
  } catch (error) {
    const err = error as Error;
    logger.error({ err }, "Class detail API Error");
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    await dbConnect();
    const { code } = await params;
    const body = await request.json();
    const {
      content,
      announcement_id,
      action,
      major_categories,
      student_order,
      student_id,
      student_ids,
      status,
      status_map,
      date: customDate,
      expiration_type,
      custom_starts_at,
      custom_expires_at,
    } = body;

    const announcementId = announcement_id;
    const classCode = code;

    // 计算过期时间
    let startsAt: Date | null = null;
    let expiresAt: Date | null = null;
    if (expiration_type === "today") {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      startsAt = startOfDay;

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      expiresAt = endOfDay;
    } else if (expiration_type === "custom") {
      if (custom_starts_at) {
        startsAt = new Date(custom_starts_at);
      }
      if (custom_expires_at) {
        expiresAt = new Date(custom_expires_at);
        expiresAt.setHours(23, 59, 59, 999);
      } else if (startsAt) {
        expiresAt = new Date(startsAt);
        expiresAt.setHours(23, 59, 59, 999);
      }
    } else if (expiration_type === "permanent") {
      startsAt = null;
      expiresAt = null;
    }

    if (action === "clear_attendance") {
      const date = customDate || new Date().toISOString().split("T")[0];
      const period = body.period !== undefined ? body.period : 0;
      await AttendanceLog.deleteMany({
        class_code: classCode,
        date,
        period: period,
      });
      return NextResponse.json({ success: true });
    }

    if (action === "update_attendance") {
      const date = customDate || new Date().toISOString().split("T")[0];
      const period = body.period !== undefined ? body.period : 0;
      const finalStatus =
        status !== undefined && status !== null ? Number(status) : 0;
      const log = await AttendanceLog.findOneAndUpdate(
        { class_code: classCode, student_id, date, period: period },
        { status: finalStatus, updated_at: new Date() },
        { upsert: true, new: true }
      );
      return NextResponse.json(log);
    }

    if (action === "batch_update_attendance") {
      const date = customDate || new Date().toISOString().split("T")[0];
      const statusMap = status_map;
      const period = body.period !== undefined ? body.period : 0;

      console.log(
        `[BatchUpdate] Starting update for class: ${classCode}, date: ${date}, period: ${period}`
      );

      if (!statusMap || !student_ids || !Array.isArray(student_ids)) {
        console.error(
          "[BatchUpdate] Missing or invalid status_map or student_ids",
          {
            hasStatusMap: !!statusMap,
            hasStudentIds: !!student_ids,
            isStudentIdsArray: Array.isArray(student_ids),
          }
        );
        return NextResponse.json(
          {
            error:
              "Missing or invalid required fields (status_map, student_ids)",
          },
          { status: 400 }
        );
      }

      // 0. 去重 student_ids
      const uniqueStudentIds = Array.from(new Set(student_ids));

      const operations = uniqueStudentIds.map((sId: string) => {
        const rawStatus = statusMap[sId];
        const status =
          rawStatus !== undefined && rawStatus !== null ? Number(rawStatus) : 0;
        return {
          updateOne: {
            filter: { class_code: classCode, student_id: sId, date, period },
            update: { status, updated_at: new Date() },
            upsert: true,
          },
        };
      });

      // 1. 更新实时协作日志
      if (operations.length > 0) {
        console.log(
          `[BatchUpdate] Bulk writing ${operations.length} logs to AttendanceLog`
        );
        try {
          await AttendanceLog.bulkWrite(operations);
        } catch (error) {
          const bulkError = error as any; // Using any here because mongoose bulk error has complex structure
          if (bulkError.code === 11000) {
            console.error(
              "[BatchUpdate] Index conflict detected, cleaning up old indexes..."
            );
            try {
              // 获取当前所有索引
              const indexes = await AttendanceLog.collection.indexes();
              const indexNames = indexes.map((idx) => idx.name);

              // 定义需要清理的旧索引名称
              const oldIndexNames = [
                "class_code_1_student_id_1_date_1",
                "class_id_1_student_id_1_date_1",
                "class_id_1_student_id_1_date_1_period_1",
              ];

              for (const name of oldIndexNames) {
                if (indexNames.includes(name)) {
                  await AttendanceLog.collection.dropIndex(name);
                  console.log(`[BatchUpdate] Dropped old index: ${name}`);
                }
              }

              // 重试
              await AttendanceLog.bulkWrite(operations);
            } catch (dropError) {
              console.error(
                "[BatchUpdate] Failed to clean indexes or retry:",
                dropError
              );
              throw bulkError;
            }
          } else {
            throw bulkError;
          }
        }
      }

      // 2. 以班级为单位保存到历史记录表
      const records = uniqueStudentIds.map((sId: string) => {
        const rawStatus = statusMap[sId];
        const status =
          rawStatus !== undefined && rawStatus !== null ? Number(rawStatus) : 0;
        return {
          student_id: sId,
          status: status,
        };
      });

      console.log(
        `[BatchUpdate] Saving snapshot to AttendanceHistory for period ${period}`
      );
      await AttendanceHistory.findOneAndUpdate(
        { class_code: classCode, date, period },
        {
          records,
          confirmed_at: new Date(),
        },
        { upsert: true, new: true }
      );

      console.log(
        `[BatchUpdate] Successfully completed for class: ${classCode}`
      );
      return NextResponse.json({ success: true });
    }

    if (action === "update_categories") {
      const updatedClass = await Class.findOneAndUpdate(
        { code: classCode },
        { major_categories, updated_at: new Date() },
        { new: true }
      );
      return NextResponse.json(updatedClass);
    }

    if (action === "update_order") {
      console.log(
        "Updating order for class:",
        classCode,
        "New order length:",
        student_order?.length
      );
      const updatedClass = await Class.findOneAndUpdate(
        { code: classCode },
        { student_order, updated_at: new Date() },
        { new: true }
      );
      return NextResponse.json(updatedClass);
    }

    if (action === "update_code") {
      const { new_code } = body;
      if (!new_code) {
        return NextResponse.json(
          { message: "新代码不能为空" },
          { status: 400 }
        );
      }

      // 检查新代码是否已存在
      const existingClass = await Class.findOne({ code: new_code });
      if (existingClass) {
        return NextResponse.json(
          { message: "班级代码已存在" },
          { status: 400 }
        );
      }

      const updatedClass = await Class.findOneAndUpdate(
        { code: classCode },
        { code: new_code, updated_at: new Date() },
        { new: true }
      );

      // 同时更新关联的考勤记录、历史记录和公告
      await Promise.all([
        AttendanceLog.updateMany(
          { class_code: classCode },
          { class_code: new_code }
        ),
        AttendanceHistory.updateMany(
          { class_code: classCode },
          { class_code: new_code }
        ),
        Announcement.updateMany(
          { class_id: classCode },
          { class_id: new_code }
        ),
      ]);

      return NextResponse.json(updatedClass);
    }

    if (action === "delete_class") {
      // 1. 检查是否有学生属于该班级
      const classData = await Class.findOne({ code: classCode });
      if (!classData) {
        return NextResponse.json({ message: "班级不存在" }, { status: 404 });
      }

      const studentCount = await Student.countDocuments({
        current_class_id: classData._id,
      });

      if (studentCount > 0) {
        return NextResponse.json(
          {
            message: `该班级下还有 ${studentCount} 名学生，请先转移或删除学生后再删除班级`,
          },
          { status: 400 }
        );
      }

      // 2. 删除班级基本信息
      await Class.findOneAndDelete({ code: classCode });

      // 3. 删除关联的公告、考勤记录、历史记录
      await Promise.all([
        Announcement.deleteMany({ class_id: classCode }),
        AttendanceLog.deleteMany({ class_code: classCode }),
        AttendanceHistory.deleteMany({ class_code: classCode }),
      ]);

      return NextResponse.json({ success: true });
    }

    if (action === "delete") {
      await Announcement.findByIdAndDelete(announcementId);
      return NextResponse.json({ success: true });
    }

    if (announcementId) {
      const announcement = await Announcement.findByIdAndUpdate(
        announcementId,
        {
          content,
          expiration_type,
          starts_at: startsAt,
          expires_at: expiresAt,
          updated_at: new Date(),
        },
        { new: true }
      );
      return NextResponse.json(announcement);
    } else {
      const announcement = await Announcement.create({
        class_id: classCode,
        content,
        expiration_type,
        starts_at: startsAt,
        expires_at: expiresAt,
        is_active: true,
      });
      return NextResponse.json(announcement);
    }
  } catch (error) {
    const err = error as Error;
    logger.error(
      { err, stack: err.stack },
      "Class detail API Error Detail"
    );
    return NextResponse.json(
      { error: "Internal Server Error", message: err.message },
      { status: 500 }
    );
  }
}
