const { db } = require("../config/db");

const {
  findLeadByMobile,
  createLead,
  getLeads,
  getLeadById,
  isLeadAccessibleByUser,
  getTeamFollowupsList,
  updateLead,
  updateLeadStatus,
  assignLead,
  addFollowup,
  getFollowups,
  getActivityLogs,
  deleteLead,
  bulkReassignLeads,
  bulkImportLeads,
  getLeadStatusLogs,
  getClosedLeadsReport,
  getFollowupsDirectory,
} = require("../models/leadModel");

const { isUserInManagerTeam } = require("../models/userModel");

const {
  notifyLeadAssigned,
  notifyLeadWon,
  notifyLeadLost,
  notifyStatusChanged,
  notifyBulkImport,
  notifyFollowupAdded,
  notifyLeadCreated,
} = require("../services/notificationService");

const ROLE_SUPER_ADMIN = 1;
const ROLE_MANAGER = 2;
const ROLE_SALES = 3;

// Sales sirf ye fields touch kar sakta hai apni lead pe — customer ka
// naam/number/email/address wagera nahi (data integrity ke liye Admin/Manager tak limited)
const SALES_EDITABLE_FIELDS = [
  "interest_status",
  "required_kw",
  "remark",
  "priority",
  "next_follow_up_date",
  "site_visit_date",
  "quotation_amount",
];

// ======================================
// Check Duplicate Lead (Mobile number lookup)
// ======================================
const checkDuplicateLeadController = async (req, res) => {
  try {
    const { mobile, exclude_id } = req.query;
    if (!mobile) {
      return res.status(400).json({ success: false, message: "Mobile number is required." });
    }
    const cleanMobile = String(mobile).replace(/\D/g, "").slice(-10);
    if (!cleanMobile || cleanMobile.length < 10) {
      return res.status(200).json({ success: true, is_duplicate: false, data: null });
    }

    const matched = await findLeadByMobile(cleanMobile, exclude_id || null);
    if (matched) {
      return res.status(200).json({
        success: true,
        is_duplicate: true,
        message: `Lead already exists with this mobile number: ${matched.lead_code} (${matched.customer_name})`,
        data: matched,
      });
    }

    return res.status(200).json({ success: true, is_duplicate: false, data: null });
  } catch (error) {
    console.error("checkDuplicateLeadController error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ======================================
// Create Lead
// ======================================
const createLeadController = async (req, res) => {
  try {
    const { customer_name, mobile_number, alternate_number, interest_status, required_kw, remark } = req.body;

    if (!customer_name || !mobile_number) {
      return res.status(400).json({ success: false, message: "Customer Name and Mobile Number are required." });
    }

    // 10-digit mobile verification & duplicate lead guard
    const cleanMobile = String(mobile_number).replace(/\D/g, "").slice(-10);
    if (!cleanMobile || cleanMobile.length !== 10) {
      return res.status(400).json({ success: false, message: "Please provide a valid 10-digit Mobile Number." });
    }

    // Check duplicate lead across system (regardless of role or assignment)
    const existingLead = await findLeadByMobile(cleanMobile);
    if (existingLead) {
      return res.status(409).json({
        success: false,
        is_duplicate: true,
        message: `Duplicate lead! Mobile number already registered with Lead Code ${existingLead.lead_code} (${existingLead.customer_name}, Status: ${existingLead.status}).`,
        data: existingLead,
      });
    }

    if (alternate_number) {
      const cleanAlt = String(alternate_number).replace(/\D/g, "").slice(-10);
      if (cleanAlt && cleanAlt.length === 10) {
        const existingAlt = await findLeadByMobile(cleanAlt);
        if (existingAlt) {
          return res.status(409).json({
            success: false,
            is_duplicate: true,
            message: `Alternate mobile number already registered with Lead Code ${existingAlt.lead_code} (${existingAlt.customer_name}, Status: ${existingAlt.status}).`,
            data: existingAlt,
          });
        }
      }
    }

    if (interest_status === "Interested" && (!required_kw || Number(required_kw) <= 0)) {
      return res.status(400).json({ success: false, message: "Required Solar Capacity in kW is mandatory when status is 'Interested'." });
    }
    if (interest_status === "Not Interested" && (!remark || !remark.trim())) {
      return res.status(400).json({ success: false, message: "Remark is mandatory when status is 'Not Interested'." });
    }

    const payload = { ...req.body };
    const roleId = Number(req.user.role_id);

    if (roleId === ROLE_SALES) {
      // Sales apni hi lead bana sakta hai — hamesha khud ko assign hogi,
      // chahe body mein kuch bhi bheja ho. Ye do wajah se zaroori hai:
      // (1) security — Sales kisi aur rep ko assign na kar paye
      // (2) warna lead unassigned reh jayegi aur Sales ke apne scope se
      //     hi gayab ho jayegi (uski query assigned_to = uski id pe chalti hai)
      payload.assigned_to = req.user.id;
      payload.assigned_by = req.user.id;
      payload.status = "New Lead";   // Sales pipeline-status khud set na kare
    } else if (roleId === ROLE_MANAGER && payload.assigned_to) {
      const inTeam = await isUserInManagerTeam(payload.assigned_to, req.user.id);
      if (!inTeam) {
        return res.status(403).json({
          success: false,
          message: "You can only assign leads to your own team members.",
        });
      }
      payload.assigned_by = req.user.id;
    }

    const newLead = await createLead(payload, req.user.id);

    // Admin ko notify karo
    try {
      const [creatorRows] = await db.query("SELECT full_name FROM users WHERE id = ?", [req.user.id]);
      const creatorName = creatorRows?.[0]?.full_name || "Someone";
      await notifyLeadCreated(newLead.id, newLead.lead_code, payload.customer_name, creatorName);
    } catch (notifErr) {
      console.error("Notification trigger error in createLead:", notifErr.message);
    }

    return res.status(201).json({ success: true, message: "Lead created successfully.", data: newLead });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ======================================
// Get All Leads
// ======================================
const getLeadsController = async (req, res) => {
  try {
    const roleId = req.user ? req.user.role_id : null;
    const userId = req.user ? req.user.id : null;
    const result = await getLeads(req.query, roleId, userId);
    return res.status(200).json({ success: true, message: "Leads fetched successfully.", ...result });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ======================================
// Get Lead By ID
// ======================================
const getLeadByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const roleId = req.user.role_id;
    const userId = req.user.id;

    if (Number(roleId) !== ROLE_SUPER_ADMIN) {
      const allowed = await isLeadAccessibleByUser(id, roleId, userId);
      if (!allowed) return res.status(403).json({ success: false, message: "You do not have access to this lead." });
    }

    const rows = await getLeadById(id);
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Lead not found." });

    return res.status(200).json({ success: true, message: "Lead details fetched successfully.", data: rows[0] });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ======================================
// NEW — Team-wide Follow-ups List (Manager)
// ======================================
const getTeamFollowupsListController = async (req, res) => {
  try {
    const userId = req.user.id;
    const data = await getTeamFollowupsList(userId);
    return res.status(200).json({ success: true, message: "Team follow-ups fetched successfully.", data });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ======================================
// ======================================
// Update Lead (full edit) — Sales role ke liye field-restricted
// ======================================
const updateLeadController = async (req, res) => {
  try {
    const { id } = req.params;
    const roleId = req.user.role_id;
    const userId = req.user.id;

    if (Number(roleId) !== ROLE_SUPER_ADMIN) {
      const allowed = await isLeadAccessibleByUser(id, roleId, userId);
      if (!allowed) return res.status(403).json({ success: false, message: "You do not have access to this lead." });
    }

    let payload = req.body;

    if (Number(roleId) === ROLE_SALES) {
      const existingRows = await getLeadById(id);
      if (existingRows.length === 0) return res.status(404).json({ success: false, message: "Lead not found." });

      const existing = existingRows[0];
      payload = { ...existing }; // baseline DB se
      SALES_EDITABLE_FIELDS.forEach((field) => {
        if (req.body[field] !== undefined) payload[field] = req.body[field];
      });

      // IMMUTABILITY: If lead was marked "Not Interested" or is in a closed state,
      // or already has a submitted reason/remark, Sales role cannot alter or delete it.
      if (["Not Interested", "Lost", "Won"].includes(existing.status) || existing.reason_category) {
        payload.remark = existing.remark; // locked/read-only for Sales
        payload.reason_category = existing.reason_category; // locked/read-only for Sales
        payload.status = existing.status; // cannot change closed status via edit form
      }
    }

    const { mobile_number, alternate_number, interest_status, required_kw, remark } = payload;

    if (mobile_number) {
      const cleanMobile = String(mobile_number).replace(/\D/g, "").slice(-10);
      if (!cleanMobile || cleanMobile.length !== 10) {
        return res.status(400).json({ success: false, message: "Please provide a valid 10-digit Mobile Number." });
      }
      const existingDuplicate = await findLeadByMobile(cleanMobile, id);
      if (existingDuplicate) {
        return res.status(409).json({
          success: false,
          is_duplicate: true,
          message: `Another lead (${existingDuplicate.lead_code} - ${existingDuplicate.customer_name}) already exists with this mobile number.`,
          data: existingDuplicate,
        });
      }
    }

    if (alternate_number) {
      const cleanAlt = String(alternate_number).replace(/\D/g, "").slice(-10);
      if (cleanAlt && cleanAlt.length === 10) {
        const existingAlt = await findLeadByMobile(cleanAlt, id);
        if (existingAlt) {
          return res.status(409).json({
            success: false,
            is_duplicate: true,
            message: `Another lead (${existingAlt.lead_code} - ${existingAlt.customer_name}) already exists with this alternate mobile number.`,
            data: existingAlt,
          });
        }
      }
    }

    if (interest_status === "Interested" && (!required_kw || Number(required_kw) <= 0)) {
      return res.status(400).json({ success: false, message: "Required Solar Capacity in kW is mandatory when status is 'Interested'." });
    }
    if (interest_status === "Not Interested" && (!remark || !remark.trim())) {
      return res.status(400).json({ success: false, message: "Remark is mandatory when status is 'Not Interested'." });
    }

    // NEW: Manager sirf apni team ko hi assign kar sake, generic edit-form se bhi
    // (dedicated /assign endpoint mein pehle se hi ye check tha, ab yahan bhi zaroori hai
    // kyunki updateLead ab assigned_to ko bhi save karta hai)
    if (Number(roleId) === ROLE_MANAGER && payload.assigned_to) {
      const inTeam = await isUserInManagerTeam(payload.assigned_to, userId);
      if (!inTeam) {
        return res.status(403).json({
          success: false,
          message: "You can only assign leads to your own team members.",
        });
      }
    }

    // Validate status transition if status is being updated or passed
    const existingRows = await getLeadById(id);
    const existingLead = existingRows[0];
    if (payload.status && existingLead && payload.status !== existingLead.status) {
      // 🔒 REOPEN LOCK: Only Manager and Super Admin can reopen closed leads
      const CLOSED_STATUSES = ["Won", "Lost", "Not Interested"];
      const isReopenAttempt = CLOSED_STATUSES.includes(existingLead.status) && !CLOSED_STATUSES.includes(payload.status);
      if (isReopenAttempt && Number(roleId) === ROLE_SALES) {
        return res.status(403).json({
          success: false,
          message: "Permission denied: Reopening a closed or Not Interested lead is strictly reserved for Managers and Super Admins.",
        });
      }

      const statusError = validateStatusTransition(payload.status, payload, existingLead);
      if (statusError) {
        return res.status(400).json({ success: false, message: statusError });
      }
    }

    await updateLead(id, payload, userId);
    return res.status(200).json({ success: true, message: "Lead updated successfully." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// Helper: Validate status transition rules for all CRM workflow stages
const validateStatusTransition = (status, payload, existing) => {
  const {
    reason_category,
    remark,
    required_kw,
    deal_amount,
    quotation_amount,
    payment_status,
    next_follow_up_date,
    site_visit_date,
    site_visit_time,
    visit_outcome,
    customer_response,
    next_action,
    call_attempts,
    customer_details,
  } = payload;

  const todayKolkataStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());

  // 1. Next Follow-up Date Enforcement
  const ACTIVE_STATUSES = [
    "Contacted",
    "Follow-up Pending",
    "Follow-up",
    "In Progress",
    "Negotiation",
    "Quotation Sent",
  ];
  if (ACTIVE_STATUSES.includes(status)) {
    const targetDate = next_follow_up_date || (existing?.status === status ? existing?.next_follow_up_date : null);
    if (!targetDate) {
      return `Next follow-up date is mandatory when moving to '${status}'.`;
    }
    const dateStr = typeof targetDate === "string" ? targetDate.slice(0, 10) : new Date(targetDate).toISOString().slice(0, 10);
    if (dateStr < todayKolkataStr) {
      return "Next follow-up date cannot be in the past. Please select today or a future date.";
    }
  }

  // 2. Not Interested Strict Controls
  if (status === "Not Interested") {
    const NOT_INTERESTED_CATEGORIES = [
      "Price issue",
      "Already installed",
      "Not interested in solar",
      "Competitor selected",
      "No response",
      "Other",
    ];
    if (!reason_category || !NOT_INTERESTED_CATEGORIES.includes(reason_category)) {
      return `Reason category is mandatory when marking a lead as 'Not Interested'. Allowed categories: ${NOT_INTERESTED_CATEGORIES.join(", ")}.`;
    }
    const effectiveRemark = (remark !== undefined && remark !== null) ? String(remark).trim() : (existing?.remark ? String(existing.remark).trim() : "");
    if (!effectiveRemark) {
      return "Detailed explanation is mandatory when marking a lead as 'Not Interested'.";
    }
    const cleanChars = effectiveRemark.replace(/\s+/g, "");
    if (cleanChars.length < 10) {
      return `Detailed explanation must contain at least 10 characters/alphabets (currently ${cleanChars.length} characters).`;
    }
    if (reason_category === "Other" && cleanChars.length < 10) {
      return "Detailed context is compulsory when selecting 'Other' (at least 10 characters required).";
    }
  }

  // 3. Won Stage Mandatory Validations
  if (status === "Won") {
    if (!existing?.customer_name || !existing?.mobile_number) {
      return "Customer Details (Name & Mobile Number) are mandatory to mark a lead as Won.";
    }
    const capacity = required_kw !== undefined && required_kw !== null && required_kw !== ""
      ? Number(required_kw)
      : (existing?.required_kw ? Number(existing.required_kw) : 0);
    if (!capacity || capacity <= 0) {
      return "System Capacity (kW) is mandatory and must be greater than 0 to mark lead as Won.";
    }
    const amount = deal_amount !== undefined && deal_amount !== null && deal_amount !== ""
      ? Number(deal_amount)
      : (quotation_amount !== undefined && quotation_amount !== null && quotation_amount !== ""
          ? Number(quotation_amount)
          : (existing?.deal_amount ? Number(existing.deal_amount) : (existing?.quotation_amount ? Number(existing.quotation_amount) : 0)));
    if (!amount || amount <= 0) {
      return "Final Deal Amount (₹) is mandatory and must be greater than 0 to mark lead as Won.";
    }
    const payment = payment_status || existing?.payment_status;
    const VALID_PAYMENTS = ["Advance", "Full", "Pending"];
    if (!payment || !VALID_PAYMENTS.includes(payment)) {
      return "Payment Status is mandatory to mark lead as Won (must be Advance, Full, or Pending).";
    }
  }

  // 4. Site Visit Scheduled
  if (status === "Site Visit Scheduled") {
    const effectiveDate = site_visit_date || existing?.site_visit_date;
    if (!effectiveDate) {
      return "Site visit date is mandatory when status is 'Site Visit Scheduled'.";
    }
    const dateStr = typeof effectiveDate === "string" ? effectiveDate.slice(0, 10) : new Date(effectiveDate).toISOString().slice(0, 10);
    if (dateStr < todayKolkataStr) {
      return "Site visit date cannot be in the past. Please select today or a future date.";
    }
    const effectiveTime = site_visit_time || existing?.site_visit_time || (customer_details && customer_details.site_visit_time);
    if (!effectiveTime && (!remark || !String(remark).trim())) {
      return "Visit time or scheduling notes are mandatory when scheduling a site visit.";
    }
  }

  // 5. Site Visit Completed
  if (status === "Site Visit Completed") {
    const effectiveOutcome = visit_outcome || (customer_details && customer_details.visit_outcome);
    if (!effectiveOutcome) {
      return "Visit outcome (e.g. Feasible, Space Issue, High Interest) is mandatory when marking Site Visit Completed.";
    }
    const effectiveResponse = customer_response || (customer_details && customer_details.customer_response) || remark;
    if (!effectiveResponse || !String(effectiveResponse).trim()) {
      return "Customer reaction and response details are mandatory when marking Site Visit Completed.";
    }
    const effectiveNextAction = next_action || (customer_details && customer_details.next_action);
    if (!effectiveNextAction) {
      return "Next action is mandatory when completing a site visit.";
    }
  }

  // 6. Quotation Sent
  if (status === "Quotation Sent") {
    const effectiveAmount = quotation_amount !== undefined && quotation_amount !== null && quotation_amount !== ""
      ? Number(quotation_amount)
      : (existing?.quotation_amount ? Number(existing.quotation_amount) : 0);
    if (!effectiveAmount || effectiveAmount <= 0) {
      return "Quotation amount (₹) is mandatory and must be greater than 0 when status is 'Quotation Sent'.";
    }
    const effectiveCapacity = required_kw !== undefined && required_kw !== null && required_kw !== ""
      ? Number(required_kw)
      : (existing?.required_kw ? Number(existing.required_kw) : 0);
    if (!effectiveCapacity || effectiveCapacity <= 0) {
      return "Quoted capacity (kW) is mandatory and must be greater than 0 when status is 'Quotation Sent'.";
    }
    if (!remark || !String(remark).trim()) {
      return "Quotation note/remarks are mandatory when status is 'Quotation Sent'.";
    }
  }

  // 7. No Response
  if (status === "No Response") {
    const rawAttempts = call_attempts ?? (customer_details && customer_details.call_attempts) ?? existing?.call_attempts;
    const numAttempts = Number(String(rawAttempts).replace(/\D/g, "")) || (rawAttempts ? 1 : 0);
    if (!numAttempts || numAttempts <= 0) {
      return "Number of call attempts is mandatory when marking 'No Response' (e.g. 1st, 2nd, 3rd+ attempt).";
    }
    const effectiveNotes = remark || (customer_details && customer_details.call_notes);
    if (!effectiveNotes || !String(effectiveNotes).trim()) {
      return "Call outcome and notes are mandatory when marking 'No Response'.";
    }
  }

  return null;
};

// ======================================
// Update Status — Workflow Stage Transitions & Action Validations
// ======================================
const updateLeadStatusController = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const roleId = req.user.role_id;
    const userId = req.user.id;

    if (!status) return res.status(400).json({ success: false, message: "Status is required." });

    if (Number(roleId) !== ROLE_SUPER_ADMIN) {
      const allowed = await isLeadAccessibleByUser(id, roleId, userId);
      if (!allowed) return res.status(403).json({ success: false, message: "You do not have access to this lead." });
    }

    const existingRows = await getLeadById(id);
    if (existingRows.length === 0) return res.status(404).json({ success: false, message: "Lead not found." });
    const existing = existingRows[0];
    const oldStatus = existing.status;

    // 🔒 REOPEN LOCK: Only Manager and Super Admin can reopen closed leads
    const CLOSED_STATUSES = ["Won", "Lost", "Not Interested"];
    const isReopenAttempt = CLOSED_STATUSES.includes(oldStatus) && !CLOSED_STATUSES.includes(status);
    if (isReopenAttempt && Number(roleId) === ROLE_SALES) {
      return res.status(403).json({
        success: false,
        message: "Permission denied: Reopening a closed or Not Interested lead is strictly reserved for Managers and Super Admins.",
      });
    }

    // 🛡️ Validate Workflow Transitions & Stage Constraints
    const validationError = validateStatusTransition(status, req.body, existing);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    await updateLeadStatus(id, req.body, userId);

    // Status ke hisaab se notify karo
    try {
      const leadRows = await getLeadById(id);
      const lead = leadRows[0];
      if (lead) {
        if (status === "Won") {
          await notifyLeadWon(id, lead.lead_code, lead.customer_name, lead.manager_id);
        } else if (status === "Lost" || status === "Not Interested") {
          await notifyLeadLost(id, lead.lead_code, lead.customer_name, lead.manager_id);
        } else {
          await notifyStatusChanged(id, lead.lead_code, lead.customer_name, status, lead.manager_id);
        }
      }
    } catch (notifErr) {
      console.error("Notification trigger error in updateLeadStatus:", notifErr.message);
    }

    return res.status(200).json({ success: true, message: "Lead status updated successfully." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ======================================
// Assign Lead
// ======================================
const assignLeadController = async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_to } = req.body;
    const roleId = req.user.role_id;
    const userId = req.user.id;

    if (!assigned_to) return res.status(400).json({ success: false, message: "assigned_to user ID is required." });

    if (Number(roleId) === ROLE_MANAGER) {
      const inTeam = await isUserInManagerTeam(assigned_to, userId);
      if (!inTeam) {
        return res.status(403).json({ success: false, message: "Unauthorized: You can only assign leads to your own team members." });
      }
    }

    await assignLead(id, assigned_to, userId);

    // Sales ko notify karo
    try {
      const leadRows = await getLeadById(id);
      const lead = leadRows[0];
      if (lead) {
        await notifyLeadAssigned(id, assigned_to, lead.lead_code, lead.customer_name);
      }
    } catch (notifErr) {
      console.error("Notification trigger error in assignLead:", notifErr.message);
    }

    return res.status(200).json({ success: true, message: "Lead assigned successfully." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ======================================
// NEW — Bulk Reassign (Offboarding)
// ======================================
const bulkReassignController = async (req, res) => {
  try {
    const { from_user_id, to_user_id } = req.body;
    const roleId = req.user.role_id;
    const userId = req.user.id;

    if (!from_user_id || !to_user_id) {
      return res.status(400).json({ success: false, message: "from_user_id and to_user_id are required." });
    }
    if (String(from_user_id) === String(to_user_id)) {
      return res.status(400).json({ success: false, message: "Source and destination user cannot be the same." });
    }

    if (Number(roleId) === ROLE_MANAGER) {
      const [fromInTeam, toInTeam] = await Promise.all([
        isUserInManagerTeam(from_user_id, userId),
        isUserInManagerTeam(to_user_id, userId),
      ]);
      if (!fromInTeam || !toInTeam) {
        return res.status(403).json({ success: false, message: "Both users must be in your team." });
      }
    }

    const result = await bulkReassignLeads(from_user_id, to_user_id, userId);
    return res.status(200).json({
      success: true,
      message: `${result.reassignedCount} lead(s) reassigned successfully.`,
      data: result,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ======================================
// NEW — Bulk Import Leads (CSV/Excel Upload)
// ======================================
const bulkImportLeadsController = async (req, res) => {
  try {
    const { leads: rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: "No leads provided for import." });
    }

    const result = await bulkImportLeads(rows, req.user.id);

    // Admin ko notify karo
    try {
      await notifyBulkImport(req.user.id, result.imported, result.failed);
    } catch (notifErr) {
      console.error("Notification trigger error in bulkImportLeads:", notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `${result.imported} lead(s) imported, ${result.failed} failed.`,
      data: result,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ======================================
// Add Follow-up
// ======================================
const addFollowupController = async (req, res) => {
  try {
    const { id } = req.params;
    const { note, status_after_followup } = req.body;
    const roleId = req.user.role_id;
    const userId = req.user.id;

    if (!note || !note.trim()) return res.status(400).json({ success: false, message: "Follow-up note is required." });

    if (Number(roleId) !== ROLE_SUPER_ADMIN) {
      const allowed = await isLeadAccessibleByUser(id, roleId, userId);
      if (!allowed) return res.status(403).json({ success: false, message: "You do not have access to this lead." });
    }

    if (status_after_followup) {
      const leadRows = await getLeadById(id);
      const existing = leadRows[0];
      const CLOSED_STATUSES = ["Won", "Lost", "Not Interested"];

      // Check reopen permission
      if (existing && CLOSED_STATUSES.includes(existing.status) && !CLOSED_STATUSES.includes(status_after_followup)) {
        if (Number(roleId) === ROLE_SALES) {
          return res.status(403).json({
            success: false,
            message: "Permission denied: Reopening a closed or Not Interested lead is strictly reserved for Managers and Super Admins.",
          });
        }
      }

      // Check workflow constraints for status transitions
      const validationError = validateStatusTransition(
        status_after_followup,
        {
          ...req.body,
          remark: req.body.remark || note,
          next_follow_up_date: req.body.next_follow_up_date || req.body.follow_up_date,
        },
        existing
      );
      if (validationError) {
        return res.status(400).json({ success: false, message: validationError });
      }
    }

    await addFollowup(id, req.body, userId);

    // Manager ko notify karo
    try {
      const leadRows = await getLeadById(id);
      const lead = leadRows[0];
      if (lead && lead.manager_id) {
        await notifyFollowupAdded(id, lead.lead_code, lead.customer_name, lead.manager_id);
      }
    } catch (notifErr) {
      console.error("Notification trigger error in addFollowup:", notifErr.message);
    }

    return res.status(201).json({ success: true, message: "Follow-up added successfully." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ======================================
// Get Follow-ups
// ======================================
const getFollowupsController = async (req, res) => {
  try {
    const { id } = req.params;
    const roleId = req.user.role_id;
    const userId = req.user.id;

    if (Number(roleId) !== ROLE_SUPER_ADMIN) {
      const allowed = await isLeadAccessibleByUser(id, roleId, userId);
      if (!allowed) return res.status(403).json({ success: false, message: "You do not have access to this lead." });
    }

    const data = await getFollowups(id);
    return res.status(200).json({ success: true, message: "Follow-ups fetched successfully.", data });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ======================================
// Get Activity Logs
// ======================================
const getActivityLogsController = async (req, res) => {
  try {
    const { id } = req.params;
    const roleId = req.user.role_id;
    const userId = req.user.id;

    if (Number(roleId) !== ROLE_SUPER_ADMIN) {
      const allowed = await isLeadAccessibleByUser(id, roleId, userId);
      if (!allowed) return res.status(403).json({ success: false, message: "You do not have access to this lead." });
    }

    const data = await getActivityLogs(id);
    return res.status(200).json({ success: true, message: "Activity logs fetched successfully.", data });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ======================================
// Delete Lead — Admin-only (route-gated)
// ======================================
const deleteLeadController = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteLead(id, req.user.id);
    return res.status(200).json({ success: true, message: "Lead deleted successfully." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ======================================
// Get Lead Status Logs (Audit Trail Timeline)
// ======================================
const getLeadStatusLogsController = async (req, res) => {
  try {
    const { id } = req.params;
    const roleId = req.user.role_id;
    const userId = req.user.id;

    if (Number(roleId) !== ROLE_SUPER_ADMIN) {
      const allowed = await isLeadAccessibleByUser(id, roleId, userId);
      if (!allowed) return res.status(403).json({ success: false, message: "You do not have access to this lead's audit logs." });
    }

    const data = await getLeadStatusLogs(id);
    return res.status(200).json({ success: true, message: "Lead status audit logs fetched successfully.", data });
  } catch (error) {
    console.error("getLeadStatusLogsController error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ======================================
// Get Closed Leads Report (Not Interested & Lost Leads)
// ======================================
const getClosedLeadsReportController = async (req, res) => {
  try {
    const roleId = Number(req.user.role_id);
    const userId = req.user.id;

    const managerId = roleId === ROLE_MANAGER ? userId : null;
    const reportData = await getClosedLeadsReport(req.query, managerId);

    return res.status(200).json({
      success: true,
      message: "Closed leads report fetched successfully.",
      count: reportData.length,
      data: reportData,
    });
  } catch (error) {
    console.error("getClosedLeadsReportController error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};


// ======================================
// Get Follow-ups Directory (Today, Overdue, Upcoming, etc.)
// ======================================
const getFollowupDirectoryController = async (req, res) => {
  try {
    const roleId = req.user ? req.user.role_id : null;
    const userId = req.user ? req.user.id : null;
    const data = await getFollowupsDirectory(req.query, roleId, userId);
    return res.status(200).json({
      success: true,
      message: "Follow-up directory fetched successfully.",
      data,
    });
  } catch (error) {
    console.error("getFollowupDirectoryController error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

module.exports = {
  getFollowupDirectory: getFollowupDirectoryController,
  checkDuplicateLead: checkDuplicateLeadController,
  createLead: createLeadController,
  getLeads: getLeadsController,
  getLeadById: getLeadByIdController,
  getTeamFollowupsList: getTeamFollowupsListController,
  updateLead: updateLeadController,
  updateLeadStatus: updateLeadStatusController,
  assignLead: assignLeadController,
  bulkReassign: bulkReassignController,
  bulkImport: bulkImportLeadsController,
  addFollowup: addFollowupController,
  getFollowups: getFollowupsController,
  getActivityLogs: getActivityLogsController,
  deleteLead: deleteLeadController,
  getLeadStatusLogs: getLeadStatusLogsController,
  getClosedLeadsReport: getClosedLeadsReportController,
};