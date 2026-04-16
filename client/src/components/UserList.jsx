import "./UserList.css";

// Generate initials from username — "alice" → "AL"
const initials = (name) => name?.slice(0, 2).toUpperCase() || "??";

// Each user gets a stable color based on their username
// so the same person always has the same color across sessions
const USER_COLORS = [
  "#f97316","#8b5cf6","#06b6d4",
  "#10b981","#ef4444","#f59e0b",
  "#ec4899","#84cc16",
];
const colorFor = (username) => {
  let hash = 0;
  for (const c of (username || "")) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
};

export default function UserList({ users, currentUserId }) {
  // Deduplicate by socketId before rendering
  // If somehow two entries share a socketId, keep only the first
  const uniqueUsers = users.filter(
    (u, index, self) => index === self.findIndex((x) => x.socketId === u.socketId)
  );

  return (
    <div className="userlist">
      <p className="userlist__label">
        online
        <span className="userlist__count">{uniqueUsers.length}</span>
      </p>
      <ul className="userlist__items">
        {uniqueUsers.map((u) => (
          <li key={u.socketId} className="userlist__item">
            <span
              className="user-avatar"
              style={{ background: colorFor(u.username) }}
            >
              {initials(u.username)}
            </span>
            <span className="userlist__name">
              {u.username}
              {u.userId === currentUserId && (
                <span className="userlist__you">you</span>
              )}
            </span>
            <span className="user-online-dot" />
          </li>
        ))}
      </ul>
    </div>
  );
}