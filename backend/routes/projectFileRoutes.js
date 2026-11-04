// routes/projectFileRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { verifyToken } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/projectFileController');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/documents/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'))
});
const upload = multer({ storage });

router.post('/create', verifyToken, ctrl.createFile);
router.get('/my-queue', verifyToken, ctrl.getMyQueue);
router.get('/dashboard/stats', verifyToken, ctrl.getDashboardStats);
router.get('/sales/won-files', verifyToken, ctrl.getSalesWonFiles);
router.get('/documents/all', verifyToken, ctrl.getAllDocuments);
router.get('/lead/:leadId/tracker', verifyToken, ctrl.getTracker);
router.get('/:fileId', verifyToken, ctrl.getFileDetail);
router.post('/:fileId/stage-action', verifyToken, ctrl.stageAction);
router.post('/:fileId/payment', verifyToken, ctrl.addPayment);
router.patch('/payment/:paymentId/verify', verifyToken, ctrl.verifyPayment);
router.patch('/payment/:paymentId/toggle-clear', verifyToken, ctrl.togglePaymentClear);
router.post('/:fileId/expense', verifyToken, ctrl.addExpense);
router.get('/:fileId/expenses', verifyToken, ctrl.getExpenses);
router.patch('/expense/:expenseId/toggle-clear', verifyToken, ctrl.toggleExpenseClear);
router.patch('/:fileId/rate-approval', verifyToken, ctrl.updateRateApproval);
router.post('/:fileId/document', verifyToken, upload.single('file'), ctrl.uploadDocument);

module.exports = router;
