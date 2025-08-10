import axios from "axios";
import { API_BASE } from "@/lib/constants";

// Fetch all programs for the coach
export const fetchCoachPrograms = async (token: string) => {
  const res = await axios.get(`${API_BASE}/programs/coach`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data.programs;
};
