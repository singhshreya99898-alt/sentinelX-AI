import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState("");
  const [activityType, setActivityType] = useState("");
  const [details, setDetails] = useState("");
  const [adding, setAdding] = useState(false);

  const API_URL = "http://127.0.0.1:8000";

  const fetchActivities = async () => {
    try {
      const response = await fetch(`${API_URL}/activities`);

      if (!response.ok) {
        throw new Error("Failed to fetch activities");
      }

      const data = await response.json();
      setActivities(data);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user || !activityType || !details) {
      alert("Please fill all fields");
      return;
    }

    setAdding(true);

    try {
      const response = await fetch(`${API_URL}/activities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: user,
          activity_type: activityType,
          details: details,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add activity");
      }

      const result = await response.json();

      console.log("Activity added:", result);

      setUser("");
      setActivityType("");
      setDetails("");

      await fetchActivities();

      alert("Activity added successfully!");
    } catch (error) {
      console.error("Error adding activity:", error);
      alert("Unable to add activity");
    } finally {
      setAdding(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  return (
    <div className="app">
      <h1>SentinelX AI</h1>
      <h2>Activity Monitor</h2>

      <div className="add-activity">
        <h3>Add Activity</h3>

        <form onSubmit={handleSubmit} className="add-form">
          <input
            type="text"
            placeholder="User"
            value={user}
            onChange={(e) => setUser(e.target.value)}
          />

          <input
            type="text"
            placeholder="Activity Type"
            value={activityType}
            onChange={(e) => setActivityType(e.target.value)}
          />

          <input
            type="text"
            placeholder="Details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />

          <button type="submit" disabled={adding}>
            {adding ? "Adding..." : "Add Activity"}
          </button>
        </form>
      </div>

      {loading ? (
        <p>Loading activities...</p>
      ) : activities.length === 0 ? (
        <p>No activities found.</p>
      ) : (
        <div className="activities">
          {activities.map((activity) => {
            const risk = activity.risk_level?.toLowerCase();

            let riskClass = "risk-low";

            if (risk === "high") {
              riskClass = "risk-high";
            } else if (risk === "medium") {
              riskClass = "risk-medium";
            }

            return (
              <div
                className={`activity-card ${riskClass}`}
                key={activity.id}
              >
                <p>
                  <strong>User:</strong> {activity.user}
                </p>

                <p>
                  <strong>Activity:</strong> {activity.activity_type}
                </p>

                <p>
                  <strong>Details:</strong> {activity.details}
                </p>

                <p>
                  <strong>Risk Level:</strong>{" "}
                  <span className="risk-badge">
                    {activity.risk_level}
                  </span>
                </p>

                <p>
                  <strong>Reason:</strong> {activity.reason}
                </p>

                <p>
                  <strong>Time:</strong> {activity.time}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default App;