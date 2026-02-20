import axios from 'axios';

const API_URL = 'http://localhost:8080/api/users';

// Fetch a user's profile (used by Profile.jsx)
export const getUserProfile = (userId) => {
    return axios.get(`${API_URL}/${userId}`);
};

// Alias used in MainLayout
export const getUserDetails = (userId) => {
    return axios.get(`${API_URL}/${userId}`);
};

// Update a user's profile data
export const updateUserProfile = (userId, userData) => {
    return axios.put(`${API_URL}/${userId}`, userData);
};

// Fetch notifications for a user
export const getNotifications = (userId) => {
    return axios.get(`${API_URL}/${userId}/notifications`);
};

// Mark a single notification as read
export const markNotificationRead = (notifId) => {
    return axios.put(`${API_URL}/notifications/${notifId}/read`);
};

// Redeem a reward item with CC coins
export const redeemReward = (userId, cost, itemName) => {
    return axios.post(`${API_URL}/${userId}/redeem`, { cost, itemName });
};
