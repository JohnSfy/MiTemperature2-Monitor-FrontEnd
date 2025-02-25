import axios from 'axios';

export async function getSensorData() {
  try {
    const res = await axios.get('http://localhost:3000/sensors');
    return res.data;
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    return [];
  }
}
