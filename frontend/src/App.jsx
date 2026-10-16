import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8004";

function App() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState("");
  const [activityType, setActivityType] = useState("");
  const [details, setDetails] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Fetch all activities
  const fetchActivities = async () => {
    try {
      setError("");

      const response = await fetch(`${API_URL}/activities`);

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Unexpected activities response");
      }

      setActivities(data);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(
        "Backend se connection nahi ho raha. Check karo ki backend port 8002 par chal raha hai."
      );
    } finally {
      setLoading(false);
    }
  };

  // Add activity
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!user.trim() || !activityType.trim() || !details.trim()) {
      alert("Please fill all fields.");
      return;
    }

    setAdding(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/activities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: user.trim(),
          activity_type: activityType.trim(),
          details: details.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      setUser("");
      setActivityType("");
      setDetails("");

      await fetchActivities();

      alert("Activity added successfully!");
    } catch (err) {
      console.error("Add activity error:", err);
      setError(
        "Activity add nahi hui. Backend connection aur POST endpoint check karo."
      );
    } finally {
      setAdding(false);
    }
  };

  // Delete activity
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Kya tum is activity ko delete karna chahti ho?"
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(id);
    setError("");

    try {
      const response = await fetch(`${API_URL}/activities/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      await fetchActivities();

      alert("Activity deleted successfully!");
    } catch (err) {
      console.error("Delete activity error:", err);
      setError(
        "Activity delete nahi hui. Backend ka DELETE endpoint check karo."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // Load activities when page opens
  useEffect(() => {
    fetchActivities();
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>SentinelX AI</h1>
        <h2>Security Activity Monitor</h2>
        <p>
          Monitor activities and identify potential security risks.
        </p>
      </header>

      {error && (
        <div className="error-message" role="alert">
          <p>{error}</p>

          <button type="button" onClick={fetchActivities}>
            Retry
          </button>
        </div>
      )}

      <section className="add-activity">
        <h3>Add New Activity</h3>

        <form onSubmit={handleSubmit} className="add-form">
          <input
            type="text"
            placeholder="User name"
            value={user}
            onChange={(event) => setUser(event.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Activity type (e.g. login)"
            value={activityType}
            onChange={(event) => setActivityType(event.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Activity details"
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            required
          />

          <button type="submit" disabled={adding}>
            {adding ? "Adding..." : "Add Activity"}
          </button>
        </form>
      </section>

      <section className="activity-section">
        <div className="section-heading">
          <h3>Activity History</h3>

          <button
            type="button"
            onClick={fetchActivities}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <p>Loading activities...</p>
        ) : activities.length === 0 ? (
          <p>No activities found. Add your first activity above.</p>
        ) : (
          <div className="activities">
            {activities.map((activity) => {
              const risk = String(
                activity.risk_level || "Low"
              ).toLowerCase();

              let riskClass = "risk-low";

              if (risk === "high") {
                riskClass = "risk-high";
              } else if (risk === "medium") {
                riskClass = "risk-medium";
              }

              return (
                <article
                  className={`activity-card ${riskClass}`}
                  key={activity.id}
                >
                  <div className="activity-card-heading">
                    <h4>{activity.activity_type}</h4>

                    <span className={`risk-badge ${riskClass}`}>
                      {activity.risk_level || "Low"} Risk
                    </span>
                  </div>

                  <p>
                    <strong>User:</strong> {activity.user}
                  </p>

                  <p>
                    <strong>Details:</strong> {activity.details}
                  </p>

                  <p>
                    <strong>Time:</strong>{" "}
                    {activity.time || "Not available"}
                  </p>

                  <button
                    type="button"
                    className="delete-button"
                    onClick={() => handleDelete(activity.id)}
                    disabled={deletingId === activity.id}
                  >
                    {deletingId === activity.id
                      ? "Deleting..."
                      : "🗑️ Delete Activity"}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default App;