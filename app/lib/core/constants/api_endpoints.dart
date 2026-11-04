class ApiEndpoints {
  // Set to true for Local development, false for Live VPS
  static const bool isLocal = false;

  // Base URL: Local Wi-Fi IP or Live Domain
  static const String baseUrl = isLocal 
      ? "http://10.27.146.188:5000/api" 
      : "https://smartsunpower.tech/api";

  // Root Server URL without '/api'
  static String get serverBaseUrl {
    if (baseUrl.endsWith('/api')) {
      return baseUrl.substring(0, baseUrl.length - 4);
    }
    return baseUrl;
  }

  // Helper to ensure full reachable URL for documents and uploads
  static String getFullFileUrl(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    final cleanPath = path.startsWith('/') ? path : '/$path';
    return '$serverBaseUrl$cleanPath';
  }

  
  // Helper to resolve full profile image URL
  static String getProfileImageUrl(String? path) {
    if (path == null || path.isEmpty || path == 'null' || path == 'undefined') {
      return '';
    }
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    String cleanPath = path.startsWith('/') ? path.substring(1) : path;
    if (!cleanPath.startsWith('uploads/profiles/')) {
      if (cleanPath.startsWith('uploads/')) {
        cleanPath = cleanPath.replaceFirst('uploads/', 'uploads/profiles/');
      } else {
        cleanPath = 'uploads/profiles/$cleanPath';
      }
    }
    return '$serverBaseUrl/$cleanPath';
  }

  // Helper to resolve company logo URL
  static String getCompanyLogoUrl(String? path) {
    if (path == null || path.isEmpty || path == 'null' || path == 'undefined') {
      return '';
    }
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    String cleanPath = path.startsWith('/') ? path.substring(1) : path;
    if (!cleanPath.startsWith('uploads/company/')) {
      if (cleanPath.startsWith('uploads/')) {
        cleanPath = cleanPath.replaceFirst('uploads/', 'uploads/company/');
      } else {
        cleanPath = 'uploads/company/$cleanPath';
      }
    }
    return '$serverBaseUrl/$cleanPath';
  }

  // Auth Endpoints
  static const String login = "/auth/login";
  static const String logout = "/auth/logout";
  static const String forgotPassword = "/auth/forgot-password";
  static const String resetPassword = "/auth/reset-password";

  // 🟢 PROFILE ENDPOINTS
  static const String profile = "/profile";
  static const String updateProfile = "/profile";
  static const String changePassword = "/profile/change-password";

  // 🟢 DASHBOARD ENDPOINTS
  static const String salesDashboard = "/dashboard/sales";
  static const String managerDashboard = "/dashboard/manager";
  static const String adminDashboard = "/dashboard/admin";

  // Operations
  static const String leads = "/leads";
  static const String assignLead = "/leads/assign";
  static const String followups = "/leads/followups";
  static const String users = "/users";
  static const String managerAssignments = "/users/manager-assignments";
  static const String closedReport = "/leads/reports/closed";
  static const String statusLogs = "/status-logs";
  static const String checkDuplicate = "/leads/check-duplicate";
  static const String appUpdate = "/settings/app-update";

  // 🟢 PHASE 2: BACK-OFFICE OPERATIONS ENDPOINTS
  static const String filesCreate = "/files/create";
  static const String filesMyQueue = "/files/my-queue";
  static const String filesLeadTracker = "/files/lead"; // /files/lead/:leadId/tracker
  static const String filesDetail = "/files";           // /files/:fileId
  static const String filesStageAction = "/files";      // /files/:fileId/stage-action
  static const String filesPayment = "/files";          // /files/:fileId/payment
  static const String filesDocument = "/files";         // /files/:fileId/document
  static const String filesRateApproval = "/files";     // /files/:fileId/rate-approval
  static const String filesExpense = "/files";          // /files/:fileId/expense
  static const String filesDocumentsAll = "/files/documents/all"; // All KYC & Project Documents
}
