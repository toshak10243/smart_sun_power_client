const { db } = require("../config/db");

const ROLE_SUPER_ADMIN = 1;
const ROLE_MANAGER = 2;
const ROLE_SALES = 3;

// Helper: Find existing active lead by mobile number (exact 10 digits or normalized)
const findLeadByMobile = async (mobile, excludeId = null) => {
  if (!mobile) return null;
  const cleanMobile = String(mobile).replace(/\D/g, "").slice(-10);
  if (!cleanMobile) return null;

  let query = `
    SELECT l.id, l.lead_code, l.customer_name, l.mobile_number, l.status, l.assigned_to,
           u.full_name AS assigned_to_name
    FROM leads l
    LEFT JOIN users u ON l.assigned_to = u.id
    WHERE l.is_deleted = 0
      AND (
        RIGHT(REGEXP_REPLACE(l.mobile_number, '[^0-9]', ''), 10) = ?
        OR RIGHT(REGEXP_REPLACE(COALESCE(l.alternate_number, ''), '[^0-9]', ''), 10) = ?
      )
  `;
  const params = [cleanMobile, cleanMobile];

  if (excludeId) {
    query += ` AND l.id != ?`;
    params.push(excludeId);
  }

  query += ` ORDER BY l.id DESC LIMIT 1`;

  const [rows] = await db.query(query, params);
  return rows[0] || null;
};

// ======================================
// 1. Create Lead
// ======================================
const createLead = async (data, createdBy) => {
  const {
    customer_name,
    mobile_number,
    alternate_number,
    email,
    address,
    city,
    state,
    pincode,
    solar_requirement,
    interest_status,
    required_kw,
    remark,
    lead_source,
    priority,
    status,
    assigned_to,
    assigned_by,
    next_follow_up_date,
    site_visit_date,
    quotation_amount,
  } = data;

  const [result] = await db.query(
    `
    INSERT INTO leads (
      lead_code, customer_name, mobile_number, alternate_number, email,
      address, city, state, pincode, solar_requirement, interest_status,
      required_kw, remark, lead_source, priority, status, assigned_to,
      assigned_by, assigned_at, created_by, next_follow_up_date, site_visit_date, quotation_amount
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      "",
      customer_name,
      mobile_number,
      alternate_number || null,
      email || null,
      address || null,
      city || null,
      state || null,
      pincode || null,
      solar_requirement || "Residential",
      interest_status || "Pending",
      required_kw || null,
      remark || null,
      lead_source || "Other",
      priority || "Medium",
      status || "New Lead",
      assigned_to || null,
      assigned_by || (assigned_to ? createdBy : null),
      assigned_to ? new Date() : null,
      createdBy,
      next_follow_up_date || null,
      site_visit_date || null,
      quotation_amount || null,
    ]
  );

  const leadId = result.insertId;
  const leadCode = `LD${String(leadId).padStart(6, "0")}`;

  await db.query(`UPDATE leads SET lead_code=? WHERE id=?`, [leadCode, leadId]);

  if (assigned_to) {
    await db.query(
      `INSERT INTO lead_assignments (lead_id, assigned_to, assigned_by) VALUES (?, ?, ?)`,
      [leadId, assigned_to, assigned_by || createdBy]
    );
  }

  await db.query(
    `INSERT INTO lead_activity_logs (lead_id, action_type, new_value, remark, performed_by)
     VALUES (?, 'Lead Created', ?, 'New lead registered', ?)`,
    [leadId, leadCode, createdBy]
  );

  return { id: leadId, lead_code: leadCode };
};

// ======================================
// 2. Get All Leads (Paginated + Filtered) — FIXED: role_id based, fail-closed
// ======================================
const getLeads = async (params, roleId, userId) => {
  const {
    page = 1, limit = 10, search = "", status = "", priority = "",
    lead_source = "", assigned_to = "", manager_id = "",
  } = params;

  const offset = (Number(page) - 1) * Number(limit);
  const role = Number(roleId);
  let whereConditions = ["l.is_deleted = 0"];
  let queryParams = [];

  // Role-based Scoping — role_id based now, not role_name string
  if (role === ROLE_SALES) {
    whereConditions.push("(l.assigned_to = ? OR l.created_by = ?)");
    queryParams.push(userId, userId);
  } else if (role === ROLE_MANAGER) {
    whereConditions.push(
      `(l.assigned_to IN (SELECT id FROM users WHERE manager_id = ?) OR l.assigned_to = ? OR l.created_by = ? OR l.assigned_by = ?)`
    );
    queryParams.push(userId, userId, userId, userId);
  } else if (role !== ROLE_SUPER_ADMIN) {
    // Unrecognized role -> show NOTHING (fail-closed, not fail-open)
    whereConditions.push("1 = 0");
  }

  if (search) {
    whereConditions.push(`(l.lead_code LIKE ? OR l.customer_name LIKE ? OR l.mobile_number LIKE ? OR l.city LIKE ?)`);
    const term = `%${search}%`;
    queryParams.push(term, term, term, term);
  }
  if (status) { whereConditions.push("l.status = ?"); queryParams.push(status); }
  if (priority) { whereConditions.push("l.priority = ?"); queryParams.push(priority); }
  if (lead_source) { whereConditions.push("l.lead_source = ?"); queryParams.push(lead_source); }
  if (assigned_to === "unassigned" || assigned_to === "null" || assigned_to === "none") {
    whereConditions.push("l.assigned_to IS NULL");
  } else if (assigned_to === "assigned") {
    whereConditions.push("l.assigned_to IS NOT NULL");
  } else if (assigned_to === "admin_assigned" || assigned_to === "assigned_by_admin") {
    whereConditions.push("(l.assigned_by IN (SELECT id FROM users WHERE role_id = 1) OR (l.assigned_to IN (SELECT id FROM users WHERE role_id = 1)))");
  } else if (assigned_to === "manager_assigned" || assigned_to === "assigned_by_manager") {
    whereConditions.push("l.assigned_by IN (SELECT id FROM users WHERE role_id = 2)");
  } else if (assigned_to) {
    whereConditions.push("(l.assigned_to = ? OR l.assigned_by = ?)");
    queryParams.push(assigned_to, assigned_to);
  }

  if (params.assigned_by) {
    if (params.assigned_by === "admin") {
      whereConditions.push("l.assigned_by IN (SELECT id FROM users WHERE role_id = 1)");
    } else if (params.assigned_by === "manager") {
      whereConditions.push("l.assigned_by IN (SELECT id FROM users WHERE role_id = 2)");
    } else {
      whereConditions.push("l.assigned_by = ?");
      queryParams.push(params.assigned_by);
    }
  }

  if (params.date_from) {
    whereConditions.push("DATE(l.created_at) >= ?");
    queryParams.push(params.date_from);
  }
  if (params.date_to) {
    whereConditions.push("DATE(l.created_at) <= ?");
    queryParams.push(params.date_to);
  }

  if (manager_id) {
    whereConditions.push("(l.assigned_to IN (SELECT id FROM users WHERE manager_id = ?) OR l.assigned_to = ? OR l.created_by = ? OR l.assigned_by = ?)");
    queryParams.push(manager_id, manager_id, manager_id, manager_id);
  }

  const whereClause = `WHERE ${whereConditions.join(" AND ")}`;

  const [countRows] = await db.query(
    `SELECT COUNT(*) AS total FROM leads l
     LEFT JOIN users u_assignee ON l.assigned_to = u_assignee.id
     ${whereClause}`,
    queryParams
  );
  const total = countRows[0].total;

  const [rows] = await db.query(
    `
    SELECT l.*, 
      l.assigned_at,
      u_assignee.full_name AS assigned_to_name,
      u_assigner.full_name AS assigned_by_name, 
      u_creator.full_name AS created_by_name,
      lf.note AS latest_remark,
      lf.created_at AS latest_remark_date,
      lf.followup_type AS latest_type,
      lf.created_by_name AS latest_remark_by,
      COALESCE(fc.total_remarks, 0) AS total_remarks
    FROM leads l
    LEFT JOIN users u_assignee ON l.assigned_to = u_assignee.id
    LEFT JOIN users u_assigner ON l.assigned_by = u_assigner.id
    LEFT JOIN users u_creator ON l.created_by = u_creator.id
    LEFT JOIN (
      SELECT f1.lead_id, f1.note, f1.followup_type, f1.created_at, u_f.full_name AS created_by_name
      FROM lead_followups f1
      INNER JOIN (
        SELECT lead_id, MAX(created_at) AS max_created
        FROM lead_followups
        GROUP BY lead_id
      ) f2 ON f1.lead_id = f2.lead_id AND f1.created_at = f2.max_created
      LEFT JOIN users u_f ON f1.created_by = u_f.id
    ) lf ON lf.lead_id = l.id
    LEFT JOIN (
      SELECT lead_id, COUNT(*) AS total_remarks
      FROM lead_followups
      GROUP BY lead_id
    ) fc ON fc.lead_id = l.id
    ${whereClause}
    ORDER BY l.created_at DESC
    LIMIT ? OFFSET ?
    `,
    [...queryParams, Number(limit), Number(offset)]
  );

  return { total, page: Number(page), limit: Number(limit), data: rows };
};

// ======================================
// 3. Get Lead By ID
// ======================================
const getLeadById = async (id) => {
  const [rows] = await db.query(
    `
    SELECT l.*, 
      l.assigned_at,
      u_assignee.full_name AS assigned_to_name,
      u_assigner.full_name AS assigned_by_name, 
      u_creator.full_name AS created_by_name
    FROM leads l
    LEFT JOIN users u_assignee ON l.assigned_to = u_assignee.id
    LEFT JOIN users u_assigner ON l.assigned_by = u_assigner.id
    LEFT JOIN users u_creator ON l.created_by = u_creator.id
    WHERE l.id = ? AND l.is_deleted = 0
    `,
    [id]
  );
  return rows;
};

// ======================================
// 3b. Ownership Guard (Sales/Manager access check for a single lead)
// ======================================
const isLeadAccessibleByUser = async (leadId, roleId, userId) => {
  const role = Number(roleId);
  if (role === ROLE_SUPER_ADMIN) return true;

  if (role === ROLE_SALES) {
    const [rows] = await db.query(
      `SELECT id FROM leads WHERE id = ? AND (assigned_to = ? OR created_by = ?) AND is_deleted = 0`,
      [leadId, userId, userId]
    );
    return rows.length > 0;
  }

  if (role === ROLE_MANAGER) {
    const [rows] = await db.query(
      `
      SELECT l.id FROM leads l
      WHERE l.id = ? AND l.is_deleted = 0
        AND (l.assigned_to IN (SELECT id FROM users WHERE manager_id = ?) OR l.assigned_to = ? OR l.created_by = ? OR l.assigned_by = ?)
      `,
      [leadId, userId, userId, userId, userId]
    );
    return rows.length > 0;
  }

  return false;
};

// ======================================
// 3c. Get Team-wide Follow-ups List (Manager)
// Returns every lead (assigned to their team, to themself, or created by them)
// that has a next_follow_up_date set, along with the latest follow-up note.
// ======================================
const getTeamFollowupsList = async (managerId) => {
  const [rows] = await db.query(
    `
    SELECT
      l.id, l.lead_code, l.customer_name, l.mobile_number AS phone,
      l.next_follow_up_date, l.status AS lead_status,
      u.id AS assigned_to, u.full_name AS assigned_to_name,
      lf.note AS latest_remark, lf.followup_type AS latest_type, lf.created_at AS latest_followup_at
    FROM leads l
    LEFT JOIN users u ON l.assigned_to = u.id
    LEFT JOIN (
      SELECT f1.lead_id, f1.note, f1.followup_type, f1.created_at
      FROM lead_followups f1
      INNER JOIN (
        SELECT lead_id, MAX(created_at) AS max_created
        FROM lead_followups
        GROUP BY lead_id
      ) f2 ON f1.lead_id = f2.lead_id AND f1.created_at = f2.max_created
    ) lf ON lf.lead_id = l.id
    WHERE l.next_follow_up_date IS NOT NULL
      AND l.is_deleted = 0
      AND (l.assigned_to IN (SELECT id FROM users WHERE manager_id = ?) OR l.assigned_to = ? OR l.created_by = ? OR l.assigned_by = ?)
    ORDER BY l.next_follow_up_date ASC
    `,
    [managerId, managerId, managerId, managerId]
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return rows.map((r) => {
    const closed = ["Won", "Lost", "Not Interested"].includes(r.lead_status);
    const dueDate = new Date(r.next_follow_up_date);
    dueDate.setHours(0, 0, 0, 0);

    let status;
    if (closed) status = "COMPLETED";
    else if (dueDate < today) status = "OVERDUE";
    else status = "PENDING";

    return {
      id: r.id,
      lead_code: r.lead_code,
      customer_name: r.customer_name,
      phone: r.phone,
      next_follow_up_date: r.next_follow_up_date,
      lead_status: r.lead_status,
      assigned_to: r.assigned_to,
      assigned_to_name: r.assigned_to_name || "Unassigned",
      latest_remark: r.latest_remark || null,
      latest_type: r.latest_type || null,
      latest_followup_at: r.latest_followup_at || null,
      status,
    };
  });
};

// ======================================
// 4. Update Lead (full edit)
// NOTE: needs the FULL lead object in body every time — customer_name,
// mobile_number etc. are NOT NULL columns and mysql2 throws if a bind
// param is undefined. Frontend flow should be: GET lead -> prefill edit
// form -> submit ALL fields back, even unchanged ones.
// ======================================
const updateLead = async (id, data, updatedBy) => {
  const {
    customer_name, mobile_number, alternate_number, email, address, city,
    state, pincode, solar_requirement, interest_status, required_kw,
    remark, lead_source, priority, next_follow_up_date, site_visit_date,
    quotation_amount, assigned_to, reason_category, deal_amount, payment_status,
  } = data;

  // Current assignment nikal lo, taaki pata chale actually badla ya nahi
  const [currentRows] = await db.query(
    `SELECT assigned_to, assigned_by FROM leads WHERE id=? AND is_deleted=0`,
    [id]
  );
  const previousAssignedTo = currentRows[0]?.assigned_to ?? null;
  const previousAssignedBy = currentRows[0]?.assigned_by ?? null;
  const newAssignedTo = assigned_to || null;
  const assignmentChanged = String(previousAssignedTo || "") !== String(newAssignedTo || "");
  const newAssignedBy = assignmentChanged && newAssignedTo ? updatedBy : previousAssignedBy;

  // If status is passed, track closed_at
  const [currentLeadRows] = await db.query(
    `SELECT status, closed_at FROM leads WHERE id=? AND is_deleted=0`,
    [id]
  );
  const currentLead = currentLeadRows[0];
  const newStatus = data.status || currentLead?.status;
  let newClosedAt = currentLead?.closed_at || null;
  const CLOSED_STATUSES = ["Won", "Lost", "Not Interested"];
  if (data.status) {
    if (CLOSED_STATUSES.includes(data.status)) {
      newClosedAt = new Date();
    } else if (CLOSED_STATUSES.includes(currentLead?.status) && !CLOSED_STATUSES.includes(data.status)) {
      newClosedAt = null; // Reopened
    }
  }

  const [result] = await db.query(
    `
    UPDATE leads SET
      customer_name=?, mobile_number=?, alternate_number=?, email=?, address=?,
      city=?, state=?, pincode=?, solar_requirement=?, interest_status=?,
      required_kw=?, remark=?, lead_source=?, priority=?, next_follow_up_date=?,
      site_visit_date=?, quotation_amount=?, assigned_to=?, assigned_by=?,
      assigned_at=CASE 
        WHEN ? = 1 THEN NOW() 
        WHEN ? IS NULL THEN NULL 
        ELSE assigned_at 
      END,
      status=COALESCE(?, status),
      closed_at=?,
      reason_category=COALESCE(?, reason_category), deal_amount=COALESCE(?, deal_amount), payment_status=COALESCE(?, payment_status)
    WHERE id=? AND is_deleted=0
    `,
    [
      customer_name, mobile_number, alternate_number || null, email || null,
      address || null, city || null, state || null, pincode || null,
      solar_requirement, interest_status, required_kw || null, remark || null,
      lead_source, priority, next_follow_up_date || null, site_visit_date || null,
      quotation_amount || null, newAssignedTo, newAssignedBy,
      (assignmentChanged && newAssignedTo) ? 1 : 0, newAssignedTo,
      newStatus,
      newClosedAt,
      reason_category ?? null, deal_amount ?? null, payment_status ?? null,
      id,
    ]
  );

  // Assignment genuinely badla ho to history + proper activity-log entry banao
  if (assignmentChanged && newAssignedTo) {
    await db.query(
      `INSERT INTO lead_assignments (lead_id, assigned_to, assigned_by) VALUES (?, ?, ?)`,
      [id, newAssignedTo, updatedBy]
    );

    await db.query(
      `INSERT INTO lead_activity_logs (lead_id, action_type, old_value, new_value, performed_by)
       VALUES (?, ?, ?, ?, ?)`,
      [
        id,
        previousAssignedTo ? "Lead Reassigned" : "Lead Assigned",
        previousAssignedTo ? String(previousAssignedTo) : null,
        String(newAssignedTo),
        updatedBy,
      ]
    );
  }

  await db.query(
    `INSERT INTO lead_activity_logs (lead_id, action_type, remark, performed_by)
     VALUES (?, 'Lead Updated', 'Lead information updated', ?)`,
    [id, updatedBy]
  );

  return result;
};

// ======================================
// 5. Update Status (Pipeline Step)
// ======================================
const updateLeadStatus = async (id, payload, performedBy) => {
  const {
    status: newStatus,
    remark,
    quotation_amount,
    site_visit_date,
    site_visit_time,
    next_follow_up_date,
    call_attempts,
    reason_category,
    deal_amount,
    payment_status,
    required_kw,
    customer_details,
    visit_outcome,
    customer_response,
    next_action,
    call_outcome,
  } = payload;

  const [leadRows] = await db.query(
    `SELECT * FROM leads WHERE id=? AND is_deleted=0`,
    [id]
  );
  const existing = leadRows[0];
  const oldStatus = existing?.status || "Unknown";

  let closedAt = existing?.closed_at || null;
  const CLOSED_STATUSES = ["Won", "Lost", "Not Interested"];
  if (CLOSED_STATUSES.includes(newStatus)) {
    closedAt = new Date();
  } else if (CLOSED_STATUSES.includes(oldStatus) && !CLOSED_STATUSES.includes(newStatus)) {
    closedAt = null; // Reopened
  }

  const finalDealAmount = deal_amount !== undefined ? (deal_amount ? Number(deal_amount) : null) : (existing?.deal_amount ?? null);
  const finalQuotationAmount = quotation_amount !== undefined ? (quotation_amount ? Number(quotation_amount) : null) : (newStatus === "Won" && deal_amount ? Number(deal_amount) : (existing?.quotation_amount ?? null));
  const finalRequiredKw = required_kw !== undefined ? (required_kw ? Number(required_kw) : null) : (existing?.required_kw ?? null);
  const finalPaymentStatus = payment_status !== undefined ? payment_status : (existing?.payment_status ?? null);
  const finalReasonCategory = reason_category !== undefined ? reason_category : (newStatus === "Not Interested" ? (existing?.reason_category ?? null) : (["Won", "Contacted", "New Lead"].includes(newStatus) ? null : (existing?.reason_category ?? null)));
  const finalNextFollowUpDate = next_follow_up_date !== undefined ? (next_follow_up_date || null) : (existing?.next_follow_up_date ?? null);
  const finalSiteVisitDate = site_visit_date !== undefined ? (site_visit_date || null) : (existing?.site_visit_date ?? null);
  const finalSiteVisitTime = site_visit_time !== undefined ? (site_visit_time || null) : (existing?.site_visit_time ?? null);
  const finalCallAttempts = call_attempts !== undefined ? (call_attempts ? Number(call_attempts) : 0) : (existing?.call_attempts ?? 0);
  const finalRemark = (remark !== undefined && remark !== null && String(remark).trim() !== "") ? String(remark).trim() : existing?.remark;

  const [result] = await db.query(
    `
    UPDATE leads
    SET status=?,
        closed_at = ?,
        quotation_amount = ?,
        site_visit_date = ?,
        site_visit_time = ?,
        next_follow_up_date = ?,
        call_attempts = ?,
        reason_category = ?,
        deal_amount = ?,
        payment_status = ?,
        required_kw = ?,
        remark = ?
    WHERE id=? AND is_deleted=0
    `,
    [
      newStatus,
      closedAt,
      finalQuotationAmount,
      finalSiteVisitDate,
      finalSiteVisitTime,
      finalNextFollowUpDate,
      finalCallAttempts,
      finalReasonCategory,
      finalDealAmount,
      finalPaymentStatus,
      finalRequiredKw,
      finalRemark,
      id
    ]
  );

  let actionType = "Status Changed";
  if (newStatus === "Won" || newStatus === "Lost" || newStatus === "Not Interested") {
    actionType = "Lead Closed";
  } else if (CLOSED_STATUSES.includes(oldStatus) && !CLOSED_STATUSES.includes(newStatus)) {
    actionType = "Status Changed"; // Reopened
  } else if (newStatus === "Quotation Sent") {
    actionType = "Quotation Sent";
  } else if (newStatus === "Site Visit Scheduled") {
    actionType = "Site Visit Scheduled";
  } else if (newStatus === "Site Visit Completed") {
    actionType = "Site Visit Completed";
  } else if (newStatus === "No Response") {
    actionType = "Follow-up Added";
  }

  const logRemark = finalRemark || (finalReasonCategory ? `[${finalReasonCategory}]` : `Status changed from ${oldStatus} to ${newStatus}`);

  await db.query(
    `INSERT INTO lead_activity_logs (lead_id, action_type, old_value, new_value, remark, performed_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, actionType, oldStatus, newStatus, logRemark, performedBy]
  );

  // Prepare structured details for lead_status_logs
  const mergedDetails = {
    ...(customer_details || {}),
    ...(finalSiteVisitDate ? { site_visit_date: finalSiteVisitDate } : {}),
    ...(finalSiteVisitTime ? { site_visit_time: finalSiteVisitTime } : {}),
    ...(visit_outcome ? { visit_outcome } : {}),
    ...(customer_response ? { customer_response } : {}),
    ...(next_action ? { next_action } : {}),
    ...(finalCallAttempts ? { call_attempts: finalCallAttempts } : {}),
    ...(call_outcome ? { call_outcome } : {}),
    ...(finalNextFollowUpDate ? { next_follow_up_date: finalNextFollowUpDate } : {}),
  };

  // Insert into lead_status_logs table for audit trail
  try {
    await db.query(
      `INSERT INTO lead_status_logs (lead_id, changed_by, old_status, new_status, reason_category, remarks, customer_details, system_capacity_kw, deal_amount, payment_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        performedBy,
        oldStatus,
        newStatus,
        finalReasonCategory,
        logRemark,
        Object.keys(mergedDetails).length > 0 ? JSON.stringify(mergedDetails) : null,
        finalRequiredKw,
        finalDealAmount,
        finalPaymentStatus,
      ]
    );
  } catch (err) {
    console.error("Error inserting into lead_status_logs:", err.message);
  }

  // Also auto-record a record in lead_followups if Site Visit Completed or No Response was logged
  try {
    if (newStatus === "Site Visit Completed" || newStatus === "No Response" || newStatus === "Site Visit Scheduled") {
      const followupType = newStatus.includes("Site Visit") ? "Site Visit" : "Call";
      await db.query(
        `INSERT INTO lead_followups (lead_id, note, followup_type, status_after_followup, follow_up_date, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id,
          finalRemark || `Status transitioned to ${newStatus}`,
          followupType,
          newStatus,
          finalNextFollowUpDate || null,
          performedBy,
        ]
      );
    }
  } catch (fErr) {
    console.error("Error adding follow-up entry for status change:", fErr.message);
  }

  return result;
};

// ======================================
// 6. Assign / Reassign Lead
// ======================================
const assignLead = async (id, assignedTo, assignedBy) => {
  const [currentRows] = await db.query(
    `SELECT assigned_to FROM leads WHERE id=? AND is_deleted=0`,
    [id]
  );
  const previousAssignedTo = currentRows[0]?.assigned_to;
  const isReassignment = Boolean(previousAssignedTo);

  const [result] = await db.query(
    `UPDATE leads SET assigned_to=?, assigned_by=?, assigned_at=NOW() WHERE id=? AND is_deleted=0`,
    [assignedTo, assignedBy, id]
  );

  await db.query(
    `INSERT INTO lead_assignments (lead_id, assigned_to, assigned_by) VALUES (?, ?, ?)`,
    [id, assignedTo, assignedBy]
  );

  await db.query(
    `INSERT INTO lead_activity_logs (lead_id, action_type, old_value, new_value, performed_by)
     VALUES (?, ?, ?, ?, ?)`,
    [
      id, isReassignment ? "Lead Reassigned" : "Lead Assigned",
      previousAssignedTo ? String(previousAssignedTo) : null, String(assignedTo), assignedBy,
    ]
  );

  return result;
};

// ======================================
// 7. Add Follow-up Note
// ======================================
const addFollowup = async (leadId, data, createdBy) => {
  const { note, followup_type, status_after_followup, follow_up_date } = data;

  const [result] = await db.query(
    `INSERT INTO lead_followups (lead_id, note, followup_type, status_after_followup, follow_up_date, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [leadId, note, followup_type || "Call", status_after_followup || null, follow_up_date || null, createdBy]
  );

  if (status_after_followup || follow_up_date) {
    let updates = [];
    let queryParams = [];
    if (status_after_followup) { updates.push("status=?"); queryParams.push(status_after_followup); }
    if (follow_up_date) { updates.push("next_follow_up_date=?"); queryParams.push(follow_up_date); }
    queryParams.push(leadId);
    await db.query(`UPDATE leads SET ${updates.join(", ")} WHERE id=?`, queryParams);
  }

  await db.query(
    `INSERT INTO lead_activity_logs (lead_id, action_type, remark, performed_by)
     VALUES (?, 'Follow-up Added', ?, ?)`,
    [leadId, note.substring(0, 200), createdBy]
  );

  return result;
};

// ======================================
// 8. Get Follow-ups Timeline
// ======================================
const getFollowups = async (leadId) => {
  const [rows] = await db.query(
    `SELECT f.*, u.full_name AS created_by_name
     FROM lead_followups f LEFT JOIN users u ON f.created_by = u.id
     WHERE f.lead_id = ? ORDER BY f.created_at DESC`,
    [leadId]
  );
  return rows;
};

// ======================================
// 9. Get Activity Logs
// ======================================
const getActivityLogs = async (leadId) => {
  const [rows] = await db.query(
    `SELECT l.*, u.full_name AS performed_by_name
     FROM lead_activity_logs l LEFT JOIN users u ON l.performed_by = u.id
     WHERE l.lead_id = ? ORDER BY l.created_at DESC`,
    [leadId]
  );
  return rows;
};

// ======================================
// 10. Soft Delete Lead
// ======================================
const deleteLead = async (id, deletedBy) => {
  const [result] = await db.query(`UPDATE leads SET is_deleted=1 WHERE id=?`, [id]);
  await db.query(
    `INSERT INTO lead_activity_logs (lead_id, action_type, remark, performed_by)
     VALUES (?, 'Lead Closed', 'Lead soft deleted', ?)`,
    [id, deletedBy]
  );
  return result;
};

// ======================================
// 11. Bulk Reassign (Offboarding case)
// Transaction-safe: sab ya kuch nahi, half-reassigned state kabhi nahi banega
// ======================================
const bulkReassignLeads = async (fromUserId, toUserId, performedBy) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Sirf OPEN leads move hongi — Won/Lost/Not Interested waisi hi rahengi
    const [openLeads] = await connection.query(
      `SELECT id FROM leads
       WHERE assigned_to = ? AND is_deleted = 0
         AND status NOT IN ('Won','Lost','Not Interested')`,
      [fromUserId]
    );

    for (const lead of openLeads) {
      await connection.query(
        `UPDATE leads SET assigned_to=?, assigned_by=?, assigned_at=NOW() WHERE id=?`,
        [toUserId, performedBy, lead.id]
      );
      await connection.query(
        `INSERT INTO lead_assignments (lead_id, assigned_to, assigned_by) VALUES (?, ?, ?)`,
        [lead.id, toUserId, performedBy]
      );
      await connection.query(
        `INSERT INTO lead_activity_logs (lead_id, action_type, old_value, new_value, remark, performed_by)
         VALUES (?, 'Lead Reassigned', ?, ?, 'Bulk reassignment (offboarding)', ?)`,
        [lead.id, String(fromUserId), String(toUserId), performedBy]
      );
    }

    await connection.commit();
    return { reassignedCount: openLeads.length };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

// ======================================
// 12. Bulk Import Leads (CSV/Excel Upload)
// Best-effort insert — jo row valid hai save ho jayegi,
// jo fail ho uska reason wapas aayega, sab-ya-kuch-nahi nahi hai
// ======================================
const bulkImportLeads = async (rows, createdBy) => {
  const results = { imported: 0, failed: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const {
        customer_name, mobile_number, alternate_number, email, address,
        city, state, pincode, solar_requirement, interest_status,
        required_kw, lead_source, priority, remark,
      } = row;

      // Basic validation (defense-in-depth, frontend bhi check karega)
      if (!customer_name || !String(customer_name).trim()) {
        throw new Error("Customer name is required");
      }
      const cleanMobile = String(mobile_number || "").replace(/\D/g, "").slice(-10);
      if (!cleanMobile || cleanMobile.length !== 10) {
        throw new Error("Invalid or missing 10-digit mobile number");
      }

      // Duplicate check: Prevent importing existing mobile number
      const existingDuplicate = await findLeadByMobile(cleanMobile);
      if (existingDuplicate) {
        throw new Error(`Duplicate mobile number. Lead already exists: ${existingDuplicate.lead_code} (${existingDuplicate.customer_name})`);
      }

      const [result] = await db.query(
        `
        INSERT INTO leads (
          lead_code, customer_name, mobile_number, alternate_number, email,
          address, city, state, pincode, solar_requirement, interest_status,
          required_kw, remark, lead_source, priority, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'New Lead', ?)
        `,
        [
          "",
          String(customer_name).trim(),
          String(mobile_number).trim(),
          alternate_number || null,
          email || null,
          address || null,
          city || null,
          state || null,
          pincode || null,
          solar_requirement || "Residential",
          interest_status || "Pending",
          required_kw || null,
          remark || null,
          lead_source || "Other",
          priority || "Medium",
          createdBy,
        ]
      );

      const leadId = result.insertId;
      const leadCode = `LD${String(leadId).padStart(6, "0")}`;
      await db.query(`UPDATE leads SET lead_code=? WHERE id=?`, [leadCode, leadId]);

      await db.query(
        `INSERT INTO lead_activity_logs (lead_id, action_type, new_value, remark, performed_by)
         VALUES (?, 'Lead Created', ?, 'Imported via bulk upload', ?)`,
        [leadId, leadCode, createdBy]
      );

      results.imported += 1;
    } catch (err) {
      results.failed += 1;
      results.errors.push({ row: i + 1, reason: err.message || "Unknown error" });
    }
  }

  return results;
};

// ======================================
// 12. Get Lead Status Logs (Audit Trail)
// ======================================
const getLeadStatusLogs = async (leadId) => {
  const [rows] = await db.query(
    `
    SELECT
      lsl.*,
      u.full_name AS changed_by_name,
      u.email AS changed_by_email,
      r.role_name AS changed_by_role
    FROM lead_status_logs lsl
    LEFT JOIN users u ON lsl.changed_by = u.id
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE lsl.lead_id = ?
    ORDER BY lsl.created_at DESC, lsl.id DESC
    `,
    [leadId]
  );
  return rows;
};

// ======================================
// 13. Get Closed Leads Report (Not Interested & Lost Leads)
// ======================================
const getClosedLeadsReport = async (filters = {}, managerId = null) => {
  const whereConditions = ["l.is_deleted = 0", "l.status IN ('Not Interested', 'Lost')"];
  const queryParams = [];

  const dateFrom = filters.from_date || filters.date_from;
  const dateTo = filters.to_date || filters.date_to;

  if (dateFrom) {
    whereConditions.push("DATE(COALESCE(l.closed_at, l.updated_at, l.created_at)) >= ?");
    queryParams.push(dateFrom);
  }
  if (dateTo) {
    whereConditions.push("DATE(COALESCE(l.closed_at, l.updated_at, l.created_at)) <= ?");
    queryParams.push(dateTo);
  }
  if (filters.assigned_to) {
    whereConditions.push("l.assigned_to = ?");
    queryParams.push(filters.assigned_to);
  }
  if (filters.reason_category) {
    whereConditions.push("l.reason_category = ?");
    queryParams.push(filters.reason_category);
  }
  if (filters.status) {
    whereConditions.push("l.status = ?");
    queryParams.push(filters.status);
  }

  // Manager scope restriction
  if (managerId) {
    whereConditions.push("(l.assigned_to IN (SELECT id FROM users WHERE manager_id = ?) OR l.assigned_to = ? OR l.created_by = ?)");
    queryParams.push(managerId, managerId, managerId);
  }

  const whereClause = `WHERE ${whereConditions.join(" AND ")}`;

  const [rows] = await db.query(
    `
    SELECT
      l.id,
      l.lead_code,
      l.customer_name,
      l.mobile_number,
      l.email,
      l.city,
      l.state,
      l.status,
      l.reason_category,
      l.remark,
      l.required_kw,
      l.quotation_amount,
      l.deal_amount,
      COALESCE(l.closed_at, l.updated_at) AS closed_date,
      l.created_at,
      u.full_name AS assigned_to_name,
      u.email AS assigned_to_email
    FROM leads l
    LEFT JOIN users u ON l.assigned_to = u.id
    ${whereClause}
    ORDER BY COALESCE(l.closed_at, l.updated_at) DESC
    `,
    queryParams
  );

  return rows;
};


// ======================================
// 16. Today's Follow-up Directory
// ======================================
const getFollowupsDirectory = async (params, roleId, userId) => {
  const {
    period = "today",
    date = "",
    search = "",
    status = "",
    priority = "",
    assigned_to = "",
  } = params;

  const role = Number(roleId);
  let whereConditions = ["l.is_deleted = 0"];
  let queryParams = [];

  // Role scoping
  if (role === ROLE_SALES) {
    whereConditions.push("(l.assigned_to = ? OR l.created_by = ?)");
    queryParams.push(userId, userId);
  } else if (role === ROLE_MANAGER) {
    whereConditions.push(
      "(l.assigned_to IN (SELECT id FROM users WHERE manager_id = ?) OR l.assigned_to = ? OR l.created_by = ? OR l.assigned_by = ?)"
    );
    queryParams.push(userId, userId, userId, userId);
  } else if (role !== ROLE_SUPER_ADMIN) {
    whereConditions.push("1 = 0");
  }

  // Period / Date filter
  if (date) {
    whereConditions.push("DATE(l.next_follow_up_date) = ?");
    queryParams.push(date);
  } else if (period === "today") {
    whereConditions.push("DATE(l.next_follow_up_date) = CURDATE()");
  } else if (period === "overdue") {
    whereConditions.push("DATE(l.next_follow_up_date) < CURDATE() AND l.status NOT IN ('Won', 'Lost', 'Not Interested')");
  } else if (period === "upcoming") {
    whereConditions.push("DATE(l.next_follow_up_date) > CURDATE()");
  } else if (period === "not_scheduled") {
    whereConditions.push("l.next_follow_up_date IS NULL");
  }

  // Search filter
  if (search && search.trim()) {
    whereConditions.push("(l.lead_code LIKE ? OR l.customer_name LIKE ? OR l.mobile_number LIKE ? OR l.city LIKE ? OR l.email LIKE ?)");
    const term = "%" + search.trim() + "%";
    queryParams.push(term, term, term, term, term);
  }

  // Status
  if (status && status !== "All" && status !== "All Statuses") {
    whereConditions.push("l.status = ?");
    queryParams.push(status);
  }

  // Priority
  if (priority && priority !== "All") {
    whereConditions.push("l.priority = ?");
    queryParams.push(priority);
  }

  // Assigned To
  if (assigned_to && assigned_to !== "All" && assigned_to !== "All Staff") {
    whereConditions.push("l.assigned_to = ?");
    queryParams.push(assigned_to);
  }

  const whereClause = "WHERE " + whereConditions.join(" AND ");

  const [rows] = await db.query(
    `
    SELECT
      l.*,
      l.solar_requirement AS requirement_type,
      l.required_kw AS system_capacity,
      l.site_visit_date AS survey_date,
      l.pincode AS pin_code,
      u_assignee.full_name AS assigned_to_name,
      lf.note AS latest_remark, lf.created_at AS latest_remark_date, lf.followup_type AS latest_type,
      COALESCE(fc.total_remarks, 0) AS total_remarks
    FROM leads l
    LEFT JOIN users u_assignee ON l.assigned_to = u_assignee.id
    LEFT JOIN (
      SELECT f1.lead_id, f1.note, f1.followup_type, f1.created_at
      FROM lead_followups f1
      INNER JOIN (
        SELECT lead_id, MAX(created_at) AS max_created
        FROM lead_followups
        GROUP BY lead_id
      ) f2 ON f1.lead_id = f2.lead_id AND f1.created_at = f2.max_created
    ) lf ON lf.lead_id = l.id
    LEFT JOIN (
      SELECT lead_id, COUNT(*) AS total_remarks
      FROM lead_followups
      GROUP BY lead_id
    ) fc ON fc.lead_id = l.id
    ${whereClause}
    ORDER BY 
      CASE WHEN l.next_follow_up_date IS NULL THEN 1 ELSE 0 END,
      l.next_follow_up_date ASC,
      l.updated_at DESC
    `,
    queryParams
  );

  return rows;
};

module.exports = {
  getFollowupsDirectory,
  findLeadByMobile,
  createLead, getLeads, getLeadById, isLeadAccessibleByUser, getTeamFollowupsList,
  updateLead, updateLeadStatus, assignLead, addFollowup, getFollowups, getActivityLogs,
  deleteLead, bulkReassignLeads, bulkImportLeads, getLeadStatusLogs, getClosedLeadsReport,
};