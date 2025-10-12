"use client";

import { useState } from "react";

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

export default function Home() {
  const [students, setStudents] = useState([
    {
      id: "001",
      name: "谢艾敉",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
    },
    {
      id: "002",
      name: "李春霏",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
    },
    {
      id: "003",
      name: "刘亦泽",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
    },
    {
      id: "004",
      name: "赵甜歌",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
    },
    {
      id: "005",
      name: "李依柔",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
    },
    {
      id: "006",
      name: "刘佳摇",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
    },
    {
      id: "007",
      name: "谢梓轶",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
    },
    {
      id: "008",
      name: "邢宇彤",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
    },
    {
      id: "009",
      name: "谢云译",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
    },
    {
      id: "010",
      name: "王秋寒",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
    },
    {
      id: "011",
      name: "邢董澈",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
    },
    {
      id: "012",
      name: "刘宜函",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
    },
    {
      id: "013",
      name: "曹紫寒",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
    },
    {
      id: "014",
      name: "朱佑聪",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
    },
    {
      id: "015",
      name: "牛思墁",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
    },
    {
      id: "016",
      name: "鲍冠杰",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
    },
    {
      id: "017",
      name: "张家帆",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
    },
    {
      id: "018",
      name: "王奥成",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
    },
    {
      id: "019",
      name: "郝晨浩",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
    },
    {
      id: "020",
      name: "陈星宇",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
    },
    {
      id: "021",
      name: "王一鸣",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
    },
    {
      id: "022",
      name: "邢依诺",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
    },
    {
      id: "023",
      name: "冯楚尧",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
    },
    {
      id: "024",
      name: "李子涵",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
    },
    {
      id: "025",
      name: "曹紫梦",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
    },
    {
      id: "026",
      name: "侯禹辰",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
    },
    {
      id: "027",
      name: "赵梓温",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
    },
    {
      id: "028",
      name: "李依梦",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
    },
    {
      id: "029",
      name: "张子丰",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
    },
    {
      id: "030",
      name: "王一丁",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
    },
    {
      id: "031",
      name: "景晗彧",
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
    },
  ]);

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

  const classTitle = "佰盈二班";
  const presentNames = students.filter((s) => s.isPresent).map((s) => s.name);
  const onLeaveNames = students.filter((s) => s.isOnLeave).map((s) => s.name);
  const lateArrivalNames = students
    .filter((s) => s.isLateArrival)
    .map((s) => s.name);
  const notArrivedNames = students
    .filter((s) => !s.isOnLeave && !s.isPresent)
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
      已到: ${presentNames.join(", ")}
      教学老师到岗情况：${classTitle}老师已到岗
    `;

  return (
    <div className=" m-auto w-fit">
      <h1 className="mx-auto">考勤</h1>
      <AlertDialog>
        <AlertDialogTrigger>点名</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>考勤</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <pre className=" whitespace-pre-wrap text-left">
                  {textTemplate}
                </pre>
                <Button
                  className="ml-auto"
                  onClick={() => navigator.clipboard.writeText(textTemplate)}
                >
                  复制文本
                </Button>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction>确认</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ul>
        {students.map((student) => {
          const isPresent = student.isPresent; // 假设所有学生都未到
          const isOnLeave = student.isOnLeave; // 假设所有学生都未请假
          const isLateArrival = student.isLateArrival; // 假设所有学生都未晚到

          const onClickIsPresent = () => {
            const newStudents = students.map((s) => {
              if (s.id === student.id) {
                return {
                  ...s,
                  isPresent: true,
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
                };
              }
              return s;
            });
            setStudents(newStudents);
          };

          return (
            <li key={student.id} className=" flex gap-4">
              <p>{student.name}</p>
              <div className=" flex gap-4">
                {!isPresent && <button onClick={onClickIsPresent}>已到</button>}
                {!isOnLeave && <button onClick={onClickIsOnLeave}>请假</button>}
                {!isLateArrival && (
                  <button onClick={onClickIsLateArrival}>晚到</button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
