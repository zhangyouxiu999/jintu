export default function Home() {
  // 谢艾敉
  // 李春霏
  // 刘亦泽
  // 赵甜歌
  // 李依柔
  // 刘佳摇
  // 谢梓轶
  // 邢宇彤
  // 谢云译
  // 王秋寒
  // 邢董澈
  // 刘宜函
  // 曹紫寒
  // 朱佑聪
  // 牛思墁
  // 鲍冠杰
  // 张家帆
  // 王奥成
  // 郝晨浩
  // 陈星宇
  // 王一鸣
  // 邢依诺
  // 冯楚尧
  // 李子涵
  // 曹紫梦
  // 侯禹辰
  // 赵梓温
  // 李依梦
  // 张子丰
  // 王一丁
  // 景晗彧
  const students = [
    {
      id: "001",
      name: "谢艾敉",
    },
    {
      id: "002",
      name: "李春霏",
    },
  ];

  return (
    <div>
      <h1>点名</h1>
      <ul>
        {students.map((student) => (
          <>
            <li key={student.id}>{student.name}</li>
            <button onClick={() => alert("已到")}>已到</button>
            <button>请假</button>
          </>
        ))}
      </ul>
    </div>
  );
}
