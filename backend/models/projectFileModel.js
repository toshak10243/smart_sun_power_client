// models/projectFileModel.js

// 1. Generate SSP-YYYY-XXXX file number (atomic, transaction safe)
async function generateFileNumber(connection, year) {
    await connection.query(`
        INSERT INTO file_number_counter (year, last_number) 
        VALUES (?, 0) 
        ON DUPLICATE KEY UPDATE year = year;
    `, [year]);

    const [rows] = await connection.query(`
        SELECT last_number FROM file_number_counter 
        WHERE year = ? FOR UPDATE;
    `, [year]);

    const nextNumber = (rows[0]?.last_number || 0) + 1;

    await connection.query(`
        UPDATE file_number_counter SET last_number = ? WHERE year = ?;
    `, [nextNumber, year]);

    const padded = String(nextNumber).padStart(4, '0');
    return `SSP-${year}-${padded}`;
}

// 2. Create new project file record
async function createProjectFile(connection, data) {
    const sql = `
        INSERT INTO project_files (
            file_number, lead_id, customer_name, phone_number, reference_name,
            reference_phone, aen_office, k_number, connection_category, property_type,
            current_sanctioned_load, modification_type, is_in_modification, phase_type,
            is_loan, total_project_cost, kw_with_subsidy, kw_without_subsidy,
            panel_company, panel_wattage, inverter_company, inverter_capacity_kw,
            inverter_phase, structure_height_front, structure_height_back, other_site_notes,
            current_stage, stage_status, file_status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        data.file_number,
        data.lead_id,
        data.customer_name,
        data.phone_number,
        data.reference_name || null,
        data.reference_phone || null,
        data.aen_office,
        data.k_number,
        data.connection_category || 'DS',
        data.property_type || 'House',
        data.current_sanctioned_load || 1.0,
        data.modification_type || 'None',
        data.is_in_modification ? 1 : 0,
        data.phase_type || '1 Phase',
        data.is_loan ? 1 : 0,
        data.total_project_cost || 0.0,
        data.kw_with_subsidy || 0.0,
        data.kw_without_subsidy || 0.0,
        data.panel_company,
        data.panel_wattage,
        data.inverter_company,
        data.inverter_kw || null,
        data.inverter_phase || '1 Phase',
        data.structure_height_front || 0.0,
        data.structure_height_back || 0.0,
        data.other_site_notes || null,
        data.current_stage !== undefined ? data.current_stage : 1,
        data.stage_status || 'Pending',
        data.file_status || 'Active',
        data.created_by
    ];

    const [result] = await connection.query(sql, values);
    return result.insertId;
}

// 3. Create initial or subsequent stage log entry
async function createStageLog(db, data) {
    const sql = `
        INSERT INTO file_stage_logs (
            file_id, stage_number, stage_name, assigned_role_id, action_taken,
            remarks, proof_attachment_url, wifi_not_connected_reason,
            sla_hours_elapsed, sla_deadline, sla_hours_allowed, performed_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        data.file_id,
        data.stage_number,
        data.stage_name,
        data.assigned_role_id || null,
        data.action_taken,
        data.remarks || null,
        data.proof_attachment_url || null,
        data.wifi_not_connected_reason || null,
        data.sla_hours_elapsed || 0,
        data.sla_deadline || null,
        data.sla_hours_allowed || 24,
        data.performed_by
    ];

    const [result] = await db.query(sql, values);
    return result.insertId;
}

// 4. Get file by lead_id (check duplicate)
async function getFileByLeadId(db, leadId) {
    const [rows] = await db.query(`SELECT * FROM project_files WHERE lead_id = ? LIMIT 1`, [leadId]);
    return rows[0] || null;
}

// 5. Get file detail with stage_definitions JOIN
async function getFileById(db, fileId) {
    const sql = `
        SELECT pf.*, sd.stage_name as current_stage_name, sd.assigned_role as current_stage_role, sd.sla_hours as current_stage_sla
        FROM project_files pf
        LEFT JOIN stage_definitions sd ON sd.stage_number = pf.current_stage
        WHERE pf.id = ?
        LIMIT 1
    `;
    const [rows] = await db.query(sql, [fileId]);
    return rows[0] || null;
}

// 6. Get role-based queue (including pending, hold, cancelled, and user submitted history)
async function getQueueByRole(db, roleName, userId) {
    let roleCondition = `sd.assigned_role = ?`;
    if (roleName === 'Back Office Online') {
        roleCondition = `(sd.assigned_role = ? AND (pf.current_stage != 0 OR pf.sub_pipeline_step IN ('Step A', 'Step C') OR pf.sub_pipeline_step IS NULL))`;
    } else if (roleName === 'Back Office Field') {
        roleCondition = `(sd.assigned_role = ? OR (pf.current_stage = 0 AND pf.sub_pipeline_step = 'Step B'))`;
    }

    const sql = `
        SELECT pf.*, fsl.sla_deadline, fsl.action_taken as last_action,
               fsl.remarks as latest_remarks, fsl.proof_attachment_url,
               sd.stage_name, sd.assigned_role, sd.sla_hours,
               (SELECT COUNT(*) FROM file_stage_logs WHERE file_id = pf.id AND performed_by = ?) as my_actions_count
        FROM project_files pf
        LEFT JOIN stage_definitions sd ON sd.stage_number = pf.current_stage
        LEFT JOIN file_stage_logs fsl ON fsl.file_id = pf.id 
             AND fsl.id = (SELECT MAX(id) FROM file_stage_logs WHERE file_id = pf.id)
        WHERE (
            ${roleCondition}
            OR ? = 'Super Admin'
            OR pf.id IN (SELECT DISTINCT file_id FROM file_stage_logs WHERE performed_by = ?)
        )
        ORDER BY pf.id DESC
    `;
    const [rows] = await db.query(sql, [userId, roleName, roleName, userId]);
    return rows;
}

// 7. Get full stage timeline
async function getFileTimeline(db, fileId) {
    const sql = `
        SELECT fsl.*, u.full_name as performed_by_name, r.role_name as performed_by_role
        FROM file_stage_logs fsl
        LEFT JOIN users u ON u.id = fsl.performed_by
        LEFT JOIN roles r ON r.id = u.role_id
        WHERE fsl.file_id = ?
        ORDER BY fsl.id ASC
    `;
    const [rows] = await db.query(sql, [fileId]);
    return rows;
}

// 8. Update file stage with Optimistic Concurrency Control (OCC)
async function updateFileStage(db, fileId, nextStage, fileStatus, stageStatus = 'Pending', expectedVersion = null) {
    let sql;
    let params;

    if (expectedVersion !== null && expectedVersion !== undefined) {
        sql = `
            UPDATE project_files 
            SET current_stage = ?, file_status = ?, stage_status = ?, version = version + 1, updated_at = NOW() 
            WHERE id = ? AND version = ?
        `;
        params = [nextStage, fileStatus, stageStatus, fileId, Number(expectedVersion)];
    } else {
        sql = `
            UPDATE project_files 
            SET current_stage = ?, file_status = ?, stage_status = ?, version = version + 1, updated_at = NOW() 
            WHERE id = ?
        `;
        params = [nextStage, fileStatus, stageStatus, fileId];
    }

    const [result] = await db.query(sql, params);
    return result.affectedRows > 0;
}

// 9. Payment functions
async function createPayment(db, data) {
    const sql = `
        INSERT INTO project_payments (
            file_id, payment_stage, amount, payment_mode, reference_number,
            bank_name, cheque_date, receipt_number, receipt_url,
            status, is_verified, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
        data.file_id,
        data.payment_stage || 'Initial Advance',
        data.amount,
        data.payment_mode || 'Cash',
        data.reference_number || null,
        data.bank_name || null,
        data.cheque_date || null,
        data.receipt_number || null,
        data.receipt_url || null,
        data.status || 'Pending',
        data.is_verified ? 1 : 0,
        data.created_by
    ];
    const [result] = await db.query(sql, values);
    return result.insertId;
}

async function getPaymentsByFileId(db, fileId) {
    const sql = `
        SELECT pp.*, u.full_name as created_by_name, v.full_name as verified_by_name
        FROM project_payments pp
        LEFT JOIN users u ON u.id = pp.created_by
        LEFT JOIN users v ON v.id = pp.verified_by
        WHERE pp.file_id = ?
        ORDER BY pp.id ASC
    `;
    const [rows] = await db.query(sql, [fileId]);
    return rows;
}

async function verifyPayment(db, paymentId, userId) {
    const sql = `
        UPDATE project_payments 
        SET is_verified = 1, status = 'Verified', verified_by = ?, verified_at = NOW()
        WHERE id = ?
    `;
    const [result] = await db.query(sql, [userId, paymentId]);
    return result.affectedRows > 0;
}

async function togglePaymentClear(db, paymentId, userId) {
    const [curr] = await db.query(`SELECT is_verified FROM project_payments WHERE id = ?`, [paymentId]);
    if (!curr.length) return null;
    const newStatus = curr[0].is_verified ? 0 : 1;
    const statusText = newStatus ? 'Verified' : 'Pending';
    await db.query(`
        UPDATE project_payments 
        SET is_verified = ?, status = ?, verified_by = ?, verified_at = NOW() 
        WHERE id = ?
    `, [newStatus, statusText, newStatus ? userId : null, paymentId]);
    return newStatus;
}

// 10. Document functions
async function createDocument(db, data) {
    const sql = `
        INSERT INTO project_documents (
            file_id, doc_type, document_number, file_url, original_filename, uploaded_by
        ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [
        data.file_id,
        data.doc_type,
        data.document_number || null,
        data.file_url,
        data.original_filename || null,
        data.uploaded_by
    ];
    const [result] = await db.query(sql, values);
    return result.insertId;
}

async function getDocumentsByFileId(db, fileId) {
    const sql = `
        SELECT pd.*, u.full_name as uploaded_by_name
        FROM project_documents pd
        LEFT JOIN users u ON u.id = pd.uploaded_by
        WHERE pd.file_id = ?
        ORDER BY pd.id DESC
    `;
    const [rows] = await db.query(sql, [fileId]);
    return rows;
}

// 11. Expense functions
async function createExpense(db, data) {
    const sql = `
        INSERT INTO project_expenses (
            file_id, expense_category, amount, description, is_cleared, created_by
        ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [
        data.file_id,
        data.expense_category,
        data.amount,
        data.description || null,
        data.is_cleared ? 1 : 0,
        data.created_by
    ];
    const [result] = await db.query(sql, values);
    return result.insertId;
}

async function getExpensesByFileId(db, fileId) {
    const sql = `
        SELECT pe.*, u.full_name as created_by_name, c.full_name as cleared_by_name
        FROM project_expenses pe
        LEFT JOIN users u ON u.id = pe.created_by
        LEFT JOIN users c ON c.id = pe.cleared_by
        WHERE pe.file_id = ?
        ORDER BY pe.id ASC
    `;
    const [rows] = await db.query(sql, [fileId]);
    return rows;
}

async function toggleExpenseClear(db, expenseId, userId) {
    const [curr] = await db.query(`SELECT is_cleared FROM project_expenses WHERE id = ?`, [expenseId]);
    if (!curr.length) return null;
    const newStatus = curr[0].is_cleared ? 0 : 1;
    await db.query(`
        UPDATE project_expenses 
        SET is_cleared = ?, cleared_by = ?, cleared_at = NOW() 
        WHERE id = ?
    `, [newStatus, newStatus ? userId : null, expenseId]);
    return newStatus;
}

// 12. Rate approval
async function updateRateApproval(db, fileId, status, userId, remarks) {
    await db.query(`
        UPDATE project_files 
        SET rate_approval_status = ?, rate_approved_by = ?, updated_at = NOW()
        WHERE id = ?
    `, [status, userId, fileId]);
    return true;
}

module.exports = {
    generateFileNumber,
    createProjectFile,
    createStageLog,
    getFileByLeadId,
    getFileById,
    getQueueByRole,
    getFileTimeline,
    updateFileStage,
    createPayment,
    getPaymentsByFileId,
    verifyPayment,
    togglePaymentClear,
    createDocument,
    getDocumentsByFileId,
    createExpense,
    getExpensesByFileId,
    toggleExpenseClear,
    updateRateApproval
};
