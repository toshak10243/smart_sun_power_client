const Bull = require("bull");
const nodemailer = require("nodemailer");
const { redisConfig, isRedisReady } = require("../config/redis");

// Mail Transporter instance for queue worker
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.MAIL_PORT || "587", 10),
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

let emailQueue = null;
let notificationQueue = null;
let activityLogQueue = null;

try {
  const queueOptions = {
    redis: {
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
    },
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: 100,
      removeOnFail: 200,
    },
  };

  // 1. Email Queue
  emailQueue = new Bull("emailQueue", queueOptions);

  emailQueue.process(async (job) => {
    const { to, subject, html, text } = job.data;
    console.log(`[Queue:Email] Processing email for ${to}: "${subject}"`);
    const info = await transporter.sendMail({
      from: `"Smart Sun Power" <${process.env.MAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log(`[Queue:Email] Sent to ${to} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  });

  // 2. Notification Queue
  notificationQueue = new Bull("notificationQueue", queueOptions);

  notificationQueue.process(async (job) => {
    const { mode, targetId, payload } = job.data;
    const notificationService = require("../services/notificationService");
    console.log(`[Queue:Notification] Processing ${mode} notification for target ${targetId}`);
    if (mode === "user") {
      await notificationService.sendToUser(targetId, payload);
    } else if (mode === "role") {
      await notificationService.sendToRole(targetId, payload);
    }
    return { success: true };
  });

  // 3. Activity Log Queue
  activityLogQueue = new Bull("activityLogQueue", queueOptions);

  activityLogQueue.process(async (job) => {
    const { leadId, performedBy, actionType, description, metadata } = job.data;
    const { db } = require("../config/db");
    await db.query(
      `INSERT INTO lead_activity_logs (lead_id, performed_by, action_type, description, metadata)
       VALUES (?, ?, ?, ?, ?)`,
      [leadId, performedBy, actionType, description, metadata ? JSON.stringify(metadata) : null]
    );
    return { success: true };
  });

  console.log("[BullMQ/Bull] All 3 background queues & workers initialized! 🚀");
} catch (err) {
  console.warn("[Queue Warn] Failed to initialize Redis queues, fallback mode enabled:", err.message);
}

/**
 * Public Dispatchers (Safe with Redis or Synchronous Fallback)
 */
const QueueManager = {
  /**
   * Dispatch email asynchronously
   */
  async dispatchEmail({ to, subject, html, text }) {
    if (emailQueue && isRedisReady()) {
      return await emailQueue.add({ to, subject, html, text });
    }
    // Fallback: Send directly
    console.log(`[Queue Fallback] Sending email directly to ${to}`);
    return transporter.sendMail({
      from: `"Smart Sun Power" <${process.env.MAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
  },

  /**
   * Dispatch push/database notification asynchronously
   */
  async dispatchNotification(mode, targetId, payload) {
    if (notificationQueue && isRedisReady()) {
      return await notificationQueue.add({ mode, targetId, payload });
    }
    // Fallback: Execute directly
    const notificationService = require("../services/notificationService");
    if (mode === "user") {
      return await notificationService.sendToUser(targetId, payload);
    } else if (mode === "role") {
      return await notificationService.sendToRole(targetId, payload);
    }
  },

  /**
   * Dispatch lead activity log asynchronously
   */
  async dispatchActivityLog({ leadId, performedBy, actionType, description, metadata }) {
    if (activityLogQueue && isRedisReady()) {
      return await activityLogQueue.add({ leadId, performedBy, actionType, description, metadata });
    }
    // Fallback: Execute directly
    const { db } = require("../config/db");
    return await db.query(
      `INSERT INTO lead_activity_logs (lead_id, performed_by, action_type, description, metadata)
       VALUES (?, ?, ?, ?, ?)`,
      [leadId, performedBy, actionType, description, metadata ? JSON.stringify(metadata) : null]
    );
  },

  emailQueue,
  notificationQueue,
  activityLogQueue,
};

module.exports = QueueManager;

