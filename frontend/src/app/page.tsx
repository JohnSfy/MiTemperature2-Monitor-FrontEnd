"use client"
import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import "./globals.css"

// Define the shape of the sensor data
interface Sensor {
  timestamp: string
  sensor_name: string
  temperature: number
  humidity: number
  battery_percent: number
  rssi: number
  raspberry_pi_temperature: number // Added this field
}

export default function Page() {
  const [sensors, setSensors] = useState<Sensor[]>([])
  const [selectedRoom, setSelectedRoom] = useState("All")
  const [latestPiTemperature, setLatestPiTemperature] = useState<number | null>(null) // Store the last raspberry_pi_temperature

  useEffect(() => {
    async function fetchData() {
      const response = await fetch('https://lazarosadamos.site/sensors');
      const data = await response.json()
      setSensors(data)

      // Find the most recent raspberry_pi_temperature measurement
      const latestPi = data.reduce(
        (latest: Sensor, sensor: Sensor) => {
          if (!latest || new Date(sensor.timestamp) > new Date(latest.timestamp)) {
            return sensor
          }
          return latest
        },
        null as Sensor | null,
      )
      console.log(JSON.stringify(latestPi))
      setLatestPiTemperature(latestPi?.raspberry_pi_temperature || null)
    }
    fetchData()
  }, [])

  // Sort sensors by timestamp (latest first)
  const sortedSensors = [...sensors].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  // Get the most recent sensor data for each room
  const mostRecentData = sortedSensors.filter(
    (sensor: Sensor, index, self) => index === self.findIndex((s) => s.sensor_name === sensor.sensor_name),
  )

  // Filter for selected room (Table view)
  const filteredData =
    selectedRoom === "All"
      ? mostRecentData
      : mostRecentData.filter((sensor: Sensor) => sensor.sensor_name === selectedRoom)

  // Get unique room names for the dropdown
  const rooms = Array.from(new Set(sensors.map((s: Sensor) => s.sensor_name)))

  // Define colors for rooms for the charts
  const roomColors = [
    "#2563EB",
    "#F59E0B",
    "#10B981",
    "#3B82F6",
    "#EF4444",
    "#9B1D20",
    "#6B7280",
    "#8B5CF6",
    "#EC4899",
    "#4ADE80",
  ]

  // Group data by room for charting
  const roomsData = rooms.reduce(
    (acc, room) => {
      acc[room] = sensors.filter((sensor) => sensor.sensor_name === room)
      return acc
    },
    {} as Record<string, Sensor[]>,
  )

  // Get filtered data for the selected room
  const selectedRoomData = selectedRoom === "All" ? sortedSensors : roomsData[selectedRoom]

  // Sort the data by timestamp in ascending order (oldest on the left, newest on the right)
  const sortedDataByTime = selectedRoomData.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  )

  return (
    <div className="sensor-dashboard w-full max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">📊 Ενδείξεις Θερμομέτρων Mi Temperature 2</h1>

      {/* Display the latest Raspberry Pi temperature */}
      <div className="latest-pi-temp text-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">🖥️ Θερμοκρασία Raspberry Pi</h2>
        <p className="text-xl font-light text-gray-600">
          {latestPiTemperature !== null
            ? `${latestPiTemperature} °C`
            : "Δεν υπάρχουν διαθέσιμα δεδομένα θερμοκρασίας Raspberry Pi"}
        </p>
      </div>

      {/* Filter Dropdown */}
      <div className="filter-dropdown w-full max-w-xs mx-auto mb-6">
        <select onChange={(e) => setSelectedRoom(e.target.value)} className="w-full p-2 rounded-md">
          <option value="All" className="text-black">
            Όλοι οι Χώροι
          </option>
          {rooms.map((room) => (
            <option key={room} value={room} className="text-black">
              {room}
            </option>
          ))}
        </select>
      </div>

      {/* Data Grid for the selected room (Most recent data) */}
      <div className="data-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.map((sensor: Sensor, index) => (
          <div
            key={index}
            className="sensor-card bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-xl shadow-lg transform transition duration-300 hover:scale-105 hover:shadow-xl hover:from-blue-700 hover:to-indigo-700"
          >
            <div className="space-y-4 text-white">
              {/* Room Info */}
              <div className="sensor-info flex justify-between">
                <strong className="font-semibold">Χώρος:</strong>
                <span className="font-light">{sensor.sensor_name}</span>
              </div>

              {/* Temperature Info */}
              <div className="sensor-info flex justify-between">
                <strong className="font-semibold">Θερμοκρασία (°C):</strong>
                <span className="font-light">{sensor.temperature}</span>
              </div>

              {/* Humidity Info */}
              <div className="sensor-info flex justify-between">
                <strong className="font-semibold">Υγρασία (%):</strong>
                <span className="font-light">{sensor.humidity}</span>
              </div>

              {/* Battery Info */}
              <div className="sensor-info flex justify-between">
                <strong className="font-semibold">Μπαταρία (%):</strong>
                <span className="font-light">{sensor.battery_percent}</span>
              </div>

              {/* RSSI Info */}
              <div className="sensor-info flex justify-between">
                <strong className="font-semibold">RSSI:</strong>
                <span className="font-light">{sensor.rssi}</span>
              </div>

              {/* Timestamp Info */}
              <div className="sensor-info flex justify-between">
                <strong className="font-semibold">Ώρα Μέτρησης:</strong>
                <span className="font-light">{new Date(sensor.timestamp).toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section (Showing only selected room data in charts) */}
      <div className="chart-section mt-8 w-full">
        {/* Temperature Line Chart for selected room */}
        <div className="chart-container">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">📈 Διάγραμμα Θερμοκρασίας</h2>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sortedDataByTime}>
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(t) => new Date(t).toLocaleString()}
                  interval="preserveStartEnd"
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(t) => new Date(t).toLocaleString()}
                  contentStyle={{
                    backgroundColor: "#000",
                    color: "#fff",
                    borderRadius: "5px",
                    padding: "10px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  name={selectedRoom}
                  data={sortedDataByTime}
                  stroke={roomColors[0]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Humidity Levels Over Time Line Chart for selected room */}
        <div className="chart-container">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">💧 Διάγραμμα Υγρασίας</h2>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sortedDataByTime}>
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(t) => new Date(t).toLocaleString()}
                  interval="preserveStartEnd"
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(t) => new Date(t).toLocaleString()}
                  contentStyle={{
                    backgroundColor: "#000",
                    color: "#fff",
                    borderRadius: "5px",
                    padding: "10px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="humidity"
                  name={selectedRoom}
                  data={sortedDataByTime}
                  stroke={roomColors[1]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Battery Levels Over Time Line Chart for selected room */}
        <div className="chart-container">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">🔋 Διάγραμμα Μπαταρίας</h2>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sortedDataByTime}>
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(t) => new Date(t).toLocaleString()}
                  interval="preserveStartEnd"
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(t) => new Date(t).toLocaleString()}
                  contentStyle={{
                    backgroundColor: "#000",
                    color: "#fff",
                    borderRadius: "5px",
                    padding: "10px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="battery_percent"
                  name={selectedRoom}
                  data={sortedDataByTime}
                  stroke={roomColors[2]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
