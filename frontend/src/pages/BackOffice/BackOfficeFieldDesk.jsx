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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import {
  AgricultureRounded as FieldIcon,
  CloudUploadRounded as UploadIcon,
  CheckCircleOutlineRounded as SubmitIcon,
  PauseCircleOutlineRounded as HoldIcon,
  CancelOutlined as CancelIcon,
  CheckRounded as YesIcon,
  ScheduleRounded as TimerIcon,
  RefreshRounded as RefreshIcon,
  WifiRounded as WifiIcon,
} from "@mui/icons-material";
import {
  getMyQueue,
  performStageAction,
  uploadProjectDocument,
} from "../../services/projectFileService";
import RemarkValidationModal from "../../components/BackOffice/RemarkValidationModal";

export default function BackOfficeFieldDesk() {
  const [activeTab, setActiveTab] = useState(0); // 0: Pending, 1: Completed/Submitted, 2: Hold, 3: Cancelled
  const [pendingSubFilter, setPendingSubFilter] = useState("all"); // "all" | "aen" | "commissioning"
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Photo Upload for Stage 4
  const [stage4Photo, setStage4Photo] = useState(null);

  // WiFi Modal for Stage 13 "No" reason
  const [wifiModalOpen, setWifiModalOpen] = useState(false);
  const [wifiTargetFile, setWifiTargetFile] = useState(null);
  const [wifiReason, setWifiReason] = useState("");

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
      setErrorMsg(err.response?.data?.message || err.message || "Failed to load field desk queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const fieldStages = [3, 4, 9, 11, 12, 13, 14];
  const isFieldFile = (f) =>
    fieldStages.includes(f.current_stage) ||
    (f.current_stage === 0 && f.sub_pipeline_step === "Step B");

  // 4 Standard Buckets
  const pendingFiles = files.filter(
    (f) => isFieldFile(f) && f.file_status !== "On Hold" && f.file_status !== "Cancelled"
  );

  const aenFiles = pendingFiles.filter((f) => [3, 4, 9].includes(f.current_stage));
  const commissioningFiles = pendingFiles.filter((f) => [11, 12, 13, 14].includes(f.current_stage));
  const subOfflineFiles = pendingFiles.filter(
    (f) => f.current_stage === 0 && f.sub_pipeline_step === "Step B"
  );

  const displayedPendingFiles =
    pendingSubFilter === "aen"
      ? aenFiles
      : pendingSubFilter === "commissioning"
      ? commissioningFiles
      : pendingSubFilter === "suboffline"
      ? subOfflineFiles
      : pendingFiles;

  const submittedFiles = files.filter(
    (f) =>
      !isFieldFile(f) &&
      f.file_status !== "Cancelled" &&
      (f.my_actions_count > 0 || f.current_stage > 3)
  );

  const holdFiles = files.filter(
    (f) => f.file_status === "On Hold" && isFieldFile(f)
  );

  const cancelledFiles = files.filter(
    (f) => f.file_status === "Cancelled" && isFieldFile(f)
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

  const executeAction = async (file, action, remarks = "", wifiReasonText = "") => {
    try {
      setActionLoading(true);
      const payload = {
        stage_number: file.current_stage,
        action,
        remarks,
      };

      if (wifiReasonText) {
        payload.wifi_not_connected_reason = wifiReasonText;
      }

      // Stage 4 mandatory photo upload
      if (file.current_stage === 4 && action === "Submit") {
        if (!stage4Photo) {
          alert("Signed receiving photo is strictly mandatory for Stage 4!");
          setActionLoading(false);
          return;
        }
        const formData = new FormData();
        formData.append("file", stage4Photo);
        formData.append("doc_type", "Meter Application Photo");
        const uploadRes = await uploadProjectDocument(file.id, formData);
        payload.proof_url = uploadRes.file_url;
      }

      await performStageAction(file.id, payload);
      setRemarkModalOpen(false);
      setStage4Photo(null);
      setWifiModalOpen(false);
      setWifiReason("");
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

  const handleWiFiNoClick = (file) => {
    setWifiTargetFile(file);
    setWifiReason("");
    setWifiModalOpen(true);
  };

  const handleWiFiNoSubmit = () => {
    if (!wifiReason.trim() || wifiReason.trim().split(/\s+/).length < 5) {
      alert("Please provide at least 5 words explaining why WiFi could not be connected.");
      return;
    }
    executeAction(wifiTargetFile, "No", "WiFi connection omitted with reason", wifiReason);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 1400, mx: "auto" }}>
      {/* Title */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#0B3A63", display: "flex", alignItems: "center", gap: 1 }}>
            <FieldIcon sx={{ color: "#16A34A" }} /> Back Office Field Desk
          </Typography>
          <Typography variant="body2" color="text.secondary">
            AEN Physical Submissions • Meter Application Photo Proof • Commissioning & Handover
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
              <Typography variant="caption" color="text.secondary" fontWeight={600}>Pending Field Tasks</Typography>
              <Typography variant="h5" fontWeight={800} color="#2563EB">{pendingFiles.length} Files</Typography>
              <Typography variant="caption" color="text.secondary">AEN submissions & commissioning</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 3, bgcolor: "#ECFDF5" }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>Cleared / Forwarded</Typography>
              <Typography variant="h5" fontWeight={800} color="#059669">{submittedFiles.length} Files</Typography>
              <Typography variant="caption" color="text.secondary">Forwarded to next stages</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 3, bgcolor: "#FEF3C7" }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>On Hold Files</Typography>
              <Typography variant="h5" fontWeight={800} color="#D97706">{holdFiles.length} Held</Typography>
              <Typography variant="caption" color="text.secondary">Discom AEN or site hold</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 3, bgcolor: "#FEE2E2" }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>Cancelled Files</Typography>
              <Typography variant="h5" fontWeight={800} color="#DC2626">{cancelledFiles.length} Cancelled</Typography>
              <Typography variant="caption" color="text.secondary">Cancelled field applications</Typography>
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
              label={`AEN Submissions [St. 3, 4, 9] (${aenFiles.length})`}
              color={pendingSubFilter === "aen" ? "primary" : "default"}
              size="small"
              onClick={() => setPendingSubFilter("aen")}
              sx={{ fontWeight: 600, cursor: "pointer" }}
            />
            <Chip
              label={`Commissioning & Handover [St. 11, 12, 13, 14] (${commissioningFiles.length})`}
              color={pendingSubFilter === "commissioning" ? "success" : "default"}
              size="small"
              onClick={() => setPendingSubFilter("commissioning")}
              sx={{ fontWeight: 600, cursor: "pointer" }}
            />
            <Chip
              label={`Step B: Sub-Offline AEN (${subOfflineFiles.length})`}
              color={pendingSubFilter === "suboffline" ? "warning" : "default"}
              size="small"
              onClick={() => setPendingSubFilter("suboffline")}
              sx={{ fontWeight: 600, cursor: "pointer" }}
            />
          </Stack>

          <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: "1px solid #E2E8F0" }}>
            <Table>
              <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>File Number</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Discom Office</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Current Stage</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>SLA Countdown</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell></TableRow>
                ) : displayedPendingFiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                        No pending field tasks found in this view.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedPendingFiles.map((file) => (
                    <TableRow key={file.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} color="#0B3A63">{file.file_number}</Typography>
                        <Typography variant="caption" color="text.secondary">K-No: {file.k_number}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{file.customer_name}</Typography>
                        <Typography variant="caption" color="text.secondary">{file.phone_number}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{file.aen_office}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={
                            file.current_stage === 0
                              ? `Step B: Sub-Offline (${file.modification_type || "Mod"})`
                              : `Stage ${file.current_stage}: ${file.stage_name}`
                          }
                          color={
                            file.current_stage === 0
                              ? "warning"
                              : file.current_stage === 4
                              ? "secondary"
                              : [11, 12, 13, 14].includes(file.current_stage)
                              ? "success"
                              : "primary"
                          }
                          sx={{ fontWeight: 600 }}
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
                        {/* Stage 4: Mandatory Photo Upload + Submit */}
                        {file.current_stage === 4 ? (
                          <Stack direction="row" spacing={0.8} justifyContent="flex-end" alignItems="center" flexWrap="nowrap">
                            <Button
                              variant={stage4Photo ? "contained" : "outlined"}
                              component="label"
                              size="small"
                              color={stage4Photo ? "success" : "primary"}
                              startIcon={<UploadIcon sx={{ fontSize: "14px !important" }} />}
                              sx={{ height: 28, px: 1.2, fontSize: "0.72rem", fontWeight: 700, borderRadius: "6px", textTransform: "none", whiteSpace: "nowrap" }}
                            >
                              {stage4Photo ? "Photo Ready" : "Upload Receiving Photo *"}
                              <input type="file" hidden accept="image/*" onChange={(e) => setStage4Photo(e.target.files[0])} />
                            </Button>
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              disabled={!stage4Photo}
                              onClick={() => executeAction(file, "Submit")}
                              sx={{ height: 28, px: 1.2, fontSize: "0.72rem", fontWeight: 700, borderRadius: "6px", textTransform: "none", whiteSpace: "nowrap" }}
                            >
                              Submit
                            </Button>
                            <Button
                              variant="outlined"
                              color="warning"
                              size="small"
                              onClick={() => handleActionClick(file, "Hold")}
                              sx={{ height: 28, px: 1.2, fontSize: "0.72rem", fontWeight: 700, borderRadius: "6px", textTransform: "none", whiteSpace: "nowrap" }}
                            >
                              Hold
                            </Button>
                          </Stack>
                        ) : file.current_stage === 12 || file.current_stage === 14 ? (
                          /* Stage 12 (Plant Start) & Stage 14 (Explanation): ONLY Yes or Hold. No "No" button! */
                          <Stack direction="row" spacing={0.8} justifyContent="flex-end" flexWrap="nowrap">
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={<YesIcon sx={{ fontSize: "14px !important" }} />}
                              onClick={() => handleActionClick(file, "Yes")}
                              sx={{ height: 28, px: 1.2, fontSize: "0.72rem", fontWeight: 700, borderRadius: "6px", textTransform: "none", whiteSpace: "nowrap" }}
                            >
                              {file.current_stage === 12 ? "Plant Started (Yes)" : "Explanation Done (Yes)"}
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
                        ) : file.current_stage === 13 ? (
                          /* Stage 13 (WiFi): Yes, No (with mandatory popup), Hold */
                          <Stack direction="row" spacing={0.8} justifyContent="flex-end" flexWrap="nowrap">
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={<WifiIcon sx={{ fontSize: "14px !important" }} />}
                              onClick={() => handleActionClick(file, "Yes")}
                              sx={{ height: 28, px: 1.2, fontSize: "0.72rem", fontWeight: 700, borderRadius: "6px", textTransform: "none", whiteSpace: "nowrap" }}
                            >
                              WiFi Synced (Yes)
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => handleWiFiNoClick(file)}
                              sx={{ height: 28, px: 1.2, fontSize: "0.72rem", fontWeight: 700, borderRadius: "6px", textTransform: "none", whiteSpace: "nowrap" }}
                            >
                              No (With Reason)
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
                        ) : file.current_stage === 11 ? (
                          /* Stage 11 (Meter Installed): Yes / No / Hold */
                          <Stack direction="row" spacing={0.8} justifyContent="flex-end" flexWrap="nowrap">
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={<YesIcon sx={{ fontSize: "14px !important" }} />}
                              onClick={() => handleActionClick(file, "Yes")}
                              sx={{ height: 28, px: 1.2, fontSize: "0.72rem", fontWeight: 700, borderRadius: "6px", textTransform: "none", whiteSpace: "nowrap" }}
                            >
                              Meter Installed (Yes)
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
                              startIcon={<HoldIcon sx={{ fontSize: "14px !important" }} />}
                              onClick={() => handleActionClick(file, "Hold")}
                              sx={{ height: 28, px: 1.2, fontSize: "0.72rem", fontWeight: 700, borderRadius: "6px", textTransform: "none", whiteSpace: "nowrap" }}
                            >
                              Hold
                            </Button>
                          </Stack>
                        ) : file.current_stage === 0 ? (
                          /* Step B (Suresh - Sub-Offline File at AEN): Submit / Hold / Cancel */
                          <Stack direction="row" spacing={0.8} justifyContent="flex-end" flexWrap="nowrap">
                            <Button
                              size="small"
                              variant="contained"
                              color="warning"
                              startIcon={<SubmitIcon sx={{ fontSize: "14px !important" }} />}
                              onClick={() => handleActionClick(file, "Submit")}
                              sx={{ height: 28, px: 1.2, fontSize: "0.72rem", fontWeight: 700, borderRadius: "6px", textTransform: "none", whiteSpace: "nowrap" }}
                            >
                              Submit Sub-Offline
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
                          /* Standard Stages (Stage 3 & 9): Submit / Hold / Cancel */
                          <Stack direction="row" spacing={0.8} justifyContent="flex-end" flexWrap="nowrap">
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              startIcon={<SubmitIcon sx={{ fontSize: "14px !important" }} />}
                              onClick={() => handleActionClick(file, "Submit")}
                              sx={{ height: 28, px: 1.2, fontSize: "0.72rem", fontWeight: 700, borderRadius: "6px", textTransform: "none", whiteSpace: "nowrap" }}
                            >
                              Submit
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
                <TableCell sx={{ fontWeight: 700 }}>AEN Office</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Current Pipeline Stage</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {submittedFiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                      No forwarded field files in history yet.
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
                      <Typography variant="body2">{file.aen_office}</Typography>
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
                <TableCell sx={{ fontWeight: 700 }}>Stage</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Hold Reason</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {holdFiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                      No field files currently on hold.
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
                      <Chip size="small" label={`Stage ${file.current_stage}`} color="warning" />
                    </TableCell>
                    <TableCell>
                      <Alert severity="warning" sx={{ py: 0.5, borderRadius: 1.5 }}>
                        "{file.latest_remarks || "Held at Field Desk"}"
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
                      No cancelled field files recorded.
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
                        "{file.latest_remarks || "Application cancelled"}"
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

      {/* Stage 13: WiFi "No" Reason Modal */}
      <Dialog open={wifiModalOpen} onClose={() => setWifiModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: "#0B3A63" }}>
          Mandatory Reason: WiFi Not Connected
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Client compliance requires a recorded technical reason if inverter WiFi cannot be synced on site.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="e.g., Consumer router password unavailable / Weak router range / Inverter offline"
            value={wifiReason}
            onChange={(e) => setWifiReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setWifiModalOpen(false)}>Back</Button>
          <Button variant="contained" color="error" onClick={handleWiFiNoSubmit}>
            Record & Proceed
          </Button>
        </DialogActions>
      </Dialog>

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
