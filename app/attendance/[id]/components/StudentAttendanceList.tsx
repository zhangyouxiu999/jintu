"use client";

import { memo } from "react";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Student } from "../types";
import SortableStudentRow from "./SortableStudentRow";

interface StudentAttendanceListProps {
  students: Student[];
  allStudents: Student[];
  onDragStart: () => void;
  onDragEnd: (event: DragEndEvent) => void;
  onDragOver: (event: DragOverEvent) => void;
  updateStudentStatus: (id: string, status: number) => void;
  handleIndexChange: (id: string, newIndex: string) => void;
}

const StudentAttendanceList = memo(
  ({
    students,
    allStudents,
    onDragStart,
    onDragEnd,
    onDragOver,
    updateStudentStatus,
    handleIndexChange,
  }: StudentAttendanceListProps) => {
    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: {
          distance: 5,
        },
      }),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      })
    );

    const totalStudents = students.length;
    const leftCount = Math.ceil(totalStudents / 3);
    const centerCount = Math.ceil((totalStudents - leftCount) / 2);

    const studentsLeft = students.slice(0, leftCount);
    const studentsCenter = students.slice(leftCount, leftCount + centerCount);
    const studentsRight = students.slice(leftCount + centerCount);

    return (
      <div className="space-y-8">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragOver={onDragOver}
        >
          <SortableContext items={students} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 左列 */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 px-1">
                  <div className="h-4 w-1 rounded-full bg-primary" />
                  <h3 className="text-sm font-semibold tracking-tight">
                    第一列
                  </h3>
                </div>
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-[45px] text-center text-[10px] font-medium uppercase tracking-wider">
                          #
                        </TableHead>
                        <TableHead className="text-[10px] font-medium uppercase tracking-wider">
                          姓名
                        </TableHead>
                        <TableHead className="text-right text-[10px] font-medium uppercase tracking-wider">
                          考勤状态
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentsLeft.map((student) => (
                        <SortableStudentRow
                          key={student.id}
                          student={student}
                          index={
                            allStudents.findIndex((s) => s.id === student.id) +
                            1
                          }
                          onUpdateStatus={updateStudentStatus}
                          onIndexChange={handleIndexChange}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* 中列 */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 px-1">
                  <div className="h-4 w-1 rounded-full bg-primary" />
                  <h3 className="text-sm font-semibold tracking-tight">
                    第二列
                  </h3>
                </div>
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-[45px] text-center text-[10px] font-medium uppercase tracking-wider">
                          #
                        </TableHead>
                        <TableHead className="text-[10px] font-medium uppercase tracking-wider">
                          姓名
                        </TableHead>
                        <TableHead className="text-right text-[10px] font-medium uppercase tracking-wider">
                          考勤状态
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentsCenter.map((student) => (
                        <SortableStudentRow
                          key={student.id}
                          student={student}
                          index={
                            allStudents.findIndex((s) => s.id === student.id) +
                            1
                          }
                          onUpdateStatus={updateStudentStatus}
                          onIndexChange={handleIndexChange}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* 右列 */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 px-1">
                  <div className="h-4 w-1 rounded-full bg-primary" />
                  <h3 className="text-sm font-semibold tracking-tight">
                    第三列
                  </h3>
                </div>
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-[45px] text-center text-[10px] font-medium uppercase tracking-wider">
                          #
                        </TableHead>
                        <TableHead className="text-[10px] font-medium uppercase tracking-wider">
                          姓名
                        </TableHead>
                        <TableHead className="text-right text-[10px] font-medium uppercase tracking-wider">
                          考勤状态
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentsRight.map((student) => (
                        <SortableStudentRow
                          key={student.id}
                          student={student}
                          index={
                            allStudents.findIndex((s) => s.id === student.id) +
                            1
                          }
                          onUpdateStatus={updateStudentStatus}
                          onIndexChange={handleIndexChange}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </SortableContext>
        </DndContext>
      </div>
    );
  }
);

StudentAttendanceList.displayName = "StudentAttendanceList";
export default StudentAttendanceList;
