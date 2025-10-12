import * as React from "react"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const invoices = [
  {
    id: "001",
    name: "张三",
    class: "1班",
    gender: "男",
    score: 100,
    lastScore: 90,
    scoreGrowth: 10,
    currentRank: 1,
    lastRank: 2,
    rankGrowth: 1,
    remark: "备注信息",
  },
  {
    id: "002",
    name: "李四",
    class: "2班",
    gender: "女",
    score: 90,
    lastScore: 80,
    scoreGrowth: 10,
    currentRank: 2,
    lastRank: 3,
    rankGrowth: 1,
    remark: "备注信息",
  },
  {
    id: "003",
    name: "王五",
    class: "3班",
    gender: "男",
    score: 80,
    lastScore: 70,
    scoreGrowth: 10,
    currentRank: 3,
    lastRank: 4,
    rankGrowth: 1,
    remark: "备注信息",
  },
  {
    id: "004",
    name: "赵六",
    class: "4班",
    gender: "女",
    score: 70,
    lastScore: 60,
    scoreGrowth: 10,
    currentRank: 4,
    lastRank: 5,
    rankGrowth: 1,
    remark: "备注信息",
  },
  {
    id: "005",
    name: "孙七",
    class: "5班",
    gender: "男",
    score: 60,
    lastScore: 50,
    scoreGrowth: 10,
    currentRank: 5,
    lastRank: 6,
    rankGrowth: 1,
    remark: "备注信息",
  },
  {
    id: "006",
    name: "周八",
    class: "6班",
    gender: "女",
    score: 50,
    lastScore: 40,
    scoreGrowth: 10,
    currentRank: 6,
    lastRank: 7,
    rankGrowth: 1,
    remark: "备注信息",
  },
  {
    id: "007",
    name: "吴九",
    class: "7班",
    gender: "男",
    score: 40,
    lastScore: 30,
    scoreGrowth: 10,
    currentRank: 7,
    lastRank: 8,
    rankGrowth: 1,
    remark: "备注信息",
  },
];

export function TableDemo() {
  return (
    <div>
      <Table>
        <TableCaption>{new Date().toLocaleDateString()}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center w-[100px]">学号</TableHead>
            <TableHead className="text-center">学生姓名</TableHead>
            <TableHead className="text-center">班级</TableHead>
            <TableHead className="text-center">性别</TableHead>
            <TableHead className="text-center w-[100px]">考试分数</TableHead>
            <TableHead className="text-center">上次考试分数</TableHead>
            <TableHead className="text-center">增长分数</TableHead>
            <TableHead className="text-center">本次名次</TableHead>
            <TableHead className="text-center">上次名次</TableHead>
            <TableHead className="text-center">增长名次</TableHead>
            <TableHead className="text-center">备注信息</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="text-center font-medium">
                {invoice.id}
              </TableCell>
              <TableCell className="text-center">{invoice.name}</TableCell>
              <TableCell className="text-center">{invoice.class}</TableCell>
              <TableCell className="text-center">
                {invoice.gender}
                </TableCell>
              <TableCell className="text-center">
                {invoice.score}
              </TableCell>
              <TableCell className="text-center">{invoice.lastScore}</TableCell>
              <TableCell className="text-center">
                {invoice.scoreGrowth}
              </TableCell>
              <TableCell className="text-center">
                {invoice.currentRank}
              </TableCell>
              <TableCell className="text-center">{invoice.lastRank}</TableCell>
              <TableCell className="text-center">
                {invoice.rankGrowth}
              </TableCell>
              <TableCell className="text-center">{invoice.remark}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function SelectDemo({ title }) {
  return (
    <Select>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={ title } />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>{ title }</SelectLabel>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="blueberry">Blueberry</SelectItem>
          <SelectItem value="grapes">Grapes</SelectItem>
          <SelectItem value="pineapple">Pineapple</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}


export default function page() {
  return (
    <div>
      <div className="flex gap-2">
        <SelectDemo title={'选择班级'} />
        <SelectDemo title={'选择科目'} />
        <SelectDemo title={'选择时间'} />
      </div>
      <div>
        <h1>单招一班学生单科成绩分析表-英语</h1>
        <span>5月第1周</span>
      </div>
      <TableDemo />
    </div>
  )

}