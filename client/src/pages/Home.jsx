import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./Home.css";

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [tab, setTab] = useState("create"); // "create" | "join"
  const [error, setError] = useState("");

  useEffect(() => {
    axios.get("/api/rooms").then(({ data }) => setRooms(data));
  }, []);

  const createRoom = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await axios.post("/api/rooms", { name: roomName });
      navigate(`/room/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create room");
    }
  };

  const joinRoom = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await axios.post("/api/rooms/join", { shareCode: joinCode });
      navigate(`/room/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Room not found");
    }
  };

  return (
    <div className="home">
      {/* topbar */}
      <header className="home-header">
        <div className="home-logo">
          <span className="bracket">[</span>CodeSync<span className="bracket">]</span>
        </div>
        <div className="home-header__right">
          <span className="home-user">
            <span className="home-user__dot" />
            {user?.username}
          </span>
          <button className="btn btn-ghost" onClick={logout}>logout</button>
        </div>
      </header>

      <main className="home-main">
        {/* left — action panel */}
        <div className="home-action">
          <h1 className="home-title">
            Start a<br />
            <span className="home-title--accent">session.</span>
          </h1>

          <div className="home-tabs">
            <button
              className={`home-tab ${tab === "create" ? "active" : ""}`}
              onClick={() => setTab("create")}
            >
              new room
            </button>
            <button
              className={`home-tab ${tab === "join" ? "active" : ""}`}
              onClick={() => setTab("join")}
            >
              join room
            </button>
          </div>

          {tab === "create" ? (
            <form onSubmit={createRoom} className="home-form">
              <input
                className="input"
                placeholder="room name..."
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                required
              />
              <button className="btn btn-primary">create →</button>
            </form>
          ) : (
            <form onSubmit={joinRoom} className="home-form">
              <input
                className="input"
                placeholder="enter share code..."
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toLowerCase())}
                required
              />
              <button className="btn btn-primary">join →</button>
            </form>
          )}

          {error && <p className="home-error">{error}</p>}
        </div>

        {/* right — recent rooms */}
        <div className="home-rooms">
          <p className="home-rooms__label">recent rooms</p>
          {rooms.length === 0 ? (
            <p className="home-rooms__empty">no rooms yet.</p>
          ) : (
            <ul className="room-list">
              {rooms.map((room) => (
                <li key={room._id}>
                  <button
                    className="room-card"
                    onClick={() => navigate(`/room/${room._id}`)}
                  >
                    <div className="room-card__left">
                      <span className="room-card__indicator" />
                      <div>
                        <p className="room-card__name">{room.name}</p>
                        <p className="room-card__meta">
                          /{room.shareCode} · {new Date(room.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="room-card__arrow">→</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}