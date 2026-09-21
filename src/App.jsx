import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import "./App.css";

function App() {
  const [task, setTask] = useState("");
  const [tasks, setTasks] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");

  async function fetchTasks() {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setTasks(data);
  }

  async function addTask() {
    if (!task.trim()) return;

    const { error } = await supabase.from("tasks").insert([{ title: task }]);

    if (error) {
      console.error(error);
      alert("Failed to add task");
      return;
    }

    setTask("");
    fetchTasks();
  }

  async function deleteTask(id) {
    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) {
      console.error(error);
      alert("Failed to delete task");
      return;
    }

    fetchTasks();
  }

  async function updateTask(id, newTitle) {
    if (!newTitle.trim()) return;

    const { error } = await supabase
      .from("tasks")
      .update({ title: newTitle })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Failed to update task");
      return;
    }

    setEditingId(null);
    fetchTasks();
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="app">
      <h1>Student Task Manager</h1>

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

      {tasks.length === 0 && <p className="empty">No tasks yet.</p>}

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

            <button className="delete-btn" onClick={() => deleteTask(item.id)}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default App;