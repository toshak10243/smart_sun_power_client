const { db } = require("./config/db");
const {
  getLeadStatusLogs,
  getClosedLeadsReport,
  updateLeadStatus,
} = require("./models/leadModel");

async function runPhase3Tests() {
  console.log("=== STARTING PHASE 3 BACKEND AUDIT & REPORTING TESTS ===");

  try {
    // 1. Verify Database schema for lead_status_logs
    const [tables] = await db.query("SHOW TABLES LIKE 'lead_status_logs'");
    if (tables.length === 0) {
      throw new Error("lead_status_logs table does NOT exist in database!");
    }
    console.log("✔ Table `lead_status_logs` exists in database.");

    // 2. Fetch a user to act as performer
    const [users] = await db.query("SELECT id, role_id, full_name FROM users LIMIT 1");
    let testUserId = users[0]?.id || 1;
    console.log(`Using Performer User ID: ${testUserId} (${users[0]?.full_name || "Admin"})`);

    // 3. Create a dedicated test lead for Phase 3
    const leadCode = `TEST-P3-${Date.now().toString().slice(-4)}`;
    const [leadRes] = await db.query(
      `INSERT INTO leads (
        lead_code, customer_name, mobile_number, email, city, state,
        solar_requirement, status, created_by, assigned_to
      ) VALUES (?, 'Ramesh Solar Test', '9876543210', 'ramesh@example.com', 'Jaipur', 'Rajasthan',
        'Residential', 'New Lead', ?, ?)`,
      [leadCode, testUserId, testUserId]
    );
    const testLeadId = leadRes.insertId;
    console.log(`✔ Created Test Lead ID: ${testLeadId} (${leadCode})`);

    // 4. Test Transition 1: Move to "Site Visit Scheduled"
    console.log("\nTesting Transition 1: 'New Lead' ➔ 'Site Visit Scheduled'...");
    await updateLeadStatus(
      testLeadId,
      {
        status: "Site Visit Scheduled",
        remark: "Scheduled technical rooftop survey with engineering team",
        site_visit_date: "2026-10-15",
        site_visit_time: "11:30 AM",
        assigned_to: testUserId,
      },
      testUserId
    );
    console.log("✔ Transitioned to 'Site Visit Scheduled'.");

    // 5. Test Transition 2: Move to "Site Visit Completed"
    console.log("\nTesting Transition 2: 'Site Visit Scheduled' ➔ 'Site Visit Completed'...");
    await updateLeadStatus(
      testLeadId,
      {
        status: "Site Visit Completed",
        remark: "Site inspection completed successfully. Structure requires elevation due to parapet height.",
        visit_outcome: "Shadow on southern edge, shadow-free on eastern side",
        customer_response: "Interested in 5kW On-Grid",
        next_action: "Send custom elevated structure quotation",
      },
      testUserId
    );
    console.log("✔ Transitioned to 'Site Visit Completed'.");

    // 6. Test Transition 3: Move to "Not Interested" with strict 50-word explanation & category
    console.log("\nTesting Transition 3: 'Site Visit Completed' ➔ 'Not Interested' (50 words + category)...");
    const explanation50Words =
      "Customer informed that current electricity tariff is subsidized and rooftop space is obstructed by shadows from neighboring high-rise building. They evaluated potential return on investment and calculated that payback period exceeds their planned ten-year residency timeline in this property. Therefore they decided definitely not to proceed further with solar installation today.";

    await updateLeadStatus(
      testLeadId,
      {
        status: "Not Interested",
        remark: explanation50Words,
        reason_category: "Price issue",
      },
      testUserId
    );
    console.log("✔ Transitioned to 'Not Interested' with 50-word explanation.");

    // 7. Verify getLeadStatusLogs
    console.log(`\nFetching Audit Trail logs for Lead ${testLeadId}...`);
    const logs = await getLeadStatusLogs(testLeadId);
    console.log(`✔ Found ${logs.length} transition logs in audit trail:`);

    logs.forEach((l, i) => {
      console.log(
        `   [${i + 1}] ${l.old_status || "Initial"} ➔ ${l.new_status} | By: ${l.changed_by_name} (${l.changed_by_role || "User"}) | Reason: ${l.reason_category || "N/A"}`
      );
    });

    if (logs.length < 3) {
      throw new Error(`Expected at least 3 logs, but found ${logs.length}`);
    }

    const latestLog = logs[0];
    if (latestLog.new_status !== "Not Interested") {
      throw new Error(`Expected latest status 'Not Interested', got ${latestLog.new_status}`);
    }
    if (latestLog.reason_category !== "Price issue") {
      throw new Error(`Expected reason_category 'Price issue', got ${latestLog.reason_category}`);
    }
    const wordCount = latestLog.remarks.trim().split(/\s+/).length;
    if (wordCount < 50) {
      throw new Error(`Expected at least 50 words, but found ${wordCount}`);
    }
    console.log(`✔ Verified 50-word explanation: ${wordCount} words recorded.`);

    // 8. Test getClosedLeadsReport (Unfiltered)
    console.log("\nTesting getClosedLeadsReport (all closed leads)...");
    const allClosed = await getClosedLeadsReport({});
    console.log(`✔ Found ${allClosed.length} closed leads total.`);
    const foundOurLead = allClosed.find((r) => r.id === testLeadId);
    if (!foundOurLead) {
      throw new Error(`Test lead ID ${testLeadId} not found in closed leads report!`);
    }
    console.log("✔ Test lead successfully present in Closed Leads Report.");

    // 9. Test getClosedLeadsReport (Filtered by Reason Category: 'Price issue')
    console.log("\nTesting getClosedLeadsReport (filtered by reason_category='Price issue')...");
    const priceIssueClosed = await getClosedLeadsReport({ reason_category: "Price issue" });
    console.log(`✔ Found ${priceIssueClosed.length} closed leads with reason_category='Price issue'.`);
    const foundInPriceIssue = priceIssueClosed.find((r) => r.id === testLeadId);
    if (!foundInPriceIssue) {
      throw new Error("Test lead not found in category-filtered report!");
    }

    // 10. Test getClosedLeadsReport (Filtered by status='Not Interested')
    console.log("\nTesting getClosedLeadsReport (filtered by status='Not Interested')...");
    const notInterestedClosed = await getClosedLeadsReport({ status: "Not Interested" });
    console.log(`✔ Found ${notInterestedClosed.length} 'Not Interested' leads.`);

    // 11. Test getClosedLeadsReport with date range (today)
    const today = new Date().toISOString().slice(0, 10);
    console.log(`\nTesting getClosedLeadsReport with date range (from_date=${today}, to_date=${today})...`);
    const dateFiltered = await getClosedLeadsReport({ from_date: today, to_date: today });
    console.log(`✔ Found ${dateFiltered.length} closed leads closed today.`);
    const foundInDate = dateFiltered.find((r) => r.id === testLeadId);
    if (!foundInDate) {
      throw new Error("Test lead not found in today's date-filtered report!");
    }

    // Clean up test lead
    await db.query("DELETE FROM lead_status_logs WHERE lead_id=?", [testLeadId]);
    await db.query("DELETE FROM lead_activity_logs WHERE lead_id=?", [testLeadId]);
    await db.query("DELETE FROM lead_followups WHERE lead_id=?", [testLeadId]);
    await db.query("DELETE FROM leads WHERE id=?", [testLeadId]);
    console.log(`✔ Cleaned up test lead ID: ${testLeadId}`);

    console.log("\n=======================================================");
    console.log("🎉 ALL PHASE 3 BACKEND AUDIT & REPORT TESTS PASSED 100%!");
    console.log("=======================================================");
  } catch (err) {
    console.error("❌ TEST FAILED:", err.message, err.stack);
    process.exit(1);
  } finally {
    await db.end();
  }
}

runPhase3Tests();
