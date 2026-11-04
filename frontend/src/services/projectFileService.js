import api from "../api/axios";

// 1. Create File (Lead Won form)
export const createProjectFile = async (data) => {
  const response = await api.post("/files/create", data);
  return response.data;
};

// 2. Get User Queue (Pending/Hold/Submitted/Cancelled)
export const getMyQueue = async () => {
  const response = await api.get("/files/my-queue");
  return response.data;
};

// 3. Get Single File Detail with Timeline, Payments & Docs
export const getFileDetail = async (fileId) => {
  const response = await api.get(`/files/${fileId}`);
  return response.data;
};

// 4. Perform Stage Action (Submit, Hold, Cancel, Yes, No)
export const performStageAction = async (fileId, payload) => {
  const response = await api.post(`/files/${fileId}/stage-action`, payload);
  return response.data;
};

// 5. Get Sales Live Tracker
export const getSalesTracker = async (leadId) => {
  const response = await api.get(`/files/lead/${leadId}/tracker`);
  return response.data;
};

// 6. Add Payment Entry
export const addProjectPayment = async (fileId, payload) => {
  const response = await api.post(`/files/${fileId}/payment`, payload);
  return response.data;
};

// 7. Verify Payment (Accounts / Admin Gate)
export const verifyProjectPayment = async (paymentId) => {
  const response = await api.patch(`/files/payment/${paymentId}/verify`);
  return response.data;
};

// 8. Upload Document with Multer
export const uploadProjectDocument = async (fileId, formData) => {
  const response = await api.post(`/files/${fileId}/document`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

// 9. Get Sales Won Files (For Salesperson My Orders page)
export const getSalesWonFiles = async () => {
  const response = await api.get("/files/sales/won-files");
  return response.data;
};

// 10. Get Dashboard Analytics & Funnel Stats
export const getDashboardStats = async () => {
  const response = await api.get("/files/dashboard/stats");
  return response.data;
};

// 11. Toggle Payment Clear/Unclear (Accounts / Ashok)
export const togglePaymentClear = async (paymentId) => {
  const response = await api.patch(`/files/payment/${paymentId}/toggle-clear`);
  return response.data;
};

// 12. Add Project Expense (Accounts / Ashok)
export const addProjectExpense = async (fileId, payload) => {
  const response = await api.post(`/files/${fileId}/expense`, payload);
  return response.data;
};

// 13. Get Project Expenses
export const getProjectExpenses = async (fileId) => {
  const response = await api.get(`/files/${fileId}/expenses`);
  return response.data;
};

// 14. Toggle Expense Clear/Unclear
export const toggleExpenseClear = async (expenseId) => {
  const response = await api.patch(`/files/expense/${expenseId}/toggle-clear`);
  return response.data;
};

// 15. Super Admin Initial Rate Approval (Pawan)
export const updateRateApproval = async (fileId, payload) => {
  const response = await api.patch(`/files/${fileId}/rate-approval`, payload);
  return response.data;
};

// 16. Get All Project Documents across files (Repository)
export const getAllProjectDocuments = async (params = {}) => {
  const response = await api.get("/files/documents/all", { params });
  return response.data;
};



