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
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import {
  Search as SearchIcon,
  TimelineRounded as TimelineIcon,
  WarningAmberRounded as EscalationIcon,
  ScheduleRounded as TimerIcon,
  ReceiptLongRounded as WonIcon,
} from "@mui/icons-material";
import { getSalesWonFiles } from "../../services/projectFileService";
import SalesLiveTrackerModal from "../../components/BackOffice/SalesLiveTrackerModal";

export default function ManagerWonTracker() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Tracker Modal
  const [trackerOpen, setTrackerOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await getSalesWonFiles();
      setFiles(res.files || []);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.message || "Failed to load team files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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

  // Hold Escalations (Priority files needing manager attention)
  const holdEscalations = files.filter((f) => f.file_status === "On Hold");

  const handleOpenTracker = (leadId) => {
    setSelectedLeadId(leadId);
    setTrackerOpen(true);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 1400, mx: "auto" }}>
      {/* Title */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#0B3A63", display: "flex", alignItems: "center", gap: 1 }}>
            <WonIcon sx={{ color: "#00B5EF" }} /> Team Won Files & Back-Office Pipeline Tracker
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sales Manager supervision • Real-time stage monitoring • Hold escalation alerts
          </Typography>
        </Box>
        <Button variant="outlined" size="small" onClick={loadData}>
          Refresh
        </Button>
      </Stack>

      {errorMsg && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{errorMsg}</Alert>}

      {/* ⚠️ HOLD ESCALATION BANNER / CARDS */}
      {holdEscalations.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" fontWeight={800} color="#DC2626" sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <EscalationIcon /> Action Required: Team Files on Back-Office Hold ({holdEscalations.length})
          </Typography>
          <Grid container spacing={2}>
            {holdEscalations.map((file) => (
              <Grid item xs={12} sm={6} md={4} key={file.id}>
                <Card elevation={0} sx={{ border: "2px solid #FCA5A5", borderRadius: 3, bgcolor: "#FFF5F5" }}>
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="subtitle2" fontWeight={800} color="#991B1B">
                        {file.file_number}
                      </Typography>
                      <Chip size="small" label={`Stage ${file.current_stage}`} color="error" />
                    </Stack>
                    <Typography variant="body2" fontWeight={700}>
                      {file.customer_name} ({file.phone_number})
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                      Currently with: <b>{file.assigned_role || "Back Office"}</b>
                    </Typography>
                    <Alert severity="error" sx={{ py: 0.5, px: 1, fontSize: "0.78rem", borderRadius: 1.5, mb: 1.5 }}>
                      <b>Hold Reason:</b> "{file.latest_remarks || "Awaiting clarification"}"
                    </Alert>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      fullWidth
                      startIcon={<TimelineIcon />}
                      onClick={() => handleOpenTracker(file.lead_id)}
                    >
                      View Live Stepper
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Search Input */}
      <Box sx={{ mb: 2 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Search team won files by customer, phone, or file number..."
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

      {/* Team Files Master Table */}
      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: "1px solid #E2E8F0" }}>
        <Table>
          <TableHead sx={{ bgcolor: "#F8FAFC" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>File Number</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>System Size</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Current Desk / Stage</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Financial Balance</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>Live Stepper</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
            ) : filteredFiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                    No team files found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredFiles.map((file) => (
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
                    <Typography variant="caption" color="text.secondary">
                      {file.is_loan ? "• [LOAN]" : "• [CASH]"}
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
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700} color="#16A34A">
                      Paid: ₹ {Number(file.total_paid).toLocaleString("en-IN")}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total: ₹ {Number(file.total_project_cost).toLocaleString("en-IN")}
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
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      startIcon={<TimelineIcon />}
                      onClick={() => handleOpenTracker(file.lead_id)}
                    >
                      Tracker
                    </Button>
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
    </Box>
  );
}
