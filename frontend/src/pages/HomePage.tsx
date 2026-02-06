import { getUser } from "../api/auth";

export default function HomePage() {
  const user = getUser();

  return (
    <div>
      <h2>Home</h2>
      <p>Welcome{user ? `, ${user.userName}` : ""}.</p>
      <p>This is the frontend shell. Features will be connected to the API step-by-step.</p>
    </div>
  );
}
