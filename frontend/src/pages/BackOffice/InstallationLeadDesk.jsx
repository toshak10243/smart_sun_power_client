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
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import {
  BuildRounded as InstallIcon,
  CheckCircleOutlineRounded as SubmitIcon,
  PauseCircleOutlineRounded as HoldIcon,
  CancelOutlined as CancelIcon,
  ScheduleRounded as TimerIcon,
  RefreshRounded as RefreshIcon,
  PlayArrowRounded as StartIcon,
} from "@mui/icons-material";
import {
  getMyQueue,
  performStageAction,
} from "../../services/projectFileService";
import RemarkValidationModal from "../../components/BackOffice/RemarkValidationModal";

export default function InstallationLeadDesk() {
  const [activeTab, setActiveTab] = useState(0); // 0: Pending, 1: Completed/Submitted, 2: Hold, 3: Cancelled
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Remark Modal
  const [remarkModalOpen, setRemarkModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [pendingAction, setPendingAction] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await getMyQueue();
      setFiles(res.files || []);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.message || "Failed to load installation queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 4 Standard Buckets for Stage 6 (Installation Work)
  const pendingFiles = files.filter(
    (f) => f.current_stage === 6 && f.file_status !== "On Hold" && f.file_status !== "Cancelled"
  );

  const submittedFiles = files.filter(
    (f) => f.current_stage > 6 && f.file_status !== "Cancelled" && (f.my_actions_count > 0 || f.current_stage > 6)
  );

  const holdFiles = files.filter(
    (f) => f.file_status === "On Hold" && f.current_stage === 6
  );

  const cancelledFiles = files.filter(
    (f) => f.file_status === "Cancelled" && f.current_stage === 6
  );

  const handleActionClick = (file, action) => {
    setSelectedFile(file);
    setPendingAction(action);
    if (action === "Hold" || action === "Cancel") {
      setRemarkModalOpen(true);
    } else {
      executeAction(file, action);
    }
  };

  const executeAction = async (file, action, remarks = "") => {
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
    executeAction(selectedFile, pendingAction, remarksText);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 1400, mx: "auto" }}>
      {/* Title */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#0B3A63", display: "flex", alignItems: "center", gap: 1 }}>
            <InstallIcon sx={{ color: "#F59E0B" }} /> Installation Lead Desk
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Stage 6 Site Structure, Panels, Inverter Installation & Physical Handover (72h SLA)
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon sx={{ fontSize: "16px !important" }} />}
          onClick={loadData}
          sx={{ height: 32, px: 1.5, fontSize: "0.78rem", fontWeight: 600, borderRadius: "8px", textTransform: "none", whiteSpace: "nowrap" }}
        >
          Refresh Queue
        </Button>
      </Stack>

      {errorMsg && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{errorMsg}</Alert>}

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 3, bgcolor: "#EFF6FF" }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>Pending Installation Work</Typography>
              <Typography variant="h5" fontWeight={800} color="#2563EB">{pendingFiles.length} Sites</Typography>
              <Typography variant="caption" color="text.secondary">Ready for onsite mounting</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 3, bgcolor: "#ECFDF5" }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>Installation Completed</Typography>
              <Typography variant="h5" fontWeight={800} color="#059669">{submittedFiles.length} Sites</Typography>
              <Typography variant="caption" color="text.secondary">Forwarded to Accounts Stage 7</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 3, bgcolor: "#FEF3C7" }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>On Hold Sites</Typography>
              <Typography variant="h5" fontWeight={800} color="#D97706">{holdFiles.length} Held</Typography>
              <Typography variant="caption" color="text.secondary">Customer / structure hold</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 3, bgcolor: "#FEE2E2" }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>Cancelled Sites</Typography>
              <Typography variant="h5" fontWeight={800} color="#DC2626">{cancelledFiles.length} Cancelled</Typography>
              <Typography variant="caption" color="text.secondary">Client refused on-site</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 4 Standard Tabs */}
      <Paper elevation={0} sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} textColor="primary" indicatorColor="primary">
          <Tab label={`Pending Files (${pendingFiles.length})`} />
          <Tab label={`Completed / Submitted (${submittedFiles.length})`} />
          <Tab label={`Hold Files (${holdFiles.length})`} />
          <Tab label={`Cancelled Files (${cancelledFiles.length})`} />
        </Tabs>
      </Paper>

      {/* Tab 0: Pending Files */}
      {activeTab === 0 && (
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: "1px solid #E2E8F0" }}>
          <Table>
            <TableHead sx={{ bgcolor: "#F8FAFC" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>File Number</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Solar & Panel Specs</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Inverter Specs</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Structure Height</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>SLA (48h)</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell></TableRow>
              ) : pendingFiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                      No installation orders pending at this moment.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                pendingFiles.map((file) => (
                  <TableRow key={file.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} color="#0B3A63">{file.file_number}</Typography>
                      <Typography variant="caption" color="text.secondary">AEN: {file.aen_office}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{file.customer_name}</Typography>
                      <Typography variant="caption" color="text.secondary">{file.phone_number}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        <b>{file.kw_with_subsidy} kW</b> • {file.panel_company}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Wattage: {file.panel_wattage}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{file.inverter_company}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {file.inverter_capacity_kw || file.kw_with_subsidy} kW • {file.inverter_phase}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">F: {file.structure_height_front}ft | B: {file.structure_height_back}ft</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        icon={<TimerIcon sx={{ fontSize: 16 }} />}
                        label={`${file.hours_remaining}h left`}
                        sx={{
                          fontWeight: 700,
                          bgcolor: file.sla_color === "red" ? "#FEE2E2" : file.sla_color === "orange" ? "#FEF3C7" : "#DCFCE7",
                          color: file.sla_color === "red" ? "#DC2626" : file.sla_color === "orange" ? "#D97706" : "#16A34A",
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {/* Buttons: In Process, Completed, Hold, Cancel */}
                      <Stack direction="row" spacing={0.8} justifyContent="flex-end" flexWrap="nowrap">
                        <Button
                          size="small"
                          variant={file.stage_status === "In Process" ? "outlined" : "contained"}
                          color="info"
                          startIcon={<StartIcon sx={{ fontSize: "14px !important" }} />}
                          disabled={file.stage_status === "In Process"}
                          onClick={() => handleActionClick(file, "In Process")}
                          sx={{ height: 28, px: 1.2, fontSize: "0.72rem", fontWeight: 700, borderRadius: "6px", textTransform: "none", whiteSpace: "nowrap" }}
                        >
                          {file.stage_status === "In Process" ? "In Process ✓" : "In Process"}
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<SubmitIcon sx={{ fontSize: "14px !important" }} />}
                          onClick={() => handleActionClick(file, "Submit")}
                          sx={{ height: 28, px: 1.2, fontSize: "0.72rem", fontWeight: 700, borderRadius: "6px", textTransform: "none", whiteSpace: "nowrap" }}
                        >
                          Completed
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
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<CancelIcon sx={{ fontSize: "14px !important" }} />}
                          onClick={() => handleActionClick(file, "Cancel")}
                          sx={{ height: 28, px: 1.2, fontSize: "0.72rem", fontWeight: 700, borderRadius: "6px", textTransform: "none", whiteSpace: "nowrap" }}
                        >
                          Cancel
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

      {/* Tab 1: Completed / Submitted */}
      {activeTab === 1 && (
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: "1px solid #E2E8F0" }}>
          <Table>
            <TableHead sx={{ bgcolor: "#F8FAFC" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>File Number</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Solar kW</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Current Pipeline Stage</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {submittedFiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                      No installation history yet.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                submittedFiles.map((file) => (
                  <TableRow key={file.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} color="#0B3A63">{file.file_number}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{file.customer_name}</Typography>
                      <Typography variant="caption" color="text.secondary">{file.phone_number}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{file.kw_with_subsidy} kW ({file.panel_company})</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={`Stage ${file.current_stage}: ${file.stage_name}`}
                        color="info"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={file.file_status || "Active"}
                        color={file.file_status === "Completed" ? "success" : "primary"}
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Tab 2: Hold Files */}
      {activeTab === 2 && (
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: "1px solid #E2E8F0" }}>
          <Table>
            <TableHead sx={{ bgcolor: "#F8FAFC" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>File Number</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Hold Reason</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {holdFiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                    <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                      No installation sites currently on hold.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                holdFiles.map((file) => (
                  <TableRow key={file.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} color="#0B3A63">{file.file_number}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{file.customer_name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Alert severity="warning" sx={{ py: 0.5, borderRadius: 1.5 }}>
                        "{file.latest_remarks || "Site installation held"}"
                      </Alert>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        onClick={() => handleActionClick(file, "Submit")}
                        sx={{ height: 28, px: 1.5, fontSize: "0.72rem", fontWeight: 700, borderRadius: "6px", textTransform: "none", whiteSpace: "nowrap" }}
                      >
                        Resume Work & Mark Done
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Tab 3: Cancelled Files */}
      {activeTab === 3 && (
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: "1px solid #E2E8F0" }}>
          <Table>
            <TableHead sx={{ bgcolor: "#F8FAFC" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>File Number</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Cancellation Reason</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cancelledFiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                    <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                      No cancelled installation files.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                cancelledFiles.map((file) => (
                  <TableRow key={file.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} color="#DC2626">{file.file_number}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{file.customer_name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Alert severity="error" sx={{ py: 0.5, borderRadius: 1.5 }}>
                        "{file.latest_remarks || "Customer cancelled on-site"}"
                      </Alert>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label="Cancelled" color="error" sx={{ fontWeight: 700 }} />
                    </TableCell>
                  </TableRow>
                ))
              )}
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
    </Box>
  );
}
