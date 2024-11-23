
import  { useState, useMemo, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  ChevronUp,
  ChevronDown,
  Filter,
  Search,
  Clock,
  AlertTriangle,
  Info,
  Bug,
  AlertCircle,
} from "lucide-react";
//@ts-ignore
const LogLevelBadge = ({ level }) => {
  const configs = {
    INFO: { class: "bg-blue-100 text-blue-800", icon: Info },
    WARN: { class: "bg-yellow-100 text-yellow-800", icon: AlertTriangle },
    ERROR: { class: "bg-red-100 text-red-800", icon: AlertCircle },
    DEBUG: { class: "bg-green-100 text-green-800", icon: Bug },
  };
  //@ts-ignore
  const IconComponent = configs[level]?.icon;

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
        //@ts-ignore
        configs[level]?.class || "bg-gray-100"
      }`}
    >
      {IconComponent && <IconComponent size={12} />}
      {level}
    </span>
  );
};

interface LogDetailsModalProps {
  log: {
    timestamp: string;
    level: string;
    message: string;
    metadata?: Record<string, any>;
  };
  onClose: () => void;
}

const LogDetailsModal = ({ log, onClose }: LogDetailsModalProps) => {
  // Add syntax highlighting for JSON
  const formatJSON = (obj: Record<string, any> | ArrayLike<unknown>) => {
    return Object.entries(obj).map(([key, value]) => (
      <div key={key} className="flex gap-2">
        <span className="text-purple-600">{`"${key}":`}</span>
        <span className="text-blue-600">
          {typeof value === "object"
            ? JSON.stringify(value, null, 2)
            : `"${value}"`}
        </span>
      </div>
    ));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Log Details</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <LogLevelBadge level={log.level} />
              <span className="text-gray-500">
                {new Date(log.timestamp).toLocaleString()}
              </span>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Message</h3>
              <p>{log.message}</p>
            </div>
            {log.metadata && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Metadata</h3>
                <div className="font-mono text-sm">
                  {formatJSON(log.metadata)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const LoggingDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState(null);
  const [selectedLog, setSelectedLog] = useState<LogDetailsModalProps["log"] | null>(null);
  const [sortConfig, setSortConfig] = useState({
    key: "timestamp",
    direction: "desc",
  });
  const [timeRange, setTimeRange] = useState("1h"); // '1h', '24h', '7d'
  const [isLive, setIsLive] = useState(true);

  const logs = [
    {
      timestamp: "2024-11-09T10:18:08.525Z",
      level: "WARN",
      message: "No proxy found, returning default settings.",
      metadata: { host: "", port: 8080, username: "", password: "", url: "" },
      source: "PROXY REPOSITORY",
    },
    {
      timestamp: "2024-11-09T10:18:08.526Z",
      level: "INFO",
      message: "Proxy extracted in GET",
      metadata: {
        requestType: "GET",
        endpoint: "/admin/hyperswitch/proxy",
        browser: "Mozilla/5.0",
        userAgent:
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
        statusCode: 200,
        clientIp: "::1",
        responseTime: "2ms",
      },
      source: "PROXY SETTINGS",
    },
  ];

  const analyticsData = {
    totalLogs: 108,
    logsByLevel: { WARN: 18, INFO: 79, ERROR: 5, DEBUG: 6 },
    logsBySource: { "PROXY REPOSITORY": 19, "PROXY SETTINGS": 11 },
    errorRate: 4.62962962962963,
    lastAnalyticsUpdate: "2024-11-09T10:45:29.124Z",
  };

  // Prepare chart data
  const logLevelData = Object.entries(analyticsData.logsByLevel).map(
    ([name, value]) => ({ name, value })
  );
  const COLORS = ["#3B82F6", "#FBBF24", "#EF4444", "#10B981"];

  const logSourceData = Object.entries(analyticsData.logsBySource)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Time series data for log volume
  const timeSeriesData = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      time: `${i}:00`,
      volume: Math.floor(Math.random() * 50),
    }));
  }, []);

  const filteredLogs = useMemo(() => {
    return logs
      .filter((log) => {
        const matchesSearch = searchTerm
          ? log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.source.toLowerCase().includes(searchTerm.toLowerCase())
          : true;

        const matchesLevel = selectedLevel ? log.level === selectedLevel : true;
        const matchesSource = selectedSource
          ? log.source === selectedSource
          : true;

        return matchesSearch && matchesLevel && matchesSource;
      })
      .sort((a, b) => {
        if (sortConfig.key === "timestamp") {
          return sortConfig.direction === "asc"
            ? new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            : new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        }
        return 0;
      });
  }, [logs, searchTerm, selectedLevel, selectedSource, sortConfig]);

  // Live updates simulation
  useEffect(() => {
    if (isLive) {
      const interval = setInterval(() => {
        // Simulate new log entries
        // This is where you would typically fetch new logs from an API
        console.log("Fetching new logs...");
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isLive]);

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>System Logs Dashboard</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <select
                  className="bg-gray-100 rounded-md px-2 py-1"
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                >
                  <option value="1h">Last Hour</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                </select>
              </div>
              <button
                className={`px-3 py-1 rounded-md ${
                  isLive ? "bg-green-500 text-white" : "bg-gray-200"
                }`}
                onClick={() => setIsLive(!isLive)}
              >
                {isLive ? "🔴 Live" : "⭘ Paused"}
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Analytics Overview */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">
                Total Logs
              </h3>
              <p className="text-2xl font-bold text-blue-900">
                {analyticsData.totalLogs}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-red-800 mb-2">
                Error Rate
              </h3>
              <p className="text-2xl font-bold text-red-900">
                {analyticsData.errorRate.toFixed(2)}%
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-yellow-800 mb-2">
                Warnings
              </h3>
              <p className="text-2xl font-bold text-yellow-900">
                {analyticsData.logsByLevel.WARN || 0}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-green-800 mb-2">
                Success Rate
              </h3>
              <p className="text-2xl font-bold text-green-900">
                {(100 - analyticsData.errorRate).toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Logs by Level</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={logLevelData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {logLevelData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Top Log Sources</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={logSourceData} layout="vertical">
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Log Volume Over Time</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeriesData}>
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="volume" stroke="#3B82F6" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Log Viewer */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Log Entries</CardTitle>
                <div className="flex space-x-2">
                  {Object.entries(analyticsData.logsByLevel).map(
                    ([level, count]) => (
                      <button
                        key={level}
                        onClick={() =>
                          setSelectedLevel(
                            selectedLevel === level ? null : level
                          )
                        }
                        className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm ${
                          selectedLevel === level
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200"
                        }`}
                      >
                        <LogLevelBadge level={level} />
                        <span>{count}</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  placeholder="Search logs by message or source..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <Search
                  className="absolute -mt-8 ml-3 text-gray-400"
                  size={20}
                />
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 text-left">
                        <button
                          onClick={() =>
                            setSortConfig((prev) => ({
                              key: "timestamp",
                              direction:
                                prev.direction === "asc" ? "desc" : "asc",
                            }))
                          }
                          className="flex items-center space-x-
1"
                        >
                          Timestamp
                          {sortConfig.direction === "asc" ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                        </button>
                      </th>
                      <th className="p-3 text-left">Level</th>
                      <th className="p-3 text-left">Source</th>
                      <th className="p-3 text-left">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log, index) => (
                      <tr
                        key={index}
                        className="border-t hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedLog(log)}
                      >
                        <td className="p-3">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="p-3">
                          <LogLevelBadge level={log.level} />
                        </td>
                        <td className="p-3">{log.source}</td>
                        <td className="p-3 truncate max-w-xs">{log.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {selectedLog && (
        <LogDetailsModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
};

export default LoggingDashboard;
