const admin = require('firebase-admin');
const { db } = require('../config/db');

const serviceAccount = require('../config/serviceAccountKey.json');

try {
  if (!admin.apps || admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
} catch (e) {
  console.error('Firebase init error:', e.message);
}

// Role Name to Role ID Mapping
const ROLE_MAP = {
  'Super Admin': 1,
  'Sales Manager': 2,
  'Sales Executive': 3,
  'Back Office Online': 4,
  'Back Office Field': 5,
  'Loan Officer': 6,
  'Accounts': 7,
  'Installation Lead': 8,
  'Portal Entry': 9,
};

const sendToUser = async (userId, { title, body, type, referenceId }) => {
  if (!userId) return;
  try {
    // 1. ALWAYS Insert into notifications table first (In-app Bell Notification)
    // This ensures notifications are NEVER lost even if FCM is unavailable or token expired
    try {
      await db.query(
        'INSERT INTO notifications (user_id, title, body, type, reference_id) VALUES (?, ?, ?, ?, ?)',
        [userId, title, body, type || null, referenceId || null]
      );
    } catch (dbErr) {
      console.error(`[Notification DB Error] User ${userId}:`, dbErr.message);
    }

    // 2. Fetch user's active FCM token
    const [rows] = await db.query(
      "SELECT fcm_token FROM users WHERE id = ? AND fcm_token IS NOT NULL AND status = 'Active'",
      [userId]
    );
    if (rows.length === 0 || !rows[0].fcm_token) {
      return;
    }

    const token = rows[0].fcm_token;
    const message = {
      token,
      notification: { title, body },
      data: {
        type: type || '',
        reference_id: referenceId ? String(referenceId) : '',
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'solar_crm_channel',
          sound: 'default',
          priority: 'high',
          visibility: 'public',
        },
      },
    };

    try {
      await admin.messaging().send(message);
      console.log(`[Notification FCM] Sent to user ${userId}: "${title}"`);
    } catch (fcmErr) {
      console.warn(`[Notification FCM Warning] User ${userId}: ${fcmErr.message}`);
      // Clean up stale or unregistered FCM token
      if (fcmErr.message.includes('NotRegistered') || fcmErr.message.includes('invalid-registration-token')) {
        await db.query('UPDATE users SET fcm_token = NULL WHERE id = ?', [userId]).catch(() => {});
        console.log(`[Notification] Cleared invalid FCM token for user ${userId}`);
      }
    }
  } catch (err) {
    console.error(`Notification failed for user ${userId}:`, err.message);
  }
};

const sendToRole = async (roleId, { title, body, type, referenceId }) => {
  try {
    const [users] = await db.query(
      "SELECT id FROM users WHERE role_id = ? AND status = 'Active'",
      [roleId]
    );
    await Promise.all(users.map(u => sendToUser(u.id, { title, body, type, referenceId })));
  } catch (err) {
    console.error(`Role notification failed for role ${roleId}:`, err.message);
  }
};

const sendToRoleName = async (roleName, payload) => {
  const roleId = ROLE_MAP[roleName];
  if (roleId) {
    await sendToRole(roleId, payload);
  } else {
    console.warn(`[Notification] Unknown roleName: ${roleName}`);
  }
};

// ==========================================
// Lead Lifecycle Notifications
// ==========================================

const notifyLeadAssigned = async (leadId, assignedToUserId, leadCode, customerName) => {
  await sendToUser(assignedToUserId, {
    title: '📋 New Lead Assigned',
    body: `${customerName} (${leadCode}) has been assigned to you.`,
    type: 'lead_assigned',
    referenceId: leadId,
  });

  try {
    const [userRows] = await db.query(
      "SELECT manager_id, full_name FROM users WHERE id = ?",
      [assignedToUserId]
    );
    const rep = userRows?.[0];
    if (rep && rep.manager_id && Number(rep.manager_id) !== Number(assignedToUserId)) {
      await sendToUser(rep.manager_id, {
        title: '📋 Team Lead Assigned',
        body: `${customerName} (${leadCode}) has been assigned to your team member ${rep.full_name}.`,
        type: 'lead_assigned',
        referenceId: leadId,
      });
    }
  } catch (err) {
    console.error('Manager lead assigned notification error:', err.message);
  }
};

const notifyLeadWon = async (leadId, leadCode, customerName, managerId) => {
  await sendToRole(1, {
    title: '🎉 Deal Closed — Won!',
    body: `${customerName} (${leadCode}) has been marked as Won.`,
    type: 'lead_won',
    referenceId: leadId,
  });
  if (managerId) {
    await sendToUser(managerId, {
      title: '🎉 Team Deal Won!',
      body: `${customerName} (${leadCode}) has been marked as Won.`,
      type: 'lead_won',
      referenceId: leadId,
    });
  }
};

const notifyLeadLost = async (leadId, leadCode, customerName, managerId) => {
  await sendToRole(1, {
    title: '❌ Lead Lost',
    body: `${customerName} (${leadCode}) has been marked as Lost.`,
    type: 'lead_lost',
    referenceId: leadId,
  });
  if (managerId) {
    await sendToUser(managerId, {
      title: '❌ Team Lead Lost',
      body: `${customerName} (${leadCode}) has been marked as Lost.`,
      type: 'lead_lost',
      referenceId: leadId,
    });
  }
};

const notifyStatusChanged = async (leadId, leadCode, customerName, newStatus, managerId) => {
  if (!managerId) return;
  await sendToUser(managerId, {
    title: '📊 Lead Status Updated',
    body: `${customerName} (${leadCode}) moved to "${newStatus}".`,
    type: 'status_changed',
    referenceId: leadId,
  });
};

const notifyBulkImport = async (adminId, imported, failed) => {
  await sendToUser(adminId, {
    title: '📥 Bulk Import Complete',
    body: `${imported} leads imported successfully${failed > 0 ? `, ${failed} failed` : ''}.`,
    type: 'bulk_import',
    referenceId: null,
  });
};

const notifyFollowupAdded = async (leadId, leadCode, customerName, managerId) => {
  if (!managerId) return;
  await sendToUser(managerId, {
    title: '📞 Follow-up Logged',
    body: `Follow-up added for ${customerName} (${leadCode}).`,
    type: 'followup_added',
    referenceId: leadId,
  });
};

const notifyLeadCreated = async (leadId, leadCode, customerName, createdByName) => {
  await sendToRole(1, {
    title: '🆕 New Lead Created',
    body: `${customerName} (${leadCode}) added by ${createdByName}.`,
    type: 'lead_created',
    referenceId: leadId,
  });
};

// ==========================================
// Project File & Pipeline Notifications
// ==========================================

const notifyFileCreated = async ({ fileId, fileNumber, customerName, kwCapacity, totalCost, createdByUserId, isModification }) => {
  const capText = kwCapacity ? ` (${kwCapacity} kW)` : '';
  const costText = totalCost ? ` • ₹${Number(totalCost).toLocaleString('en-IN')}` : '';

  // 1. Super Admin (Role 1)
  await sendToRole(1, {
    title: '📁 New Project File Created',
    body: `File #${fileNumber} for ${customerName}${capText}${costText} has been created.`,
    type: 'file_created',
    referenceId: fileId,
  });

  // 2. Desk for Stage 1 / Modification Sub-pipeline (Back Office Online - Role 4)
  const deskStage = isModification ? 'Modification Sub-Pipeline' : 'Stage 1: File Online';
  await sendToRole(4, {
    title: '📥 New File In Desk Queue',
    body: `File #${fileNumber} (${customerName}) is ready for processing at ${deskStage}.`,
    type: 'file_created',
    referenceId: fileId,
  });

  // 3. Sales Creator
  if (createdByUserId) {
    await sendToUser(createdByUserId, {
      title: '🎉 File Successfully Booked',
      body: `File #${fileNumber} for ${customerName} is successfully registered and moved to pipeline.`,
      type: 'file_created',
      referenceId: fileId,
    });
  }
};

const notifyStageAdvanced = async ({ fileId, fileNumber, customerName, nextStageNumber, nextStageName, nextRoleName, performedByName, salesRepId }) => {
  // 1. Next Desk Role
  if (nextRoleName) {
    await sendToRoleName(nextRoleName, {
      title: `⚡ Action Required: Stage ${nextStageNumber}`,
      body: `File #${fileNumber} (${customerName}) has arrived at "${nextStageName}". Please review and take action.`,
      type: 'stage_advanced',
      referenceId: fileId,
    });
  }

  // 2. Sales Rep
  if (salesRepId) {
    await sendToUser(salesRepId, {
      title: `📈 File Advanced: Stage ${nextStageNumber}`,
      body: `File #${fileNumber} (${customerName}) moved to "${nextStageName}".`,
      type: 'stage_advanced',
      referenceId: fileId,
    });
  }

  // 3. Super Admin
  await sendToRole(1, {
    title: `🚀 Stage Progress: #${fileNumber}`,
    body: `${customerName} advanced to Stage ${nextStageNumber} (${nextStageName}) by ${performedByName || 'staff'}.`,
    type: 'stage_advanced',
    referenceId: fileId,
  });
};

const notifyFileHold = async ({ fileId, fileNumber, customerName, stageNumber, stageName, remarks, performedByName, salesRepId }) => {
  const reasonText = remarks ? ` Reason: ${remarks}` : '';

  // 1. Sales Rep
  if (salesRepId) {
    await sendToUser(salesRepId, {
      title: `⏸️ File Placed On Hold: #${fileNumber}`,
      body: `File #${fileNumber} (${customerName}) is placed On Hold at Stage ${stageNumber} (${stageName}).${reasonText}`,
      type: 'file_hold',
      referenceId: fileId,
    });
  }

  // 2. Super Admin
  await sendToRole(1, {
    title: `⚠️ File On Hold: #${fileNumber}`,
    body: `${customerName} put on Hold at Stage ${stageNumber} by ${performedByName || 'staff'}.${reasonText}`,
    type: 'file_hold',
    referenceId: fileId,
  });
};

const notifyFileResumed = async ({ fileId, fileNumber, customerName, stageNumber, stageName, performedByName, salesRepId }) => {
  // 1. Sales Rep
  if (salesRepId) {
    await sendToUser(salesRepId, {
      title: `▶️ File Resumed: #${fileNumber}`,
      body: `File #${fileNumber} (${customerName}) has been resumed and is active again at Stage ${stageNumber} (${stageName}).`,
      type: 'file_resumed',
      referenceId: fileId,
    });
  }

  // 2. Super Admin
  await sendToRole(1, {
    title: `✅ File Resumed: #${fileNumber}`,
    body: `${customerName} resumed from Hold at Stage ${stageNumber} by ${performedByName || 'staff'}.`,
    type: 'file_resumed',
    referenceId: fileId,
  });
};

const notifyFileCancelled = async ({ fileId, fileNumber, customerName, remarks, performedByName, salesRepId }) => {
  const reasonText = remarks ? ` Reason: ${remarks}` : '';

  // 1. Sales Rep
  if (salesRepId) {
    await sendToUser(salesRepId, {
      title: `❌ File Cancelled: #${fileNumber}`,
      body: `File #${fileNumber} (${customerName}) has been cancelled.${reasonText}`,
      type: 'file_cancelled',
      referenceId: fileId,
    });
  }

  // 2. Super Admin
  await sendToRole(1, {
    title: `🚨 File Cancelled: #${fileNumber}`,
    body: `${customerName} (File #${fileNumber}) cancelled by ${performedByName || 'staff'}.${reasonText}`,
    type: 'file_cancelled',
    referenceId: fileId,
  });
};

const notifyPaymentAdded = async ({ fileId, fileNumber, customerName, amount, paymentMode, paymentStage, addedByName }) => {
  const amtStr = `₹${Number(amount).toLocaleString('en-IN')}`;

  // 1. Accounts Desk (Role 7)
  await sendToRole(7, {
    title: `💰 Payment Received: ${amtStr}`,
    body: `${paymentStage} payment of ${amtStr} (${paymentMode}) logged for File #${fileNumber} (${customerName}). Verification required.`,
    type: 'payment_added',
    referenceId: fileId,
  });

  // 2. Super Admin
  await sendToRole(1, {
    title: `💵 Payment Logged: ${amtStr}`,
    body: `${amtStr} (${paymentMode}) received for #${fileNumber} (${customerName}) by ${addedByName || 'sales'}.`,
    type: 'payment_added',
    referenceId: fileId,
  });
};

const notifyPaymentVerified = async ({ fileId, fileNumber, customerName, amount, paymentStage, verifiedByName, salesRepId }) => {
  const amtStr = `₹${Number(amount).toLocaleString('en-IN')}`;

  // 1. Sales Rep
  if (salesRepId) {
    await sendToUser(salesRepId, {
      title: `✅ Payment Verified: ${amtStr}`,
      body: `${paymentStage} payment of ${amtStr} for File #${fileNumber} (${customerName}) has been verified by Accounts.`,
      type: 'payment_verified',
      referenceId: fileId,
    });
  }

  // 2. Super Admin
  await sendToRole(1, {
    title: `🟢 Payment Cleared: ${amtStr}`,
    body: `${amtStr} verified for #${fileNumber} (${customerName}) by ${verifiedByName || 'Accounts'}.`,
    type: 'payment_verified',
    referenceId: fileId,
  });
};

const notifyDocumentUploaded = async ({ fileId, fileNumber, customerName, docType, currentRoleName, uploadedByName, salesRepId }) => {
  // 1. Current Desk Role
  if (currentRoleName) {
    await sendToRoleName(currentRoleName, {
      title: `📄 New Document: ${docType}`,
      body: `"${docType}" uploaded for File #${fileNumber} (${customerName}) by ${uploadedByName || 'staff'}.`,
      type: 'document_uploaded',
      referenceId: fileId,
    });
  }

  // 2. Sales Rep
  if (salesRepId) {
    await sendToUser(salesRepId, {
      title: `📎 Document Attached: ${docType}`,
      body: `"${docType}" was attached to File #${fileNumber} (${customerName}).`,
      type: 'document_uploaded',
      referenceId: fileId,
    });
  }
};

const notifyRateApproval = async ({ fileId, fileNumber, customerName, status, remarks, approvedByName, salesRepId }) => {
  let title = '⚖️ Rate Approval Updated';
  if (status === 'Approved') title = '🎉 Project Rate Approved!';
  else if (status === 'On Hold') title = '⏸️ Project Rate On Hold';
  else if (status === 'Rejected') title = '❌ Project Rate Rejected';

  const reasonText = remarks ? ` Remarks: ${remarks}` : '';

  // 1. Sales Rep
  if (salesRepId) {
    await sendToUser(salesRepId, {
      title,
      body: `File #${fileNumber} (${customerName}) rate status: ${status}.${reasonText}`,
      type: 'rate_approval',
      referenceId: fileId,
    });
  }

  // 2. If approved, inform Back Office Online (Role 4)
  if (status === 'Approved') {
    await sendToRole(4, {
      title: `🟢 Rate Approved: #${fileNumber}`,
      body: `File #${fileNumber} (${customerName}) rate approved by Super Admin. Ready for File Online.`,
      type: 'rate_approval',
      referenceId: fileId,
    });
  }
};

const notifyExpenseAdded = async ({ fileId, fileNumber, customerName, category, amount, description, addedByName }) => {
  const amtStr = `₹${Number(amount).toLocaleString('en-IN')}`;
  const note = description ? ` (${description})` : '';

  await sendToRole(1, {
    title: `🧾 Expense Logged: ${amtStr}`,
    body: `${category} of ${amtStr} logged for #${fileNumber} (${customerName})${note} by ${addedByName || 'staff'}.`,
    type: 'expense_added',
    referenceId: fileId,
  });

  await sendToRole(7, {
    title: `🧾 New Expense Entry: ${amtStr}`,
    body: `${category} of ${amtStr} logged for #${fileNumber} (${customerName})${note}.`,
    type: 'expense_added',
    referenceId: fileId,
  });
};

module.exports = {
  sendToUser,
  sendToRole,
  sendToRoleName,
  notifyLeadAssigned,
  notifyLeadWon,
  notifyLeadLost,
  notifyStatusChanged,
  notifyBulkImport,
  notifyFollowupAdded,
  notifyLeadCreated,
  // Project File notifications
  notifyFileCreated,
  notifyStageAdvanced,
  notifyFileHold,
  notifyFileResumed,
  notifyFileCancelled,
  notifyPaymentAdded,
  notifyPaymentVerified,
  notifyDocumentUploaded,
  notifyRateApproval,
  notifyExpenseAdded,
};
