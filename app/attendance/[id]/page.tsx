"use client";

import copy from "copy-to-clipboard";
import { useEffect, useRef, useState } from "react";

import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
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
import { useParams, useRouter } from "next/navigation";

const classesNames = [
  "class-one",
  "class-two",
  "class-three",
  "class-four",
  "class-five",
  "class-six",
];

const classInformations = {
  "class-one": {
    id: "1",
    name: "佰盈一班",
    students: [
      {
        id: "001",
        name: "崔哲元",
        attendanceStatus: 0, // 0: 未到, 1: 已到, 2: 请假, 3: 晚到
      },
      {
        id: "002",
        name: "谢星淇",
        attendanceStatus: 0,
      },
      {
        id: "003",
        name: "赵子萌",
        attendanceStatus: 0,
      },
      {
        id: "004",
        name: "靳雨锡",
        attendanceStatus: 0,
      },
      {
        id: "005",
        name: "张珈伟",
        attendanceStatus: 0,
      },
      {
        id: "006",
        name: "王煜",
        attendanceStatus: 0,
      },
      {
        id: "007",
        name: "王子腾",
        attendanceStatus: 0,
      },
      {
        id: "008",
        name: "王子涵",
        attendanceStatus: 0,
      },
      {
        id: "009",
        name: "杨紫伊",
        attendanceStatus: 0,
      },
      {
        id: "010",
        name: "宗清璇",
        attendanceStatus: 0,
      },
      {
        id: "011",
        name: "崔家玮",
        attendanceStatus: 0,
      },
      {
        id: "012",
        name: "赵少康",
        attendanceStatus: 0,
      },
      {
        id: "013",
        name: "熊炯赫",
        attendanceStatus: 0,
      },
      {
        id: "014",
        name: "黄怡洁",
        attendanceStatus: 0,
      },
      {
        id: "015",
        name: "赵则淳",
        attendanceStatus: 0,
      },
      {
        id: "016",
        name: "乔宇",
        attendanceStatus: 0,
      },
      {
        id: "017",
        name: "刘宸宇",
        attendanceStatus: 0,
      },
      {
        id: "018",
        name: "刘家琦",
        attendanceStatus: 0,
      },
      {
        id: "019",
        name: "张一嘉",
        attendanceStatus: 0,
      },
      {
        id: "020",
        name: "顾奥胜",
        attendanceStatus: 0,
      },
    ],
  },
  "class-two": {
    id: "2",
    name: "佰盈二班",
    students: [
      {
        id: "001",
        name: "谢梓轶",
        attendanceStatus: 0, // 0: 未到, 1: 已到, 2: 请假, 3: 晚到
      },
      {
        id: "002",
        name: "李依柔",
        attendanceStatus: 0,
      },
      {
        id: "003",
        name: "刘佳摇",
        attendanceStatus: 0,
      },
      {
        id: "004",
        name: "谢艾敉",
        attendanceStatus: 0,
      },
      {
        id: "005",
        name: "李春霏",
        attendanceStatus: 0,
      },
      {
        id: "006",
        name: "曹紫梦",
        attendanceStatus: 0,
      },
      {
        id: "007",
        name: "李子涵",
        attendanceStatus: 0,
      },
      {
        id: "008",
        name: "赵梓温",
        attendanceStatus: 0,
      },
      {
        id: "009",
        name: "景晗彧",
        attendanceStatus: 0,
      },
      {
        id: "010",
        name: "赵甜歌",
        attendanceStatus: 0,
      },
      {
        id: "011",
        name: "王一丁",
        attendanceStatus: 0,
      },
      {
        id: "012",
        name: "张子丰",
        attendanceStatus: 0,
      },
      {
        id: "013",
        name: "郝晨浩",
        attendanceStatus: 0,
      },
      {
        id: "014",
        name: "谢云译",
        attendanceStatus: 0,
      },
      {
        id: "015",
        name: "邢宇彤",
        attendanceStatus: 0,
      },
      {
        id: "016",
        name: "王秋寒",
        attendanceStatus: 0,
      },
      {
        id: "017",
        name: "李依梦",
        attendanceStatus: 0,
      },
      {
        id: "018",
        name: "侯禹辰",
        attendanceStatus: 0,
      },
      {
        id: "019",
        name: "邢依诺",
        attendanceStatus: 0,
      },
      {
        id: "020",
        name: "邢董澈",
        attendanceStatus: 0,
      },
      {
        id: "021",
        name: "曹紫寒",
        attendanceStatus: 0,
      },
      {
        id: "022",
        name: "朱佑聪",
        attendanceStatus: 0,
      },
      {
        id: "023",
        name: "王奥成",
        attendanceStatus: 0,
      },
      {
        id: "024",
        name: "张家帆",
        attendanceStatus: 0,
      },
      {
        id: "025",
        name: "鲍冠杰",
        attendanceStatus: 0,
      },
      {
        id: "026",
        name: "牛偲墁",
        attendanceStatus: 0,
      },
      {
        id: "027",
        name: "刘亦泽",
        attendanceStatus: 0,
      },
      {
        id: "028",
        name: "刘宜函",
        attendanceStatus: 0,
      },
      {
        id: "029",
        name: "王一鸣",
        attendanceStatus: 0,
      },
      {
        id: "030",
        name: "陈星宇",
        attendanceStatus: 0,
      },
      {
        id: "031",
        name: "冯楚尧",
        attendanceStatus: 0,
      },
      {
        id: "032",
        name: "李雨梦",
        attendanceStatus: 0,
      },
    ],
  },
  "class-three": {
    id: "3",
    name: "佰盈三班",
    students: [
      {
        id: "001",
        name: "王子腾",
        attendanceStatus: 0, // 0: 未到, 1: 已到, 2: 请假, 3: 晚到
      },
      {
        id: "002",
        name: "杨紫伊",
        attendanceStatus: 0,
      },
      {
        id: "003",
        name: "宗清璇",
        attendanceStatus: 0,
      },
      {
        id: "004",
        name: "刘佳摇",
        attendanceStatus: 0,
      },
      {
        id: "005",
        name: "邢董澈",
        attendanceStatus: 0,
      },
      {
        id: "006",
        name: "邢依诺",
        attendanceStatus: 0,
      },
      {
        id: "007",
        name: "曹紫梦",
        attendanceStatus: 0,
      },
      {
        id: "008",
        name: "孟倞月",
        attendanceStatus: 0,
      },
      {
        id: "009",
        name: "刘依初",
        attendanceStatus: 0,
      },
      {
        id: "010",
        name: "赵倚钒",
        attendanceStatus: 0,
      },
      {
        id: "011",
        name: "王立园",
        attendanceStatus: 0,
      },
      {
        id: "012",
        name: "何晨令",
        attendanceStatus: 0,
      },
      {
        id: "013",
        name: "王梦瑶",
        attendanceStatus: 0,
      },
      {
        id: "014",
        name: "谢怡迈",
        attendanceStatus: 0,
      },
      {
        id: "015",
        name: "杨慧敏",
        attendanceStatus: 0,
      },
      {
        id: "016",
        name: "杨乐旋",
        attendanceStatus: 0,
      },
      {
        id: "017",
        name: "蔡照人",
        attendanceStatus: 0,
      },
      {
        id: "018",
        name: "贾亦萌",
        attendanceStatus: 0,
      },
      {
        id: "019",
        name: "梁紫楚",
        attendanceStatus: 0,
      },
      {
        id: "020",
        name: "马梓皓",
        attendanceStatus: 0,
      },
      {
        id: "021",
        name: "王筱蕊",
        attendanceStatus: 0,
      },
      {
        id: "022",
        name: "王紫琛",
        attendanceStatus: 0,
      },
      {
        id: "023",
        name: "袁若菡",
        attendanceStatus: 0,
      },
      {
        id: "024",
        name: "张函祎",
        attendanceStatus: 0,
      },
      {
        id: "025",
        name: "赵刘名格",
        attendanceStatus: 0,
      },
      {
        id: "026",
        name: "王一然",
        attendanceStatus: 0,
      },
      {
        id: "027",
        name: "娄煜晗",
        attendanceStatus: 0,
      },
      {
        id: "028",
        name: "彭俊奥",
        attendanceStatus: 0,
      },
      {
        id: "029",
        name: "张腾姿",
        attendanceStatus: 0,
      },
      {
        id: "030",
        name: "王伟嘉",
        attendanceStatus: 0,
      },
    ],
  },
  "class-four": {
    id: "4",
    name: "佰盈四班",
    students: [
      {
        id: "001",
        name: "张珈玮",
        attendanceStatus: 0, // 0: 未到, 1: 已到, 2: 请假, 3: 晚到
      },
      {
        id: "002",
        name: "王煜",
        attendanceStatus: 0,
      },
      {
        id: "003",
        name: "王子涵",
        attendanceStatus: 0,
      },
      {
        id: "004",
        name: "刘家琦",
        attendanceStatus: 0,
      },
      {
        id: "005",
        name: "张一嘉",
        attendanceStatus: 0,
      },
      {
        id: "006",
        name: "李依柔",
        attendanceStatus: 0,
      },
      {
        id: "007",
        name: "王秋寒",
        attendanceStatus: 0,
      },
      {
        id: "008",
        name: "曹紫寒",
        attendanceStatus: 0,
      },
      {
        id: "009",
        name: "牛偲墁",
        attendanceStatus: 0,
      },
      {
        id: "010",
        name: "王一鸣",
        attendanceStatus: 0,
      },
      {
        id: "011",
        name: "李子涵",
        attendanceStatus: 0,
      },
      {
        id: "012",
        name: "李依梦",
        attendanceStatus: 0,
      },
      {
        id: "013",
        name: "王梓成",
        attendanceStatus: 0,
      },
      {
        id: "014",
        name: "耿子柔",
        attendanceStatus: 0,
      },
      {
        id: "015",
        name: "弓守荣",
        attendanceStatus: 0,
      },
      {
        id: "016",
        name: "张函婕",
        attendanceStatus: 0,
      },
      {
        id: "017",
        name: "赵艺萌",
        attendanceStatus: 0,
      },
      {
        id: "018",
        name: "田悦彤",
        attendanceStatus: 0,
      },
      {
        id: "019",
        name: "张梦依",
        attendanceStatus: 0,
      },
      {
        id: "020",
        name: "李梓淇",
        attendanceStatus: 0,
      },
      {
        id: "021",
        name: "赵奕萌",
        attendanceStatus: 0,
      },
      {
        id: "022",
        name: "张嘉予",
        attendanceStatus: 0,
      },
      {
        id: "023",
        name: "温浩彤",
        attendanceStatus: 0,
      },
      {
        id: "024",
        name: "赵宇杭",
        attendanceStatus: 0,
      },
    ],
  },
  "class-five": {
    id: "5",
    name: "佰盈五班",
    students: [
      {
        id: "001",
        name: "潘诗文",
        attendanceStatus: 0, // 0: 未到, 1: 已到, 2: 请假, 3: 晚到
      },
      {
        id: "002",
        name: "邢宇彤",
        attendanceStatus: 0,
      },
      {
        id: "003",
        name: "彭冠谋",
        attendanceStatus: 0,
      },
      {
        id: "004",
        name: "乔宇",
        attendanceStatus: 0,
      },
      {
        id: "005",
        name: "谢艾敉",
        attendanceStatus: 0,
      },
      {
        id: "006",
        name: "张响珣",
        attendanceStatus: 0,
      },
      {
        id: "007",
        name: "刘金熙",
        attendanceStatus: 0,
      },
      {
        id: "008",
        name: "杨雨杉",
        attendanceStatus: 0,
      },
      {
        id: "009",
        name: "李梦熙",
        attendanceStatus: 0,
      },
      {
        id: "010",
        name: "温诗瑶",
        attendanceStatus: 0,
      },
      {
        id: "011",
        name: "张嘉艺",
        attendanceStatus: 2,
      },
      {
        id: "012",
        name: "李香姗",
        attendanceStatus: 0,
      },
      {
        id: "013",
        name: "李悠然",
        attendanceStatus: 0,
      },
      {
        id: "014",
        name: "郭佳楠",
        attendanceStatus: 0,
      },
      {
        id: "015",
        name: "黄怡洁",
        attendanceStatus: 0,
      },
      {
        id: "016",
        name: "朱佑聪",
        attendanceStatus: 0,
      },
      {
        id: "017",
        name: "郝思雅",
        attendanceStatus: 0,
      },
      {
        id: "018",
        name: "谢云译",
        attendanceStatus: 0,
      },
      {
        id: "019",
        name: "王若萱",
        attendanceStatus: 0,
      },
      {
        id: "020",
        name: "王弟贤",
        attendanceStatus: 2,
      },
      {
        id: "021",
        name: "赵梓温",
        attendanceStatus: 0,
      },
      {
        id: "022",
        name: "李雨梦",
        attendanceStatus: 0,
      },
      {
        id: "023",
        name: "李若冰",
        attendanceStatus: 0,
      },
      {
        id: "024",
        name: "李默涵",
        attendanceStatus: 0,
      },
      {
        id: "025",
        name: "王佳萱",
        attendanceStatus: 0,
      },
      {
        id: "026",
        name: "蔡奇辰",
        attendanceStatus: 0,
      },
      {
        id: "027",
        name: "魏守阳",
        attendanceStatus: 0,
      },
      {
        id: "028",
        name: "赵梓淳",
        attendanceStatus: 0,
      },
      {
        id: "029",
        name: "王滢喆",
        attendanceStatus: 0,
      },
      {
        id: "030",
        name: "赵建聪",
        attendanceStatus: 0,
      },
      {
        id: "031",
        name: "王佳特",
        attendanceStatus: 0,
      },
      {
        id: "032",
        name: "韩炅洁",
        attendanceStatus: 0,
      },
      {
        id: "033",
        name: "刘佳怡",
        attendanceStatus: 0,
      },
      {
        id: "034",
        name: "石奥生",
        attendanceStatus: 0,
      },
      {
        id: "035",
        name: "赵甜歌",
        attendanceStatus: 0,
      },
      {
        id: "036",
        name: "景晗彧",
        attendanceStatus: 0,
      },
      {
        id: "037",
        name: "靳雨锡",
        attendanceStatus: 0,
      },
      {
        id: "038",
        name: "邢家豪",
        attendanceStatus: 0,
      },
      {
        id: "039",
        name: "周子豪",
        attendanceStatus: 0,
      },
      {
        id: "040",
        name: "马旺泽",
        attendanceStatus: 0,
      },
      {
        id: "041",
        name: "顾奥胜",
        attendanceStatus: 0,
      },
      {
        id: "042",
        name: "刘宸宇",
        attendanceStatus: 0,
      },
      {
        id: "043",
        name: "魏天娇",
        attendanceStatus: 0,
      },
    ],
  },
  "class-six": {
    id: "6",
    name: "佰盈六班",
    students: [
      {
        id: "001",
        name: "王佳萱",
        attendanceStatus: 0, // 0: 未到, 1: 已到, 2: 请假, 3: 晚到
      },
      {
        id: "002",
        name: "温诗瑶",
        attendanceStatus: 0,
      },
      {
        id: "003",
        name: "李悠然",
        attendanceStatus: 0,
      },
      {
        id: "004",
        name: "赵函飒",
        attendanceStatus: 0,
      },
      {
        id: "005",
        name: "李梓淇",
        attendanceStatus: 0,
      },
      {
        id: "006",
        name: "赵奕萌",
        attendanceStatus: 0,
      },
      {
        id: "007",
        name: "王一然",
        attendanceStatus: 0,
      },
      {
        id: "008",
        name: "李承信",
        attendanceStatus: 0,
      },
      {
        id: "009",
        name: "韩炅洁",
        attendanceStatus: 0,
      },
      {
        id: "010",
        name: "娄煜晗",
        attendanceStatus: 0,
      },
      {
        id: "011",
        name: "李香姗",
        attendanceStatus: 0,
      },
      {
        id: "012",
        name: "刘凯旋",
        attendanceStatus: 0,
      },
      {
        id: "013",
        name: "彭俊奥",
        attendanceStatus: 0,
      },
      {
        id: "014",
        name: "郝思雅",
        attendanceStatus: 0,
      },
      {
        id: "015",
        name: "梁倚绰",
        attendanceStatus: 0,
      },
      {
        id: "016",
        name: "刘子毅",
        attendanceStatus: 0,
      },
      {
        id: "017",
        name: "姚佳佑",
        attendanceStatus: 0,
      },
      {
        id: "018",
        name: "李梦熙",
        attendanceStatus: 0,
      },
      {
        id: "019",
        name: "魏奥雨",
        attendanceStatus: 0,
      },
      {
        id: "020",
        name: "张嘉艺",
        attendanceStatus: 0,
      },
      {
        id: "021",
        name: "李若冰",
        attendanceStatus: 0,
      },
      {
        id: "022",
        name: "李鹏飞",
        attendanceStatus: 0,
      },
      {
        id: "023",
        name: "李默涵",
        attendanceStatus: 0,
      },
      {
        id: "024",
        name: "张嘉予",
        attendanceStatus: 0,
      },
      {
        id: "025",
        name: "康艺苑",
        attendanceStatus: 0,
      },
      {
        id: "026",
        name: "陈劲衡",
        attendanceStatus: 0,
      },
      {
        id: "027",
        name: "张腾姿",
        attendanceStatus: 0,
      },
    ],
  },
};

// async function copyToClipboard(text) {
//   // 方案1: 优先尝试现代 Clipboard API
//   if (navigator.clipboard && window.isSecureContext) {
//     try {
//       await navigator.clipboard.writeText(text);
//       console.log("复制成功！");
//       return true;
//     } catch (err) {
//       console.error("使用Clipboard API复制失败: ", err);
//       // 现代API失败，不立即返回，继续尝试备用方案
//     }
//   }

//   // 方案2: 备用方案 - 使用 textarea 和 execCommand
//   try {
//     // 创建一个临时的 textarea 元素
//     const textArea = document.createElement("textarea");
//     textArea.value = text;
//     // 将元素移到视口外使其不可见
//     textArea.style.position = "fixed";
//     textArea.style.top = "-10000px";
//     textArea.style.left = "-10000px";
//     document.body.appendChild(textArea);

//     // 选择并复制文本
//     textArea.focus();
//     textArea.select(); // 对于移动设备，可以尝试 textArea.setSelectionRange(0, 99999)

//     const successful = document.execCommand("copy");
//     document.body.removeChild(textArea);

//     if (successful) {
//       console.log("复制成功！(使用备用方案)");
//       return true;
//     } else {
//       throw new Error("execCommand 复制失败");
//     }
//   } catch (err) {
//     console.error("所有复制方法均失败: ", err);
//     // 最后的手段：提示用户手动复制
//     alert(`复制失败，请手动复制以下内容: ${text}`);
//     return false;
//   }
// }

const Attendance = ({ id }) => {
  const router = useRouter();
  const classInformation = classInformations[id];
  const classTitle = classInformation.name;

  const [students, setStudents] = useState(classInformation.students);

  useEffect(() => {
    const storedStudents = localStorage.getItem(
      `students/${classInformation.id}`
    );
    if (storedStudents) {
      setStudents(JSON.parse(storedStudents));
    }
  }, []);

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      // 初次渲染，不执行任何操作
      isFirstRender.current = false;
      return;
    }

    localStorage.setItem(
      `students/${classInformation.id}`,
      JSON.stringify(students)
    );
  }, [classInformation.id, students]);

  function onClear() {
    const clearedStudents = students.map((s) => ({
      ...s,
      isPresent: false,
      isOnLeave: false,
      isLateArrival: false,
      attendanceStatus: 0,
    }));
    setStudents(clearedStudents);
    localStorage.removeItem(`students/${classInformation.id}`);
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

  const date = new Date();
  const hour = date.getHours();
  //   const textTemplate =
  //     hour < 20
  //       ? `${data}
  // ${classTitle}
  // 应到: ${students.length}人
  // 实到: ${presentNames.length}人
  // 请假: ${onLeaveNames.join(" ")}
  // 晚到：${lateArrivalNames.join(" ")}
  // 未到：${notArrivedNames.join(" ")}
  // 教学老师到岗情况：${classTitle}老师已到岗
  // `
  //       : `${data}
  // ${classTitle}
  // 已到: ${presentNames.join(", ")} ${presentNames.length}人
  // 教学老师到岗情况：${classTitle}老师已到岗
  // `;

  const textTemplate = `
${data}
${classTitle}
应到: ${students.length}人
实到: ${presentNames.length}人 
请假: ${onLeaveNames.join(" ")}
晚到：${lateArrivalNames.join(" ")}
未到：${notArrivedNames.join(" ")}
教学老师到岗情况：${classTitle}老师已到岗
`;

  // const handleCopy = async () => {
  //   // 如果使用 useRef 获取输入框内容：
  //   // const text = inputRef.current.value;
  //   const success = await copyToClipboard(textTemplate);
  //   toast("复制成功");
  //   if (success) {
  //     // 复制成功，可以给用户一些反馈，例如改变按钮文字或显示一个提示
  //     console.log("复制成功反馈给用户");
  //     // 例如：setCopied(true); setTimeout(() => setCopied(false), 2000);
  //   }
  // };

  async function copyToClipboard(textToCopy) {
    // 方案1: 尝试使用现代的 Clipboard API (安全上下文下)
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        console.log("复制成功！(使用 Clipboard API)");
        return true;
      } catch (err) {
        console.error("Clipboard API 复制失败: ", err);
        // 即使有 API 也可能失败，继续尝试备用方案
      }
    }

    // 方案2: 备用方案 - 使用 textarea 和 execCommand (兼容旧浏览器)
    try {
      // 创建一个临时的 textarea 元素来保存文本
      const textArea = document.createElement("textarea");
      textArea.value = textToCopy;
      // 将元素移到视口外使其不可见
      textArea.style.position = "fixed";
      textArea.style.top = "-10000px";
      textArea.style.left = "-10000px";
      document.body.appendChild(textArea);

      // 选择并复制文本
      textArea.focus();
      textArea.select();
      // 针对移动设备的一些额外尝试
      textArea.setSelectionRange(0, 99999);

      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);

      if (successful) {
        console.log("复制成功！(使用 execCommand)");
        return true;
      } else {
        throw new Error("execCommand 复制失败");
      }
    } catch (err) {
      console.error("所有复制方法均失败: ", err);
      // 最后的手段：提示用户手动复制
      alert(`复制失败，请手动选中以下文本进行复制：${textToCopy}`);
      return false;
    }
  }

  return (
    <div className=" m-auto w-fit">
      <Button className=" cursor-pointer" onClick={() => router.push("/")}>
        返回
      </Button>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">姓名</TableHead>
            <TableHead className=" text-center">状态</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => {
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

            const onClickReset = () => {
              const newStudents = students.map((s) => {
                if (s.id === student.id) {
                  return {
                    ...s,
                    isLateArrival: true,
                    attendanceStatus: 0,
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

                    <Button
                      className=" cursor-pointer"
                      variant="outline"
                      size="sm"
                      onClick={onClickReset}
                    >
                      重置
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
            <Button className=" cursor-pointer ml-[200px]">生成考勤</Button>
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
                        copy(textTemplate);
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
};

export default function Page() {
  const { id } = useParams();
  const isHaveClass = classesNames.includes(`class-${id}`);
  if (!isHaveClass) {
    return <div className=" p-4">无此班级</div>;
  }

  return <Attendance id={`class-${id}`} />;
}
