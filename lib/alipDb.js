import axios from "axios";

const BASE = process.env.ALIP_DB_BASE_URL; // e.g. http://alipai-db.clutch.web.id
const headers = () => ({
  "x-api-key": process.env.ALIP_DB_API_KEY,
  "Content-Type": "application/json"
});

export const alipDb = {
  addNumber: (number) =>
    axios.post(`${BASE}/api/v1/numbers/add`, { number }, { headers: headers() }),

  deleteNumber: (number) =>
    axios.post(`${BASE}/api/v1/numbers/delete`, { number }, { headers: headers() }),

  addReseller: (username, password) =>
    axios.post(
      `${BASE}/api/v1/resellers/add`,
      { username, password },
      { headers: headers() }
    ),

  addPt: (username, password) =>
    axios.post(
      `${BASE}/api/v1/super-resellers/add`,
      { username, password },
      { headers: headers() }
    ),

  upgradeResellerToPt: (username) =>
    axios.post(
      `${BASE}/api/v1/resellers/upgrade-to-pt`,
      { username },
      { headers: headers() }
    )
};
