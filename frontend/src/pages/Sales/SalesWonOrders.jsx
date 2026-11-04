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
  IconButton,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import {
  Search as SearchIcon,
  TimelineRounded as TimelineIcon,
  ReceiptLongRounded as ReceiptIcon,
  TrendingUpRounded as TrendingIcon,
  CheckCircleOutlineRounded as CompletedIcon,
  PauseCircleOutlineRounded as HoldIcon,
  HourglassEmptyRounded as PendingIcon,
} from "@mui/icons-material";
import { getSalesWonFiles } from "../../services/projectFileService";
import SalesLiveTrackerModal from "../../components/BackOffice/SalesLiveTrackerModal";
import ReceiptPrintModal from "../../components/BackOffice/ReceiptPrintModal";

export default function SalesWonOrders() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [trackerOpen, setTrackerOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState(null);

  const [receiptOpen, setReceiptOpen] = useState(false);
  const [selectedReceiptData, setSelectedReceiptData] = useState(null);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await getSalesWonFiles();
      setFiles(res.files || []);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.message || "Failed to load won orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const filteredFiles = files.filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.file_number?.toLowerCase().includes(q) ||
      f.customer_name?.toLowerCase().includes(q) ||
      f.phone_number?.includes(q) ||
      f.aen_office?.toLowerCase().includes(q)
    );
  });

  // Calculate Metrics
  const totalOrders = files.length;
  const inProgress = files.filter((f) => f.file_status === "Active").length;
  const onHold = files.filter((f) => f.file_status === "On Hold").length;
  const completed = files.filter((f) => f.file_status === "Completed").length;

  const handleOpenTracker = (leadId) => {
    setSelectedLeadId(leadId);
    setTrackerOpen(true);
  };

  const handleOpenReceipt = (file) => {
    setSelectedReceiptData({
      fileNumber: file.file_number,
      customerName: file.customer_name,
      phone: file.phone_number,
      aenOffice: file.aen_office,
      kNumber: file.k_number,
      kw: file.kw_with_subsidy,
      totalCost: file.total_project_cost,
      advanceAmount: file.total_paid || 0,
      paymentMode: "Verified Payment",
      referenceNumber: "N/A",
      salesRep: file.created_by_name || "Sales Team",
      date: new Date(file.created_at).toLocaleDateString("en-IN"),
    });
    setReceiptOpen(true);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 1400, mx: "auto" }}>
      {/* Title */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#0B3A63", display: "flex", alignItems: "center", gap: 1 }}>
            <ReceiptIcon sx={{ color: "#00B5EF" }} /> My Won Orders & Live Tracker
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time back-office execution tracker & customer receipts for closed sales
          </Typography>
        </Box>
        <Button variant="outlined" size="small" onClick={loadFiles}>
          Refresh
        </Button>
      </Stack>

      {errorMsg && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{errorMsg}</Alert>}

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 3, bgcolor: "#F8FAFC" }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>Total Orders</Typography>
                  <Typography variant="h5" fontWeight={800} color="#0B3A63">{totalOrders}</Typography>
                </Box>
                <TrendingIcon sx={{ color: "#00B5EF", fontSize: 28 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 3, bgcolor: "#EFF6FF" }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>In Progress</Typography>
                  <Typography variant="h5" fontWeight={800} color="#2563EB">{inProgress}</Typography>
                </Box>
                <PendingIcon sx={{ color: "#2563EB", fontSize: 28 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 3, bgcolor: "#FEF3C7" }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>On Hold (Check Reason)</Typography>
                  <Typography variant="h5" fontWeight={800} color="#D97706">{onHold}</Typography>
                </Box>
                <HoldIcon sx={{ color: "#D97706", fontSize: 28 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 3, bgcolor: "#DCFCE7" }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>Completed</Typography>
                  <Typography variant="h5" fontWeight={800} color="#16A34A">{completed}</Typography>
                </Box>
                <CompletedIcon sx={{ color: "#16A34A", fontSize: 28 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search Input */}
      <Box sx={{ mb: 2 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Search by customer name, phone, or file number (e.g. SSP-2026-0001)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ bgcolor: "#FFFFFF", borderRadius: 2 }}
        />
      </Box>

      {/* Orders Table */}
      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: "1px solid #E2E8F0" }}>
        <Table>
          <TableHead sx={{ bgcolor: "#F8FAFC" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>File Number</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Customer Info</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>System Specs</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Current Desk / Stage</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Payment Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>File Status</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={32} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Loading your won orders...</Typography>
                </TableCell>
              </TableRow>
            ) : filteredFiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                    No won orders found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredFiles.map((file) => (
                <TableRow key={file.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#0B3A63" }}>
                      {file.file_number}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(file.created_at).toLocaleDateString("en-IN")}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {file.customer_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {file.phone_number} | {file.aen_office}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {file.kw_with_subsidy} kW
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {file.panel_company} {file.is_loan ? "• [LOAN]" : "• [CASH]"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={`Stage ${file.current_stage}: ${file.current_stage_name || "Pending"}`}
                      sx={{ bgcolor: "#F1F5F9", fontWeight: 600, color: "#1E293B", mb: 0.5 }}
                    />
                    <Typography variant="caption" display="block" color="text.secondary">
                      At desk of: <b>{file.assigned_role || "Back Office"}</b>
                    </Typography>
                    {file.file_status === "On Hold" && file.latest_remarks && (
                      <Alert severity="warning" sx={{ py: 0, px: 1, mt: 0.5, fontSize: "0.75rem", borderRadius: 1 }}>
                        Hold reason: "{file.latest_remarks}"
                      </Alert>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700} color="#16A34A">
                      Paid: ₹ {Number(file.total_paid).toLocaleString("en-IN")}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Due: ₹ {Number(file.balance_due).toLocaleString("en-IN")} / ₹ {Number(file.total_project_cost).toLocaleString("en-IN")}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={file.file_status}
                      color={
                        file.file_status === "Active"
                          ? "primary"
                          : file.file_status === "On Hold"
                          ? "warning"
                          : file.file_status === "Completed"
                          ? "success"
                          : "error"
                      }
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        startIcon={<TimelineIcon />}
                        onClick={() => handleOpenTracker(file.lead_id)}
                      >
                        Tracker
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="secondary"
                        startIcon={<ReceiptIcon />}
                        onClick={() => handleOpenReceipt(file)}
                      >
                        Receipt
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Stepper Modal */}
      {trackerOpen && (
        <SalesLiveTrackerModal
          open={trackerOpen}
          onClose={() => setTrackerOpen(false)}
          leadId={selectedLeadId}
        />
      )}

      {/* Receipt Modal */}
      {receiptOpen && selectedReceiptData && (
        <ReceiptPrintModal
          open={receiptOpen}
          onClose={() => setReceiptOpen(false)}
          receiptData={selectedReceiptData}
        />
      )}
    </Box>
  );
}
