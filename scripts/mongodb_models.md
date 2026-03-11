# MongoDB Models (School CMS)

数据库: `school_cms`

---

## Collection: classes
- `_id` (ObjectId) — 自动生成
- `code` (string) — 班级代码（唯一）
- `name` (string) — 班级名称
- `teacher` (string) — 班主任姓名
- `created_at` (date)
- `updated_at` (date)

示例:
```json
{
  "code": "1A",
  "name": "Class 1A",
  "teacher": "Li",
  "created_at": ISODate(),
  "updated_at": ISODate()
}
```

---

## Collection: categories
- `_id` (ObjectId)
- `name` (string)
- `description` (string)
- `created_at` (date)
- `updated_at` (date)

示例:
```json
{
  "name": "Category 1",
  "description": "Sports",
  "created_at": ISODate()
}
```

---

## Collection: students
- `_id` (ObjectId)
- `student_id` (string) — 学号 / 唯一标识
- `name` (string)
- `gender` (string) — 可选: "male"/"female"/"other"
- `current_class_id` (ObjectId) — 关联 classes._id
- `previous_class_id` (ObjectId) — 关联 classes._id，可 null
- `category_id` (ObjectId) — 关联 categories._id
- `origin_school` (string) — 来自学校
- `birthday` (date)
- `enroll_date` (date)
- `created_at` (date)
- `updated_at` (date)

示例:
```json
{
  "student_id": "2025001",
  "name": "Zhang San",
  "gender": "male",
  "current_class_id": ObjectId("..."),
  "previous_class_id": null,
  "category_id": ObjectId("..."),
  "origin_school": "Beijing Elementary",
  "birthday": ISODate("2015-03-15"),
  "enroll_date": ISODate("2025-09-01"),
  "created_at": ISODate()
}
```

---

## Collection: attendance
- `_id` (ObjectId)
- `student_id` (ObjectId) — 关联 students._id
- `class_id` (ObjectId) — 关联 classes._id
- `date` (date)
- `status` (string) — e.g. "present", "late", "absent", "leave"
- `remarks` (string) — 可选
- `created_at` (date)

示例:
```json
{
  "student_id": ObjectId("..."),
  "class_id": ObjectId("..."),
  "date": ISODate("2025-12-03"),
  "status": "present",
  "remarks": ""
}
```

---

## 说明与建议
- 字段统一使用 **snake_case**（如 `student_id`, `current_class_id`）以便与后端代码风格一致。
- 尽量使用 ObjectId 做关联（外键），便于使用 `$lookup` 进行聚合查询。
- `created_at` / `updated_at` 可由应用层或数据库触发器/中间件自动填充。
- 若后续需要扩展（例如老师表 `teachers`、课程表 `courses`），建议保持命名风格一致并使用引用关系。

