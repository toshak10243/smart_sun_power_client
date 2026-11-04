const { db } = require('../config/db');

/**
 * Auto-migration runner for Phase 2 (Back-Office Operations)
 * Runs automatically on backend start.
 * Safe & Idempotent: Only creates tables/columns/roles if they do not exist.
 * Leaves all existing live data intact!
 */
async function runPhase2Migrations() {
    try {
        console.log("⚡ [Migration] Checking Phase 2 Back-Office Schema...");

        // 1. Ensure Back-Office Roles Exist
        const rolesToEnsure = [
            { name: 'Back Office Online', desc: 'Online Filing & AEN tracking' },
            { name: 'Back Office Field', desc: 'Offline submission, Meter application & Commissioning' },
            { name: 'Loan Officer', desc: 'Bank submission & Loan disbursement' },
            { name: 'Accounts', desc: 'Dual payment checks & Ledger reconciliation' },
            { name: 'Installation Lead', desc: 'Onsite structure & solar installation' },
            { name: 'Portal Entry', desc: 'Solar portal updates & Subsidy claims' }
        ];

        for (const r of rolesToEnsure) {
            await db.query(`
                INSERT INTO roles (role_name, description, status)
                VALUES (?, ?, 'Active')
                ON DUPLICATE KEY UPDATE description = VALUES(description);
            `, [r.name, r.desc]);
        }

        // 2. Ensure file_number_counter Table Exists
        await db.query(`
            CREATE TABLE IF NOT EXISTS file_number_counter (
                year INT PRIMARY KEY,
                last_number INT NOT NULL DEFAULT 0
            ) ENGINE=InnoDB;
        `);

        // 3. Ensure stage_definitions Table Exists & Populated
        await db.query(`
            CREATE TABLE IF NOT EXISTS stage_definitions (
                stage_number INT PRIMARY KEY,
                stage_name VARCHAR(100) NOT NULL,
                assigned_role VARCHAR(50) NOT NULL,
                sla_hours INT NOT NULL DEFAULT 24
            ) ENGINE=InnoDB;
        `);

        await db.query(`
            INSERT INTO stage_definitions (stage_number, stage_name, assigned_role, sla_hours) VALUES
            (0, 'Modification Sub-Branch', 'Back Office Online', 24),
            (1, 'File Online', 'Back Office Online', 24),
            (2, 'Loan 1st Check (Bank Submission)', 'Loan Officer', 24),
            (3, 'Offline File', 'Back Office Field', 24),
            (4, 'Meter Application Photo', 'Back Office Field', 24),
            (5, 'Pre-Install Payment Check', 'Accounts', 24),
            (6, 'Installation Work', 'Installation Lead', 72),
            (7, 'Post-Install Payment Check', 'Accounts', 24),
            (8, 'Online Installation Details', 'Portal Entry', 24),
            (9, 'Work Completion at AEN Office', 'Back Office Field', 24),
            (10, 'Loan 2nd Check (Disbursement Docs)', 'Loan Officer', 24),
            (11, 'Meter Installed', 'Back Office Field', 24),
            (12, 'Plant Start', 'Back Office Field', 24),
            (13, 'WiFi Connected', 'Back Office Field', 24),
            (14, 'Customer Explanation', 'Back Office Field', 24),
            (15, 'Payment Check-up & Ledger Verification', 'Accounts', 24),
            (16, 'Final Closing', 'Super Admin', 24),
            (17, 'Subsidy Redeemed', 'Portal Entry', 48)
            ON DUPLICATE KEY UPDATE stage_name=VALUES(stage_name), assigned_role=VALUES(assigned_role), sla_hours=VALUES(sla_hours);
        `);

        // 4. Ensure project_files Table Exists
        await db.query(`
            CREATE TABLE IF NOT EXISTS project_files (
                id INT AUTO_INCREMENT PRIMARY KEY,
                file_number VARCHAR(30) NOT NULL UNIQUE,
                lead_id INT NOT NULL,
                customer_name VARCHAR(150) NOT NULL,
                phone_number VARCHAR(15) NOT NULL,
                reference_name VARCHAR(150) DEFAULT NULL,
                reference_phone VARCHAR(15) DEFAULT NULL,
                aen_office VARCHAR(100) NOT NULL,
                k_number VARCHAR(50) NOT NULL,
                connection_category ENUM('DS','NDS') NOT NULL DEFAULT 'DS',
                property_type ENUM('House','Flat') NOT NULL DEFAULT 'House',
                current_sanctioned_load DECIMAL(6,2) NOT NULL DEFAULT 1.00,
                modification_type ENUM('None','Load Extension','Name Transfer','New Connection') NOT NULL DEFAULT 'None',
                phase_type ENUM('1 Phase','3 Phase') NOT NULL DEFAULT '1 Phase',
                is_loan TINYINT(1) NOT NULL DEFAULT 0,
                total_project_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                kw_with_subsidy DECIMAL(6,2) NOT NULL DEFAULT 0.00,
                kw_without_subsidy DECIMAL(6,2) NOT NULL DEFAULT 0.00,
                panel_company VARCHAR(100) NOT NULL,
                panel_wattage VARCHAR(50) NOT NULL,
                inverter_company VARCHAR(100) NOT NULL,
                inverter_capacity_kw DECIMAL(6,2) DEFAULT NULL,
                inverter_phase ENUM('1 Phase','3 Phase') DEFAULT '1 Phase',
                structure_height_front DECIMAL(5,2) DEFAULT 0.00,
                structure_height_back DECIMAL(5,2) DEFAULT 0.00,
                other_site_notes TEXT DEFAULT NULL,
                current_stage TINYINT NOT NULL DEFAULT 1,
                stage_status ENUM('Pending','Submitted','Hold','Cancelled','In Process') NOT NULL DEFAULT 'Pending',
                file_status VARCHAR(30) DEFAULT 'Active',
                is_in_modification TINYINT(1) DEFAULT 0,
                is_sub_pipeline_active TINYINT(1) NOT NULL DEFAULT 0,
                sub_pipeline_status ENUM('Pending','Paid','Due','Completed') DEFAULT 'Pending',
                created_by INT DEFAULT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_lead_id (lead_id),
                INDEX idx_current_stage (current_stage),
                INDEX idx_stage_status (stage_status),
                CONSTRAINT fk_proj_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // Safe alter for existing tables
        try {
            await db.query(`ALTER TABLE project_files ADD COLUMN file_status VARCHAR(30) DEFAULT 'Active'`);
        } catch(e) {}
        try {
            await db.query(`ALTER TABLE project_files ADD COLUMN is_in_modification TINYINT(1) DEFAULT 0`);
        } catch(e) {}
        try {
            await db.query(`ALTER TABLE project_files ADD COLUMN version INT NOT NULL DEFAULT 1`);
        } catch(e) {}
        try {
            await db.query(`ALTER TABLE file_stage_logs ADD COLUMN sla_hours_allowed INT DEFAULT 24`);
        } catch(e) {}
        try {
            await db.query(`ALTER TABLE project_payments ADD COLUMN is_verified TINYINT(1) DEFAULT 0`);
        } catch(e) {}

        // 3. Ensure file_stage_logs Table Exists
        await db.query(`
            CREATE TABLE IF NOT EXISTS file_stage_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                file_id INT NOT NULL,
                stage_number TINYINT NOT NULL,
                stage_name VARCHAR(100) NOT NULL,
                assigned_role_id INT DEFAULT NULL,
                action_taken VARCHAR(50) NOT NULL,
                remarks TEXT DEFAULT NULL,
                proof_attachment_url TEXT DEFAULT NULL,
                wifi_not_connected_reason TEXT DEFAULT NULL,
                sla_hours_elapsed DECIMAL(7,2) DEFAULT 0.00,
                sla_deadline DATETIME DEFAULT NULL,
                performed_by INT NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_file_id (file_id),
                INDEX idx_stage_num (stage_number),
                CONSTRAINT fk_stage_file FOREIGN KEY (file_id) REFERENCES project_files(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 4. Ensure project_payments Table Exists (Dual Gate & Ledger)
        await db.query(`
            CREATE TABLE IF NOT EXISTS project_payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                file_id INT NOT NULL,
                payment_stage ENUM('Initial Advance','Pre-Install','Post-Install','Final Settlement') NOT NULL,
                amount DECIMAL(12,2) NOT NULL,
                payment_mode ENUM('Cash','QR','Online','NEFT','Cheque') NOT NULL DEFAULT 'Cash',
                reference_number VARCHAR(100) DEFAULT NULL,
                bank_name VARCHAR(100) DEFAULT NULL,
                cheque_date DATE DEFAULT NULL,
                receipt_number VARCHAR(50) DEFAULT NULL,
                receipt_url VARCHAR(255) DEFAULT NULL,
                status ENUM('Pending','Verified','Hold','Rejected') NOT NULL DEFAULT 'Pending',
                verified_by INT DEFAULT NULL,
                verified_at DATETIME DEFAULT NULL,
                remarks TEXT DEFAULT NULL,
                created_by INT DEFAULT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_file_payment (file_id),
                CONSTRAINT fk_pay_file FOREIGN KEY (file_id) REFERENCES project_files(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 5. Ensure project_documents Table Exists (Dynamic Mandatory Documents)
        await db.query(`
            CREATE TABLE IF NOT EXISTS project_documents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                file_id INT NOT NULL,
                doc_type ENUM('Aadhaar Card','Electricity Bill','Cancelled Cheque','PAN Card','Property Document','Meter Application Photo','Site Photo','Other') NOT NULL,
                document_number VARCHAR(100) DEFAULT NULL,
                file_url VARCHAR(255) NOT NULL,
                original_filename VARCHAR(255) DEFAULT NULL,
                uploaded_by INT DEFAULT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_file_docs (file_id),
                CONSTRAINT fk_doc_file FOREIGN KEY (file_id) REFERENCES project_files(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 6. Ensure stage_status allows 'In Process'
        try {
            await db.query(`ALTER TABLE project_files MODIFY COLUMN stage_status ENUM('Pending','Submitted','Hold','Cancelled','In Process') NOT NULL DEFAULT 'Pending'`);
        } catch (alterErr) {
            // Already updated or ignored
        }

        console.log("✅ [Migration] Phase 2 Back-Office Schema is up to date & synchronized!");
    } catch (error) {
        console.error("❌ [Migration] Phase 2 Migration Failed:", error.message);
        throw error;
    }
}

module.exports = { runPhase2Migrations };
