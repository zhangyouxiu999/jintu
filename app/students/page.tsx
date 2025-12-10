import clientPromise from "@/lib/mongodb";

export default async function StudentsPage() {
  const client = await clientPromise;
  const db = client.db("school_cms");

  const students = await db.collection("students").find({}).toArray();

  return (
    <div>
      <h1>Students</h1>
      <pre>{JSON.stringify(students, null, 2)}</pre>
    </div>
  );
}
