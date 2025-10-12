"use client";

import { useEffect, useState } from "react";

import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Toaster } from "@/components/ui/sonner";

export default function Home() {
  const [students, setStudents] = useState([
    {
      id: "001",
      name: "温诗瑶",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
      attendanceStatus: 0, // 0: 未到, 1: 已到, 2: 请假, 3: 晚到
    },
    {
      id: "002",
      name: "李悠然",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
      attendanceStatus: 0,
    },
    {
      id: "003",
      name: "赵函飒",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
      attendanceStatus: 0,
    },
    {
      id: "004",
      name: "李梓淇",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
      attendanceStatus: 0,
    },
    {
      id: "005",
      name: "赵奕萌",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
      attendanceStatus: 0,
    },
    {
      id: "006",
      name: "王一然",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
      attendanceStatus: 0,
    },
    {
      id: "007",
      name: "李承信",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
      attendanceStatus: 0,
    },
    {
      id: "008",
      name: "韩炅洁",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
      attendanceStatus: 0,
    },
    {
      id: "009",
      name: "娄煜晗",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
      attendanceStatus: 0,
    },
    {
      id: "010",
      name: "李香姗",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
      attendanceStatus: 0,
    },
    {
      id: "011",
      name: "刘凯旋",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
      attendanceStatus: 0,
    },
    {
      id: "012",
      name: "彭俊奥",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
      attendanceStatus: 0,
    },
    {
      id: "013",
      name: "郝思雅",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
      attendanceStatus: 0,
    },
    {
      id: "014",
      name: "梁倚绰",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
      attendanceStatus: 0,
    },
    {
      id: "015",
      name: "刘子毅",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
      attendanceStatus: 0,
    },
    {
      id: "016",
      name: "姚佳佑",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
      attendanceStatus: 0,
    },
    {
      id: "017",
      name: "李梦熙",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
      attendanceStatus: 0,
    },
    {
      id: "018",
      name: "魏奥雨",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
      attendanceStatus: 0,
    },
    {
      id: "019",
      name: "张嘉艺",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
      attendanceStatus: 0,
    },
    {
      id: "020",
      name: "李若冰",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
      attendanceStatus: 0,
    },
    {
      id: "021",
      name: "李鹏飞",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
      attendanceStatus: 0,
    },
    {
      id: "022",
      name: "李默涵",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
      attendanceStatus: 0,
    },
    {
      id: "023",
      name: "张嘉予",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
      attendanceStatus: 0,
    },
    {
      id: "024",
      name: "陈劲衡",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
      attendanceStatus: 0,
    },
  ]);

  useEffect(() => {
    const storedStudents = localStorage.getItem("students/6");
    if (storedStudents) {
      setStudents(JSON.parse(storedStudents));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("students/6", JSON.stringify(students));
  }, [students]);

  function onClear() {
    const clearedStudents = students.map((s) => ({
      ...s,
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
      attendanceStatus: 0,
    }));
    setStudents(clearedStudents);
    localStorage.removeItem("students/6");
  }

  function getGreeting() {
    const now = new Date();
    const date = new Date();
    const hour = now.getHours();

    const months = date.getMonth() + 1;
    const day = date.getDate();

    let greeting = `${months}月${day}日`;

    if (hour >= 7 && hour < 9) {
      greeting += " 上午";
    } else if (hour >= 13 && hour < 15) {
      greeting += " 下午";
    } else if (hour >= 17 && hour < 20) {
      greeting += " 晚一";
    } else if (hour >= 20 && hour < 21) {
      greeting += " 晚二";
    } else {
      greeting = "夜里好！";
    }

    return greeting;
  }

  // const onPush = () => {
  //   const classTitle = "佰盈二班";
  //   const presentNames = students.filter((s) => s.isPresent).map((s) => s.name);
  //   const onLeaveNames = students.filter((s) => s.isOnLeave).map((s) => s.name);
  //   const lateArrivalNames = students
  //     .filter((s) => s.isLateArrival)
  //     .map((s) => s.name);
  //   const notArrivedNames = students
  //     .filter((s) => !s.isOnLeave && !s.isPresent)
  //     .map((s) => s.name);
  //   const data = getGreeting();
  //   const textTemplate = `
  //     ${data}
  //     ${classTitle}
  //     应到: ${students.length}人
  //     实到: ${presentNames.length}人
  //     请假: ${onLeaveNames.join(", ")}
  //     晚到：${lateArrivalNames.join(", ")}
  //     未到：${notArrivedNames.join(", ")}
  //     已到: ${presentNames.join(", ")}
  //     教学老师到岗情况：二班老师已到岗
  //   `;

  //   alert(textTemplate);
  // };

  const classTitle = "佰盈六班";
  const presentNames = students
    .filter((s) => s.attendanceStatus === 1)
    .map((s) => s.name);
  const onLeaveNames = students
    .filter((s) => s.attendanceStatus === 2)
    .map((s) => s.name);
  const lateArrivalNames = students
    .filter((s) => s.attendanceStatus === 3)
    .map((s) => s.name);
  const notArrivedNames = students
    .filter((s) => s.attendanceStatus === 0)
    .map((s) => s.name);
  const data = getGreeting();
  const textTemplate = `
${data}
${classTitle}
应到: ${students.length}人
实到: ${presentNames.length}人 
请假: ${onLeaveNames.join(", ")}
晚到：${lateArrivalNames.join(", ")}
未到：${notArrivedNames.join(", ")}
教学老师到岗情况：${classTitle}老师已到岗
`;

  // 已到: ${presentNames.join(", ")}

  return (
    <div className=" m-auto w-fit">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">姓名</TableHead>
            <TableHead className=" text-center">状态</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => {
            // const isPresent = student.isPresent; // 假设所有学生都未到
            // const isOnLeave = student.isOnLeave; // 假设所有学生都未请假
            // const isLateArrival = student.isLateArrival; // 假设所有学生都未晚到

            const onClickIsPresent = () => {
              const newStudents = students.map((s) => {
                if (s.id === student.id) {
                  return {
                    ...s,
                    isPresent: true,
                    attendanceStatus: 1,
                  };
                }
                return s;
              });
              setStudents(newStudents);
            };

            const onClickIsOnLeave = () => {
              const newStudents = students.map((s) => {
                if (s.id === student.id) {
                  return {
                    ...s,
                    isOnLeave: true,
                    attendanceStatus: 2,
                  };
                }
                return s;
              });
              setStudents(newStudents);
            };

            const onClickIsLateArrival = () => {
              const newStudents = students.map((s) => {
                if (s.id === student.id) {
                  return {
                    ...s,
                    isLateArrival: true,
                    attendanceStatus: 3,
                  };
                }
                return s;
              });
              setStudents(newStudents);
            };
            return (
              <TableRow
                key={student.id}
                style={{
                  backgroundColor:
                    student.attendanceStatus === 1
                      ? "#d1fae5"
                      : student.attendanceStatus === 2
                      ? "#fef3c7"
                      : student.attendanceStatus === 3
                      ? "#fee2e2"
                      : "transparent",
                }}
              >
                <TableCell className="font-medium text-lg">
                  {student.name}
                </TableCell>
                <TableCell>
                  <div className=" flex gap-4">
                    <Button
                      className=" cursor-pointer"
                      variant="outline"
                      size="sm"
                      onClick={onClickIsPresent}
                    >
                      已到
                    </Button>

                    <Button
                      className=" cursor-pointer"
                      variant="outline"
                      size="sm"
                      onClick={onClickIsOnLeave}
                    >
                      请假
                    </Button>

                    <Button
                      className=" cursor-pointer"
                      variant="outline"
                      size="sm"
                      onClick={onClickIsLateArrival}
                    >
                      晚到
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <div className="flex justify-end mt-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className=" cursor-pointer">生成考勤</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>考勤</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div>
                  <pre className=" whitespace-pre-wrap text-left">
                    {textTemplate}
                  </pre>
                  <div className="flex justify-end">
                    <Button
                      className="ml-auto cursor-pointer mt-4"
                      size={"sm"}
                      onClick={() => {
                        navigator.clipboard.writeText(textTemplate);
                        toast("复制成功");
                      }}
                    >
                      复制文本
                    </Button>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction>确认</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button className="ml-4 cursor-pointer" onClick={onClear}>
          清除
        </Button>
      </div>
      <Toaster />
    </div>
  );
}
