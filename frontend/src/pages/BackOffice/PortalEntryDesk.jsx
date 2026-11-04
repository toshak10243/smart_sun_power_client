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
  DevicesRounded as PortalIcon,
  CheckCircleOutlineRounded as SubmitIcon,
  PauseCircleOutlineRounded as HoldIcon,
  CancelOutlined as CancelIcon,
  CheckRounded as YesIcon,
  ScheduleRounded as TimerIcon,
  RefreshRounded as RefreshIcon,
  CardGiftcardRounded as SubsidyIcon,
} from "@mui/icons-material";
import {
  getMyQueue,
  performStageAction,
} from "../../services/projectFileService";
import RemarkValidationModal from "../../components/BackOffice/RemarkValidationModal";

export default function PortalEntryDesk() {
  const [activeTab, setActiveTab] = useState(0); // 0: Pending, 1: Completed/Submitted, 2: Hold, 3: Cancelled
  const [pendingSubFilter, setPendingSubFilter] = useState("all"); // "all" | "stage8" | "stage17"
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
      setErrorMsg(err.response?.data?.message || err.message || "Failed to load portal entry queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const portalStages = [8, 17];

  // 4 Standard Buckets
  const pendingFiles = files.filter(
    (f) => portalStages.includes(f.current_stage) && f.file_status !== "On Hold" && f.file_status !== "Cancelled"
  );

  const stage8Files = pendingFiles.filter((f) => f.current_stage === 8);
  const stage17Files = pendingFiles.filter((f) => f.current_stage === 17);

  const displayedPendingFiles =
    pendingSubFilter === "stage8"
      ? stage8Files
      : pendingSubFilter === "stage17"
      ? stage17Files
      : pendingFiles;

  const submittedFiles = files.filter(
    (f) => (!portalStages.includes(f.current_stage) || f.file_status === "Completed") && f.file_status !== "Cancelled" && (f.my_actions_count > 0 || f.current_stage > 8)
  );

  const holdFiles = files.filter(
    (f) => f.file_status === "On Hold" && portalStages.includes(f.current_stage)
  );

  const cancelledFiles = files.filter(
    (f) => f.file_status === "Cancelled" && portalStages.includes(f.current_stage)
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
            <PortalIcon sx={{ color: "#7C3AED" }} /> National Solar Portal Entry Desk
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Stage 8 National Solar Portal Registration & Stage 17 Direct DBT Subsidy Claim Release
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
              <Typography variant="caption" color="text.secondary" fontWeight={600}>Pending Portal Tasks</Typography>
              <Typography variant="h5" fontWeight={800} color="#2563EB">{pendingFiles.length} Files</Typography>
              <Typography variant="caption" color="text.secondary">Stage 8 & Stage 17 queue</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 3, bgcolor: "#ECFDF5" }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>Portal Entries Completed</Typography>
              <Typography variant="h5" fontWeight={800} color="#059669">{submittedFiles.length} Files</Typography>
              <Typography variant="caption" color="text.secondary">Online entries logged</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 3, bgcolor: "#FEF3C7" }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>On Hold Files</Typography>
              <Typography variant="h5" fontWeight={800} color="#D97706">{holdFiles.length} Held</Typography>
              <Typography variant="caption" color="text.secondary">National portal errors/queries</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 3, bgcolor: "#FEE2E2" }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>Cancelled Applications</Typography>
              <Typography variant="h5" fontWeight={800} color="#DC2626">{cancelledFiles.length} Cancelled</Typography>
              <Typography variant="caption" color="text.secondary">Subsidy ineligible</Typography>
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
        <Box>
          {/* Sub-filter Chips */}
          <Stack direction="row" spacing={1} sx={{ mb: 2 }} alignItems="center">
            <Typography variant="caption" fontWeight={700} color="text.secondary">Filter:</Typography>
            <Chip
              label={`All Pending (${pendingFiles.length})`}
              color={pendingSubFilter === "all" ? "primary" : "default"}
              size="small"
              onClick={() => setPendingSubFilter("all")}
              sx={{ fontWeight: 600, cursor: "pointer" }}
            />
            <Chip
              label={`Stage 8: Online Portal Details (${stage8Files.length})`}
              color={pendingSubFilter === "stage8" ? "primary" : "default"}
              size="small"
              onClick={() => setPendingSubFilter("stage8")}
              sx={{ fontWeight: 600, cursor: "pointer" }}
            />
            <Chip
              label={`Stage 17: Subsidy Redeemed (${stage17Files.length})`}
              color={pendingSubFilter === "stage17" ? "secondary" : "default"}
              size="small"
              onClick={() => setPendingSubFilter("stage17")}
              sx={{ fontWeight: 600, cursor: "pointer" }}
            />
          </Stack>

          <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: "1px solid #E2E8F0" }}>
            <Table>
              <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>File Number</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>K-Number / AEN</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Solar Capacity</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Stage</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>SLA Countdown</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell></TableRow>
                ) : displayedPendingFiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                        No pending portal tasks found in this view.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedPendingFiles.map((file) => (
                    <TableRow key={file.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} color="#0B3A63">{file.file_number}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{file.customer_name}</Typography>
                        <Typography variant="caption" color="text.secondary">{file.phone_number}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">K-No: {file.k_number}</Typography>
                        <Typography variant="caption" color="text.secondary">{file.aen_office}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {file.kw_with_subsidy} kW
                        </Typography>
                        <Typography variant="caption" color="text.secondary">{file.panel_company}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={file.current_stage === 8 ? "Stage 8: Online Portal Details" : "Stage 17: Subsidy Redeemed"}
                          color={file.current_stage === 8 ? "primary" : "secondary"}
                          sx={{ fontWeight: 700 }}
                        />
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
                        {file.current_stage === 8 ? (
                          /* Stage 8: Submit / Hold / Cancel */
                          <Stack direction="row" spacing={0.8} justifyContent="flex-end" flexWrap="nowrap">
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              startIcon={<SubmitIcon sx={{ fontSize: "14px !important" }} />}
                              onClick={() => handleActionClick(file, "Submit")}
                              sx={{ height: 28, px: 1.2, fontSize: "0.72rem", fontWeight: 700, borderRadius: "6px", textTransform: "none", whiteSpace: "nowrap" }}
                            >
                              Portal Upload Done
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
                        ) : (
                          /* Stage 17: Subsidy Redeemed (Exact client options: Yes, No, Pending) */
                          <Stack direction="row" spacing={0.8} justifyContent="flex-end" flexWrap="nowrap">
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={<SubsidyIcon sx={{ fontSize: "14px !important" }} />}
                              onClick={() => handleActionClick(file, "Yes")}
                              sx={{ height: 28, px: 1.2, fontSize: "0.72rem", fontWeight: 700, borderRadius: "6px", textTransform: "none", whiteSpace: "nowrap" }}
                            >
                              Yes
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => handleActionClick(file, "No")}
                              sx={{ height: 28, px: 1.2, fontSize: "0.72rem", fontWeight: 700, borderRadius: "6px", textTransform: "none", whiteSpace: "nowrap" }}
                            >
                              No
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="warning"
                              onClick={() => handleActionClick(file, "Pending")}
                              sx={{ height: 28, px: 1.2, fontSize: "0.72rem", fontWeight: 700, borderRadius: "6px", textTransform: "none", whiteSpace: "nowrap" }}
                            >
                              Pending
                            </Button>
                          </Stack>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
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
                      No portal entries in history yet.
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
                      <Typography variant="body2">{file.kw_with_subsidy} kW</Typography>
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
                      No portal files currently on hold.
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
                        "{file.latest_remarks || "Held on national portal"}"
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
                        Resume & Submit
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
                      No cancelled portal files recorded.
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
                        "{file.latest_remarks || "Subsidy rejected"}"
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
