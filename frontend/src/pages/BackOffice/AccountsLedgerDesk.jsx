import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  TextField,
  Grid,
  Card,
  CardContent,
  MenuItem,
} from "@mui/material";
import {
  AccountBalanceWalletRounded as PaymentIcon,
  CheckCircleRounded as VerifiedIcon,
  PauseCircleOutlineRounded as HoldIcon,
  CheckCircleOutlineRounded as ClearIcon,
  AddCircleOutlineRounded as AddIcon,
  TrendingUpRounded as RevenueIcon,
  MonetizationOnRounded as PaidIcon,
  PendingActionsRounded as PendingIcon,
  ReceiptLongRounded as ReceiptIcon,
} from "@mui/icons-material";
import {
  getMyQueue,
  performStageAction,
  getFileDetail,
  verifyProjectPayment,
  addProjectPayment,
  togglePaymentClear,
  addProjectExpense,
  toggleExpenseClear,
} from "../../services/projectFileService";
import RemarkValidationModal from "../../components/BackOffice/RemarkValidationModal";

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://localhost:5000";

export default function AccountsLedgerDesk() {
  const [activeTab, setActiveTab] = useState(0); // 0: Pre-Install (Stage 5), 1: Post-Install (Stage 7), 2: Stage 15 Verification, 3: Full Ledger
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Remark Modal
  const [remarkModalOpen, setRemarkModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [pendingAction, setPendingAction] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Add Payment Modal
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [paymentTargetFile, setPaymentTargetFile] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    payment_stage: "Pre-Install",
    amount: "",
    payment_mode: "Cash",
    reference_number: "",
    bank_name: "",
    cheque_date: "",
  });
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  // Add Expense Modal (Stage 15 Cost Logging)
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [expenseTargetFile, setExpenseTargetFile] = useState(null);
  const [expenseForm, setExpenseForm] = useState({
    expense_category: "Civil Material Cost",
    amount: "",
    description: "",
  });
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);

  // Detail Modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await getMyQueue();
      setFiles(res.files || []);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.message || "Failed to load accounts queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter queues
  const preInstallFiles = files.filter(
    (f) => f.current_stage === 5 && f.file_status !== "Completed"
  );
  const postInstallFiles = files.filter(
    (f) => f.current_stage === 7 && f.file_status !== "Completed"
  );
  const finalCheckFiles = files.filter(
    (f) => (f.current_stage === 15 || f.current_stage === 16) && f.file_status !== "Completed"
  );

  // Aggregated KPIs
  const totalBilled = files.reduce((acc, f) => acc + Number(f.total_project_cost || 0), 0);

  const handleActionClick = (file, action) => {
    setSelectedFile(file);
    setPendingAction(action);
    if (action === "Hold" || action === "Cancel") {
      setRemarkModalOpen(true);
    } else {
      executeClearAction(file, action);
    }
  };

  const executeClearAction = async (file, action, remarks = "") => {
    try {
      setActionLoading(true);
      await performStageAction(file.id, {
        stage_number: file.current_stage,
        action,
        remarks,
      });
      setRemarkModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemarkSubmit = (remarksText) => {
    if (!selectedFile || !pendingAction) return;
    executeClearAction(selectedFile, pendingAction, remarksText);
  };

  const handleOpenAddPayment = (file) => {
    setPaymentTargetFile(file);
    setPaymentForm({
      payment_stage: file.current_stage === 5 ? "Pre-Install" : file.current_stage === 7 ? "Post-Install" : "Final Settlement",
      amount: "",
      payment_mode: "Cash",
      reference_number: "",
      bank_name: "",
      cheque_date: "",
    });
    setAddPaymentOpen(true);
  };

  const handleAddPaymentSubmit = async () => {
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      alert("Please enter a valid amount!");
      return;
    }
    try {
      setPaymentSubmitting(true);
      await addProjectPayment(paymentTargetFile.id, paymentForm);
      alert("Payment recorded successfully!");
      setAddPaymentOpen(false);
      loadData();
      if (detailOpen && detailData?.file?.id === paymentTargetFile.id) {
        handleViewLedger(paymentTargetFile.id);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to record payment");
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleViewLedger = async (fileId) => {
    try {
      setDetailLoading(true);
      setDetailOpen(true);
      const res = await getFileDetail(fileId);
      setDetailData(res);
    } catch (err) {
      alert("Failed to load file ledger details");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleVerify = async (paymentId) => {
    try {
      await verifyProjectPayment(paymentId);
      alert("Payment verified and locked in ledger!");
      if (detailData?.file?.id) {
        handleViewLedger(detailData.file.id);
      }
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to verify payment");
    }
  };

  const handleTogglePaymentClear = async (paymentId) => {
    try {
      await togglePaymentClear(paymentId);
      if (detailData?.file?.id) {
        handleViewLedger(detailData.file.id);
      }
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to toggle payment clearance");
    }
  };

  const handleToggleExpenseClear = async (expenseId) => {
    try {
      await toggleExpenseClear(expenseId);
      if (detailData?.file?.id) {
        handleViewLedger(detailData.file.id);
      }
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to toggle expense clearance");
    }
  };

  const handleOpenAddExpense = (file) => {
    setExpenseTargetFile(file);
    setExpenseForm({
      expense_category: "Civil Material Cost",
      amount: "",
      description: "",
    });
    setAddExpenseOpen(true);
  };

  const handleAddExpenseSubmit = async () => {
    if (!expenseForm.amount || Number(expenseForm.amount) <= 0) {
      alert("Please enter a valid expense amount!");
      return;
    }
    try {
      setExpenseSubmitting(true);
      await addProjectExpense(expenseTargetFile.id, expenseForm);
      alert("Project expense recorded successfully!");
      setAddExpenseOpen(false);
      if (detailOpen && detailData?.file?.id === expenseTargetFile.id) {
        handleViewLedger(expenseTargetFile.id);
      }
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to record expense");
    } finally {
      setExpenseSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 1400, mx: "auto" }}>
      {/* Title */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#0B3A63", display: "flex", alignItems: "center", gap: 1 }}>
            <PaymentIcon sx={{ color: "#16A34A" }} /> Accounts & Dual Clearance Desk
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Screen 5 Pre-Install Gate • Screen 7 Post-Install Gate • Reconciliation Ledger
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          onClick={loadData}
          sx={{ height: 32, px: 1.5, fontSize: "0.78rem", fontWeight: 600, borderRadius: "8px", textTransform: "none", whiteSpace: "nowrap" }}
        >
          Refresh Ledger
        </Button>
      </Stack>

      {errorMsg && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{errorMsg}</Alert>}

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 3, bgcolor: "#FEF3C7" }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Stage 5: Pre-Install Clearance Due
                  </Typography>
                  <Typography variant="h5" fontWeight={800} color="#D97706">
                    {preInstallFiles.length} Files
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Requires advance payment verification before installation dispatch
                  </Typography>
                </Box>
                <PendingIcon sx={{ color: "#D97706", fontSize: 32 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Card elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 3, bgcolor: "#EFF6FF" }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Stage 7: Post-Install Settlement Due
                  </Typography>
                  <Typography variant="h5" fontWeight={800} color="#2563EB">
                    {postInstallFiles.length} Files
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Requires customer balance clearance before portal entry
                  </Typography>
                </Box>
                <RevenueIcon sx={{ color: "#2563EB", fontSize: 32 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Card elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 3, bgcolor: "#DCFCE7" }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Stage 15 & 16: Closing Ledger
                  </Typography>
                  <Typography variant="h5" fontWeight={800} color="#16A34A">
                    {finalCheckFiles.length} Files
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Final debit/credit balance tally before file closing
                  </Typography>
                </Box>
                <VerifiedIcon sx={{ color: "#16A34A", fontSize: 32 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper elevation={0} sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} textColor="primary" indicatorColor="primary">
          <Tab label={`1. Pre-Install Gate [Stage 5] (${preInstallFiles.length})`} />
          <Tab label={`2. Post-Install Gate [Stage 7] (${postInstallFiles.length})`} />
          <Tab label={`3. Stage 15 & 16: Closing Ledger (${finalCheckFiles.length})`} />
          <Tab label={`4. All Files & Master Ledger (${files.length})`} />
        </Tabs>
      </Paper>

      {/* Tab 0: Pre-Install Gate */}
      {activeTab === 0 && (
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: "1px solid #E2E8F0" }}>
          <Table>
            <TableHead sx={{ bgcolor: "#F8FAFC" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>File Number</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Capacity</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Total Deal Amount</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Advance Verification</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Clearance Gate</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell></TableRow>
              ) : preInstallFiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                      No files currently pending for Pre-Install Payment Clearance.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                preInstallFiles.map((file) => (
                  <TableRow key={file.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} color="#0B3A63">{file.file_number}</Typography>
                      <Typography variant="caption" color="text.secondary">{file.aen_office}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{file.customer_name}</Typography>
                      <Typography variant="caption" color="text.secondary">{file.phone_number}</Typography>
                    </TableCell>
                    <TableCell>{file.kw_with_subsidy} kW {file.is_loan ? "(LOAN)" : "(CASH)"}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>₹ {Number(file.total_project_cost).toLocaleString("en-IN")}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => handleViewLedger(file.id)}
                        sx={{ height: 28, px: 1, fontSize: "0.72rem", fontWeight: 700, borderRadius: "6px", textTransform: "none", whiteSpace: "nowrap" }}
                      >
                        Check Payments
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={file.file_status === "On Hold" ? "HOLD (Red)" : "PENDING CLEARANCE"}
                        color={file.file_status === "On Hold" ? "warning" : "default"}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.8} justifyContent="flex-end" flexWrap="nowrap">
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<ClearIcon sx={{ fontSize: "14px !important" }} />}
                          onClick={() => handleActionClick(file, "Clear")}
                          sx={{ height: 28, px: 1.2, fontSize: "0.72rem", fontWeight: 700, borderRadius: "6px", textTransform: "none", whiteSpace: "nowrap" }}
                        >
                          Clear (Green)
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<HoldIcon sx={{ fontSize: "14px !important" }} />}
                          onClick={() => handleActionClick(file, "Hold")}
                          sx={{ height: 28, px: 1.2, fontSize: "0.72rem", fontWeight: 700, borderRadius: "6px", textTransform: "none", whiteSpace: "nowrap" }}
                        >
                          Hold (Red)
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleOpenAddPayment(file)}
                          sx={{ height: 28, px: 1.2, fontSize: "0.72rem", fontWeight: 700, borderRadius: "6px", textTransform: "none", whiteSpace: "nowrap" }}
                        >
                          + Pay
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Tab 1: Post-Install Gate */}
      {activeTab === 1 && (
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: "1px solid #E2E8F0" }}>
          <Table>
            <TableHead sx={{ bgcolor: "#F8FAFC" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>File Number</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Total Deal</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Settlement Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Clearance Gate</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell></TableRow>
              ) : postInstallFiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                      No files currently pending for Post-Install Payment Settlement.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                postInstallFiles.map((file) => (
                  <TableRow key={file.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} color="#0B3A63">{file.file_number}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{file.customer_name}</Typography>
                      <Typography variant="caption" color="text.secondary">{file.phone_number}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>₹ {Number(file.total_project_cost).toLocaleString("en-IN")}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => handleViewLedger(file.id)}
                        sx={{ height: 28, px: 1, fontSize: "0.72rem", fontWeight: 700, borderRadius: "6px", textTransform: "none", whiteSpace: "nowrap" }}
                      >
                        View Ledger
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={file.file_status === "On Hold" ? "HOLD (Red)" : "AWAITING BALANCE"}
                        color={file.file_status === "On Hold" ? "warning" : "default"}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.8} justifyContent="flex-end" flexWrap="nowrap">
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<ClearIcon sx={{ fontSize: "14px !important" }} />}
                          onClick={() => handleActionClick(file, "Clear")}
                          sx={{ height: 28, px: 1.2, fontSize: "0.72rem", fontWeight: 700, borderRadius: "6px", textTransform: "none", whiteSpace: "nowrap" }}
                        >
                          Clear (Green)
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<HoldIcon sx={{ fontSize: "14px !important" }} />}
                          onClick={() => handleActionClick(file, "Hold")}
                          sx={{ height: 28, px: 1.2, fontSize: "0.72rem", fontWeight: 700, borderRadius: "6px", textTransform: "none", whiteSpace: "nowrap" }}
                        >
                          Hold (Red)
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleOpenAddPayment(file)}
                          sx={{ height: 28, px: 1.2, fontSize: "0.72rem", fontWeight: 700, borderRadius: "6px", textTransform: "none", whiteSpace: "nowrap" }}
                        >
                          + Pay
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Tab 2: Stage 15 Verification & Expenses */}
      {activeTab === 2 && (
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: "1px solid #E2E8F0" }}>
          <Table>
            <TableHead sx={{ bgcolor: "#F8FAFC" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>File Number</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Capacity</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Total Deal Cost</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {finalCheckFiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                      No files currently pending for Stage 15 Ledger Verification.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                finalCheckFiles.map((file) => (
                  <TableRow key={file.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} color="#0B3A63">{file.file_number}</Typography>
                      <Typography variant="caption" color="text.secondary">{file.aen_office}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{file.customer_name}</Typography>
                      <Typography variant="caption" color="text.secondary">{file.phone_number}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{file.kw_with_subsidy} kW</Typography>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#16A34A" }}>
                      ₹ {Number(file.total_project_cost).toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={file.file_status}
                        color={file.file_status === "Active" ? "primary" : "warning"}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.8} justifyContent="flex-end" flexWrap="nowrap">
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={() => handleViewLedger(file.id)}
                          sx={{ height: 28, px: 1.2, fontSize: "0.72rem", fontWeight: 700, borderRadius: "6px", textTransform: "none", whiteSpace: "nowrap" }}
                        >
                          Ledger & Costs
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="secondary"
                          onClick={() => handleOpenAddExpense(file)}
                          sx={{ height: 28, px: 1.2, fontSize: "0.72rem", fontWeight: 700, borderRadius: "6px", textTransform: "none", whiteSpace: "nowrap" }}
                        >
                          + Log Cost
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<ClearIcon sx={{ fontSize: "14px !important" }} />}
                          onClick={() => handleActionClick(file, file.current_stage === 16 ? "Completed" : "Submit")}
                          sx={{ height: 28, px: 1.2, fontSize: "0.72rem", fontWeight: 700, borderRadius: "6px", textTransform: "none", whiteSpace: "nowrap" }}
                        >
                          {file.current_stage === 16 ? "Final Close File (Pawan Ji)" : "Clear Stg 15"}
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="warning"
                          startIcon={<HoldIcon sx={{ fontSize: "14px !important" }} />}
                          onClick={() => handleActionClick(file, "Hold")}
                          sx={{ height: 28, px: 1.2, fontSize: "0.72rem", fontWeight: 700, borderRadius: "6px", textTransform: "none", whiteSpace: "nowrap" }}
                        >
                          Hold
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Tab 3: Full Files & Ledger */}
      {activeTab === 3 && (
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: "1px solid #E2E8F0" }}>
          <Table>
            <TableHead sx={{ bgcolor: "#F8FAFC" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>File Number</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Current Stage</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Total Cost</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {files.map((file) => (
                <TableRow key={file.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700} color="#0B3A63">{file.file_number}</Typography>
                    <Typography variant="caption" color="text.secondary">{file.aen_office}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{file.customer_name}</Typography>
                    <Typography variant="caption" color="text.secondary">{file.phone_number}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={`Stage ${file.current_stage}: ${file.stage_name}`} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#16A34A" }}>
                    ₹ {Number(file.total_project_cost).toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={file.file_status} color={file.file_status === "Active" ? "primary" : "warning"} />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.8} justifyContent="flex-end" flexWrap="nowrap">
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        onClick={() => handleViewLedger(file.id)}
                        sx={{ height: 28, px: 1.2, fontSize: "0.72rem", fontWeight: 700, borderRadius: "6px", textTransform: "none", whiteSpace: "nowrap" }}
                      >
                        Ledger
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleOpenAddPayment(file)}
                        sx={{ height: 28, px: 1.2, fontSize: "0.72rem", fontWeight: 700, borderRadius: "6px", textTransform: "none", whiteSpace: "nowrap" }}
                      >
                        + Pay
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 10-Word Remark Enforcement Modal */}
      <RemarkValidationModal
        open={remarkModalOpen}
        onClose={() => setRemarkModalOpen(false)}
        action={pendingAction}
        onSubmit={handleRemarkSubmit}
        loading={actionLoading}
      />

      {/* Add Payment Modal */}
      <Dialog open={addPaymentOpen} onClose={() => setAddPaymentOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: "#0B3A63" }}>
          Record Payment: {paymentTargetFile?.file_number}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Payment Stage"
              value={paymentForm.payment_stage}
              onChange={(e) => setPaymentForm({ ...paymentForm, payment_stage: e.target.value })}
              fullWidth
              size="small"
            >
              <MenuItem value="Initial Advance">Initial Advance</MenuItem>
              <MenuItem value="Pre-Install">Pre-Install (Stage 5 Check)</MenuItem>
              <MenuItem value="Post-Install">Post-Install (Stage 7 Check)</MenuItem>
              <MenuItem value="Final Settlement">Final Settlement</MenuItem>
            </TextField>

            <TextField
              label="Amount (₹) *"
              type="number"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              fullWidth
              size="small"
              required
            />

            <TextField
              select
              label="Payment Mode *"
              value={paymentForm.payment_mode}
              onChange={(e) => setPaymentForm({ ...paymentForm, payment_mode: e.target.value })}
              fullWidth
              size="small"
            >
              <MenuItem value="Cash">Cash</MenuItem>
              <MenuItem value="Online">Online / UPI</MenuItem>
              <MenuItem value="NEFT">Bank Transfer (NEFT/RTGS)</MenuItem>
              <MenuItem value="Cheque">Cheque</MenuItem>
            </TextField>

            <TextField
              label="Reference / UTR / Cheque Number"
              value={paymentForm.reference_number}
              onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
              fullWidth
              size="small"
            />

            <TextField
              label="Bank Name (if applicable)"
              value={paymentForm.bank_name}
              onChange={(e) => setPaymentForm({ ...paymentForm, bank_name: e.target.value })}
              fullWidth
              size="small"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAddPaymentOpen(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleAddPaymentSubmit} disabled={paymentSubmitting}>
            {paymentSubmitting ? "Recording..." : "Save Payment"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Expense Modal (Stage 15 Project Costs) */}
      <Dialog open={addExpenseOpen} onClose={() => setAddExpenseOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: "#0B3A63" }}>
          Log Project Expense / Cost: {expenseTargetFile?.file_number}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Expense Category *"
              value={expenseForm.expense_category}
              onChange={(e) => setExpenseForm({ ...expenseForm, expense_category: e.target.value })}
              fullWidth
              size="small"
            >
              <MenuItem value="Civil Material Cost">Civil Material Cost</MenuItem>
              <MenuItem value="JVVNL Expense">JVVNL Expense</MenuItem>
              <MenuItem value="Other Expense">Other Expense</MenuItem>
              <MenuItem value="Sales Incentive">Sales Incentive</MenuItem>
            </TextField>

            <TextField
              label="Amount (₹) *"
              type="number"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
              fullWidth
              size="small"
              required
            />

            <TextField
              label="Description / Invoice Notes"
              value={expenseForm.description}
              onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
              fullWidth
              size="small"
              multiline
              rows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAddExpenseOpen(false)}>Cancel</Button>
          <Button variant="contained" color="secondary" onClick={handleAddExpenseSubmit} disabled={expenseSubmitting}>
            {expenseSubmitting ? "Logging..." : "Save Expense"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Comprehensive Ledger & Expense Reconciliation Modal */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: "#0B3A63" }}>
          Reconciliation Ledger: {detailData?.file?.file_number} - {detailData?.file?.customer_name}
        </DialogTitle>
        <DialogContent dividers>
          {detailLoading ? (
            <Box sx={{ textAlign: "center", py: 5 }}><CircularProgress /></Box>
          ) : detailData ? (
            <Box>
              {/* Customer & Deal Overview */}
              <Paper sx={{ p: 2, bgcolor: "#F8FAFC", borderRadius: 2, mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2">Customer: <b>{detailData.file.customer_name}</b></Typography>
                    <Typography variant="body2">Phone: <b>{detailData.file.phone_number}</b></Typography>
                    <Typography variant="body2">Capacity: <b>{detailData.file.kw_with_subsidy} kW</b></Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2">Total Deal Cost: <b>₹ {Number(detailData.file.total_project_cost).toLocaleString("en-IN")}</b></Typography>
                    <Typography variant="body2">AEN Office: <b>{detailData.file.aen_office}</b></Typography>
                    <Typography variant="body2">Current Stage: <b>Stage {detailData.file.current_stage}: {detailData.file.current_stage_name}</b></Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Financial Tally Metric Chips */}
              {(() => {
                const totalPaidCleared = (detailData.payments || [])
                  .filter((p) => p.is_verified === 1 || p.status === "Verified")
                  .reduce((sum, p) => sum + Number(p.amount || 0), 0);
                const totalExpensesCleared = (detailData.expenses || [])
                  .filter((e) => e.is_cleared === 1)
                  .reduce((sum, e) => sum + Number(e.amount || 0), 0);
                const netMargin = totalPaidCleared - totalExpensesCleared;

                return (
                  <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Card elevation={0} sx={{ bgcolor: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 2, p: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>Total Collected (Cleared)</Typography>
                        <Typography variant="h6" fontWeight={800} color="#059669">₹ {totalPaidCleared.toLocaleString("en-IN")}</Typography>
                      </Card>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Card elevation={0} sx={{ bgcolor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 2, p: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>Project Costs (Cleared)</Typography>
                        <Typography variant="h6" fontWeight={800} color="#DC2626">₹ {totalExpensesCleared.toLocaleString("en-IN")}</Typography>
                      </Card>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Card elevation={0} sx={{ bgcolor: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 2, p: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>Net Cash Inflow / Margin</Typography>
                        <Typography variant="h6" fontWeight={800} color={netMargin >= 0 ? "#2563EB" : "#DC2626"}>
                          ₹ {netMargin.toLocaleString("en-IN")}
                        </Typography>
                      </Card>
                    </Grid>
                  </Grid>
                );
              })()}

              {/* Table 1: Customer Payments & Clear/Unclear Toggle */}
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={800} color="#0B3A63">
                  1. Customer Payment Entries (Clear / Unclear)
                </Typography>
                <Button size="small" variant="outlined" onClick={() => handleOpenAddPayment(detailData.file)}>
                  + Add Payment
                </Button>
              </Stack>
              <TableContainer component={Paper} sx={{ borderRadius: 2, mb: 3 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "#F1F5F9" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Stage</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Amount (₹)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Mode</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Ref / Bank</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>Toggle</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detailData.payments?.length === 0 ? (
                      <TableRow><TableCell colSpan={6} align="center">No payment entries in ledger.</TableCell></TableRow>
                    ) : (
                      detailData.payments.map((p) => {
                        const isCleared = p.is_verified === 1 || p.status === "Verified";
                        return (
                          <TableRow key={p.id}>
                            <TableCell>{p.payment_stage}</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#16A34A" }}>
                              ₹ {Number(p.amount).toLocaleString("en-IN")}
                            </TableCell>
                            <TableCell>{p.payment_mode}</TableCell>
                            <TableCell>{p.reference_number || "-"} {p.bank_name ? `(${p.bank_name})` : ""}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={isCleared ? "Cleared" : "Unclear"}
                                color={isCleared ? "success" : "warning"}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Button
                                size="small"
                                variant={isCleared ? "outlined" : "contained"}
                                color={isCleared ? "warning" : "success"}
                                onClick={() => handleTogglePaymentClear(p.id)}
                              >
                                {isCleared ? "Mark Unclear" : "Mark Clear"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Table 2: Project Expenses & Clear/Unclear Toggle */}
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={800} color="#0B3A63">
                  2. Project Cost & Expense Items (Civil, JVVNL, Incentives, Other)
                </Typography>
                <Button
                  size="small"
                  variant="contained"
                  color="secondary"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenAddExpense(detailData.file)}
                >
                  + Log Project Cost
                </Button>
              </Stack>
              <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "#F1F5F9" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Cost Category</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Amount (₹)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Logged By</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>Toggle</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {!detailData.expenses || detailData.expenses.length === 0 ? (
                      <TableRow><TableCell colSpan={6} align="center">No project expenses logged yet.</TableCell></TableRow>
                    ) : (
                      detailData.expenses.map((exp) => (
                        <TableRow key={exp.id}>
                          <TableCell>
                            <Chip size="small" label={exp.expense_category} color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, color: "#DC2626" }}>
                            ₹ {Number(exp.amount).toLocaleString("en-IN")}
                          </TableCell>
                          <TableCell>{exp.description || "-"}</TableCell>
                          <TableCell>{exp.created_by_name || "Staff"}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={exp.is_cleared ? "Cleared" : "Unclear"}
                              color={exp.is_cleared ? "success" : "warning"}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              variant={exp.is_cleared ? "outlined" : "contained"}
                              color={exp.is_cleared ? "warning" : "success"}
                              onClick={() => handleToggleExpenseClear(exp.id)}
                            >
                              {exp.is_cleared ? "Mark Unclear" : "Mark Clear"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Table 3: Uploaded Customer & Mandatory Documents */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" fontWeight={800} color="#0B3A63" sx={{ mb: 1 }}>
                  3. Project & Mandatory Documents (Aadhaar, Electricity Bill, Cheque, PAN, Property, Photos)
                </Typography>
                <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "#F1F5F9" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Document Type</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Original Filename</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Uploaded On</TableCell>
                        <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {!detailData.documents || detailData.documents.length === 0 ? (
                        <TableRow><TableCell colSpan={4} align="center">No documents uploaded for this project file.</TableCell></TableRow>
                      ) : (
                        detailData.documents.map((doc, idx) => {
                          const docUrl = doc.file_url?.startsWith("http")
                            ? doc.file_url
                            : `${API_BASE_URL}${doc.file_url?.startsWith("/") ? "" : "/"}${doc.file_url}`;
                          return (
                            <TableRow key={doc.id || idx}>
                              <TableCell>
                                <Chip size="small" label={doc.doc_type} color="primary" variant="filled" sx={{ fontWeight: 700 }} />
                              </TableCell>
                              <TableCell>{doc.original_filename || "Document"}</TableCell>
                              <TableCell>{doc.created_at ? new Date(doc.created_at).toLocaleString() : "-"}</TableCell>
                              <TableCell align="right">
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="info"
                                  component="a"
                                  href={docUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  View / Download
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
