import { getUser } from "../api/auth";

export default function ProfilePage() {
  const user = getUser();

  return (
    <div>
      <h2>Profile</h2>
      {!user ? (
        <p>No user loaded.</p>
      ) : (
        <div style={{ border: "1px solid #333", borderRadius: 10, padding: 12 }}>
          <div><b>Username:</b> {user.userName}</div>
          <div><b>Email:</b> {user.email}</div>
          <div><b>Roles:</b> {user.roles.join(", ")}</div>
        </div>
      )}
    </div>
  );
}
