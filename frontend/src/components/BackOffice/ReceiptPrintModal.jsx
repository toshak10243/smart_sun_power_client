import React from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  Divider,
  Paper,
} from "@mui/material";
import {
  PrintRounded as PrintIcon,
  CloseRounded as CloseIcon,
  CheckCircleRounded as CheckIcon,
  SolarPowerRounded as SolarIcon,
} from "@mui/icons-material";

export default function ReceiptPrintModal({ open, onClose, paymentData, fileData }) {
  if (!paymentData || !fileData) return null;

  const handlePrint = () => {
    window.print();
  };

  const receiptNo = paymentData.receipt_number || `REC-${Date.now().toString().slice(-6)}`;
  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: { sx: { borderRadius: 3 } },
      }}
    >
      <DialogContent sx={{ p: 4 }} id="printable-receipt">
        <Paper
          elevation={0}
          sx={{
            p: 3,
            border: "2px dashed #00B5EF",
            borderRadius: 3,
            bgcolor: "#F8FCFF",
          }}
        >
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#0B3A63", display: "flex", alignItems: "center", gap: 1 }}>
                <SolarIcon sx={{ color: "#00B5EF" }} /> Smart Sun Power
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748B" }}>
                Solar Installation & Rooftop Energy Solutions
              </Typography>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "#00B5EF" }}>
                RECEIPT
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: "#1E293B" }}>
                #{receiptNo}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Date: {dateStr}
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* Customer & Project Info */}
          <Stack spacing={1.2}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">Customer Name:</Typography>
              <Typography variant="body2" fontWeight={700}>{fileData.customer_name}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">Mobile Number:</Typography>
              <Typography variant="body2" fontWeight={600}>{fileData.phone_number}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">Project File No:</Typography>
              <Typography variant="body2" fontWeight={700} color="#0B3A63">{fileData.file_number}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">AEN Office & K-No:</Typography>
              <Typography variant="body2">{fileData.aen_office} | {fileData.k_number}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">Total Project Capacity:</Typography>
              <Typography variant="body2" fontWeight={600}>
                {(Number(fileData.kw_with_subsidy || 0) + Number(fileData.kw_without_subsidy || 0))} kW
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* Payment Section */}
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: "#FFFFFF",
              border: "1px solid #E2E8F0",
              textAlign: "center",
              mb: 2,
            }}
          >
            <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600 }}>
              ADVANCE BOOKING AMOUNT RECEIVED
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: "#16A34A", my: 0.5 }}>
              ₹ {Number(paymentData.amount || 0).toLocaleString("en-IN")}
            </Typography>
            <Typography variant="caption" sx={{ color: "#0B3A63", fontWeight: 600 }}>
              Mode: {paymentData.payment_mode} {paymentData.reference_number ? `(${paymentData.reference_number})` : ""}
            </Typography>
          </Box>

          <Stack direction="row" justifyContent="space-between" sx={{ fontSize: "0.75rem", color: "#64748B" }}>
            <Typography variant="caption">Total Project Cost: ₹ {Number(fileData.total_project_cost || 0).toLocaleString("en-IN")}</Typography>
            <Typography variant="caption">
              Balance Due: ₹ {Math.max(0, Number(fileData.total_project_cost || 0) - Number(paymentData.amount || 0)).toLocaleString("en-IN")}
            </Typography>
          </Stack>

          <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">Terms & Conditions:</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>
                * Amount is strictly non-refundable upon structure fabrication.
              </Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Box sx={{ width: 100, borderBottom: "1px solid #000", mb: 0.5 }} />
              <Typography variant="caption" fontWeight={600}>Authorized Signatory</Typography>
            </Box>
          </Box>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ p: 2, px: 3 }}>
        <Button onClick={onClose} color="inherit" startIcon={<CloseIcon />}>
          Close
        </Button>
        <Button
          onClick={handlePrint}
          variant="contained"
          startIcon={<PrintIcon />}
          sx={{
            bgcolor: "#00B5EF",
            "&:hover": { bgcolor: "#0095c5" },
            fontWeight: 700,
            textTransform: "none",
            borderRadius: 2,
            px: 3,
          }}
        >
          Print Receipt
        </Button>
      </DialogActions>
    </Dialog>
  );
}
