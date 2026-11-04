import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
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
  Collapse,
  IconButton,
} from "@mui/material";
import {
  PriceCheckRounded as RateIcon,
  CheckCircleOutlineRounded as ApproveIcon,
  PauseCircleOutlineRounded as HoldIcon,
  CancelOutlined as CancelIcon,
  KeyboardArrowDownRounded as DownIcon,
  KeyboardArrowUpRounded as UpIcon,
  RefreshRounded as RefreshIcon,
} from "@mui/icons-material";
import { getMyQueue, updateRateApproval } from "../../services/projectFileService";
import RemarkValidationModal from "./RemarkValidationModal";

export default function AdminRateApprovalGate() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [expanded, setExpanded] = useState(true);
  const [filterView, setFilterView] = useState("pending"); // "pending" | "all"

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
      setErrorMsg(err.response?.data?.message || err.message || "Failed to load rate approval queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pendingFiles = files.filter(
    (f) => !f.rate_approval_status || f.rate_approval_status === "Pending" || f.rate_approval_status === "On Hold"
  );

  const displayedFiles = filterView === "pending" ? pendingFiles : files;

  const handleActionClick = (file, action) => {
    setSelectedFile(file);
    setPendingAction(action);
    if (action === "Hold" || action === "Cancel") {
      setRemarkModalOpen(true);
    } else {
      executeRateApproval(file, action);
    }
  };

  const executeRateApproval = async (file, action, remarks = "") => {
    try {
      setActionLoading(true);
      await updateRateApproval(file.id, {
        action,
        remarks,
      });
      setRemarkModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Rate action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemarkSubmit = (remarksText) => {
    if (!selectedFile || !pendingAction) return;
    executeRateApproval(selectedFile, pendingAction, remarksText);
  };

  return (
    <Box sx={{ px: { xs: 2, md: 3.5 }, mb: 3 }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1.5px solid",
          borderColor: pendingFiles.length > 0 ? "#F59E0B" : "#E2E8F0",
          bgcolor: "#FFFFFF",
          overflow: "hidden",
        }}
      >
        {/* Card Header */}
        <Box
          sx={{
            p: 2,
            bgcolor: pendingFiles.length > 0 ? "#FFFBEB" : "#F8FAFC",
            borderBottom: expanded ? "1px solid #E2E8F0" : "none",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1.5,
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                p: 1,
                bgcolor: pendingFiles.length > 0 ? "#FEF3C7" : "#E2E8F0",
                color: pendingFiles.length > 0 ? "#D97706" : "#475569",
                borderRadius: 2,
                display: "flex",
              }}
            >
              <RateIcon />
            </Box>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle1" fontWeight={800} color="#0B3A63">
                  Super Admin Initial Rate Approval Gate (Pawan Ji)
                </Typography>
                <Chip
                  size="small"
                  label={
                    pendingFiles.length > 0
                      ? `${pendingFiles.length} Awaiting Approval`
                      : "All Rates Approved ✓"
                  }
                  color={pendingFiles.length > 0 ? "warning" : "success"}
                  sx={{ fontWeight: 700 }}
                />
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Verify salesperson booking price, subsidy breakup & documents before dispatching to pipeline
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              size="small"
              variant={filterView === "pending" ? "contained" : "outlined"}
              color="warning"
              onClick={() => setFilterView("pending")}
              sx={{ fontWeight: 700, fontSize: "0.75rem", height: 28 }}
            >
              Pending ({pendingFiles.length})
            </Button>
            <Button
              size="small"
              variant={filterView === "all" ? "contained" : "outlined"}
              onClick={() => setFilterView("all")}
              sx={{ fontWeight: 700, fontSize: "0.75rem", height: 28 }}
            >
              All Files ({files.length})
            </Button>
            <IconButton size="small" onClick={loadData} title="Refresh">
              <RefreshIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => setExpanded(!expanded)}>
              {expanded ? <UpIcon /> : <DownIcon />}
            </IconButton>
          </Stack>
        </Box>

        {/* Collapsible Content */}
        <Collapse in={expanded}>
          {errorMsg && <Alert severity="error" sx={{ m: 2, borderRadius: 2 }}>{errorMsg}</Alert>}

          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>File Number</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Property & Discom</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Solar Capacity</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Total Deal Amount</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Rate Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>Rate Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={26} />
                    </TableCell>
                  </TableRow>
                ) : displayedFiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary" fontWeight={600}>
                        {filterView === "pending"
                          ? "✓ No files pending initial rate approval. Great job!"
                          : "No files found."}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedFiles.map((file) => {
                    const status = file.rate_approval_status || "Pending";
                    const isApproved = status === "Approved";
                    const totalKw = (
                      Number(file.kw_with_subsidy || 0) + Number(file.kw_without_subsidy || 0)
                    ).toFixed(1);

                    return (
                      <TableRow key={file.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700} color="#0B3A63">
                            {file.file_number}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Stage {file.current_stage}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{file.customer_name}</Typography>
                          <Typography variant="caption" color="text.secondary">{file.phone_number}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            <b>{file.property_type || "House"}</b> • {file.connection_category || "DS"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {file.aen_office} • K-No: {file.k_number}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700} color="#2563EB">
                            {totalKw} kW Total
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Sub: {file.kw_with_subsidy} kW • Non-Sub: {file.kw_without_subsidy || 0} kW
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={800} color="#16A34A">
                            ₹ {Number(file.total_project_cost || 0).toLocaleString("en-IN")}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={status}
                            color={
                              status === "Approved"
                                ? "success"
                                : status === "On Hold"
                                ? "warning"
                                : status === "Rejected"
                                ? "error"
                                : "info"
                            }
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.8} justifyContent="flex-end">
                            {!isApproved ? (
                              <>
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  startIcon={<ApproveIcon sx={{ fontSize: "14px !important" }} />}
                                  onClick={() => handleActionClick(file, "Approve")}
                                  sx={{
                                    height: 28,
                                    px: 1.2,
                                    fontWeight: 700,
                                    fontSize: "0.72rem",
                                    borderRadius: "6px",
                                    textTransform: "none",
                                    backgroundColor: "#16A34A",
                                    "&:hover": { backgroundColor: "#15803D" },
                                  }}
                                >
                                  Approve Rate
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="warning"
                                  startIcon={<HoldIcon sx={{ fontSize: "14px !important" }} />}
                                  onClick={() => handleActionClick(file, "Hold")}
                                  sx={{
                                    height: 28,
                                    px: 1.2,
                                    fontWeight: 700,
                                    fontSize: "0.72rem",
                                    borderRadius: "6px",
                                    textTransform: "none",
                                    borderColor: "#D97706",
                                    color: "#D97706",
                                    "&:hover": { backgroundColor: "#FEF3C7" },
                                  }}
                                >
                                  Hold
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  startIcon={<CancelIcon sx={{ fontSize: "14px !important" }} />}
                                  onClick={() => handleActionClick(file, "Cancel")}
                                  sx={{
                                    height: 28,
                                    px: 1.2,
                                    fontWeight: 700,
                                    fontSize: "0.72rem",
                                    borderRadius: "6px",
                                    textTransform: "none",
                                    borderColor: "#DC2626",
                                    color: "#DC2626",
                                    "&:hover": { backgroundColor: "#FEE2E2" },
                                  }}
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <Typography variant="caption" sx={{ color: "#16A34A", fontWeight: 700, fontSize: "0.75rem" }}>
                                Rate Approved
                              </Typography>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Collapse>
      </Paper>

      {/* 10-Word Remark Enforcement Modal for Hold/Cancel */}
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
