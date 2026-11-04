// controllers/projectFileController.js
const { db } = require('../config/db');
const model = require('../models/projectFileModel');
const notificationService = require('../services/notificationService');

// Helper: next stage logic
function getNextStage(current, isLoan) {
    if (current === 0) return 1; // Modification Sub-branch -> Stage 1 File Online
    if (current === 1) return isLoan ? 2 : 3;
    if (current === 2) return 3;
    if (current === 9) return isLoan ? 10 : 11;
    if (current === 10) return 11;
    return current + 1;
}

// Helper: word count check
function wordCount(str) {
    return str ? str.trim().split(/\s+/).filter(w => w.length > 0).length : 0;
}

// 1. Create File (Lead Won Intake Form) - POST /api/files/create
exports.createFile = async (req, res) => {
    let connection;
    try {
        const {
            lead_id, aen_office, k_number, connection_category, property_type,
            current_sanctioned_load, modification_required, modification_type,
            phase_type, is_loan, total_project_cost, kw_with_subsidy,
            kw_without_subsidy, panel_company, panel_wattage, inverter_company,
            inverter_kw, inverter_phase, structure_height_front,
            structure_height_back, reference_name, reference_phone,
            advance_amount, payment_mode, reference_number, bank_name,
            customer_name, phone_number
        } = req.body;

        if (!lead_id) {
            return res.status(400).json({ success: false, message: "lead_id is required" });
        }

        // 1. Check lead exists & status='Won'
        const [leadRows] = await db.query(
            `SELECT id, customer_name, mobile_number, status FROM leads WHERE id = ? LIMIT 1`, 
            [lead_id]
        );

        if (leadRows.length === 0) {
            return res.status(404).json({ success: false, message: "Lead not found" });
        }

        const lead = leadRows[0];
        if (lead.status !== 'Won') {
            return res.status(400).json({ success: false, message: "Lead must be in Won status" });
        }

        // 2. Check duplicate
        const existing = await model.getFileByLeadId(db, lead_id);
        if (existing) {
            return res.status(400).json({ success: false, message: "File already created for this lead" });
        }

        // 3. Get connection for transaction
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 5. Atomic file number
        const currentYear = new Date().getFullYear();
        const fileNumber = await model.generateFileNumber(connection, currentYear);

        // 6. Create file record
        const fileData = {
            file_number: fileNumber,
            lead_id,
            customer_name: customer_name || lead.customer_name,
            phone_number: phone_number || lead.mobile_number,
            reference_name,
            reference_phone,
            aen_office,
            k_number,
            connection_category: connection_category || 'DS',
            property_type: property_type || 'House',
            current_sanctioned_load: current_sanctioned_load || 1.0,
            modification_type: modification_required ? (modification_type || 'Load Extension') : 'None',
            is_in_modification: !!modification_required,
            phase_type: phase_type || '1 Phase',
            is_loan: !!is_loan,
            total_project_cost: total_project_cost || 0.0,
            kw_with_subsidy: kw_with_subsidy || 0.0,
            kw_without_subsidy: kw_without_subsidy || 0.0,
            panel_company: panel_company || 'Standard',
            panel_wattage: panel_wattage || '540W',
            inverter_company: inverter_company || 'Standard',
            inverter_kw: inverter_kw || null,
            inverter_phase: inverter_phase || '1 Phase',
            structure_height_front: structure_height_front || 0.0,
            structure_height_back: structure_height_back || 0.0,
            other_site_notes: req.body.other_site_notes || null,
            current_stage: modification_required ? 0 : 1,
            stage_status: 'Pending',
            file_status: 'Active',
            created_by: req.user.id
        };

        const fileId = await model.createProjectFile(connection, fileData);

        // 7. Create initial payment record
        if (advance_amount && Number(advance_amount) > 0) {
            await connection.query(`
                INSERT INTO project_payments (
                    file_id, payment_stage, amount, payment_mode, reference_number,
                    bank_name, status, is_verified, created_by
                ) VALUES (?, 'Initial Advance', ?, ?, ?, ?, 'Pending', 0, ?)
            `, [
                fileId, 
                Number(advance_amount), 
                payment_mode || 'Cash', 
                reference_number || null, 
                bank_name || null, 
                req.user.id
            ]);
        }

        // 8. Determine first stage log
        if (modification_required) {
            await connection.query(`
                INSERT INTO file_stage_logs (
                    file_id, stage_number, stage_name, action_taken,
                    sla_deadline, sla_hours_allowed, performed_by
                ) VALUES (?, 0, 'Modification Sub-Pipeline', 'Pending', DATE_ADD(NOW(), INTERVAL 24 HOUR), 24, ?)
            `, [fileId, req.user.id]);
        } else {
            await connection.query(`
                INSERT INTO file_stage_logs (
                    file_id, stage_number, stage_name, action_taken,
                    sla_deadline, sla_hours_allowed, performed_by
                ) VALUES (?, 1, 'File Online', 'Pending', DATE_ADD(NOW(), INTERVAL 24 HOUR), 24, ?)
            `, [fileId, req.user.id]);
        }

        await connection.commit();
        connection.release();

        // Asynchronously dispatch notifications
        (async () => {
            try {
                const kwTotal = (Number(kw_with_subsidy) || 0) + (Number(kw_without_subsidy) || 0);
                await notificationService.notifyFileCreated({
                    fileId,
                    fileNumber,
                    customerName: customer_name || lead.customer_name,
                    kwCapacity: kwTotal > 0 ? kwTotal : null,
                    totalCost: total_project_cost,
                    createdByUserId: req.user.id,
                    isModification: !!modification_required
                });

                if (advance_amount && Number(advance_amount) > 0) {
                    await notificationService.notifyPaymentAdded({
                        fileId,
                        fileNumber,
                        customerName: customer_name || lead.customer_name,
                        amount: advance_amount,
                        paymentMode: payment_mode || 'Cash',
                        paymentStage: 'Initial Advance',
                        addedByName: req.user.full_name || req.user.name || 'Sales'
                    });
                }
            } catch (notifErr) {
                console.error("createFile notification error:", notifErr.message);
            }
        })();

        return res.status(201).json({
            success: true,
            message: "Project file created successfully",
            file_id: fileId,
            file_number: fileNumber
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
            connection.release();
        }
        console.error("createFile error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Get User Queue - GET /api/files/my-queue
exports.getMyQueue = async (req, res) => {
    try {
        const [userRows] = await db.query(`
            SELECT r.role_name 
            FROM roles r 
            JOIN users u ON u.role_id = r.id 
            WHERE u.id = ? LIMIT 1
        `, [req.user.id]);

        if (userRows.length === 0) {
            return res.status(403).json({ success: false, message: "User role not found" });
        }

        const roleName = userRows[0].role_name;
        const files = await model.getQueueByRole(db, roleName, req.user.id);

        const now = Date.now();
        const enrichedFiles = files.map(file => {
            const deadline = file.sla_deadline ? new Date(file.sla_deadline).getTime() : (now + 24 * 3600000);
            const slaHours = file.sla_hours || 24;
            const totalMs = slaHours * 3600000;
            const usedMs = now - (deadline - totalMs);
            const pct = Math.max(0, usedMs / totalMs);

            let sla_color = 'green';
            if (pct >= 1.0) sla_color = 'red';
            else if (pct >= 0.5) sla_color = 'orange';

            const hours_remaining = Math.max(0, Math.round((deadline - now) / 3600000));

            return {
                ...file,
                sla_color,
                hours_remaining
            };
        });

        return res.status(200).json({
            success: true,
            role: roleName,
            files: enrichedFiles
        });
    } catch (error) {
        console.error("getMyQueue error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Get File Detail - GET /api/files/:fileId
exports.getFileDetail = async (req, res) => {
    try {
        const fileId = req.params.fileId;
        const file = await model.getFileById(db, fileId);

        if (!file) {
            return res.status(404).json({ success: false, message: "File not found" });
        }

        const timeline = await model.getFileTimeline(db, fileId);
        const payments = await model.getPaymentsByFileId(db, fileId);
        const documents = await model.getDocumentsByFileId(db, fileId);
        const expenses = await model.getExpensesByFileId(db, fileId);

        return res.status(200).json({
            success: true,
            file,
            timeline,
            payments,
            documents,
            expenses
        });
    } catch (error) {
        console.error("getFileDetail error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 4. Stage Action - POST /api/files/:fileId/stage-action
exports.stageAction = async (req, res) => {
    try {
        const fileId = req.params.fileId;
        const { stage_number, action, remarks, proof_url, wifi_not_connected_reason, version } = req.body;

        // 1. Get file
        const file = await model.getFileById(db, fileId);
        if (!file) {
            return res.status(404).json({ success: false, message: "File not found" });
        }

        // Optimistic Concurrency Control (OCC) check
        if (version !== undefined && version !== null && Number(version) !== Number(file.version || 1)) {
            return res.status(409).json({
                success: false,
                conflict: true,
                message: "Concurrency conflict: This file has been modified by another user. Please refresh to load the latest state.",
                current_version: file.version,
                current_stage: file.current_stage,
                file_status: file.file_status
            });
        }

        // 2. Stage sequence
        if (Number(stage_number) !== Number(file.current_stage)) {
            return res.status(400).json({ success: false, message: "Not your turn or invalid stage" });
        }

        // 3. User role
        const [userRows] = await db.query(`
            SELECT r.role_name 
            FROM roles r 
            JOIN users u ON u.role_id = r.id 
            WHERE u.id = ? LIMIT 1
        `, [req.user.id]);
        const userRole = userRows[0]?.role_name;

        // 4. Stage definition
        const [stageRows] = await db.query(`SELECT * FROM stage_definitions WHERE stage_number = ? LIMIT 1`, [stage_number]);
        if (stageRows.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid stage definition" });
        }
        const stageDef = stageRows[0];

        // 5. Role match (Super Admin can perform any stage)
        if (Number(stage_number) === 0) {
            const currentSubStep = file.sub_pipeline_step || 'Step A';
            if (currentSubStep === 'Step B' && userRole !== 'Back Office Field' && userRole !== 'Super Admin') {
                return res.status(403).json({ success: false, message: "Step B (Sub-Offline File) requires Back Office Field (Suresh)" });
            }
            if ((currentSubStep === 'Step A' || currentSubStep === 'Step C') && userRole !== 'Back Office Online' && userRole !== 'Super Admin') {
                return res.status(403).json({ success: false, message: "Step A & Step C require Back Office Online (Jitu)" });
            }
        } else if (stageDef.assigned_role !== userRole && userRole !== 'Super Admin') {
            return res.status(403).json({ success: false, message: `Not authorized for this stage. Requires: ${stageDef.assigned_role}` });
        }

        // 6. Hold / Cancel word check
        if (['Hold', 'Cancel'].includes(action) && wordCount(remarks) < 10) {
            return res.status(400).json({ success: false, message: "Minimum 10 words required in remarks for Hold or Cancel" });
        }

        // 7. Stage 4 photo proof check
        if (Number(stage_number) === 4 && action === 'Submit' && !proof_url) {
            return res.status(400).json({ success: false, message: "Photo proof required for Stage 4 (Meter Application)" });
        }

        // 8. Stage 12 or 14 no-block rule
        if ((Number(stage_number) === 12 || Number(stage_number) === 14) && action === 'No') {
            return res.status(400).json({ success: false, message: "No option not allowed for this stage. Only Yes or Hold." });
        }

        // 9. Stage 13 WiFi reason check
        if (Number(stage_number) === 13 && action === 'No' && (!wifi_not_connected_reason || !wifi_not_connected_reason.trim())) {
            return res.status(400).json({ success: false, message: "Mandatory reason required when WiFi is not connected" });
        }

        // Determine next stage & status
        let nextStage = getNextStage(Number(stage_number), file.is_loan);
        let nextStatus = 'Active';
        let nextStageStatus = 'Pending';

        if (action === 'Cancel') {
            nextStatus = 'Cancelled';
            nextStage = file.current_stage;
        } else if (action === 'Hold') {
            nextStatus = 'On Hold';
            nextStage = file.current_stage;
        } else if (Number(stage_number) === 0) {
            // Sub-pipeline 3-Step Sync
            const currentSubStep = file.sub_pipeline_step || 'Step A';
            if (currentSubStep === 'Step A') {
                nextStage = 0;
                await db.query(`UPDATE project_files SET sub_pipeline_step = 'Step B', updated_at = NOW() WHERE id = ?`, [fileId]);
            } else if (currentSubStep === 'Step B') {
                nextStage = 0;
                await db.query(`UPDATE project_files SET sub_pipeline_step = 'Step C', updated_at = NOW() WHERE id = ?`, [fileId]);
            } else if (currentSubStep === 'Step C') {
                if (action === 'Paid' || action === 'Submit') {
                    nextStage = 1; // Unlocks Main Stage 1!
                    await db.query(`UPDATE project_files SET sub_pipeline_step = 'Completed', is_in_modification = 0, is_sub_pipeline_active = 0, sub_pipeline_status = 'Paid', updated_at = NOW() WHERE id = ?`, [fileId]);
                } else if (action === 'Due') {
                    nextStage = 0;
                    nextStatus = 'On Hold';
                    await db.query(`UPDATE project_files SET sub_pipeline_status = 'Due', updated_at = NOW() WHERE id = ?`, [fileId]);
                }
            }
        } else if (Number(stage_number) === 6 && action === 'In Process') {
            nextStage = 6;
            nextStatus = 'Active';
            nextStageStatus = 'In Process';
        } else if (Number(stage_number) === 17) {
            if (action === 'Yes' || action === 'Completed') {
                nextStatus = 'Completed';
            } else if (action === 'Pending') {
                nextStage = 17;
                nextStatus = 'Active';
            } else if (action === 'No') {
                nextStatus = 'Cancelled';
                nextStage = 17;
            }
        }

        const nextSlaDeadline = new Date(Date.now() + stageDef.sla_hours * 3600000);

        await model.createStageLog(db, {
            file_id: fileId,
            stage_number,
            stage_name: stageDef.stage_name,
            assigned_role_id: stageDef.stage_number,
            action_taken: action,
            remarks: remarks || null,
            proof_attachment_url: proof_url || null,
            wifi_not_connected_reason: wifi_not_connected_reason || null,
            sla_deadline: nextSlaDeadline,
            sla_hours_allowed: stageDef.sla_hours,
            performed_by: req.user.id
        });

        const updated = await model.updateFileStage(
            db, 
            fileId, 
            nextStage, 
            nextStatus, 
            nextStageStatus, 
            version !== undefined && version !== null ? Number(version) : null
        );

        if (!updated) {
            return res.status(409).json({
                success: false,
                conflict: true,
                message: "Concurrency conflict: This file was modified simultaneously by another session. Please refresh.",
            });
        }

        // Asynchronously dispatch notifications
        (async () => {
            try {
                const [leadRows] = await db.query(
                    `SELECT l.assigned_to as sales_rep_id, u.full_name as performed_by_name
                     FROM project_files pf
                     JOIN leads l ON l.id = pf.lead_id
                     LEFT JOIN users u ON u.id = ?
                     WHERE pf.id = ?`,
                    [req.user.id, fileId]
                );
                const salesRepId = leadRows[0]?.sales_rep_id;
                const performedByName = leadRows[0]?.performed_by_name || req.user.full_name || req.user.name || 'Staff';

                if (action === 'Hold') {
                    await notificationService.notifyFileHold({
                        fileId,
                        fileNumber: file.file_number,
                        customerName: file.customer_name,
                        stageNumber: stage_number,
                        stageName: stageDef.stage_name,
                        remarks,
                        performedByName,
                        salesRepId
                    });
                } else if (action === 'Cancel') {
                    await notificationService.notifyFileCancelled({
                        fileId,
                        fileNumber: file.file_number,
                        customerName: file.customer_name,
                        remarks,
                        performedByName,
                        salesRepId
                    });
                } else {
                    // Check if file was previously On Hold and is now resumed
                    if (file.file_status === 'On Hold') {
                        await notificationService.notifyFileResumed({
                            fileId,
                            fileNumber: file.file_number,
                            customerName: file.customer_name,
                            stageNumber: stage_number,
                            stageName: stageDef.stage_name,
                            performedByName,
                            salesRepId
                        });
                    }

                    // If advanced to next stage
                    if (Number(nextStage) !== Number(file.current_stage)) {
                        const [nextStageRows] = await db.query(
                            `SELECT stage_name, assigned_role FROM stage_definitions WHERE stage_number = ? LIMIT 1`,
                            [nextStage]
                        );
                        const nextStageDef = nextStageRows[0];
                        await notificationService.notifyStageAdvanced({
                            fileId,
                            fileNumber: file.file_number,
                            customerName: file.customer_name,
                            nextStageNumber: nextStage,
                            nextStageName: nextStageDef?.stage_name || `Stage ${nextStage}`,
                            nextRoleName: nextStageDef?.assigned_role || null,
                            performedByName,
                            salesRepId
                        });
                    }
                }
            } catch (notifErr) {
                console.error("stageAction notification error:", notifErr.message);
            }
        })();

        return res.status(200).json({
            success: true,
            message: "Stage action updated successfully",
            next_stage: nextStage,
            file_status: nextStatus
        });
    } catch (error) {
        console.error("stageAction error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 5. Get Tracker (Sales Live View) - GET /api/files/lead/:leadId/tracker
exports.getTracker = async (req, res) => {
    try {
        const leadId = req.params.leadId;
        const file = await model.getFileByLeadId(db, leadId);

        if (!file) {
            return res.status(404).json({ success: false, message: "No file found for this lead" });
        }

        const timeline = await model.getFileTimeline(db, file.id);
        const payments = await model.getPaymentsByFileId(db, file.id);

        const total_paid = payments
            .filter(p => p.status === 'Verified' || p.is_verified === 1)
            .reduce((s, p) => s + Number(p.amount || 0), 0);

        const total_cost = Number(file.total_project_cost || 0);

        return res.status(200).json({
            success: true,
            file_id: file.id,
            file_number: file.file_number,
            current_stage: file.current_stage,
            file_status: file.file_status,
            total_project_cost: total_cost,
            total_paid,
            balance_due: Math.max(0, total_cost - total_paid),
            timeline
        });
    } catch (error) {
        console.error("getTracker error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 6. Add Payment - POST /api/files/:fileId/payment
exports.addPayment = async (req, res) => {
    try {
        const fileId = req.params.fileId;
        const { payment_stage, amount, payment_mode, reference_number, bank_name, cheque_date } = req.body;

        if (!amount || Number(amount) <= 0) {
            return res.status(400).json({ success: false, message: "Valid amount is required" });
        }

        const paymentId = await model.createPayment(db, {
            file_id: fileId,
            payment_stage: payment_stage || 'Pre-Install',
            amount: Number(amount),
            payment_mode: payment_mode || 'Cash',
            reference_number,
            bank_name,
            cheque_date: cheque_date || null,
            status: 'Pending',
            is_verified: 0,
            created_by: req.user.id
        });

        // Asynchronously dispatch notification
        (async () => {
            try {
                const [fileRows] = await db.query(
                    `SELECT pf.file_number, pf.customer_name, u.full_name as user_name
                     FROM project_files pf
                     LEFT JOIN users u ON u.id = ?
                     WHERE pf.id = ?`,
                    [req.user.id, fileId]
                );
                const fileInfo = fileRows[0];
                if (fileInfo) {
                    await notificationService.notifyPaymentAdded({
                        fileId,
                        fileNumber: fileInfo.file_number,
                        customerName: fileInfo.customer_name,
                        amount: Number(amount),
                        paymentMode: payment_mode || 'Cash',
                        paymentStage: payment_stage || 'Pre-Install',
                        addedByName: fileInfo.user_name || req.user.full_name || 'Staff'
                    });
                }
            } catch (notifErr) {
                console.error("addPayment notification error:", notifErr.message);
            }
        })();

        return res.status(201).json({
            success: true,
            message: "Payment entry created successfully",
            payment_id: paymentId
        });
    } catch (error) {
        console.error("addPayment error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 7. Verify Payment (Accounts Gate) - PATCH /api/files/payment/:paymentId/verify
exports.verifyPayment = async (req, res) => {
    try {
        const paymentId = req.params.paymentId;
        await model.verifyPayment(db, paymentId, req.user.id);

        // Asynchronously dispatch notification
        (async () => {
            try {
                const [payRows] = await db.query(
                    `SELECT pp.amount, pp.payment_stage, pp.file_id, pf.file_number, pf.customer_name, l.assigned_to as sales_rep_id, u.full_name as verifier_name
                     FROM project_payments pp
                     JOIN project_files pf ON pf.id = pp.file_id
                     JOIN leads l ON l.id = pf.lead_id
                     LEFT JOIN users u ON u.id = ?
                     WHERE pp.id = ?`,
                    [req.user.id, paymentId]
                );
                const pInfo = payRows[0];
                if (pInfo) {
                    await notificationService.notifyPaymentVerified({
                        fileId: pInfo.file_id,
                        fileNumber: pInfo.file_number,
                        customerName: pInfo.customer_name,
                        amount: pInfo.amount,
                        paymentStage: pInfo.payment_stage,
                        verifiedByName: pInfo.verifier_name || 'Accounts',
                        salesRepId: pInfo.sales_rep_id
                    });
                }
            } catch (notifErr) {
                console.error("verifyPayment notification error:", notifErr.message);
            }
        })();

        return res.status(200).json({
            success: true,
            message: "Payment verified successfully"
        });
    } catch (error) {
        console.error("verifyPayment error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 8. Upload Document - POST /api/files/:fileId/document
exports.uploadDocument = async (req, res) => {
    try {
        const fileId = req.params.fileId;
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No document file uploaded" });
        }

        const { doc_type, document_number } = req.body;
        const fileUrl = `/uploads/documents/${req.file.filename}`;

        const docId = await model.createDocument(db, {
            file_id: fileId,
            doc_type: doc_type || 'Other',
            document_number: document_number || null,
            file_url: fileUrl,
            original_filename: req.file.originalname,
            uploaded_by: req.user.id
        });

        // Asynchronously dispatch notification
        (async () => {
            try {
                const [fileRows] = await db.query(
                    `SELECT pf.file_number, pf.customer_name, pf.current_stage, sd.assigned_role, l.assigned_to as sales_rep_id, u.full_name as uploader_name
                     FROM project_files pf
                     JOIN leads l ON l.id = pf.lead_id
                     LEFT JOIN stage_definitions sd ON sd.stage_number = pf.current_stage
                     LEFT JOIN users u ON u.id = ?
                     WHERE pf.id = ?`,
                    [req.user.id, fileId]
                );
                const fileInfo = fileRows[0];
                if (fileInfo) {
                    await notificationService.notifyDocumentUploaded({
                        fileId,
                        fileNumber: fileInfo.file_number,
                        customerName: fileInfo.customer_name,
                        docType: doc_type || 'Document',
                        currentRoleName: fileInfo.assigned_role,
                        uploadedByName: fileInfo.uploader_name || 'Staff',
                        salesRepId: fileInfo.sales_rep_id
                    });
                }
            } catch (notifErr) {
                console.error("uploadDocument notification error:", notifErr.message);
            }
        })();

        return res.status(201).json({
            success: true,
            message: "Document uploaded successfully",
            doc_id: docId,
            file_url: fileUrl
        });
    } catch (error) {
        console.error("uploadDocument error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 9. Get Sales Won Files - GET /api/files/sales/won-files
exports.getSalesWonFiles = async (req, res) => {
    try {
        const userId = req.user.id;
        const [userRows] = await db.query(`
            SELECT r.role_name 
            FROM roles r 
            JOIN users u ON u.role_id = r.id 
            WHERE u.id = ? LIMIT 1
        `, [userId]);

        const roleName = userRows[0]?.role_name || '';
        const isSales = roleName.toLowerCase().includes('sales');

        let sql = `
            SELECT pf.*, sd.stage_name as current_stage_name, sd.assigned_role,
                   (SELECT remarks FROM file_stage_logs WHERE file_id = pf.id ORDER BY id DESC LIMIT 1) as latest_remarks,
                   (SELECT COALESCE(SUM(amount), 0) FROM project_payments WHERE file_id = pf.id) as total_paid
            FROM project_files pf
            JOIN leads l ON l.id = pf.lead_id
            LEFT JOIN stage_definitions sd ON sd.stage_number = pf.current_stage
        `;

        const params = [];
        if (isSales) {
            sql += ` WHERE (l.assigned_to = ? OR pf.created_by = ?) `;
            params.push(userId, userId);
        }

        sql += ` ORDER BY pf.id DESC `;

        const [rows] = await db.query(sql, params);

        const files = rows.map(r => {
            const cost = Number(r.total_project_cost) || 0;
            const paid = Number(r.total_paid) || 0;
            return {
                ...r,
                balance_due: Math.max(0, cost - paid)
            };
        });

        return res.status(200).json({
            success: true,
            files
        });
    } catch (error) {
        console.error("getSalesWonFiles error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 10. Get Back-Office Dashboard Analytics & Charts - GET /api/files/dashboard/stats
exports.getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const [userRows] = await db.query(`
            SELECT r.role_name 
            FROM roles r 
            JOIN users u ON u.role_id = r.id 
            WHERE u.id = ? LIMIT 1
        `, [userId]);

        const roleName = userRows[0]?.role_name || '';

        // 1. Overall & Role Specific Counts
        const [countRows] = await db.query(`
            SELECT 
                COUNT(*) as total_files,
                SUM(CASE WHEN file_status = 'Active' THEN 1 ELSE 0 END) as active_files,
                SUM(CASE WHEN file_status = 'On Hold' THEN 1 ELSE 0 END) as hold_files,
                SUM(CASE WHEN file_status = 'Completed' THEN 1 ELSE 0 END) as completed_files,
                SUM(CASE WHEN file_status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled_files,
                COALESCE(SUM(total_project_cost), 0) as total_booked_value
            FROM project_files
        `);

        // 2. Financials from project_payments
        const [finRows] = await db.query(`
            SELECT 
                COALESCE(SUM(CASE WHEN status = 'Verified' THEN amount ELSE 0 END), 0) as total_collected,
                COALESCE(SUM(CASE WHEN status = 'Pending' THEN amount ELSE 0 END), 0) as total_pending_clearance
            FROM project_payments
        `);

        // 3. Desk / Role Distribution (Graph data)
        const [deskRows] = await db.query(`
            SELECT 
                sd.assigned_role,
                COUNT(pf.id) as count
            FROM project_files pf
            JOIN stage_definitions sd ON sd.stage_number = pf.current_stage
            WHERE pf.file_status = 'Active'
            GROUP BY sd.assigned_role
        `);

        // 4. Stage Breakdown (17 Stages Funnel)
        const [stageRows] = await db.query(`
            SELECT 
                sd.stage_number,
                sd.stage_name,
                sd.assigned_role,
                COUNT(pf.id) as count
            FROM stage_definitions sd
            LEFT JOIN project_files pf ON pf.current_stage = sd.stage_number AND pf.file_status = 'Active'
            GROUP BY sd.stage_number, sd.stage_name, sd.assigned_role
            ORDER BY sd.stage_number ASC
        `);

        // 5. Recent Activity Feed (Latest 10 actions)
        const [recentActivity] = await db.query(`
            SELECT 
                fsl.id,
                fsl.stage_number,
                fsl.stage_name,
                fsl.action_taken,
                fsl.remarks,
                fsl.created_at,
                pf.file_number,
                pf.customer_name,
                u.full_name as performed_by_name,
                r.role_name as performed_by_role
            FROM file_stage_logs fsl
            JOIN project_files pf ON pf.id = fsl.file_id
            LEFT JOIN users u ON u.id = fsl.performed_by
            LEFT JOIN roles r ON r.id = u.role_id
            ORDER BY fsl.id DESC
            LIMIT 10
        `);

        // 6. SLA Breaches
        const [slaBreaches] = await db.query(`
            SELECT 
                pf.id,
                pf.file_number,
                pf.customer_name,
                pf.current_stage,
                sd.stage_name,
                sd.assigned_role,
                fsl.sla_deadline,
                fsl.remarks as hold_reason
            FROM project_files pf
            JOIN stage_definitions sd ON sd.stage_number = pf.current_stage
            LEFT JOIN file_stage_logs fsl ON fsl.file_id = pf.id 
                 AND fsl.id = (SELECT MAX(id) FROM file_stage_logs WHERE file_id = pf.id)
            WHERE pf.file_status = 'Active' AND fsl.sla_deadline < NOW()
            LIMIT 5
        `);

        const booked = Number(countRows[0]?.total_booked_value) || 0;
        const collected = Number(finRows[0]?.total_collected) || 0;

        return res.status(200).json({
            success: true,
            role: roleName,
            summary: {
                total_files: Number(countRows[0]?.total_files) || 0,
                active_files: Number(countRows[0]?.active_files) || 0,
                hold_files: Number(countRows[0]?.hold_files) || 0,
                completed_files: Number(countRows[0]?.completed_files) || 0,
                cancelled_files: Number(countRows[0]?.cancelled_files) || 0,
                total_booked_value: booked,
                total_collected: collected,
                total_pending_clearance: Number(finRows[0]?.total_pending_clearance) || 0,
                total_outstanding: Math.max(0, booked - collected),
                sla_breached_count: slaBreaches.length
            },
            desk_distribution: deskRows,
            stage_breakdown: stageRows,
            recent_activity: recentActivity,
            sla_breaches: slaBreaches
        });
    } catch (error) {
        console.error("getDashboardStats error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 11. Add Project Expense (Accounts / Super Admin) - POST /api/files/:fileId/expense
exports.addExpense = async (req, res) => {
    try {
        const fileId = req.params.fileId;
        const { expense_category, amount, description } = req.body;

        if (!expense_category || !amount || Number(amount) <= 0) {
            return res.status(400).json({ success: false, message: "Valid category and amount required" });
        }

        const validCategories = ['Civil Material Cost', 'JVVNL Expense', 'Other Expense', 'Sales Incentive'];
        if (!validCategories.includes(expense_category)) {
            return res.status(400).json({ success: false, message: "Invalid expense category" });
        }

        const expenseId = await model.createExpense(db, {
            file_id: fileId,
            expense_category,
            amount: Number(amount),
            description: description || null,
            is_cleared: 0,
            created_by: req.user.id
        });

        // Asynchronously dispatch notification
        (async () => {
            try {
                const [fileRows] = await db.query(
                    `SELECT pf.file_number, pf.customer_name, u.full_name as user_name
                     FROM project_files pf
                     LEFT JOIN users u ON u.id = ?
                     WHERE pf.id = ?`,
                    [req.user.id, fileId]
                );
                const fileInfo = fileRows[0];
                if (fileInfo) {
                    await notificationService.notifyExpenseAdded({
                        fileId,
                        fileNumber: fileInfo.file_number,
                        customerName: fileInfo.customer_name,
                        category: expense_category,
                        amount: Number(amount),
                        description,
                        addedByName: fileInfo.user_name || 'Staff'
                    });
                }
            } catch (notifErr) {
                console.error("addExpense notification error:", notifErr.message);
            }
        })();

        return res.status(201).json({
            success: true,
            message: "Expense logged successfully",
            expense_id: expenseId
        });
    } catch (error) {
        console.error("addExpense error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 12. Get Expenses by File ID - GET /api/files/:fileId/expenses
exports.getExpenses = async (req, res) => {
    try {
        const fileId = req.params.fileId;
        const expenses = await model.getExpensesByFileId(db, fileId);
        return res.status(200).json({
            success: true,
            expenses
        });
    } catch (error) {
        console.error("getExpenses error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 13. Toggle Expense Clearance - PATCH /api/files/expense/:expenseId/toggle-clear
exports.toggleExpenseClear = async (req, res) => {
    try {
        const expenseId = req.params.expenseId;
        const newStatus = await model.toggleExpenseClear(db, expenseId, req.user.id);
        if (newStatus === null) {
            return res.status(404).json({ success: false, message: "Expense not found" });
        }
        return res.status(200).json({
            success: true,
            message: newStatus ? "Expense marked as Cleared" : "Expense marked as Unclear",
            is_cleared: newStatus
        });
    } catch (error) {
        console.error("toggleExpenseClear error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 14. Toggle Payment Clearance - PATCH /api/files/payment/:paymentId/toggle-clear
exports.togglePaymentClear = async (req, res) => {
    try {
        const paymentId = req.params.paymentId;
        const newStatus = await model.togglePaymentClear(db, paymentId, req.user.id);
        if (newStatus === null) {
            return res.status(404).json({ success: false, message: "Payment not found" });
        }

        // If marked as cleared/verified, dispatch notification
        if (newStatus === 1) {
            (async () => {
                try {
                    const [payRows] = await db.query(
                        `SELECT pp.amount, pp.payment_stage, pp.file_id, pf.file_number, pf.customer_name, l.assigned_to as sales_rep_id, u.full_name as verifier_name
                         FROM project_payments pp
                         JOIN project_files pf ON pf.id = pp.file_id
                         JOIN leads l ON l.id = pf.lead_id
                         LEFT JOIN users u ON u.id = ?
                         WHERE pp.id = ?`,
                        [req.user.id, paymentId]
                    );
                    const pInfo = payRows[0];
                    if (pInfo) {
                        await notificationService.notifyPaymentVerified({
                            fileId: pInfo.file_id,
                            fileNumber: pInfo.file_number,
                            customerName: pInfo.customer_name,
                            amount: pInfo.amount,
                            paymentStage: pInfo.payment_stage,
                            verifiedByName: pInfo.verifier_name || 'Accounts',
                            salesRepId: pInfo.sales_rep_id
                        });
                    }
                } catch (notifErr) {
                    console.error("togglePaymentClear notification error:", notifErr.message);
                }
            })();
        }

        return res.status(200).json({
            success: true,
            message: newStatus ? "Payment marked as Verified/Cleared" : "Payment marked as Pending/Unclear",
            is_verified: newStatus
        });
    } catch (error) {
        console.error("togglePaymentClear error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 15. Super Admin Initial Rate Approval - PATCH /api/files/:fileId/rate-approval
exports.updateRateApproval = async (req, res) => {
    try {
        const fileId = req.params.fileId;
        const { action, remarks } = req.body;

        const [userRows] = await db.query(`
            SELECT r.role_name 
            FROM roles r 
            JOIN users u ON u.role_id = r.id 
            WHERE u.id = ? LIMIT 1
        `, [req.user.id]);
        const userRole = userRows[0]?.role_name;

        if (userRole !== 'Super Admin') {
            return res.status(403).json({ success: false, message: "Only Super Admin (Pawan) can approve file rates" });
        }

        if (action === 'Hold' && wordCount(remarks) < 10) {
            return res.status(400).json({ success: false, message: "Minimum 10 words required in remarks to put rate on Hold" });
        }

        let newStatus = 'Approved';
        if (action === 'Hold') newStatus = 'On Hold';
        else if (action === 'Cancel' || action === 'Reject') newStatus = 'Rejected';

        await model.updateRateApproval(db, fileId, newStatus, req.user.id, remarks);

        await model.createStageLog(db, {
            file_id: fileId,
            stage_number: 0,
            stage_name: 'Admin Rate Approval',
            action_taken: `Rate ${newStatus}`,
            remarks: remarks || `Rate status set to ${newStatus} by Super Admin`,
            performed_by: req.user.id
        });

        // Asynchronously dispatch notification
        (async () => {
            try {
                const [fileRows] = await db.query(
                    `SELECT pf.file_number, pf.customer_name, l.assigned_to as sales_rep_id, u.full_name as admin_name
                     FROM project_files pf
                     JOIN leads l ON l.id = pf.lead_id
                     LEFT JOIN users u ON u.id = ?
                     WHERE pf.id = ?`,
                    [req.user.id, fileId]
                );
                const fileInfo = fileRows[0];
                if (fileInfo) {
                    await notificationService.notifyRateApproval({
                        fileId,
                        fileNumber: fileInfo.file_number,
                        customerName: fileInfo.customer_name,
                        status: newStatus,
                        remarks,
                        approvedByName: fileInfo.admin_name || 'Super Admin',
                        salesRepId: fileInfo.sales_rep_id
                    });
                }
            } catch (notifErr) {
                console.error("updateRateApproval notification error:", notifErr.message);
            }
        })();

        return res.status(200).json({
            success: true,
            message: `Rate approval status updated to ${newStatus}`,
            rate_approval_status: newStatus
        });
    } catch (error) {
        console.error("updateRateApproval error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 16. Get All Documents across Files (Document Repository) - GET /api/files/documents/all
exports.getAllDocuments = async (req, res) => {
    try {
        const { doc_type, search } = req.query;
        let sql = `
            SELECT pd.id, pd.file_id, pd.doc_type, pd.document_number, 
                   pd.file_url, pd.original_filename, pd.created_at,
                   pf.file_number, pf.customer_name, pf.phone_number, pf.aen_office,
                   pf.current_stage, pf.file_status,
                   u.full_name as uploaded_by_name
            FROM project_documents pd
            JOIN project_files pf ON pf.id = pd.file_id
            LEFT JOIN users u ON u.id = pd.uploaded_by
            WHERE 1=1
        `;
        const params = [];

        if (doc_type && doc_type !== 'all') {
            sql += ` AND pd.doc_type = ?`;
            params.push(doc_type);
        }

        if (search && search.trim()) {
            const q = `%${search.trim()}%`;
            sql += ` AND (pf.file_number LIKE ? OR pf.customer_name LIKE ? OR pf.phone_number LIKE ? OR pf.aen_office LIKE ? OR pd.original_filename LIKE ?)`;
            params.push(q, q, q, q, q);
        }

        sql += ` ORDER BY pd.id DESC`;

        const [rows] = await db.query(sql, params);

        return res.status(200).json({
            success: true,
            count: rows.length,
            documents: rows
        });
    } catch (error) {
        console.error("getAllDocuments error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};




