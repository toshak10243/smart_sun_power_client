require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { db } = require("../config/db");

async function indexExists(tableName, indexName) {
  const [rows] = await db.query(`SHOW INDEX FROM ${tableName} WHERE Key_name = ?`, [indexName]);
  return rows.length > 0;
}

async function addIndexIfNotExists(tableName, indexName, columnsStr) {
  try {
    const exists = await indexExists(tableName, indexName);
    if (exists) {
      console.log(`[Index Exists] ${tableName}.${indexName}`);
      return;
    }
    console.log(`[Creating Index] ${tableName}.${indexName} (${columnsStr})...`);
    await db.query(`ALTER TABLE ${tableName} ADD INDEX ${indexName} (${columnsStr})`);
    console.log(`[Created] ${tableName}.${indexName} successfully!`);
  } catch (err) {
    console.warn(`[Index Error] ${tableName}.${indexName}:`, err.message);
  }
}

async function runOptimization() {
  console.log("=== Starting Database Index Optimization ===");

  // 1. Notifications: Fast fetch of unread / user notifications sorted by date
  await addIndexIfNotExists("notifications", "idx_notifications_user_unread", "user_id, is_read, created_at");

  // 2. Project Files: Fast desk queue, stage & status filtering
  await addIndexIfNotExists("project_files", "idx_files_stage_status", "current_stage, stage_status, updated_at");
  await addIndexIfNotExists("project_files", "idx_files_lead_stage", "lead_id, current_stage");

  // 3. File Stage Logs: Fast audit trail lookup
  await addIndexIfNotExists("file_stage_logs", "idx_stage_logs_file_stage", "file_id, stage_number, created_at");

  // 4. Project Documents: Fast KYC / Stage document lookup
  await addIndexIfNotExists("project_documents", "idx_project_docs_lookup", "file_id, doc_type, created_at");

  // 5. Project Payments & Expenses: Fast ledger calculation
  await addIndexIfNotExists("project_payments", "idx_payments_file_stage", "file_id, payment_stage, status, created_at");
  await addIndexIfNotExists("project_expenses", "idx_expenses_file", "file_id, created_at");

  // 6. Password Reset OTPs: Fast valid OTP check
  await addIndexIfNotExists("password_reset_otps", "idx_otps_user_verified", "user_id, is_verified, expires_at");

  // 7. Users: Fast lookup by role and active status
  await addIndexIfNotExists("users", "idx_users_role_status", "role_id, status, is_deleted");

  console.log("=== Database Index Optimization Complete! 🚀 ===");
  process.exit(0);
}

runOptimization().catch((e) => {
  console.error("Index optimization failed:", e);
  process.exit(1);
});
