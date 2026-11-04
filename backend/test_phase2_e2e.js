// test_phase2_e2e.js
const { db } = require('./config/db');

const BASE_URL = 'http://localhost:5000/api';

const results = [];

function recordResult(scenario, step, status, details = '') {
    results.push({ scenario, step, status, details });
    const mark = status === 'PASS' ? '✅ PASS' : '❌ FAIL';
    console.log(`${mark} | [${scenario}] ${step}${details ? ' -> ' + details : ''}`);
}

async function loginUser(login, password) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password })
    });
    const data = await res.json();
    if (!res.ok || !data.token) {
        throw new Error(`Login failed for ${login}: ${data.message || 'Unknown error'}`);
    }
    return data.token;
}

async function apiCall(endpoint, method = 'GET', body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${endpoint}`, options);
    let data;
    try {
        data = await res.json();
    } catch (e) {
        data = { message: res.statusText };
    }
    return { status: res.status, ok: res.ok, data };
}

async function runE2ETests() {
    console.log('================================================================');
    console.log('🚀 STARTING PHASE 2 WEB ERP AUTOMATED E2E TEST SUITE');
    console.log('================================================================\n');

    let adminToken, jituToken, sureshToken, rahulToken, ashokToken, narendraToken, moinToken;
    let testLeadId1, testFileId1, testLeadId2, testFileId2;
    let initialPaymentId;

    try {
        // --- 0. AUTHENTICATE ALL PERSONAS ---
        adminToken = await loginUser('admin', 'Admin@123');
        jituToken = await loginUser('jitu@smartsunpower.com', 'Password@123');
        sureshToken = await loginUser('suresh@smartsunpower.com', 'Password@123');
        rahulToken = await loginUser('rahul@smartsunpower.com', 'Password@123');
        ashokToken = await loginUser('ashok@smartsunpower.com', 'Password@123');
        narendraToken = await loginUser('narendra@smartsunpower.com', 'Password@123');
        moinToken = await loginUser('moin@smartsunpower.com', 'Password@123');
        recordResult('Setup', 'Persona Authentication', 'PASS', '7/7 role tokens acquired successfully');

        // Clean any leftover previous test leads if any
        await db.query(`DELETE FROM leads WHERE lead_code IN ('TEST-E2E-LOAN', 'TEST-E2E-CASH')`);

        // --- SCENARIO 1: LEAD WON INTAKE & RATE GATE ---
        const [leadResult1] = await db.query(`
            INSERT INTO leads (
                lead_code, customer_name, mobile_number, status, 
                solar_requirement, interest_status, lead_source, priority,
                deal_amount, quotation_amount, is_deleted, created_at, updated_at
            ) VALUES (
                'TEST-E2E-LOAN', 'Test Client Loan', '9999900001', 'Won',
                'Residential', 'Interested', 'Website', 'High',
                185000, 185000, 0, NOW(), NOW()
            )
        `);
        testLeadId1 = leadResult1.insertId;

        const intakeRes = await apiCall('/files/create', 'POST', {
            lead_id: testLeadId1,
            aen_office: 'AEN-C-I Mansarovar',
            k_number: 'K-2100998811',
            connection_category: 'DS',
            property_type: 'House',
            current_sanctioned_load: 2.0,
            modification_required: true,
            modification_type: 'Load Extension',
            phase_type: '1 Phase',
            is_loan: true,
            total_project_cost: 185000,
            kw_with_subsidy: 3.0,
            kw_without_subsidy: 0,
            advance_amount: 25000,
            payment_mode: 'Online',
            customer_name: 'Test Client Loan',
            phone_number: '9999900001'
        }, adminToken);

        if (intakeRes.ok && intakeRes.data.file_id) {
            testFileId1 = intakeRes.data.file_id;
            const fileNumber = intakeRes.data.file_number;
            const isSSPPattern = /^SSP-2026-\d{4}$/.test(fileNumber);

            const [fileRows] = await db.query(`SELECT * FROM project_files WHERE id = ?`, [testFileId1]);
            const fileRec = fileRows[0];

            const [paymentRows] = await db.query(`SELECT * FROM project_payments WHERE file_id = ?`, [testFileId1]);
            initialPaymentId = paymentRows[0]?.id;

            if (isSSPPattern && fileRec.rate_approval_status === 'Pending' && fileRec.current_stage === 0 && fileRec.sub_pipeline_step === 'Step A' && Number(paymentRows[0]?.amount) === 25000) {
                recordResult('Scenario 1', 'Lead Won Intake & Rate Gate', 'PASS', `File: ${fileNumber}, Rate Status: ${fileRec.rate_approval_status}, Stage: 0 (Step A), Payment: ₹${paymentRows[0]?.amount}`);
            } else {
                recordResult('Scenario 1', 'Lead Won Intake & Rate Gate', 'FAIL', `Checks failed: number=${fileNumber}, rate=${fileRec.rate_approval_status}, stage=${fileRec.current_stage}`);
            }
        } else {
            recordResult('Scenario 1', 'Lead Won Intake & Rate Gate', 'FAIL', intakeRes.data.message);
        }

        // --- SCENARIO 2: SUPER ADMIN APPROVAL & 3-STEP SUB-PIPELINE ---
        // 2.1 Pawan Ji Approves Rate
        const rateRes = await apiCall(`/files/${testFileId1}/rate-approval`, 'PATCH', {
            action: 'Approve',
            remarks: 'Rate verified against solar pricing sheet by Pawan Ji'
        }, adminToken);

        const [rateCheck] = await db.query(`SELECT rate_approval_status FROM project_files WHERE id = ?`, [testFileId1]);
        if (rateRes.ok && rateCheck[0]?.rate_approval_status === 'Approved') {
            recordResult('Scenario 2.1', 'Super Admin Rate Approval Gate', 'PASS', 'Status updated to Approved');
        } else {
            recordResult('Scenario 2.1', 'Super Admin Rate Approval Gate', 'FAIL', rateRes.data.message);
        }

        // 2.2 Step A: Jitu Submits Online Sub-File -> moves to Step B
        const stepARes = await apiCall(`/files/${testFileId1}/stage-action`, 'POST', {
            stage_number: 0,
            action: 'Submit'
        }, jituToken);

        const [stepACheck] = await db.query(`SELECT sub_pipeline_step, current_stage FROM project_files WHERE id = ?`, [testFileId1]);
        if (stepARes.ok && stepACheck[0]?.sub_pipeline_step === 'Step B' && stepACheck[0]?.current_stage === 0) {
            recordResult('Scenario 2.2', 'Sub-Pipeline Step A (Jitu Online Submit)', 'PASS', 'File advanced to Step B (Suresh Desk)');
        } else {
            recordResult('Scenario 2.2', 'Sub-Pipeline Step A (Jitu Online Submit)', 'FAIL', stepARes.data.message);
        }

        // 2.3 Step B: Suresh Submits Offline File -> moves to Step C
        const stepBRes = await apiCall(`/files/${testFileId1}/stage-action`, 'POST', {
            stage_number: 0,
            action: 'Submit'
        }, sureshToken);

        const [stepBCheck] = await db.query(`SELECT sub_pipeline_step, current_stage FROM project_files WHERE id = ?`, [testFileId1]);
        if (stepBRes.ok && stepBCheck[0]?.sub_pipeline_step === 'Step C' && stepBCheck[0]?.current_stage === 0) {
            recordResult('Scenario 2.3', 'Sub-Pipeline Step B (Suresh Sub-Offline Submit)', 'PASS', 'File advanced to Step C (Jitu Demand Note Desk)');
        } else {
            recordResult('Scenario 2.3', 'Sub-Pipeline Step B (Suresh Sub-Offline Submit)', 'FAIL', stepBRes.data.message);
        }

        // 2.4 Step C: Jitu marks Demand Note Paid -> Unlocks Main Stage 1
        const stepCRes = await apiCall(`/files/${testFileId1}/stage-action`, 'POST', {
            stage_number: 0,
            action: 'Paid'
        }, jituToken);

        const [stepCCheck] = await db.query(`SELECT current_stage, is_in_modification, sub_pipeline_step FROM project_files WHERE id = ?`, [testFileId1]);
        if (stepCRes.ok && stepCCheck[0]?.current_stage === 1 && stepCCheck[0]?.is_in_modification === 0 && stepCCheck[0]?.sub_pipeline_step === 'Completed') {
            recordResult('Scenario 2.4', 'Sub-Pipeline Step C (Jitu Demand Note Paid)', 'PASS', 'Main Stage 1 unlocked! is_in_modification=0');
        } else {
            recordResult('Scenario 2.4', 'Sub-Pipeline Step C (Jitu Demand Note Paid)', 'FAIL', stepCRes.data.message);
        }

        // --- SCENARIO 3: 10-WORD REMARK RULE ENFORCEMENT ---
        // 3.1 Negative: Hold with only 4 words -> Should reject with 400
        const shortRemarkRes = await apiCall(`/files/${testFileId1}/stage-action`, 'POST', {
            stage_number: 1,
            action: 'Hold',
            remarks: 'Customer not answering call'
        }, jituToken);

        if (shortRemarkRes.status === 400 && shortRemarkRes.data.message?.includes('10 words')) {
            recordResult('Scenario 3.1', '10-Word Rule Negative Check (4 words)', 'PASS', `Rejected as expected: "${shortRemarkRes.data.message}"`);
        } else {
            recordResult('Scenario 3.1', '10-Word Rule Negative Check (4 words)', 'FAIL', `Expected 400 rejection but got ${shortRemarkRes.status}`);
        }

        // 3.2 Positive: Hold with 13 words -> Should pass
        const longRemarkRes = await apiCall(`/files/${testFileId1}/stage-action`, 'POST', {
            stage_number: 1,
            action: 'Hold',
            remarks: 'Customer requested hold because Aadhaar address update is currently in progress at e-Mitra'
        }, jituToken);

        const [holdCheck] = await db.query(`SELECT file_status FROM project_files WHERE id = ?`, [testFileId1]);
        if (longRemarkRes.ok && holdCheck[0]?.file_status === 'On Hold') {
            recordResult('Scenario 3.2', '10-Word Rule Positive Check (13 words)', 'PASS', 'Status successfully changed to On Hold');
        } else {
            recordResult('Scenario 3.2', '10-Word Rule Positive Check (13 words)', 'FAIL', longRemarkRes.data.message);
        }

        // Reset file_status back to Active for subsequent steps
        await db.query(`UPDATE project_files SET file_status = 'Active' WHERE id = ?`, [testFileId1]);

        // --- SCENARIO 4: LOAN VS CASH BRANCHING ---
        // 4.1 Loan File (File 1) Submit Stage 1 -> moves to Stage 2 (Rahul)
        const loanSubmitRes = await apiCall(`/files/${testFileId1}/stage-action`, 'POST', {
            stage_number: 1,
            action: 'Submit'
        }, jituToken);

        const [loanCheck] = await db.query(`SELECT current_stage FROM project_files WHERE id = ?`, [testFileId1]);
        if (loanSubmitRes.ok && loanCheck[0]?.current_stage === 2) {
            recordResult('Scenario 4.1', 'Loan File Branching (is_loan=true)', 'PASS', 'Stage 1 -> Stage 2 (Loan Officer Rahul)');
        } else {
            recordResult('Scenario 4.1', 'Loan File Branching (is_loan=true)', 'FAIL', `Expected Stage 2, got Stage ${loanCheck[0]?.current_stage}`);
        }

        // 4.2 Cash File (File 2) Submit Stage 1 -> skips Stage 2, goes directly to Stage 3 (Suresh)
        const [leadResult2] = await db.query(`
            INSERT INTO leads (
                lead_code, customer_name, mobile_number, status,
                solar_requirement, interest_status, lead_source, priority,
                deal_amount, quotation_amount, is_deleted, created_at, updated_at
            ) VALUES (
                'TEST-E2E-CASH', 'Test Client Cash', '9999900002', 'Won',
                'Residential', 'Interested', 'Call', 'Medium',
                150000, 150000, 0, NOW(), NOW()
            )
        `);
        testLeadId2 = leadResult2.insertId;

        const cashIntakeRes = await apiCall('/files/create', 'POST', {
            lead_id: testLeadId2,
            aen_office: 'AEN-D-I Sanganer',
            k_number: 'K-2100998822',
            connection_category: 'DS',
            property_type: 'House',
            current_sanctioned_load: 3.0,
            modification_required: false,
            phase_type: '1 Phase',
            is_loan: false, // CASH FILE
            total_project_cost: 150000,
            kw_with_subsidy: 3.0,
            advance_amount: 30000,
            customer_name: 'Test Client Cash',
            phone_number: '9999900002'
        }, adminToken);
        testFileId2 = cashIntakeRes.data.file_id;

        // Approve Cash File Rate
        await apiCall(`/files/${testFileId2}/rate-approval`, 'PATCH', { action: 'Approve' }, adminToken);

        // Jitu Submits Stage 1 for Cash File
        const cashSubmitRes = await apiCall(`/files/${testFileId2}/stage-action`, 'POST', {
            stage_number: 1,
            action: 'Submit'
        }, jituToken);

        const [cashCheck] = await db.query(`SELECT current_stage FROM project_files WHERE id = ?`, [testFileId2]);
        if (cashSubmitRes.ok && cashCheck[0]?.current_stage === 3) {
            recordResult('Scenario 4.2', 'Cash File Branching (is_loan=false)', 'PASS', 'Stage 1 -> Stage 3 (Skipped Stage 2 directly to Suresh)');
        } else {
            recordResult('Scenario 4.2', 'Cash File Branching (is_loan=false)', 'FAIL', `Expected Stage 3, got Stage ${cashCheck[0]?.current_stage}`);
        }

        // --- SCENARIO 5: STAGE 4 MANDATORY PHOTO PROOF ---
        // Advance File 1 from Stage 2 -> Stage 3 -> Stage 4
        await apiCall(`/files/${testFileId1}/stage-action`, 'POST', { stage_number: 2, action: 'Submit' }, rahulToken);
        await apiCall(`/files/${testFileId1}/stage-action`, 'POST', { stage_number: 3, action: 'Submit' }, sureshToken);

        const [stage4Check] = await db.query(`SELECT current_stage FROM project_files WHERE id = ?`, [testFileId1]);
        if (stage4Check[0]?.current_stage !== 4) {
            throw new Error(`File 1 not at Stage 4, currently at Stage ${stage4Check[0]?.current_stage}`);
        }

        // 5.1 Negative: Submit Stage 4 without proof_url
        const noProofRes = await apiCall(`/files/${testFileId1}/stage-action`, 'POST', {
            stage_number: 4,
            action: 'Submit'
        }, sureshToken);

        if (noProofRes.status === 400 && noProofRes.data.message?.includes('Photo proof required')) {
            recordResult('Scenario 5.1', 'Stage 4 Photo Proof Negative Test', 'PASS', `Rejected as expected: "${noProofRes.data.message}"`);
        } else {
            recordResult('Scenario 5.1', 'Stage 4 Photo Proof Negative Test', 'FAIL', `Expected 400 but got ${noProofRes.status}`);
        }

        // 5.2 Positive: Submit Stage 4 with proof_url
        const withProofRes = await apiCall(`/files/${testFileId1}/stage-action`, 'POST', {
            stage_number: 4,
            action: 'Submit',
            proof_url: '/uploads/documents/signed_meter_receiving.jpg'
        }, sureshToken);

        const [stage5Check] = await db.query(`SELECT current_stage FROM project_files WHERE id = ?`, [testFileId1]);
        if (withProofRes.ok && stage5Check[0]?.current_stage === 5) {
            recordResult('Scenario 5.2', 'Stage 4 Photo Proof Positive Test', 'PASS', 'Stage 4 -> Stage 5 (Accounts Gate)');
        } else {
            recordResult('Scenario 5.2', 'Stage 4 Photo Proof Positive Test', 'FAIL', withProofRes.data.message);
        }

        // --- SCENARIO 6: INSTALLATION (STAGE 6) & COMMISSIONING (STAGE 11-14) ---
        // 6.1 Clear Stage 5 (Ashok Accounts Gate) -> moves to Stage 6
        await apiCall(`/files/${testFileId1}/stage-action`, 'POST', { stage_number: 5, action: 'Submit' }, ashokToken);

        // 6.2 Narendra on Stage 6: Action 'In Process' keeps on Stage 6
        const inProcessRes = await apiCall(`/files/${testFileId1}/stage-action`, 'POST', {
            stage_number: 6,
            action: 'In Process'
        }, narendraToken);

        const [inProcessCheck] = await db.query(`SELECT current_stage, stage_status FROM project_files WHERE id = ?`, [testFileId1]);
        if (inProcessRes.ok && inProcessCheck[0]?.current_stage === 6 && inProcessCheck[0]?.stage_status === 'In Process') {
            recordResult('Scenario 6.1', 'Narendra Stage 6 "In Process" Action', 'PASS', 'Keeps file on Stage 6 with status "In Process"');
        } else {
            recordResult('Scenario 6.1', 'Narendra Stage 6 "In Process" Action', 'FAIL', inProcessRes.data.message);
        }

        // Narendra completes Stage 6 -> moves to Stage 7
        const completeStage6 = await apiCall(`/files/${testFileId1}/stage-action`, 'POST', {
            stage_number: 6,
            action: 'Completed'
        }, narendraToken);

        const [stage7Check] = await db.query(`SELECT current_stage FROM project_files WHERE id = ?`, [testFileId1]);
        if (completeStage6.ok && stage7Check[0]?.current_stage === 7) {
            recordResult('Scenario 6.2', 'Narendra Stage 6 Completion', 'PASS', 'Stage 6 -> Stage 7');
        } else {
            recordResult('Scenario 6.2', 'Narendra Stage 6 Completion', 'FAIL', completeStage6.data.message);
        }

        // Advance: Stage 7 (Ashok) -> 8 (Moin) -> 9 (Suresh) -> 10 (Rahul loan) -> 11 (Suresh Meter) -> 12
        await apiCall(`/files/${testFileId1}/stage-action`, 'POST', { stage_number: 7, action: 'Submit' }, ashokToken);
        await apiCall(`/files/${testFileId1}/stage-action`, 'POST', { stage_number: 8, action: 'Submit' }, moinToken);
        await apiCall(`/files/${testFileId1}/stage-action`, 'POST', { stage_number: 9, action: 'Submit' }, sureshToken);
        await apiCall(`/files/${testFileId1}/stage-action`, 'POST', { stage_number: 10, action: 'Submit' }, rahulToken);
        await apiCall(`/files/${testFileId1}/stage-action`, 'POST', { stage_number: 11, action: 'Yes' }, sureshToken);

        const [stage12Check] = await db.query(`SELECT current_stage FROM project_files WHERE id = ?`, [testFileId1]);
        if (stage12Check[0]?.current_stage !== 12) {
            throw new Error(`File 1 not at Stage 12, currently at Stage ${stage12Check[0]?.current_stage}`);
        }

        // 6.3 Stage 12 (Plant Start): Negative test sending 'No'
        const stage12NoRes = await apiCall(`/files/${testFileId1}/stage-action`, 'POST', {
            stage_number: 12,
            action: 'No'
        }, sureshToken);

        if (stage12NoRes.status === 400 && stage12NoRes.data.message?.includes('No option not allowed')) {
            recordResult('Scenario 6.3', 'Stage 12 Plant Start "No" Constraint', 'PASS', `Rejected as expected: "${stage12NoRes.data.message}"`);
        } else {
            recordResult('Scenario 6.3', 'Stage 12 Plant Start "No" Constraint', 'FAIL', `Expected 400 but got ${stage12NoRes.status}`);
        }

        // Pass Stage 12 with 'Yes' -> moves to Stage 13 (WiFi)
        await apiCall(`/files/${testFileId1}/stage-action`, 'POST', { stage_number: 12, action: 'Yes' }, sureshToken);

        // 6.4 Stage 13 (WiFi): Negative test sending 'No' without reason
        const stage13NoNoReason = await apiCall(`/files/${testFileId1}/stage-action`, 'POST', {
            stage_number: 13,
            action: 'No'
        }, sureshToken);

        if (stage13NoNoReason.status === 400 && stage13NoNoReason.data.message?.includes('Mandatory reason required')) {
            recordResult('Scenario 6.4', 'Stage 13 WiFi "No" without Reason', 'PASS', `Rejected as expected: "${stage13NoNoReason.data.message}"`);
        } else {
            recordResult('Scenario 6.4', 'Stage 13 WiFi "No" without Reason', 'FAIL', `Expected 400 but got ${stage13NoNoReason.status}`);
        }

        // Positive test: Stage 13 'No' WITH reason -> advances to Stage 14
        const stage13WithReason = await apiCall(`/files/${testFileId1}/stage-action`, 'POST', {
            stage_number: 13,
            action: 'No',
            wifi_not_connected_reason: 'Consumer does not have home broadband router'
        }, sureshToken);

        const [stage14Check] = await db.query(`SELECT current_stage FROM project_files WHERE id = ?`, [testFileId1]);
        if (stage13WithReason.ok && stage14Check[0]?.current_stage === 14) {
            recordResult('Scenario 6.5', 'Stage 13 WiFi "No" with Reason', 'PASS', 'Stage 13 -> Stage 14 (Saved reason without blocking)');
        } else {
            recordResult('Scenario 6.5', 'Stage 13 WiFi "No" with Reason', 'FAIL', stage13WithReason.data.message);
        }

        // 6.5 Stage 14 (Explanation): Negative test sending 'No'
        const stage14NoRes = await apiCall(`/files/${testFileId1}/stage-action`, 'POST', {
            stage_number: 14,
            action: 'No'
        }, sureshToken);

        if (stage14NoRes.status === 400 && stage14NoRes.data.message?.includes('No option not allowed')) {
            recordResult('Scenario 6.6', 'Stage 14 Customer Demo "No" Constraint', 'PASS', `Rejected as expected: "${stage14NoRes.data.message}"`);
        } else {
            recordResult('Scenario 6.6', 'Stage 14 Customer Demo "No" Constraint', 'FAIL', `Expected 400 but got ${stage14NoRes.status}`);
        }

        // Pass Stage 14 with 'Yes' -> moves to Stage 15 (Ledger Reconciliation)
        await apiCall(`/files/${testFileId1}/stage-action`, 'POST', { stage_number: 14, action: 'Yes' }, sureshToken);

        // --- SCENARIO 7: STAGE 15 DUAL LEDGER, STAGE 16 CLOSING & STAGE 17 SUBSIDY ---
        const [stage15Check] = await db.query(`SELECT current_stage FROM project_files WHERE id = ?`, [testFileId1]);
        if (stage15Check[0]?.current_stage !== 15) {
            throw new Error(`File 1 not at Stage 15, currently at Stage ${stage15Check[0]?.current_stage}`);
        }

        // 7.1 Log Project Expenses
        const exp1 = await apiCall(`/files/${testFileId1}/expense`, 'POST', {
            expense_category: 'Civil Material Cost',
            amount: 14500,
            description: 'Foundation civil materials & brickwork'
        }, ashokToken);

        const exp2 = await apiCall(`/files/${testFileId1}/expense`, 'POST', {
            expense_category: 'JVVNL Expense',
            amount: 4500,
            description: 'Discom net-meter testing official receipt'
        }, ashokToken);

        const exp3 = await apiCall(`/files/${testFileId1}/expense`, 'POST', {
            expense_category: 'Other Expense',
            amount: 1800,
            description: 'Transport & crane lifting charges'
        }, ashokToken);

        const exp4 = await apiCall(`/files/${testFileId1}/expense`, 'POST', {
            expense_category: 'Sales Incentive',
            amount: 3500,
            description: 'Sales rep booking incentive'
        }, ashokToken);

        const listExpRes = await apiCall(`/files/${testFileId1}/expenses`, 'GET', null, ashokToken);
        if (listExpRes.ok && listExpRes.data.expenses?.length === 4) {
            recordResult('Scenario 7.1', 'Stage 15 Project Expenses Logging', 'PASS', '4 cost categories successfully logged (Civil, JVVNL, Other, Incentive)');
        } else {
            recordResult('Scenario 7.1', 'Stage 15 Project Expenses Logging', 'FAIL', `Expected 4 expenses, got ${listExpRes.data.expenses?.length}`);
        }

        // 7.2 Toggle Clear on Expense Item
        const expIdToToggle = listExpRes.data.expenses[0].id;
        const toggleExpRes = await apiCall(`/files/expense/${expIdToToggle}/toggle-clear`, 'PATCH', null, ashokToken);

        const [toggledExpCheck] = await db.query(`SELECT is_cleared FROM project_expenses WHERE id = ?`, [expIdToToggle]);
        if (toggleExpRes.ok && toggledExpCheck[0]?.is_cleared === 1) {
            recordResult('Scenario 7.2', 'Per-Item Expense Clear Toggle', 'PASS', 'is_cleared toggled to 1 (Cleared)');
        } else {
            recordResult('Scenario 7.2', 'Per-Item Expense Clear Toggle', 'FAIL', toggleExpRes.data.message);
        }

        // 7.3 Toggle Clear on Payment Item
        const togglePayRes = await apiCall(`/files/payment/${initialPaymentId}/toggle-clear`, 'PATCH', null, ashokToken);
        const [toggledPayCheck] = await db.query(`SELECT is_verified FROM project_payments WHERE id = ?`, [initialPaymentId]);
        if (togglePayRes.ok && toggledPayCheck[0]?.is_verified === 1) {
            recordResult('Scenario 7.3', 'Per-Item Payment Clear Toggle', 'PASS', 'is_verified toggled to 1 (Cleared)');
        } else {
            recordResult('Scenario 7.3', 'Per-Item Payment Clear Toggle', 'FAIL', togglePayRes.data.message);
        }

        // 7.4 Ashok submits Stage 15 -> moves to Stage 16 (Super Admin Pawan)
        const stage15SubmitRes = await apiCall(`/files/${testFileId1}/stage-action`, 'POST', {
            stage_number: 15,
            action: 'Submit'
        }, ashokToken);

        const [stage16Check] = await db.query(`SELECT current_stage FROM project_files WHERE id = ?`, [testFileId1]);
        if (stage15SubmitRes.ok && stage16Check[0]?.current_stage === 16) {
            recordResult('Scenario 7.4', 'Stage 15 Ledger Clearance', 'PASS', 'Stage 15 -> Stage 16 (Super Admin Pawan Final Closing)');
        } else {
            recordResult('Scenario 7.4', 'Stage 15 Ledger Clearance', 'FAIL', stage15SubmitRes.data.message);
        }

        // 7.5 Pawan completes Stage 16 -> moves to Stage 17 (Portal Entry Moin)
        const stage16SubmitRes = await apiCall(`/files/${testFileId1}/stage-action`, 'POST', {
            stage_number: 16,
            action: 'Completed'
        }, adminToken);

        const [stage17Check] = await db.query(`SELECT current_stage FROM project_files WHERE id = ?`, [testFileId1]);
        if (stage16SubmitRes.ok && stage17Check[0]?.current_stage === 17) {
            recordResult('Scenario 7.5', 'Stage 16 Super Admin Final Closing', 'PASS', 'Stage 16 -> Stage 17 (National Portal Entry)');
        } else {
            recordResult('Scenario 7.5', 'Stage 16 Super Admin Final Closing', 'FAIL', stage16SubmitRes.data.message);
        }

        // 7.6 Moin on Stage 17: 'Pending' keeps on Stage 17
        const stage17PendingRes = await apiCall(`/files/${testFileId1}/stage-action`, 'POST', {
            stage_number: 17,
            action: 'Pending'
        }, moinToken);

        const [stage17PendingCheck] = await db.query(`SELECT current_stage, file_status FROM project_files WHERE id = ?`, [testFileId1]);
        if (stage17PendingRes.ok && stage17PendingCheck[0]?.current_stage === 17 && stage17PendingCheck[0]?.file_status === 'Active') {
            recordResult('Scenario 7.6', 'Stage 17 Subsidy Pending Action', 'PASS', 'Maintains Stage 17 Active state');
        } else {
            recordResult('Scenario 7.6', 'Stage 17 Subsidy Pending Action', 'FAIL', stage17PendingRes.data.message);
        }

        // 7.7 Moin on Stage 17: 'Yes' marks file Completed
        const stage17YesRes = await apiCall(`/files/${testFileId1}/stage-action`, 'POST', {
            stage_number: 17,
            action: 'Yes'
        }, moinToken);

        const [finalFileCheck] = await db.query(`SELECT file_status FROM project_files WHERE id = ?`, [testFileId1]);
        if (stage17YesRes.ok && finalFileCheck[0]?.file_status === 'Completed') {
            recordResult('Scenario 7.7', 'Stage 17 Subsidy Released (Yes)', 'PASS', 'File reached Final Stage 17 "Completed" status!');
        } else {
            recordResult('Scenario 7.7', 'Stage 17 Subsidy Released (Yes)', 'FAIL', stage17YesRes.data.message);
        }

    } catch (err) {
        console.error('\n💥 UNEXPECTED EXCEPTION DURING E2E TESTING:', err);
        recordResult('Fatal', 'Execution Error', 'FAIL', err.message);
    } finally {
        // --- CLEANUP DUMMY TEST RECORDS ---
        console.log('\n🧹 Cleaning up test records from database...');
        try {
            if (testFileId1) {
                await db.query(`DELETE FROM project_expenses WHERE file_id = ?`, [testFileId1]);
                await db.query(`DELETE FROM project_payments WHERE file_id = ?`, [testFileId1]);
                await db.query(`DELETE FROM file_stage_logs WHERE file_id = ?`, [testFileId1]);
                await db.query(`DELETE FROM project_files WHERE id = ?`, [testFileId1]);
            }
            if (testFileId2) {
                await db.query(`DELETE FROM project_expenses WHERE file_id = ?`, [testFileId2]);
                await db.query(`DELETE FROM project_payments WHERE file_id = ?`, [testFileId2]);
                await db.query(`DELETE FROM file_stage_logs WHERE file_id = ?`, [testFileId2]);
                await db.query(`DELETE FROM project_files WHERE id = ?`, [testFileId2]);
            }
            if (testLeadId1) await db.query(`DELETE FROM leads WHERE id = ?`, [testLeadId1]);
            if (testLeadId2) await db.query(`DELETE FROM leads WHERE id = ?`, [testLeadId2]);
            console.log('✓ Cleanup completed successfully.');
        } catch (cleanupErr) {
            console.error('Cleanup error:', cleanupErr.message);
        }

        // --- SUMMARY REPORT ---
        console.log('\n================================================================');
        console.log('📊 FINAL TEST SUMMARY REPORT');
        console.log('================================================================');
        const passCount = results.filter(r => r.status === 'PASS').length;
        const failCount = results.filter(r => r.status === 'FAIL').length;
        console.log(`TOTAL: ${results.length} | PASSED: ${passCount} | FAILED: ${failCount}`);

        if (failCount === 0) {
            console.log('🎉 ALL E2E AUTOMATED TESTS PASSED 100%!');
            process.exit(0);
        } else {
            console.log('⚠️ SOME TESTS FAILED. Review details above.');
            process.exit(1);
        }
    }
}

runE2ETests();
