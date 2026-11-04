import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Stack,
  Alert,
  CircularProgress,
  IconButton,
  Grid,
  MenuItem,
  FormControlLabel,
  Switch,
  RadioGroup,
  Radio,
  Divider,
  Chip,
} from "@mui/material";
import {
  Close as CloseIcon,
  EmojiEventsRounded as TrophyIcon,
  CloudUploadRounded as UploadIcon,
} from "@mui/icons-material";
import { updateLeadStatus } from "../services/leadService";
import { createProjectFile, uploadProjectDocument } from "../services/projectFileService";
import ReceiptPrintModal from "./BackOffice/ReceiptPrintModal";

const AEN_OFFICES = [
  "AEN-A-I Jaipur",
  "AEN-A-II Jaipur",
  "AEN-B-I Jaipur",
  "AEN-C-I Mansarovar",
  "AEN-D-I Sanganer",
  "AEN-E-I Vaishali Nagar",
  "AEN-F-I Vidhyadhar Nagar",
  "AEN-G-I Malviya Nagar",
  "AEN Rural Jaipur",
  "Other AEN Office",
];

export default function WonStageModal({ open, onClose, lead, onSuccess }) {
  // Section 1: Customer Info
  const [aenOffice, setAenOffice] = useState("AEN-C-I Mansarovar");
  const [kNumber, setKNumber] = useState("");
  const [refName, setRefName] = useState("");
  const [refPhone, setRefPhone] = useState("");

  // Section 2: Connection Type
  const [connCategory, setConnCategory] = useState("DS");
  const [propertyType, setPropertyType] = useState("House");
  const [sanctionedLoad, setSanctionedLoad] = useState("2.0");
  const [modRequired, setModRequired] = useState(false);
  const [modType, setModType] = useState("Load Extension");

  // Section 3: Project & Loan
  const [phaseType, setPhaseType] = useState("1 Phase");
  const [isLoan, setIsLoan] = useState(false);
  const [totalCost, setTotalCost] = useState("");

  // Section 4: Solar Specs
  const [kwWithSub, setKwWithSub] = useState("");
  const [kwWithoutSub, setKwWithoutSub] = useState("0");
  const [panelCompany, setPanelCompany] = useState("Waaree");
  const [panelWattage, setPanelWattage] = useState("540W");
  const [inverterCompany, setInverterCompany] = useState("Growatt");
  const [inverterKw, setInverterKw] = useState("3.0");
  const [inverterPhase, setInverterPhase] = useState("1 Phase");
  const [heightFront, setHeightFront] = useState("6");
  const [heightBack, setHeightBack] = useState("4");
  const [notes, setNotes] = useState("");

  // Section 5: Dynamic Documents
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [billFile, setBillFile] = useState(null);
  const [chequeFile, setChequeFile] = useState(null);
  const [panFile, setPanFile] = useState(null);
  const [propFile, setPropFile] = useState(null);

  // Section 6: Advance Payment
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [refNumber, setRefNumber] = useState("");
  const [bankName, setBankName] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Receipt Modal State
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [createdReceiptData, setCreatedReceiptData] = useState(null);
  const [createdFileData, setCreatedFileData] = useState(null);

  useEffect(() => {
    if (open && lead) {
      setKNumber("");
      setRefName("");
      setRefPhone("");
      setConnCategory("DS");
      setPropertyType("House");
      setSanctionedLoad("2.0");
      setModRequired(false);
      setModType("Load Extension");
      setPhaseType("1 Phase");
      setIsLoan(false);

      const cap = lead.required_kw ? String(lead.required_kw) : "3.0";
      setKwWithSub(cap);
      setInverterKw(cap);

      const dealAmt = lead.deal_amount || lead.quotation_amount || "";
      setTotalCost(dealAmt ? String(dealAmt) : "");
      setAdvanceAmount(lead.deal_amount ? String(Math.round(lead.deal_amount * 0.2)) : "10000");

      setAadhaarFile(null);
      setBillFile(null);
      setChequeFile(null);
      setPanFile(null);
      setPropFile(null);
      setErrorMsg("");
      setSubmitting(false);
    }
  }, [open, lead]);

  const handleSubmit = async () => {
    if (!lead?.id) return;

    // Validations
    if (!kNumber.trim()) {
      setErrorMsg("K-Number (Electricity Account No.) is mandatory.");
      return;
    }
    if (!totalCost || Number(totalCost) <= 0) {
      setErrorMsg("Total Project Cost (₹) is required.");
      return;
    }
    if (!kwWithSub || Number(kwWithSub) <= 0) {
      setErrorMsg("Solar Capacity (kW) is required.");
      return;
    }
    if (!advanceAmount || Number(advanceAmount) <= 0) {
      setErrorMsg("Advance Booking Amount (₹) is required.");
      return;
    }
    if (!aadhaarFile || !billFile || !chequeFile) {
      setErrorMsg("Mandatory Documents: Aadhaar, Electricity Bill, and Cancelled Cheque are required.");
      return;
    }
    if (isLoan && !panFile) {
      setErrorMsg("PAN Card is mandatory for Loan files.");
      return;
    }
    if (modRequired && !propFile) {
      setErrorMsg("Property Document is mandatory when Connection Modification is selected.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg("");

      const totalCapacity = Number(kwWithSub) + Number(kwWithoutSub || 0);

      // 1. Update lead status in CRM
      await updateLeadStatus(lead.id, {
        status: "Won",
        deal_amount: Number(totalCost),
        required_kw: totalCapacity,
        system_capacity_kw: totalCapacity,
        payment_status: "Advance",
        remark: `Converted to Won. Project File initiated. ${notes || ""}`,
      });

      // 2. Create Project File in Back-Office
      const filePayload = {
        lead_id: lead.id,
        customer_name: lead.customer_name,
        phone_number: lead.mobile_number,
        reference_name: refName,
        reference_phone: refPhone,
        aen_office: aenOffice,
        k_number: kNumber,
        connection_category: connCategory,
        property_type: propertyType,
        current_sanctioned_load: Number(sanctionedLoad),
        modification_required: modRequired,
        modification_type: modType,
        phase_type: phaseType,
        is_loan: isLoan,
        total_project_cost: Number(totalCost),
        kw_with_subsidy: Number(kwWithSub),
        kw_without_subsidy: Number(kwWithoutSub || 0),
        panel_company: panelCompany,
        panel_wattage: panelWattage,
        inverter_company: inverterCompany,
        inverter_kw: Number(inverterKw),
        inverter_phase: inverterPhase,
        structure_height_front: Number(heightFront),
        structure_height_back: Number(heightBack),
        other_site_notes: notes,
        advance_amount: Number(advanceAmount),
        payment_mode: paymentMode,
        reference_number: refNumber,
        bank_name: bankName,
      };

      const fileRes = await createProjectFile(filePayload);
      const fileId = fileRes.file_id;

      // 3. Upload attached documents
      const docsToUpload = [
        { file: aadhaarFile, type: "Aadhaar Card" },
        { file: billFile, type: "Electricity Bill" },
        { file: chequeFile, type: "Cancelled Cheque" },
        { file: panFile, type: "PAN Card" },
        { file: propFile, type: "Property Document" },
      ].filter((d) => Boolean(d.file));

      for (const item of docsToUpload) {
        const formData = new FormData();
        formData.append("file", item.file);
        formData.append("doc_type", item.type);
        await uploadProjectDocument(fileId, formData);
      }

      setCreatedReceiptData({
        amount: advanceAmount,
        payment_mode: paymentMode,
        reference_number: refNumber,
        receipt_number: `REC-${fileRes.file_number}`,
      });
      setCreatedFileData({
        customer_name: lead.customer_name,
        phone_number: lead.mobile_number,
        file_number: fileRes.file_number,
        aen_office: aenOffice,
        k_number: kNumber,
        total_project_cost: totalCost,
        kw_with_subsidy: kwWithSub,
        kw_without_subsidy: kwWithoutSub,
      });

      setReceiptOpen(true);
      if (onSuccess) {
        onSuccess({
          required_kw: totalCapacity,
          deal_amount: Number(totalCost),
          payment_status: "Advance",
          remark: `Converted to Won. Project File initiated. ${notes || ""}`,
        });
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.message || "Failed to create project file");
    } finally {
      setSubmitting(false);
    }
  };

  if (!lead) return null;

  return (
    <>
      <Dialog
        open={Boolean(open && lead)}
        onClose={submitting ? undefined : onClose}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: { sx: { borderRadius: 3 } },
        }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ p: 1, bgcolor: "#E0F2FE", color: "#00B5EF", borderRadius: 2, display: "flex" }}>
              <TrophyIcon />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800} color="#0B3A63">
                Mark Lead as Won & File Onboarding
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Client: <b>{lead?.customer_name}</b> ({lead?.mobile_number})
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={onClose} disabled={submitting}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ maxHeight: "75vh" }}>
          {errorMsg && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{errorMsg}</Alert>}

          {/* Section 1: Customer & Connection Info */}
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0B3A63", mb: 1 }}>
            1. Customer & Connection Info
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="AEN Office (Jaipur Discom) *"
                value={aenOffice}
                onChange={(e) => setAenOffice(e.target.value)}
              >
                {AEN_OFFICES.map((off) => (
                  <MenuItem key={off} value={off}>{off}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="K-Number (Electricity A/C) *"
                placeholder="e.g. 210123456789"
                value={kNumber}
                onChange={(e) => setKNumber(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Reference Name (Optional)"
                value={refName}
                onChange={(e) => setRefName(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Reference Phone (Optional)"
                value={refPhone}
                onChange={(e) => setRefPhone(e.target.value)}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Section 2: Connection Type & Modification Branch */}
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0B3A63", mb: 1 }}>
            2. Connection Type & Modification
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="caption" color="text.secondary">Category</Typography>
              <RadioGroup row value={connCategory} onChange={(e) => setConnCategory(e.target.value)}>
                <FormControlLabel value="DS" control={<Radio size="small" />} label="DS (Domestic)" />
                <FormControlLabel value="NDS" control={<Radio size="small" />} label="NDS" />
              </RadioGroup>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="caption" color="text.secondary">Property Type</Typography>
              <RadioGroup row value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
                <FormControlLabel value="House" control={<Radio size="small" />} label="House" />
                <FormControlLabel value="Flat" control={<Radio size="small" />} label="Flat" />
              </RadioGroup>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Current Sanctioned Load (kW) *"
                value={sanctionedLoad}
                onChange={(e) => setSanctionedLoad(e.target.value)}
              />
            </Grid>
            <Grid size={12}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                <FormControlLabel
                  control={<Switch checked={modRequired} onChange={(e) => setModRequired(e.target.checked)} color="warning" />}
                  label="Connection Modification Required? (Load Extension / Name Transfer)"
                />
                {modRequired && (
                  <TextField
                    select
                    size="small"
                    sx={{ mt: 1, minWidth: 250 }}
                    label="Modification Type *"
                    value={modType}
                    onChange={(e) => setModType(e.target.value)}
                  >
                    <MenuItem value="Load Extension">Load Extension</MenuItem>
                    <MenuItem value="Name Transfer">Name Transfer</MenuItem>
                    <MenuItem value="New Connection">New Connection</MenuItem>
                  </TextField>
                )}
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Section 3: Project & Loan */}
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0B3A63", mb: 1 }}>
            3. Project & Financials
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Connection Phase *"
                value={phaseType}
                onChange={(e) => setPhaseType(e.target.value)}
              >
                <MenuItem value="1 Phase">1 Phase</MenuItem>
                <MenuItem value="3 Phase">3 Phase</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box sx={{ border: "1px solid #E2E8F0", borderRadius: 1.5, p: 0.5, px: 1.5, height: 40, display: "flex", alignItems: "center" }}>
                <FormControlLabel
                  control={<Switch checked={isLoan} onChange={(e) => setIsLoan(e.target.checked)} color="primary" />}
                  label="Loan File? (Bank Financed)"
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Total Project Cost (₹) *"
                value={totalCost}
                onChange={(e) => setTotalCost(e.target.value)}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Section 4: Solar Technical Specs */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0B3A63" }}>
              4. Solar Technical Specs
            </Typography>
            <Chip
              size="small"
              color="primary"
              label={`Total Plant: ${(Number(kwWithSub || 0) + Number(kwWithoutSub || 0)).toFixed(1)} kW`}
              sx={{ fontWeight: 700 }}
            />
          </Stack>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="In Subsidy kW (With Subsidy) *"
                value={kwWithSub}
                onChange={(e) => setKwWithSub(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Without Subsidy kW (Commercial/Extra)"
                value={kwWithoutSub}
                onChange={(e) => setKwWithoutSub(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Panel Company *"
                value={panelCompany}
                onChange={(e) => setPanelCompany(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Panel Wattage *"
                value={panelWattage}
                onChange={(e) => setPanelWattage(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Inverter Company *"
                value={inverterCompany}
                onChange={(e) => setInverterCompany(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Inverter Capacity (kW)"
                value={inverterKw}
                onChange={(e) => setInverterKw(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Inverter Phase"
                value={inverterPhase}
                onChange={(e) => setInverterPhase(e.target.value)}
              >
                <MenuItem value="1 Phase">1 Phase</MenuItem>
                <MenuItem value="3 Phase">3 Phase</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Front Structure Height (ft)"
                value={heightFront}
                onChange={(e) => setHeightFront(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Back Structure Height (ft)"
                value={heightBack}
                onChange={(e) => setHeightBack(e.target.value)}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                size="small"
                label="Other Site Notes (Optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Section 5: Mandatory Document Uploads */}
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0B3A63", mb: 1 }}>
            5. Mandatory Documents Upload
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Button
                variant={aadhaarFile ? "contained" : "outlined"}
                component="label"
                fullWidth
                color={aadhaarFile ? "success" : "primary"}
                startIcon={<UploadIcon />}
                size="small"
              >
                {aadhaarFile ? `Aadhaar: ${aadhaarFile.name.slice(0, 10)}...` : "Aadhaar Card *"}
                <input type="file" hidden onChange={(e) => setAadhaarFile(e.target.files[0])} />
              </Button>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Button
                variant={billFile ? "contained" : "outlined"}
                component="label"
                fullWidth
                color={billFile ? "success" : "primary"}
                startIcon={<UploadIcon />}
                size="small"
              >
                {billFile ? `Bill: ${billFile.name.slice(0, 10)}...` : "Electricity Bill *"}
                <input type="file" hidden onChange={(e) => setBillFile(e.target.files[0])} />
              </Button>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Button
                variant={chequeFile ? "contained" : "outlined"}
                component="label"
                fullWidth
                color={chequeFile ? "success" : "primary"}
                startIcon={<UploadIcon />}
                size="small"
              >
                {chequeFile ? `Cheque: ${chequeFile.name.slice(0, 10)}...` : "Cancelled Cheque *"}
                <input type="file" hidden onChange={(e) => setChequeFile(e.target.files[0])} />
              </Button>
            </Grid>
            {isLoan && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Button
                  variant={panFile ? "contained" : "outlined"}
                  component="label"
                  fullWidth
                  color={panFile ? "success" : "warning"}
                  startIcon={<UploadIcon />}
                  size="small"
                >
                  {panFile ? `PAN: ${panFile.name.slice(0, 10)}...` : "PAN Card * (Loan Mandatory)"}
                  <input type="file" hidden onChange={(e) => setPanFile(e.target.files[0])} />
                </Button>
              </Grid>
            )}
            {modRequired && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Button
                  variant={propFile ? "contained" : "outlined"}
                  component="label"
                  fullWidth
                  color={propFile ? "success" : "warning"}
                  startIcon={<UploadIcon />}
                  size="small"
                >
                  {propFile ? `Doc: ${propFile.name.slice(0, 10)}...` : "Property Doc * (Load Extension)"}
                  <input type="file" hidden onChange={(e) => setPropFile(e.target.files[0])} />
                </Button>
              </Grid>
            )}
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Section 6: Advance Payment */}
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0B3A63", mb: 1 }}>
            6. Advance Booking Payment
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Advance Booking Amount (₹) *"
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Payment Mode *"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
              >
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="QR">QR / UPI</MenuItem>
                <MenuItem value="Online">Online / NEFT</MenuItem>
                <MenuItem value="Cheque">Cheque</MenuItem>
              </TextField>
            </Grid>
            {paymentMode !== "Cash" && (
              <>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Transaction / Cheque / UTR No."
                    value={refNumber}
                    onChange={(e) => setRefNumber(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Bank Name"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2, px: 3 }}>
          <Button onClick={onClose} color="inherit" disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <TrophyIcon />}
            sx={{
              bgcolor: "#00B5EF",
              "&:hover": { bgcolor: "#0095c5" },
              fontWeight: 700,
              textTransform: "none",
              borderRadius: 2,
              px: 3,
            }}
          >
            {submitting ? "Submitting File..." : "Convert to Won & Initiate File"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 1-Tap Instant Printable Customer Receipt Modal */}
      <ReceiptPrintModal
        open={receiptOpen}
        onClose={() => {
          setReceiptOpen(false);
          onClose();
        }}
        paymentData={createdReceiptData}
        fileData={createdFileData}
      />
    </>
  );
}
