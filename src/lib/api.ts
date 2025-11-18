const resolveDefaultApiBase = () => {
  if (typeof window === "undefined") {
    return "http://localhost:5050/api";
  }

  const protocol = window.location.protocol === "https:" ? "https:" : "http:";
  const hostname = window.location.hostname || "localhost";
  const port = window.location.protocol === "https:" ? "5051" : "5050";
  return `${protocol}//${hostname}:${port}/api`;
};

const API_BASE_URL = import.meta.env.VITE_API_URL ?? resolveDefaultApiBase();

// Log API URL in development for debugging
if (import.meta.env.DEV) {
  console.log("API Base URL:", API_BASE_URL);
}

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    let errorBody;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = {};
    }
    const message = errorBody.message ?? response.statusText ?? "Request failed";
    throw new Error(message);
  }
  if (response.status === 204) {
    return null;
  }
  try {
    return await response.json();
  } catch (error) {
    // If response is empty or invalid JSON, return null
    return null;
  }
};

const fetchWithErrorHandling = async (url: string, options?: RequestInit) => {
  try {
    const response = await fetch(url, options);
    return await handleResponse(response);
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error("Network error: Unable to connect to server. Please ensure the backend server is running on port 5050.");
    }
    throw error;
  }
};

// Designations
export const fetchDesignations = () =>
  fetch(`${API_BASE_URL}/designations`).then(handleResponse);

export const createDesignation = (payload: { name: string; department?: string }) =>
  fetch(`${API_BASE_URL}/designations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(handleResponse);

export const updateDesignation = (
  id: string,
  payload: { name?: string; department?: string },
) =>
  fetch(`${API_BASE_URL}/designations/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(handleResponse);

export const deleteDesignation = (id: string) =>
  fetch(`${API_BASE_URL}/designations/${id}`, {
    method: "DELETE",
  }).then(handleResponse);

// Employees
export const fetchEmployees = () =>
  fetch(`${API_BASE_URL}/employees`).then(handleResponse);

export const fetchEmployee = (id: string) =>
  fetch(`${API_BASE_URL}/employees/${id}`).then(handleResponse);

export const createEmployee = <T extends Record<string, unknown>>(payload: T) =>
  fetch(`${API_BASE_URL}/employees`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(handleResponse);

export const updateEmployee = <T extends Record<string, unknown>>(id: string, payload: T) =>
  fetch(`${API_BASE_URL}/employees/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(handleResponse);

export const deleteEmployee = (id: string) =>
  fetch(`${API_BASE_URL}/employees/${id}`, {
    method: "DELETE",
  }).then(handleResponse);

// Leave Requests
export const fetchLeaves = () =>
  fetch(`${API_BASE_URL}/leaves`).then(handleResponse);

export const createLeave = <T extends Record<string, unknown>>(payload: T) =>
  fetch(`${API_BASE_URL}/leaves`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(handleResponse);

export const updateLeave = <T extends Record<string, unknown>>(id: string, payload: T) =>
  fetch(`${API_BASE_URL}/leaves/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(handleResponse);

export const deleteLeave = (id: string) =>
  fetch(`${API_BASE_URL}/leaves/${id}`, {
    method: "DELETE",
  }).then(handleResponse);

export const approveLeave = (id: string, approver?: string) =>
  fetch(`${API_BASE_URL}/leaves/${id}/approve`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ approver }),
  }).then(handleResponse);

export const rejectLeave = (id: string, approver?: string) =>
  fetch(`${API_BASE_URL}/leaves/${id}/reject`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ approver }),
  }).then(handleResponse);

// Holidays
export const fetchHolidays = async () => {
  try {
    const response = await fetchWithErrorHandling(`${API_BASE_URL}/holidays`);
    if (Array.isArray(response)) {
      return response;
    }
    console.warn("fetchHolidays: Expected array but got:", response);
    return [];
  } catch (error) {
    console.error("fetchHolidays error:", error);
    if (error instanceof Error && (error.message.includes("Network error") || error.message.includes("fetch"))) {
      throw error;
    }
    return [];
  }
};

export const createHoliday = (payload: { name: string; date: string; type: string }) =>
  fetchWithErrorHandling(`${API_BASE_URL}/holidays`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const updateHoliday = (id: string, payload: { name?: string; date?: string; type?: string }) =>
  fetchWithErrorHandling(`${API_BASE_URL}/holidays/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const deleteHoliday = (id: string) =>
  fetchWithErrorHandling(`${API_BASE_URL}/holidays/${id}`, {
    method: "DELETE",
  });

// Events
export const fetchEvents = async () => {
  try {
    const response = await fetchWithErrorHandling(`${API_BASE_URL}/events`);
    if (Array.isArray(response)) {
      return response;
    }
    console.warn("fetchEvents: Expected array but got:", response);
    return [];
  } catch (error) {
    console.error("fetchEvents error:", error);
    if (error instanceof Error && (error.message.includes("Network error") || error.message.includes("fetch"))) {
      throw error;
    }
    return [];
  }
};

export const createEvent = (payload: { name: string; date: string; location: string; description?: string; status?: string }) =>
  fetchWithErrorHandling(`${API_BASE_URL}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const updateEvent = (id: string, payload: { name?: string; date?: string; location?: string; description?: string; status?: string }) =>
  fetchWithErrorHandling(`${API_BASE_URL}/events/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const deleteEvent = (id: string) =>
  fetchWithErrorHandling(`${API_BASE_URL}/events/${id}`, {
    method: "DELETE",
  });

// Attendance
export const fetchAttendance = (params?: {
  employeeId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.employeeId) queryParams.append("employeeId", params.employeeId);
  if (params?.date) queryParams.append("date", params.date);
  if (params?.startDate) queryParams.append("startDate", params.startDate);
  if (params?.endDate) queryParams.append("endDate", params.endDate);
  if (params?.status && params.status !== "all") queryParams.append("status", params.status);
  const query = queryParams.toString();
  return fetchWithErrorHandling(`${API_BASE_URL}/attendance${query ? `?${query}` : ""}`).catch((error) => {
    console.error("fetchAttendance error:", error);
    // Return empty array on error instead of throwing
    if (error.message.includes("Network error")) {
      throw error;
    }
    return [];
  });
};

export const createAttendance = (payload: { employeeId: string; date: string; checkIn?: string; checkOut?: string; workHours?: string; status?: string; location?: string }) =>
  fetch(`${API_BASE_URL}/attendance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(handleResponse);

export const updateAttendance = (id: string, payload: { checkIn?: string; checkOut?: string; workHours?: string; status?: string; location?: string }) =>
  fetch(`${API_BASE_URL}/attendance/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(handleResponse);

export const deleteAttendance = (id: string) =>
  fetch(`${API_BASE_URL}/attendance/${id}`, {
    method: "DELETE",
  }).then(handleResponse);

export const checkIn = (employeeId: string, location?: string) =>
  fetchWithErrorHandling(`${API_BASE_URL}/attendance/checkin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ employeeId, location }),
  });

export const checkOut = (employeeId: string) =>
  fetchWithErrorHandling(`${API_BASE_URL}/attendance/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ employeeId }),
  });

export const getTodayAttendance = (employeeId: string) =>
  fetchWithErrorHandling(`${API_BASE_URL}/attendance/today/${employeeId}`).catch((error) => {
    // If it's a 404 or no record found, return null instead of throwing
    if (error.message.includes("not found") || error.message.includes("404")) {
      return null;
    }
    // For network errors, still throw
    if (error.message.includes("Network error")) {
      throw error;
    }
    // For other errors, return null (no attendance record for today)
    return null;
  });

// Auth
export const employeeLogin = (payload: { email: string; password: string }) =>
  fetchWithErrorHandling(`${API_BASE_URL}/auth/employee`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const requestPasswordReset = (email: string) =>
  fetchWithErrorHandling(`${API_BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

export const resetPassword = (payload: { email: string; token: string; password: string }) =>
  fetchWithErrorHandling(`${API_BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

// Worksheet APIs (Employee)
export const createOrGetWorksheet = (employeeId: string) =>
  fetchWithErrorHandling(`${API_BASE_URL}/worksheet/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ employeeId }),
  });

export const addTaskToWorksheet = (worksheetId: string, task: { title: string; description?: string; start_time: string; end_time: string; remarks?: string; clientId?: string; typeOfWorkId?: string }) =>
  fetchWithErrorHandling(`${API_BASE_URL}/worksheet/add-task/${worksheetId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(task),
  });

export const updateTaskInWorksheet = (worksheetId: string, taskId: string, task: { title?: string; description?: string; start_time?: string; end_time?: string; status?: string; remarks?: string; clientId?: string; typeOfWorkId?: string }) =>
  fetchWithErrorHandling(`${API_BASE_URL}/worksheet/update-task/${worksheetId}/${taskId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(task),
  });

export const removeTaskFromWorksheet = (worksheetId: string, taskId: string) =>
  fetchWithErrorHandling(`${API_BASE_URL}/worksheet/remove-task/${worksheetId}/${taskId}`, {
    method: "DELETE",
  });

export const updateWorksheetDetails = (worksheetId: string, data: { clientId?: string; typeOfWorkId?: string }) =>
  fetchWithErrorHandling(`${API_BASE_URL}/worksheet/update/${worksheetId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

export const submitWorksheet = (worksheetId: string) =>
  fetchWithErrorHandling(`${API_BASE_URL}/worksheet/submit/${worksheetId}`, {
    method: "POST",
  });

export const getMyWorksheets = (employeeId: string) =>
  fetchWithErrorHandling(`${API_BASE_URL}/worksheet/my?employeeId=${employeeId}`);

export const getWorksheetByDate = (employeeId: string, date: string) =>
  fetchWithErrorHandling(`${API_BASE_URL}/worksheet/my/${date}?employeeId=${employeeId}`);

// Worksheet APIs (Admin)
export const getAllWorksheets = (params?: { date?: string; employeeId?: string; status?: string; startDate?: string; endDate?: string; clientId?: string; typeOfWorkId?: string }) => {
  const queryParams = new URLSearchParams();
  if (params?.date) queryParams.append("date", params.date);
  if (params?.employeeId) queryParams.append("employeeId", params.employeeId);
  if (params?.status) queryParams.append("status", params.status);
  if (params?.startDate) queryParams.append("startDate", params.startDate);
  if (params?.endDate) queryParams.append("endDate", params.endDate);
  if (params?.clientId) queryParams.append("clientId", params.clientId);
  if (params?.typeOfWorkId) queryParams.append("typeOfWorkId", params.typeOfWorkId);
  const query = queryParams.toString();
  return fetchWithErrorHandling(`${API_BASE_URL}/admin/worksheet/all${query ? `?${query}` : ""}`);
};

export const getWorksheetsByEmployee = (employeeId: string) =>
  fetchWithErrorHandling(`${API_BASE_URL}/admin/worksheet/${employeeId}`);

export const approveWorksheetAdmin = (worksheetId: string, admin_comments?: string) =>
  fetchWithErrorHandling(`${API_BASE_URL}/admin/worksheet/approve/${worksheetId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ admin_comments }),
  });

export const rejectWorksheetAdmin = (worksheetId: string, admin_comments: string) =>
  fetchWithErrorHandling(`${API_BASE_URL}/admin/worksheet/reject/${worksheetId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ admin_comments }),
  });

export const reopenWorksheetAdmin = (worksheetId: string, admin_comments?: string) =>
  fetchWithErrorHandling(`${API_BASE_URL}/admin/worksheet/reopen/${worksheetId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ admin_comments }),
  });

export const getWorksheetStats = () =>
  fetchWithErrorHandling(`${API_BASE_URL}/admin/worksheet/stats/summary`);

// Admin Invoice APIs
export const fetchClientTasksForInvoice = (
  clientId: string,
  params?: { startDate?: string; endDate?: string; employeeId?: string; status?: string },
) => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append("startDate", params.startDate);
  if (params?.endDate) queryParams.append("endDate", params.endDate);
  if (params?.employeeId && params.employeeId !== "all") queryParams.append("employeeId", params.employeeId);
  if (params?.status && params.status !== "all") queryParams.append("status", params.status);
  const query = queryParams.toString();
  return fetchWithErrorHandling(
    `${API_BASE_URL}/admin/tasks/client/${clientId}${query ? `?${query}` : ""}`,
  );
};

export const createInvoiceFromTasks = (payload: {
  client_id: string;
  task_ids: Array<{ worksheetId: string; taskId: string }>;
}) =>
  fetchWithErrorHandling(`${API_BASE_URL}/admin/invoice/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const fetchInvoiceById = (invoiceId: string) =>
  fetchWithErrorHandling(`${API_BASE_URL}/admin/invoice/view/${invoiceId}`);

export const updateInvoiceById = (
  invoiceId: string,
  payload: { tasks: any[]; tax?: number; notes?: string },
) =>
  fetchWithErrorHandling(`${API_BASE_URL}/admin/invoice/update/${invoiceId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const finalizeInvoiceById = (invoiceId: string) =>
  fetchWithErrorHandling(`${API_BASE_URL}/admin/invoice/finalize/${invoiceId}`, {
    method: "POST",
  });

export const fetchInvoicesForClient = (clientId: string) =>
  fetchWithErrorHandling(`${API_BASE_URL}/admin/invoice/client/${clientId}`);

// Client Master APIs
export const fetchClients = () =>
  fetchWithErrorHandling(`${API_BASE_URL}/clients`);

export const fetchClient = (id: string) =>
  fetchWithErrorHandling(`${API_BASE_URL}/clients/${id}`);

export const createClient = (client: any) =>
  fetchWithErrorHandling(`${API_BASE_URL}/clients`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(client),
  });

export const updateClient = (id: string, client: any) =>
  fetchWithErrorHandling(`${API_BASE_URL}/clients/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(client),
  });

export const deleteClient = (id: string) =>
  fetchWithErrorHandling(`${API_BASE_URL}/clients/${id}`, {
    method: "DELETE",
  });

// Type of Work Master APIs
export const fetchTypesOfWork = () =>
  fetchWithErrorHandling(`${API_BASE_URL}/type-of-work`);

export const fetchTypeOfWork = (id: string) =>
  fetchWithErrorHandling(`${API_BASE_URL}/type-of-work/${id}`);

export const createTypeOfWork = (typeOfWork: any) =>
  fetchWithErrorHandling(`${API_BASE_URL}/type-of-work`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(typeOfWork),
  });

export const updateTypeOfWork = (id: string, typeOfWork: any) =>
  fetchWithErrorHandling(`${API_BASE_URL}/type-of-work/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(typeOfWork),
  });

export const deleteTypeOfWork = (id: string) =>
  fetchWithErrorHandling(`${API_BASE_URL}/type-of-work/${id}`, {
    method: "DELETE",
  });

