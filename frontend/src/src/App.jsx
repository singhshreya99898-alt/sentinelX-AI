import React, { useEffect, useState } from "react";
import {
  Shield,
  AlertTriangle,
  Activity,
  Lock,
  List,
  TrendingUp,
  RefreshCw,
  User,
  Plus,
  Clock,
  X,
  Loader2,
} from "lucide-react";

// =====================================================
// SENTINELX AI BACKEND URL
// =====================================================

const BASE_URL = "https://daffodil-partly-seclusion.ngrok-free.dev";

// =====================================================
// APP
// =====================================================

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("latest");
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const [riskResult, setRiskResult] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [riskLoading, setRiskLoading] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  

  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  const [newActivity, setNewActivity] = useState({
    user: "",
    activity_type: "search",
    details: "",
  });

  // =====================================================
  // FETCH ACTIVITIES
  // =====================================================

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${BASE_URL}/activities`, {
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const data = await response.json();

      setActivities(Array.isArray(data) ? data : []);
      setBackendConnected(true);
      setLastUpdated(new Date().toLocaleString());
    } catch (err) {
      console.error("Fetch Error:", err);

      setActivities([]);
      setBackendConnected(false);

      setError(
        "Unable to connect to backend. Please make sure backend and ngrok are running."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchActivities();
  }, []);
  // =====================================================
// CLOSE ACTIVITY MODAL WITH ESCAPE KEY
// =====================================================

useEffect(() => {
  const handleEscape = (event) => {
    if (event.key === "Escape") {
      setSelectedActivity(null);
      setCopySuccess(false);
    }
  };

  window.addEventListener("keydown", handleEscape);

  return () => {
    window.removeEventListener("keydown", handleEscape);
  };
}, []);
  useEffect(() => {
  const interval = setInterval(() => {
    fetchActivities();
  }, 30000);

  return () => clearInterval(interval);
}, []);

  // =====================================================
  // RISK ANALYSIS
  // =====================================================

  const analyzeRisk = async (activity) => {
    try {
      setRiskLoading(true);
      setRiskResult(null);
      setError("");

      const activityType = encodeURIComponent(
        activity.activity_type || ""
      );

      const details = encodeURIComponent(
        activity.details || ""
      );

      const response = await fetch(
        `${BASE_URL}/risk-analysis?activity_type=${activityType}&details=${details}`,
        {
          headers: {
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Risk analysis error: ${response.status}`);
      }

      const data = await response.json();

      setRiskResult(data);
      setActivePage("risk");
    } catch (err) {
      console.error("Risk Analysis Error:", err);

      setRiskResult({
        activity_type: activity.activity_type,
        details: activity.details,
        risk_level: "Unknown",
        reason:
          "Unable to get AI risk analysis. Please check backend connection.",
      });

      setActivePage("risk");
    } finally {
      setRiskLoading(false);
    }
  };

  // =====================================================
  // ADD ACTIVITY
  // =====================================================

  const handleAddActivity = async (e) => {
    e.preventDefault();

    if (
      !newActivity.user.trim() ||
      !newActivity.activity_type.trim() ||
      !newActivity.details.trim()
    ) {
      setAddError("Please fill all fields.");
      return;
    }

    try {
      setAddLoading(true);
      setAddError("");

      const response = await fetch(`${BASE_URL}/activities`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },

        body: JSON.stringify(newActivity),
      });

      if (!response.ok) {
        throw new Error(`Add activity error: ${response.status}`);
      }

      setNewActivity({
        user: "",
        activity_type: "search",
        details: "",
      });

      setShowAddModal(false);

      await fetchActivities();
    } catch (err) {
      console.error("Add Activity Error:", err);

      setAddError(
        "Unable to add activity. Backend POST endpoint may not be available yet."
      );
    } finally {
      setAddLoading(false);
    }
  };

  // =====================================================
  // RISK STYLE
  // =====================================================

  const getRiskStyle = (risk) => {
    const value = String(risk || "").toLowerCase();

    if (value === "high") {
      return "bg-red-500/20 text-red-400 border-red-500/30";
    }

    if (value === "medium") {
      return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    }

    if (value === "low") {
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    }

    return "bg-slate-500/20 text-slate-300 border-slate-500/30";
  };
// =====================================================
// FILTERED ACTIVITIES
// =====================================================

const filteredActivities = activities.filter((item) => {
  const searchValue = searchTerm.toLowerCase();

  const matchesSearch =
    String(item.user || "").toLowerCase().includes(searchValue) ||
    String(item.activity_type || "")
      .toLowerCase()
      .includes(searchValue) ||
    String(item.details || "")
      .toLowerCase()
      .includes(searchValue);

  const matchesRisk =
    riskFilter === "all" ||
    String(item.risk_level || "").toLowerCase() === riskFilter;

  return matchesSearch && matchesRisk;
});
const sortedActivities = [...filteredActivities].sort((a, b) => {
  if (sortOrder === "highRisk") {
    const riskPriority = {
      high: 3,
      medium: 2,
      low: 1,
    };

    return (
      (riskPriority[String(b.risk_level || "").toLowerCase()] || 0) -
      (riskPriority[String(a.risk_level || "").toLowerCase()] || 0)
    );
  }

  if (sortOrder === "lowRisk") {
    const riskPriority = {
      high: 3,
      medium: 2,
      low: 1,
    };

    return (
      (riskPriority[String(a.risk_level || "").toLowerCase()] || 0) -
      (riskPriority[String(b.risk_level || "").toLowerCase()] || 0)
    );
  }

  if (sortOrder === "oldest") {
    return Number(a.id || 0) - Number(b.id || 0);
  }

  return Number(b.id || 0) - Number(a.id || 0);
});

  // =====================================================
  // RISK COUNTS
  // =====================================================

  const lowRiskCount = activities.filter(
    (item) =>
      String(item.risk_level || "").toLowerCase() === "low"
  ).length;

  const mediumRiskCount = activities.filter(
    (item) =>
      String(item.risk_level || "").toLowerCase() === "medium"
  ).length;

  const highRiskCount = activities.filter(
    (item) =>
      String(item.risk_level || "").toLowerCase() === "high"
  ).length;
  const totalActivities = activities.length;

const lowRiskPercentage =
  totalActivities > 0
    ? Math.round((lowRiskCount / totalActivities) * 100)
    : 0;

const mediumRiskPercentage =
  totalActivities > 0
    ? Math.round((mediumRiskCount / totalActivities) * 100)
    : 0;

const highRiskPercentage =
  totalActivities > 0
    ? Math.round((highRiskCount / totalActivities) * 100)
    : 0;
 

  // =====================================================
  // OVERALL RISK
  // =====================================================

  let overallRisk = "LOW";
  let riskScore = 12;

  if (highRiskCount > 0) {
    overallRisk = "HIGH";
    riskScore = 80;
  } else if (mediumRiskCount > 0) {
    overallRisk = "MEDIUM";
    riskScore = 45;
  }

  const overallRiskColor =
    overallRisk === "HIGH"
      ? "text-red-400"
      : overallRisk === "MEDIUM"
      ? "text-amber-400"
      : "text-emerald-400";

  // =====================================================
  // NAVIGATION
  // =====================================================
const clearFilters = () => {
  setSearchTerm("");
  setRiskFilter("all");
  setSortOrder("latest");
};
const copyActivityDetails = async (activity) => {
  const activityText = `
User: ${activity.user || "Unknown"}
Activity Type: ${activity.activity_type || "Unknown"}
Details: ${activity.details || "No details available"}
Risk Level: ${activity.risk_level || "Unknown"}
Time: ${activity.time || "Recent"}
  `.trim();

  try {
    await navigator.clipboard.writeText(activityText);

    setCopySuccess(true);

    setTimeout(() => {
      setCopySuccess(false);
    }, 2000);

  } catch (error) {
    console.error("Copy failed:", error);
  }
};

  

  

  const navigation = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Activity,
    },
    {
      id: "activities",
      label: "Activity Monitoring",
      icon: List,
    },
    {
      id: "risk",
      label: "Risk Analysis",
      icon: TrendingUp,
    },
    {
      id: "alerts",
      label: "Threat Alerts",
      icon: AlertTriangle,
    },
    {
      id: "logs",
      label: "Security Logs",
      icon: Lock,
    },
  ];

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">

      {/* ================= SIDEBAR ================= */}

      <aside className="w-full md:w-64 min-h-screen bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between">

        <div>

          <div className="flex items-center gap-3 text-cyan-400 font-bold text-xl mb-10">
            <Shield className="w-8 h-8" />
            <span>SentinelX AI</span>
          </div>

          <nav className="space-y-3">

            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
                    activePage === item.id
                      ? "text-cyan-400 font-medium bg-slate-800"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-5 h-5" />

                  {item.label}
                </button>
              );
            })}

          </nav>

        </div>

        <div className="text-xs text-slate-500 border-t border-slate-800 pt-4">

          

          Status:{" "}

<span
  className={
    backendConnected
      ? "text-emerald-400"
      : "text-red-400"
  }
>
  ● {backendConnected
    ? "Backend Connected"
    : "Backend Disconnected"}
</span>
      
        

        </div>

      </aside>

      {/* ================= MAIN ================= */}

      <main className="flex-1 p-4 md:p-8 overflow-auto">

        {/* ================= ERROR ================= */}

        {error && (
  <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-lg">

    <div className="flex justify-between items-start gap-4">

      <div>
        <p className="font-medium">
          Connection Error
        </p>

        <p className="text-sm mt-1 text-red-300/80">
          {error}
        </p>
      </div>

      <button
        onClick={() => setError("")}
        className="hover:text-white"
      >
        <X className="w-5 h-5" />
      </button>

    </div>

    <button
      onClick={fetchActivities}
      className="mt-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 px-4 py-2 rounded-lg text-sm transition"
    >
      Retry Connection
    </button>

  </div>
)}
          

        {/* ================================================= */}
        {/* DASHBOARD */}
        {/* ================================================= */}

        {activePage === "dashboard" && (
          <>

            <header className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-5 mb-8">

              <div>

                <h1 className="text-3xl font-bold text-white">
                  Security Overview
                </h1>

                <p className="text-slate-400 text-sm mt-1">
                  Real-time threat monitoring and AI analytics
                </p>

                <div className="flex items-center gap-2 text-xs text-slate-500 mt-3">

                  <Clock className="w-4 h-4" />

                  Last updated:{" "}

                  {lastUpdated || "Not updated yet"}

                </div>

              </div>

              <div className="flex flex-wrap gap-3">

                <button
                  onClick={() => {
                    setAddError("");
                    setShowAddModal(true);
                  }}
                  className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-4 py-2 rounded-lg transition"
                >
                  <Plus className="w-4 h-4" />

                  Add Activity
                </button>

                <button
                  onClick={fetchActivities}
                  disabled={loading}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${
                      loading ? "animate-spin" : ""
                    }`}
                  />

                  Refresh
                </button>

              </div>

            </header>

            {/* ================= COUNTS ================= */}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">

                <p className="text-slate-400 text-sm">
                  Total Activities
                </p>

                <h2 className="text-4xl font-bold text-white mt-3">
                  {activities.length}
                </h2>

              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">

                <p className="text-slate-400 text-sm">
                  Low Risk
                </p>

                <h2 className="text-4xl font-bold text-emerald-400 mt-3">
                  {lowRiskCount}
                </h2>

              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">

                <p className="text-slate-400 text-sm">
                  Medium Risk
                </p>

                <h2 className="text-4xl font-bold text-amber-400 mt-3">
                  {mediumRiskCount}
                </h2>

              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">

                <p className="text-slate-400 text-sm">
                  High Risk
                </p>

                <h2 className="text-4xl font-bold text-red-400 mt-3">
                  {highRiskCount}
                </h2>

              </div>

            </div>

            {/* ================= OVERALL ================= */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">

                <p className="text-slate-400 text-sm">
                  Overall Threat Score
                </p>

                <h2 className={`text-4xl font-bold mt-3 ${overallRiskColor}`}>
                  {overallRisk} ({riskScore}/100)
                </h2>

              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">

                <p className="text-slate-400 text-sm">
                  AI Detection Status
                </p>

                <h2 className="text-4xl font-bold text-cyan-400 mt-3">
                  Active
                </h2>

              </div>

            </div>

            {/* ================= RECENT ACTIVITIES ================= */}
            {/* ================= RISK DISTRIBUTION ================= */}

<div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">

  <div className="flex items-center justify-between mb-6">
    <div>
      <h2 className="text-lg font-semibold">
        Risk Distribution
      </h2>

      <p className="text-sm text-slate-400 mt-1">
        Distribution of activities by risk level.
      </p>
    </div>

    <TrendingUp className="w-6 h-6 text-cyan-400" />
  </div>

  <div className="space-y-5">

    {/* Low Risk */}
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-emerald-400">
          Low Risk
        </span>

        <span className="text-slate-300">
          {lowRiskCount} Activities ({lowRiskPercentage}%)
        </span>
      </div>

      <div className="w-full bg-slate-800 rounded-full h-3">
        <div
          className="bg-emerald-500 h-3 rounded-full transition-all"
          style={{ width: `${lowRiskPercentage}%` }}
        />
      </div>
    </div>

    {/* Medium Risk */}
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-amber-400">
          Medium Risk
        </span>

        <span className="text-slate-300">
          {mediumRiskCount} Activities ({mediumRiskPercentage}%)
        </span>
      </div>

      <div className="w-full bg-slate-800 rounded-full h-3">
        <div
          className="bg-amber-500 h-3 rounded-full transition-all"
          style={{ width: `${mediumRiskPercentage}%` }}
        />
      </div>
    </div>

    {/* High Risk */}
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-red-400">
          High Risk
        </span>

        <span className="text-slate-300">
          {highRiskCount} Activities ({highRiskPercentage}%)
        </span>
      </div>

      <div className="w-full bg-slate-800 rounded-full h-3">
        <div
          className="bg-red-500 h-3 rounded-full transition-all"
          style={{ width: `${highRiskPercentage}%` }}
        />
      </div>
    </div>

  </div>

</div>
{/* ================= QUICK RISK ALERTS ================= */}

<div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">

  <div className="flex items-center justify-between mb-5">
    <div>
      <h2 className="text-lg font-semibold">
        Quick Risk Alerts
      </h2>

      <p className="text-sm text-slate-400 mt-1">
        Medium and high-risk activities requiring attention.
      </p>
    </div>

    <AlertTriangle className="w-6 h-6 text-amber-400" />
  </div>

  {activities.filter(
    (item) =>
      ["medium", "high"].includes(
        String(item.risk_level || "").toLowerCase()
      )
  ).length === 0 ? (

    <div className="text-center py-6 text-slate-400">
      No important risk alerts detected.
    </div>

  ) : (

    <div className="space-y-3">

      {activities
        .filter(
          (item) =>
            ["medium", "high"].includes(
              String(item.risk_level || "").toLowerCase()
            )
        )
        .slice(0, 3)
        .map((item, index) => (

          <div
            key={item.id || index}
            className="flex items-center justify-between bg-slate-800/60 border border-slate-700 p-4 rounded-lg"
          >

            <div>
              <p className="font-medium text-white capitalize">
                {item.activity_type || "Unknown Activity"}
              </p>

              <p className="text-sm text-slate-400 mt-1">
                {item.details || "No details available"}
              </p>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs border ${getRiskStyle(
                item.risk_level
              )}`}
            >
              {item.risk_level || "Unknown"}
            </span>

          </div>

        ))}

    </div>

  )}

</div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

              <div className="flex items-center justify-between mb-5">

  <div className="flex items-center gap-3">

    <Activity className="w-5 h-5 text-cyan-400" />

    <h2 className="text-lg font-semibold">
      Recent Activities
    </h2>

  </div>

  <button
    onClick={() => setActivePage("activities")}
    className="text-sm text-cyan-400 hover:text-cyan-300 transition"
  >
    View All →
  </button>

</div>
           

              {loading ? (

                <div className="flex flex-col items-center justify-center py-10 text-cyan-400">

  <Loader2 className="w-8 h-8 animate-spin mb-3" />

  <p className="text-sm">
    Loading activities from SentinelX AI...
  </p>

</div>

                

                  

                

              ) : activities.length === 0 ? (

                <p className="text-slate-400">
                  No activities found. Add your first activity from the Dashboard.
                </p>

              ) : (

                <div className="space-y-3">

                  {activities.slice(0, 5).map((item, index) => (

                    <div
                      key={item.id || index}
                      className="flex items-center justify-between bg-slate-800/60 p-4 rounded-lg"
                    >

                      <div>

                        <p className="font-medium text-white capitalize">
                          {item.activity_type || "Unknown Activity"}
                        </p>

                        <p className="text-sm text-slate-400">
                          {item.details || "No details available"}
                        </p>

                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-xs border ${getRiskStyle(
                          item.risk_level
                        )}`}
                      >
                        {item.risk_level || "Unknown"}
                      </span>

                    </div>

                  ))}

                </div>

              )}

            </div>

          </>
        )}

        {/* ================================================= */}
        {/* ACTIVITY MONITORING */}
        {/* ================================================= */}

        {activePage === "activities" && (
          <>

            <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">

              <div>

                <div className="flex items-center gap-3">

                  <List className="w-7 h-7 text-cyan-400" />

                  <h1 className="text-3xl font-bold">
                    Activity Monitoring
                  </h1>

                </div>

                <p className="text-slate-400 text-sm mt-2">
                  Monitor activities received from the SentinelX AI backend.
                </p>

              </div>

              <button
                onClick={fetchActivities}
                className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-4 py-2 rounded-lg"
              >
                <RefreshCw className="w-4 h-4" />

                Refresh
              </button>

            </header>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">

              <div className="p-6 border-b border-slate-800">

                <h2 className="text-lg font-semibold">
                  Activity History
                </h2>

                <p className="text-sm text-slate-400 mt-1">
                  Click Analyze to get AI-powered risk analysis.
                </p>

              </div>

              <div className="p-6 border-b border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">

  <div>

    <label className="text-sm text-slate-400">
      Search Activities
    </label>

    <input
      type="text"
      value={searchQuery}
      onChange={(e) =>
        setSearchQuery(e.target.value)
      }
      placeholder="Search user, activity or details..."
      className="w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-cyan-400"
    />

  </div>

  <div>

    <label className="text-sm text-slate-400">
      Filter by Risk
    </label>

    <select
      value={riskFilter}
      onChange={(e) =>
        setRiskFilter(e.target.value)
      }
      className="w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-cyan-400"
    >

      <option value="all">
        All Risks
      </option>

      <option value="low">
        Low Risk
      </option>

      <option value="medium">
        Medium Risk
      </option>

      <option value="high">
        High Risk
      </option>

    </select>

  </div>
  {/* Sort Activities */}
<div>
  <label className="text-sm text-slate-400">
    Sort Activities
  </label>

  <select
    value={sortOrder}
    onChange={(e) => setSortOrder(e.target.value)}
    className="w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-cyan-400"
  >
    <option value="latest">Latest First</option>
    <option value="oldest">Oldest First</option>
    <option value="highRisk">High Risk First</option>
    <option value="lowRisk">Low Risk First</option>
  </select>
</div>

</div>
<button
  onClick={clearFilters}
  className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-4 py-3 rounded-lg transition"
>
  Clear Filters
</button>

              <div className="overflow-x-auto">

                <table className="w-full">

                  <thead className="bg-slate-800/70">

                    <tr>

                      <th className="text-left p-4 text-sm text-slate-400">
                        User
                      </th>

                      <th className="text-left p-4 text-sm text-slate-400">
                        Activity
                      </th>

                      <th className="text-left p-4 text-sm text-slate-400">
                        Details
                      </th>

                      <th className="text-left p-4 text-sm text-slate-400">
                        Risk
                      </th>

                      <th className="text-left p-4 text-sm text-slate-400">
                        AI Analysis
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredActivities.length === 0 && !loading ? (

                      <tr>

                        <div className="text-center py-10">

  <Activity className="w-10 h-10 text-slate-600 mx-auto mb-3" />

  <h3 className="text-lg font-semibold text-white">
    No Activities Yet
  </h3>

  <p className="text-sm text-slate-400 mt-2">
    No activity records have been received from the backend.
  </p>

  <button
    onClick={() => {
      setAddError("");
      setShowAddModal(true);
    }}
    className="mt-5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-4 py-2 rounded-lg transition"
  >
    Add First Activity
  </button>

</div>
                          
                          
                        
                        
                        

                      </tr>

                    ) : (

                      sortedActivities.map((item, index) => (

                        <tr
                          key={item.id || index}
                          className="border-t border-slate-800 hover:bg-slate-800/40"
                        >

                          <td className="p-4">

                            <div className="flex items-center gap-2">

                              <User className="w-4 h-4 text-cyan-400" />

                              <span>
                                {item.user || "Unknown"}
                              </span>

                            </div>

                          </td>

                          <td className="p-4 capitalize">
                            {item.activity_type || "Unknown"}
                          </td>

                          <td className="p-4 text-slate-400">
                            {item.details || "No details"}
                          </td>

                          <td className="p-4">

                            <span
                              className={`px-3 py-1 rounded-full text-xs border ${getRiskStyle(
                                item.risk_level
                              )}`}
                            >
                              {item.risk_level || "Unknown"}
                            </span>

                          </td>

                          <td className="p-4">

  <div className="flex flex-wrap gap-2">

    <button
      onClick={() => analyzeRisk(item)}
      className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 px-3 py-2 rounded-lg text-sm"
    >
      Analyze
    </button>

    <button
      onClick={() => {
  setSelectedActivity(item);
  setCopySuccess(false);
}}
      className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-3 py-2 rounded-lg text-sm"
    >
      View Details
    </button>

  </div>

</td>         

                        </tr>

                      ))

                    )}

                  </tbody>

                </table>

              </div>

            </div>

          </>
        )}

        {/* ================================================= */}
        {/* RISK ANALYSIS */}
        {/* ================================================= */}

        {activePage === "risk" && (
          <>

            <header className="mb-8">

              <div className="flex items-center gap-3">

                <TrendingUp className="w-7 h-7 text-cyan-400" />

                <h1 className="text-3xl font-bold">
                  Risk Analysis
                </h1>

              </div>

              <p className="text-slate-400 text-sm mt-2">
                AI-powered analysis using the SentinelX backend.
              </p>

            </header>

            {riskLoading ? (

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 flex items-center gap-3 text-cyan-400">

                <Loader2 className="w-6 h-6 animate-spin" />

                AI is analyzing the selected activity...

              </div>

            ) : riskResult ? (

              <div className="space-y-6">

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

                  <p className="text-slate-400 text-sm">
                    Selected Activity
                  </p>

                  <h2 className="text-2xl font-bold mt-2 capitalize">
                    {riskResult.activity_type}
                  </h2>

                  <p className="text-slate-400 mt-3">
                    {riskResult.details}
                  </p>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

                    <p className="text-slate-400 text-sm">
                      AI Risk Level
                    </p>

                    <h2
                      className={`text-4xl font-bold mt-3 ${
                        String(riskResult.risk_level).toLowerCase() === "high"
                          ? "text-red-400"
                          : String(riskResult.risk_level).toLowerCase() ===
                            "medium"
                          ? "text-amber-400"
                          : String(riskResult.risk_level).toLowerCase() ===
                            "low"
                          ? "text-emerald-400"
                          : "text-slate-300"
                      }`}
                    >
                      {riskResult.risk_level}
                    </h2>

                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

                    <p className="text-slate-400 text-sm mb-3">
                      AI Reason
                    </p>

                    <p className="text-white">
                      {riskResult.reason}
                    </p>

                  </div>

                </div>

              </div>

            ) : (

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center">

                <TrendingUp className="w-12 h-12 text-cyan-400 mx-auto mb-4" />

                <h2 className="text-xl font-semibold">
                  Select an Activity
                </h2>

                <p className="text-slate-400 mt-2">
                  Go to Activity Monitoring and click Analyze.
                </p>

              </div>

            )}

          </>
        )}

        {/* ================================================= */}
        {/* THREAT ALERTS */}
        {/* ================================================= */}

        {activePage === "alerts" && (
          <>

            <header className="mb-8">

              <div className="flex items-center gap-3">

                <AlertTriangle className="w-7 h-7 text-amber-400" />

                <h1 className="text-3xl font-bold">
                  Threat Alerts
                </h1>

              </div>

              <p className="text-slate-400 text-sm mt-2">
                Activities classified as Medium or High risk.
              </p>

            </header>

            <div className="space-y-4">

              {activities.filter(
                (item) =>
                  ["medium", "high"].includes(
                    String(item.risk_level || "").toLowerCase()
                  )
              ).length === 0 ? (

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
                  No medium or high-risk threats detected.
                </div>

              ) : (

                activities
                  .filter(
                    (item) =>
                      ["medium", "high"].includes(
                        String(item.risk_level || "").toLowerCase()
                      )
                  )
                  .map((item, index) => (

                    <div
                      key={item.id || index}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex justify-between items-center"
                    >

                      <div>

                        <h3 className="font-semibold capitalize">
                          {item.activity_type}
                        </h3>

                        <p className="text-sm text-slate-400 mt-1">
                          {item.details}
                        </p>

                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-xs border ${getRiskStyle(
                          item.risk_level
                        )}`}
                      >
                        {item.risk_level}
                      </span>

                    </div>

                  ))

              )}

            </div>

          </>
        )}

        {/* ================================================= */}
        {/* SECURITY LOGS */}
        {/* ================================================= */}

        {activePage === "logs" && (
          <>

            <header className="mb-8">

              <div className="flex items-center gap-3">

                <Lock className="w-7 h-7 text-cyan-400" />

                <h1 className="text-3xl font-bold">
                  Security Logs
                </h1>

              </div>

              <p className="text-slate-400 text-sm mt-2">
                Activity records received from the backend.
              </p>

            </header>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

              {activities.length === 0 ? (

                <p className="text-slate-400">
                  No security logs available.
                </p>

              ) : (

                <div className="space-y-4">

                  {activities.map((item, index) => (

                    <div
                      key={item.id || index}
                      className="border-b border-slate-800 pb-4 last:border-0"
                    >

                      <div className="flex justify-between gap-4">

                        <p className="text-white capitalize">
                          {item.activity_type}
                        </p>

                        <span className="text-xs text-slate-500">
                          {item.time || "Recent"}
                        </span>

                      </div>

                      <p className="text-sm text-slate-400 mt-1">

                        User: {item.user || "Unknown"} —{" "}

                        {item.details || "No details"}

                      </p>

                    </div>

                  ))}

                </div>

              )}

            </div>

          </>
        )}

      </main>

      {/* ================================================= */}
      {/* ADD ACTIVITY MODAL */}
      {/* ================================================= */}

      {showAddModal && (

        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">

          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6">

            <div className="flex justify-between items-center mb-6">

              <div>

                <h2 className="text-xl font-bold">
                  Add Activity
                </h2>

                <p className="text-sm text-slate-400 mt-1">
                  Add a new activity to SentinelX AI.
                </p>

              </div>

              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>

            </div>

            {addError && (

              <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-lg text-sm">
                {addError}
              </div>

            )}

            <form
              onSubmit={handleAddActivity}
              className="space-y-4"
            >

              <div>

                <label className="text-sm text-slate-400">
                  User
                </label>

                <input
                  type="text"
                  value={newActivity.user}
                  onChange={(e) =>
                    setNewActivity({
                      ...newActivity,
                      user: e.target.value,
                    })
                  }
                  placeholder="Enter user name"
                  className="w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-cyan-400"
                />

              </div>

              <div>

                <label className="text-sm text-slate-400">
                  Activity Type
                </label>

                <select
                  value={newActivity.activity_type}
                  onChange={(e) =>
                    setNewActivity({
                      ...newActivity,
                      activity_type: e.target.value,
                    })
                  }
                  className="w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-cyan-400"
                >

                  <option value="search">
                    Search
                  </option>

                  <option value="login">
                    Login
                  </option>

                  <option value="website">
                    Website
                  </option>

                  <option value="download">
                    Download
                  </option>

                </select>

              </div>

              <div>

                <label className="text-sm text-slate-400">
                  Details
                </label>

                <textarea
                  value={newActivity.details}
                  onChange={(e) =>
                    setNewActivity({
                      ...newActivity,
                      details: e.target.value,
                    })
                  }
                  placeholder="Enter activity details"
                  rows="4"
                  className="w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-cyan-400"
                />

              </div>

              <button
                type="submit"
                disabled={addLoading}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold p-3 rounded-lg transition disabled:opacity-50"
              >

                {addLoading
                  ? "Adding Activity..."
                  : "Add Activity"}

              </button>

            </form>

          </div>

        </div>

      )}
      {/* ================================================= */}
{/* ACTIVITY DETAILS MODAL */}
{/* ================================================= */}

{selectedActivity && (

  <div
  className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
  onClick={() => setSelectedActivity(null)}
>

    <div
  className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6"
  onClick={(e) => e.stopPropagation()}
>

      {/* MODAL HEADER */}

      <div className="flex justify-between items-center mb-6">

        <div>

          <h2 className="text-xl font-bold text-white">
            Activity Details
          </h2>

          <p className="text-sm text-slate-400 mt-1">
            Complete information about the selected activity.
          </p>

        </div>

        <button
          onClick={() => setSelectedActivity(null)}
          className="text-slate-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

      </div>

      {/* ACTIVITY INFORMATION */}

      <div className="space-y-5">

        <div>

          <p className="text-xs uppercase tracking-wide text-slate-500">
            User
          </p>

          <p className="text-white font-medium mt-1">
            {selectedActivity.user || "Unknown"}
          </p>

        </div>

        <div>

          <p className="text-xs uppercase tracking-wide text-slate-500">
            Activity Type
          </p>

          <p className="text-white font-medium mt-1 capitalize">
            {selectedActivity.activity_type || "Unknown"}
          </p>

        </div>

        <div>

          <p className="text-xs uppercase tracking-wide text-slate-500">
            Details
          </p>

          <p className="text-slate-300 mt-1">
            {selectedActivity.details || "No details available"}
          </p>

        </div>

        <div>

          <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">
            Risk Level
          </p>

          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs border ${getRiskStyle(
              selectedActivity.risk_level
            )}`}
          >
            {selectedActivity.risk_level || "Unknown"}
          </span>

        </div>

        <div>

          <p className="text-xs uppercase tracking-wide text-slate-500">
            Time
          </p>

          <p className="text-slate-300 mt-1">
            {selectedActivity.time || "Recent"}
          </p>

        </div>

      </div>
      {copySuccess && (
  <div className="mt-6 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-lg text-sm">
    ✓ Details Copied Successfully!
  </div>
)}

      {/* MODAL ACTIONS */}

      <div className="flex justify-end gap-3 mt-8">

        <button
          onClick={() => setSelectedActivity(null)}
          className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-4 py-2 rounded-lg transition"
        >
          Close
        </button>
        <button
  onClick={() => copyActivityDetails(selectedActivity)}
  className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-4 py-2 rounded-lg transition"
>
  Copy Details
</button>

        <button
          onClick={() => {
            analyzeRisk(selectedActivity);
            setSelectedActivity(null);
          }}
          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-4 py-2 rounded-lg transition"
        >
          Analyze Risk
        </button>

      </div>

    </div>

  </div>

)}

    </div>
  );
}