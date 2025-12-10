import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

async function getUsers() {
  await dbConnect();
  const users = await User.find({});
  return users;
}

export default async function UsersPage() {
  const users = await getUsers();
  console.log(users);
  return (
    <div>
      <h1>用户列表</h1>
      {/* <ul>
        {users.map((user) => (
          <li key={user._id}>
            {user.name} - {user.email}
          </li>
        ))}
      </ul> */}
    </div>
  );
}
