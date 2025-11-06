// client/src/api/http.js
import axios from "axios";

const http = axios.create({
  baseURL: "http://localhost:3000", // backend port
  withCredentials: true,
});

export default http;