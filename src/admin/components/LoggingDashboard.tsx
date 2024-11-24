"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useLogger } from "../query-hooks";
import { SpinnerPage } from "./re:components";

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  metadata: Record<string, any>;
  correlationId: string;
  source: string;
}

interface AnalyticsData {
  totalLogs: number;
  logsByLevel: Record<string, number>;
  logsBySource: Record<string, number>;
  errorRate: number;
  averageResponseTime: number;
  lastAnalyticsUpdate: string;
}

const LogLevelBadge = ({ level }: { level: string }) => {
  const configs = {
    INFO: { class: "bg-blue-100 text-blue-800", icon: Info },
    WARN: { class: "bg-yellow-100 text-yellow-800", icon: AlertTriangle },
    ERROR: { class: "bg-red-100 text-red-800", icon: AlertCircle },
    DEBUG: { class: "bg-green-100 text-green-800", icon: Bug },
    ALL: { class: "bg-gray-100", icon: Filter },
  };
  const { class: badgeClass, icon: IconComponent } = configs[
    level as keyof typeof configs
  ] || { class: "bg-gray-100", icon: Info };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${badgeClass}`}
    >
      {IconComponent && <IconComponent size={12} />}
      {level}
    </span>
  );
};

const LogDetailsModal = ({
  log,
  onClose,
}: {
  log: LogEntry;
  onClose: () => void;
}) => {
  const formatJSON = (obj: Record<string, any>) => {
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
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Source</h3>
              <p>{log.source}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Correlation ID</h3>
              <p>{log.correlationId}</p>
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

const parseLogs = (logs: any[]) => {
  return logs
    .map((log) => {
      try {
        const timestampEnd = log.indexOf("]");
        const timestamp = log.substring(1, timestampEnd);
        const rest = log.substring(timestampEnd + 2);
        const levelEndIndex = rest.indexOf(" ");
        const level = rest.substring(0, levelEndIndex);
        const jsonString = rest.substring(levelEndIndex + 1);
        const parsedJson = JSON.parse(jsonString);
        const { message, metadata, correlationId, source } = parsedJson;

        return {
          timestamp,
          level,
          message,
          metadata,
          correlationId,
          source,
        };
      } catch (error) {
        console.error("Error parsing log:", error);
        return null;
      }
    })
    .filter(Boolean);
};

const LoggingDashboard = () => {
  const { data, isSuccess, isLoading } = useLogger();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [sortConfig, setSortConfig] = useState({
    key: "timestamp",
    direction: "desc",
  });
  const [timeRange, setTimeRange] = useState("1h");
  const [isLive, setIsLive] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage] = useState(15);

  useEffect(() => {
    if (isSuccess && data) {
      const analyticsLog = JSON.parse(data.logs[0].split("] ANALYTICS ")[1]);
      setAnalyticsData(analyticsLog);
      const parsedLogs = parseLogs(data.logs);
      setLogs(parsedLogs.filter((log): log is LogEntry => log !== null));
    }
  }, [isSuccess, data]);

  const logLevelData = useMemo(() => {
    return analyticsData
      ? Object.entries(analyticsData.logsByLevel).map(([name, value]) => ({
          name,
          value,
        }))
      : [];
  }, [analyticsData]);

  const COLORS = ["#3B82F6", "#FBBF24", "#EF4444", "#10B981"];

  const logSourceData = useMemo(() => {
    return analyticsData
      ? Object.entries(analyticsData.logsBySource)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10)
      : [];
  }, [analyticsData]);

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
          ? log?.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log?.source?.toLowerCase().includes(searchTerm.toLowerCase())
          : true;

        const matchesLevel = selectedLevel ? log.level === selectedLevel : true;
        console.log(selectedLevel);
        console.log(log.level);

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

  useEffect(() => {
    if (isLive) {
      const interval = setInterval(() => {
        console.log("Fetching new logs...");
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isLive]);

  const indexOfLastLog = currentPage * logsPerPage;
  console.log(indexOfLastLog);
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  console.log(indexOfFirstLog);
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  console.log(currentLogs);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (isLoading) {
    return <SpinnerPage />;
  }

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
          {analyticsData && (
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
                  Avg Response Time
                </h3>
                <p className="text-2xl font-bold text-green-900">
                  {analyticsData.averageResponseTime.toFixed(2)}ms
                </p>
              </div>
            </div>
          )}

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

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Log Entries</CardTitle>
                <div className="flex space-x-2">
                  {analyticsData &&
                    Object.entries(analyticsData.logsByLevel).map(
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
              <div className="mb-4 flex items-center space-x-2">
                <div className="relative flex-grow">
                  <Input
                    placeholder="Search logs by message or source..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                  />
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                </div>
                <Button
                  onClick={() => {
                    setSearchTerm("");
                    setCurrentPage(1);
                  }}
                  variant="outline"
                >
                  Clear
                </Button>
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
                          className="flex items-center space-x-1"
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
                    {currentLogs.map((log, index) => (
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

              <div className="mt-4 flex justify-between items-center">
                <div>
                  Showing {indexOfFirstLog + 1} to{" "}
                  {Math.min(indexOfLastLog, filteredLogs.length)} of{" "}
                  {filteredLogs.length} entries
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    variant="outline"
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (number) => (
                      <Button
                        key={number}
                        onClick={() => paginate(number)}
                        variant={currentPage === number ? "default" : "outline"}
                      >
                        {number}
                      </Button>
                    )
                  )}
                  <Button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    variant="outline"
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
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
