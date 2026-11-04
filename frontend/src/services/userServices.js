import api from "../api/axios";

export const getUsers = (params) => api.get("/users", { params });

export const getUserStats = () => api.get("/users/stats");

export const createUser = (data) => api.post("/users", data);

export const getUserById = (id) => api.get(`/users/${id}`);

export const updateUser = (id, data) => api.put(`/users/${id}`, data);

export const updateUserStatus = (id, data) =>
    api.patch(`/users/status/${id}`, data);

export const deleteUser = (id) => api.delete(`/users/${id}`);

// 🟢 Manager Team Fetch Method Add Kar Diya
export const getTeamMembers = async () => {
    const response = await api.get("/users/team");
    return response.data;
};

// 🟢 Manager Assignments Summary (Super Admin)
export const getManagerAssignmentsSummary = async () => {
    const response = await api.get("/users/manager-assignments");
    return response.data;
};

// 🟢 Manager Assigned Leads (Super Admin Drill-Down)
export const getManagerAssignedLeads = async (managerId, params = {}) => {
    const response = await api.get(`/users/manager-assignments/${managerId}/leads`, { params });
    return response.data;
};
