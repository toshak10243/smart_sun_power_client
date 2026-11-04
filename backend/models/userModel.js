const { db } = require("../config/db");

// ===============================
// Internal Helper: Build WHERE Clause
// ===============================
const buildUserQueryFilters = (search, role, status) => {
    let whereClause = "WHERE u.is_deleted = 0";
    const values = [];

    if (search) {
        whereClause += ` AND (u.full_name LIKE ? OR u.username LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)`;
        values.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (role) {
        whereClause += " AND u.role_id = ?";
        values.push(role);
    }

    if (status) {
        whereClause += " AND u.status = ?";
        values.push(status);
    }

    return { whereClause, values };
};

// ===============================
// Check Username Exists
// ===============================
const checkUsernameExists = async (username) => {
    const [rows] = await db.query(
        `SELECT id FROM users WHERE username = ? AND is_deleted = 0 LIMIT 1`,
        [username]
    );
    return rows;
};

// ===============================
// Check Email Exists
// ===============================
const checkEmailExists = async (email) => {
    const [rows] = await db.query(
        `SELECT id FROM users WHERE email = ? AND is_deleted = 0 LIMIT 1`,
        [email]
    );
    return rows;
};

// ===============================
// Check Phone Exists
// ===============================
const checkPhoneExists = async (phone) => {
    const [rows] = await db.query(
        `SELECT id FROM users WHERE phone = ? AND is_deleted = 0 LIMIT 1`,
        [phone]
    );
    return rows;
};

// ===============================
// Create User
// ===============================
const createUser = async (data) => {
    const { role_id, manager_id, full_name, username, email, phone, password, created_by } = data;
    
    const [result] = await db.query(
        `INSERT INTO users (role_id, manager_id, full_name, username, email, phone, password, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [role_id, manager_id, full_name, username, email, phone, password, created_by]
    );
    return result;
};

// ===============================
// Get All Users (With Pagination)
// ===============================
const getAllUsers = async (offset, limit, search, role, status) => {
    const { whereClause, values } = buildUserQueryFilters(search, role, status);

    const query = `
        SELECT 
            u.id, u.full_name, u.username, u.email, u.phone,u.profile_image,
            u.status, u.last_login, u.created_at, 
            r.role_name,
            m.full_name AS manager_name
        FROM users u
        LEFT JOIN users m ON u.manager_id = m.id
        INNER JOIN roles r ON u.role_id = r.id
        ${whereClause}
        ORDER BY u.id DESC
        LIMIT ?, ?
    `;

    const [rows] = await db.query(query, [...values, Number(offset), Number(limit)]);
    return rows;
};

// ===============================
// Get Total Users Count (For Pagination)
// ===============================
const getTotalUsersCount = async (search, role, status) => {
    const { whereClause, values } = buildUserQueryFilters(search, role, status);

    const query = `
        SELECT COUNT(*) AS totalRecords
        FROM users u
        INNER JOIN roles r ON u.role_id = r.id
        ${whereClause}
    `;

    const [rows] = await db.query(query, values);
    return rows[0].totalRecords;
};

// ===============================
// Get User By ID
// ===============================
const getUserById = async (id) => {

    const [rows] = await db.query(
        `SELECT

            u.id,
            u.role_id,
            u.manager_id,
            u.full_name,
            u.username,
            u.email,
            u.phone,
            u.profile_image,
            u.status,
            u.last_login,
            u.created_at,
            r.role_name,
            m.full_name AS manager_name

        FROM users u

        LEFT JOIN users m
        ON u.manager_id = m.id

        INNER JOIN roles r
        ON u.role_id = r.id

        WHERE
            u.id = ?
            AND u.is_deleted = 0

        LIMIT 1`,
        [id]
    );

    return rows;
};

// ===============================
// Check Username Exists Except Current User
// ===============================
const checkUsernameExistsForUpdate = async (username, id) => {

    const [rows] = await db.query(
        `SELECT id
         FROM users
         WHERE username = ?
         AND id != ?
         AND is_deleted = 0
         LIMIT 1`,
        [username, id]
    );

    return rows;
};

// ===============================
// Check Email Exists Except Current User
// ===============================
const checkEmailExistsForUpdate = async (email, id) => {

    const [rows] = await db.query(
        `SELECT id
         FROM users
         WHERE email = ?
         AND id != ?
         AND is_deleted = 0
         LIMIT 1`,
        [email, id]
    );

    return rows;
};

// ===============================
// Check Phone Exists Except Current User
// ===============================
const checkPhoneExistsForUpdate = async (phone, id) => {

    const [rows] = await db.query(
        `SELECT id
         FROM users
         WHERE phone = ?
         AND id != ?
         AND is_deleted = 0
         LIMIT 1`,
        [phone, id]
    );

    return rows;
};

// ===============================
// Update User
// ===============================
const updateUser = async (data) => {

    const {
        id,
        role_id,
        manager_id,
        full_name,
        username,
        email,
        phone
    } = data;

    const [result] = await db.query(

        `UPDATE users
        SET
            role_id = ?,
            manager_id = ?,
            full_name = ?,
            username = ?,
            email = ?,
            phone = ?
        WHERE 
            id = ? 
            AND is_deleted = 0`,

        [
            role_id,
            manager_id,
            full_name,
            username,
            email,
            phone,
            id
        ]

    );

    return result;

};

// ===============================
// Update User Status
// ===============================
const updateUserStatus = async (id, status) => {

    const [result] = await db.query(
        `UPDATE users
        SET status = ?
        WHERE id = ?
        AND is_deleted = 0`,
        [status, id]
    );

    return result;
};

// ===============================
// Soft Delete User
// ===============================
const softDeleteUser = async (id) => {

    const [result] = await db.query(
        `UPDATE users
        SET is_deleted = 1
        WHERE id = ?`,
        [id]
    );

    return result;
};

// ===============================
// Get Team Members By Manager ID
// ===============================
const getTeamMembersByManager = async (managerId) => {
    const query = `
        SELECT 
            u.id, 
            u.full_name, 
            u.username,
            u.email, 
            u.phone, 
            u.status, 
            u.profile_image,
            COUNT(l.id) AS total_assigned,
            SUM(CASE WHEN l.status = 'Won' THEN 1 ELSE 0 END) AS converted,
            SUM(CASE WHEN l.status = 'Lost' THEN 1 ELSE 0 END) AS lost,
            SUM(CASE WHEN l.status NOT IN ('Won','Lost','Not Interested') THEN 1 ELSE 0 END) AS in_progress,
            SUM(CASE WHEN l.next_follow_up_date = CURDATE() 
                     AND l.status NOT IN ('Won','Lost','Not Interested') 
                THEN 1 ELSE 0 END) AS today_followups
        FROM users u
        LEFT JOIN leads l ON l.assigned_to = u.id AND l.is_deleted = 0
        WHERE u.manager_id = ? 
          AND u.role_id = 3 
          AND u.is_deleted = 0
        GROUP BY u.id
        ORDER BY u.id DESC
    `;

    const [rows] = await db.query(query, [managerId]);
    return rows;
};

// ===============================
// Check If User Is In Manager's Team
// ===============================
const isUserInManagerTeam = async (userId, managerId) => {
    if (String(userId) === String(managerId)) return true;
    const [rows] = await db.query(
        `SELECT id FROM users WHERE id = ? AND manager_id = ? AND is_deleted = 0`,
        [userId, managerId]
    );
    return rows.length > 0;
};

// ===============================
// Get Manager Assignments Summary (Super Admin)
// ===============================
const getManagerAssignmentsSummary = async () => {
    const query = `
        SELECT 
            m.id,
            m.full_name,
            m.username,
            m.email,
            m.phone,
            m.profile_image,
            m.status,
            m.created_at,
            COUNT(DISTINCT tm.id) AS total_team_members,
            COUNT(DISTINCT CASE WHEN tm.status = 'Active' THEN tm.id END) AS active_team_members,
            COUNT(DISTINCT l.id) AS total_assigned_leads,
            SUM(CASE WHEN l.status = 'Won' THEN 1 ELSE 0 END) AS won_leads,
            SUM(CASE WHEN l.status = 'Lost' THEN 1 ELSE 0 END) AS lost_leads,
            SUM(CASE WHEN l.status NOT IN ('Won', 'Lost', 'Not Interested') AND l.id IS NOT NULL THEN 1 ELSE 0 END) AS in_progress_leads
        FROM users m
        LEFT JOIN users tm ON tm.manager_id = m.id AND tm.role_id = 3 AND tm.is_deleted = 0
        LEFT JOIN leads l ON (l.assigned_by = m.id OR l.assigned_to = tm.id) AND l.is_deleted = 0
        WHERE m.role_id = 2 AND m.is_deleted = 0
        GROUP BY m.id
        ORDER BY total_assigned_leads DESC, m.full_name ASC
    `;
    const [rows] = await db.query(query);
    return rows;
};

// ===============================
// Get Manager Assigned Leads (Super Admin Drill-Down)
// ===============================
const getManagerAssignedLeads = async (managerId, params = {}) => {
    const { search = "", status = "" } = params;
    let whereConditions = [
        "l.is_deleted = 0",
        "(l.assigned_by = ? OR (u_assignee.manager_id = ? AND l.assigned_to IS NOT NULL))"
    ];
    let queryParams = [managerId, managerId];

    if (search) {
        whereConditions.push("(l.lead_code LIKE ? OR l.customer_name LIKE ? OR l.mobile_number LIKE ? OR l.city LIKE ?)");
        const term = `%${search}%`;
        queryParams.push(term, term, term, term);
    }
    if (status) {
        whereConditions.push("l.status = ?");
        queryParams.push(status);
    }

    const query = `
        SELECT 
            l.id,
            l.lead_code,
            l.customer_name,
            l.mobile_number,
            l.alternate_number,
            l.email,
            l.city,
            l.state,
            l.solar_requirement,
            l.required_kw,
            l.quotation_amount,
            l.priority,
            l.status,
            l.interest_status,
            l.assigned_to,
            u_assignee.full_name AS assigned_to_name,
            u_assignee.profile_image AS assigned_to_image,
            l.assigned_by,
            u_assigner.full_name AS assigned_by_name,
            l.created_at,
            l.updated_at
        FROM leads l
        LEFT JOIN users u_assignee ON l.assigned_to = u_assignee.id
        LEFT JOIN users u_assigner ON l.assigned_by = u_assigner.id
        WHERE ${whereConditions.join(" AND ")}
        ORDER BY l.updated_at DESC, l.id DESC
    `;

    const [rows] = await db.query(query, queryParams);
    return rows;
};


// ===============================
// Get Users KPI Stats
// ===============================
const getUserStats = async () => {
    const query = `
        SELECT 
            COUNT(*) AS total,
            SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) AS active,
            SUM(CASE WHEN status = 'Inactive' THEN 1 ELSE 0 END) AS inactive,
            SUM(CASE WHEN role_id = 2 THEN 1 ELSE 0 END) AS managers,
            SUM(CASE WHEN role_id = 3 THEN 1 ELSE 0 END) AS sales,
            SUM(CASE WHEN role_id IN (4,5,6,7,8,9) THEN 1 ELSE 0 END) AS backOffice
        FROM users 
        WHERE is_deleted = 0
    `;
    const [rows] = await db.query(query);
    return rows[0] || { total: 0, active: 0, inactive: 0, managers: 0, sales: 0, backOffice: 0 };
};

module.exports = {
    getUserStats,
    checkUsernameExists,
    checkEmailExists,
    checkPhoneExists,
    createUser,
    getAllUsers,
    getTotalUsersCount,
    getUserById,
    checkUsernameExistsForUpdate,
    checkEmailExistsForUpdate,
    checkPhoneExistsForUpdate,
    updateUser,
    updateUserStatus,
    softDeleteUser,
    getTeamMembersByManager,
    isUserInManagerTeam,
    getManagerAssignmentsSummary,
    getManagerAssignedLeads
};