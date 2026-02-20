import axios from "axios";

const API_URL = "http://localhost:8080/api/chat";

/**
 * Sends a citizen's message to the GeoCivic chatbot backend.
 * @param {string} message   - The text typed by the citizen.
 * @param {number|null} userId - The logged-in citizen's ID (for ticket ownership checks).
 */
export const sendChatMessage = (message, userId = null) => {
  return axios.post(API_URL, { message, userId });
};
