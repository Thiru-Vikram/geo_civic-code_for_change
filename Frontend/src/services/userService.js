import axios from 'axios';

const API_URL = 'http://localhost:8080/api/users';

export const getUserProfile = (id) => {
    return axios.get(`${API_URL}/${id}`);
};

export const updateUserProfile = (id, userData) => {
    return axios.put(`${API_URL}/${id}`, userData);
};

export const getNotifications = (userId) => {
    return axios.get(`http://localhost:8080/api/notifications/user/${userId}`);
};

export const markNotificationRead = (notifId) => {
    return axios.put(`http://localhost:8080/api/notifications/${notifId}/read`);
};
