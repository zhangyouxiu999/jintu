"use client";

import { useState, useEffect, memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RefreshCw } from "lucide-react";
import { Student } from "../types";

interface SortableStudentRowProps {
  student: Student;
  index: number;
  onUpdateStatus: (id: string, status: number) => void;
  onIndexChange: (id: string, newIndex: string) => void;
}

const SortableStudentRow = memo(
  ({
    student,
    index,
    onUpdateStatus,
    onIndexChange,
  }: SortableStudentRowProps) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: student.id });

    const [inputValue, setInputValue] = useState(index.toString());

    useEffect(() => {
      setInputValue(index.toString());
    }, [index]);

    const handleBlur = () => {
      if (inputValue !== index.toString()) {
        onIndexChange(student.id, inputValue);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        (e.target as HTMLInputElement).blur();
      }
    };

    const style = {
      transform: CSS.Translate.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 1000 : "auto",
      position: "relative" as const,
    };

    const getStatusStyles = () => {
      switch (student.attendanceStatus) {
        case 1:
          return "bg-emerald-50/60 hover:bg-emerald-50/80 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/15 border-l-4 border-l-emerald-500/50";
        case 2:
          return "bg-amber-50/60 hover:bg-amber-50/80 dark:bg-amber-500/10 dark:hover:bg-amber-500/15 border-l-4 border-l-amber-500/50";
        case 3:
          return "bg-sky-50/60 hover:bg-sky-50/80 dark:bg-sky-500/10 dark:hover:bg-sky-500/15 border-l-4 border-l-sky-500/50";
        default:
          return "border-l-4 border-l-transparent";
      }
    };

    return (
      <TableRow
        ref={setNodeRef}
        style={style}
        {...attributes}
        className={`transition-colors duration-200 ${getStatusStyles()}`}
      >
        <TableCell className="w-[45px] py-2 px-1">
          <div className="flex items-center justify-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  {...listeners}
                  className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded transition-colors"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-muted-foreground/50"
                  >
                    <path
                      d="M5.5 3C5.5 3.27614 5.27614 3.5 5 3.5C4.72386 3.5 4.5 3.27614 4.5 3C4.5 2.72386 4.72386 2.5 5 2.5C5.27614 2.5 5.5 2.72386 5.5 3ZM5.5 7.5C5.5 7.77614 5.27614 8 5 8C4.72386 8 4.5 7.77614 4.5 7.5C4.5 7.22386 4.72386 7 5 7C5.27614 7 5.5 7.22386 5.5 7.5ZM5 12.5C5.27614 12.5 5.5 12.2761 5.5 12C5.5 11.7239 5.27614 11.5 5 11.5C4.72386 11.5 4.5 11.7239 4.5 12C4.5 12.2761 4.72386 12.5 5 12.5ZM10.5 3C10.5 3.27614 10.2761 3.5 10 3.5C9.72386 3.5 9.5 3.27614 9.5 3C9.5 2.72386 9.72386 2.5 10 2.5C10.2761 2.5 10.5 2.72386 10.5 3ZM10.5 7.5C10.5 7.77614 10.2761 8 10 8C9.72386 8 9.5 7.77614 9.5 7.5C9.5 7.22386 9.72386 7 10 7C10.2761 7 10.5 7.22386 10.5 7.5ZM10 12.5C10.2761 12.5 10.5 12.2761 10.5 12C10.5 11.7239 10.2761 11.5 10 11.5C9.72386 11.5 9.5 11.7239 9.5 12C9.5 12.2761 9.72386 12.5 10 12.5Z"
                      fill="currentColor"
                      fillRule="evenodd"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">拖动排序</TooltipContent>
            </Tooltip>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="w-7 h-5 bg-muted/50 border rounded text-center text-[10px] font-medium text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        </TableCell>
        <TableCell className="py-2 px-2">
          <span className="font-medium text-sm text-foreground truncate block max-w-[80px] sm:max-w-none">
            {student.name}
          </span>
        </TableCell>
        <TableCell className="py-2 px-2">
          <div className="flex gap-1.5 justify-end">
            <Button
              className={cn(
                "h-7 px-2.5 text-[10px] font-bold rounded-lg transition-all duration-200",
                student.attendanceStatus === 1
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-200 dark:shadow-none"
                  : "text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50"
              )}
              variant={student.attendanceStatus === 1 ? "default" : "outline"}
              size="sm"
              onClick={() => onUpdateStatus(student.id, 1)}
            >
              已到
            </Button>

            <Button
              className={cn(
                "h-7 px-2.5 text-[10px] font-bold rounded-lg transition-all duration-200",
                student.attendanceStatus === 2
                  ? "bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-200 dark:shadow-none"
                  : "text-muted-foreground hover:text-amber-600 hover:bg-amber-50"
              )}
              variant={student.attendanceStatus === 2 ? "default" : "outline"}
              size="sm"
              onClick={() => onUpdateStatus(student.id, 2)}
            >
              请假
            </Button>

            <Button
              className={cn(
                "h-7 px-2.5 text-[10px] font-bold rounded-lg transition-all duration-200",
                student.attendanceStatus === 3
                  ? "bg-sky-500 hover:bg-sky-600 text-white shadow-sm shadow-sky-200 dark:shadow-none"
                  : "text-muted-foreground hover:text-sky-600 hover:bg-sky-50"
              )}
              variant={student.attendanceStatus === 3 ? "default" : "outline"}
              size="sm"
              onClick={() => onUpdateStatus(student.id, 3)}
            >
              晚到
            </Button>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="h-7 w-7 p-0 flex items-center justify-center"
                  variant="ghost"
                  size="sm"
                  onClick={() => onUpdateStatus(student.id, 0)}
                >
                  <RefreshCw className="h-3 w-3 text-muted-foreground/50" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>重置状态</TooltipContent>
            </Tooltip>
          </div>
        </TableCell>
      </TableRow>
    );
  }
);

SortableStudentRow.displayName = "SortableStudentRow";

export default SortableStudentRow;
