import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import "./App.css";

function App() {
  const [session, setSession] = useState(null);

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [task, setTask] = useState("");
  const [tasks, setTasks] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");

  const [loading, setLoading] = useState(false);

  // Check current login session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch only current user's tasks
  async function fetchTasks() {
    if (!session?.user) return;

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", session.user.id)
      .order("id", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setTasks(data);
  }

  useEffect(() => {
    if (session) {
      fetchTasks();
    } else {
      setTasks([]);
    }
  }, [session]);

  // Sign Up / Login
  async function handleAuth() {
    if (!email.trim() || !password.trim()) {
      alert("Please enter email and password.");
      return;
    }

    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert(error.message);
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        alert(error.message);
      } else if (!data.session) {
        alert("Account created! Please check your email and confirm your account.");
        setIsLogin(true);
      } else {
        alert("Account created successfully!");
      }
    }

    setLoading(false);
  }

  // Logout
  async function handleLogout() {
    await supabase.auth.signOut();
    setTasks([]);
  }

  // Add task
  async function addTask() {
    if (!task.trim() || !session?.user) return;

    const { error } = await supabase.from("tasks").insert([
      {
        title: task.trim(),
        user_id: session.user.id,
      },
    ]);

    if (error) {
      console.error(error);
      alert("Failed to add task");
      return;
    }

    setTask("");
    fetchTasks();
  }

  // Delete task
  async function deleteTask(id) {
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) {
      console.error(error);
      alert("Failed to delete task");
      return;
    }

    fetchTasks();
  }

  // Update task
  async function updateTask(id, newTitle) {
    if (!newTitle.trim()) return;

    const { error } = await supabase
      .from("tasks")
      .update({ title: newTitle.trim() })
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) {
      console.error(error);
      alert("Failed to update task");
      return;
    }

    setEditingId(null);
    setEditingTitle("");
    fetchTasks();
  }

  // Login / Sign Up screen
  if (!session) {
    return (
      <div className="app auth-app">
        <h1>Student Task Manager</h1>

        <div className="auth-box">
          <h2>{isLogin ? "Login" : "Create Account"}</h2>

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="auth-btn" onClick={handleAuth} disabled={loading}>
            {loading ? "Please wait..." : isLogin ? "Login" : "Sign Up"}
          </button>

          <p className="switch-auth">
            {isLogin
              ? "Don't have an account?"
              : "Already have an account?"}
          </p>

          <button
            className="switch-btn"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Create Account" : "Back to Login"}
          </button>
        </div>
      </div>
    );
  }

  // Task Manager screen
  return (
    <div className="app">
      <div className="top-bar">
        <div>
          <h1>Student Task Manager</h1>
          <p className="user-email">{session.user.email}</p>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="add-task">
        <input
          type="text"
          placeholder="Enter a task..."
          value={task}
          onChange={(e) => setTask(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
        />

        <button className="add-btn" onClick={addTask}>
          Add Task
        </button>
      </div>

      <h2>My Tasks</h2>

      {tasks.length === 0 && (
        <p className="empty">No tasks yet.</p>
      )}

      {tasks.map((item) => (
        <div className="task-item" key={item.id}>
          {editingId === item.id ? (
            <input
              className="edit-input"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
            />
          ) : (
            <span className="task-title">{item.title}</span>
          )}

          <div className="task-buttons">
            {editingId === item.id ? (
              <button
                className="save-btn"
                onClick={() => updateTask(item.id, editingTitle)}
              >
                Save
              </button>
            ) : (
              <button
                className="edit-btn"
                onClick={() => {
                  setEditingId(item.id);
                  setEditingTitle(item.title);
                }}
              >
                Edit
              </button>
            )}

            <button
              className="delete-btn"
              onClick={() => deleteTask(item.id)}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default App;