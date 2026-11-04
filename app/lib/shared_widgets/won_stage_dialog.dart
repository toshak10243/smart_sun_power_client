import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../features/sales/data/models/lead_model.dart';
import '../features/sales/data/repositories/back_office_repository.dart';
import '../features/sales/data/sales_lead_service.dart';
import 'image_source_picker_sheet.dart';

class WonStageDialog extends StatefulWidget {
  final dynamic lead; // Accepts LeadModel or Map<String, dynamic>
  final VoidCallback onSuccess;

  const WonStageDialog({
    Key? key,
    required this.lead,
    required this.onSuccess,
  }) : super(key: key);

  static Future<void> show(BuildContext context, dynamic lead, VoidCallback onSuccess) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      enableDrag: false,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => WonStageDialog(lead: lead, onSuccess: onSuccess),
    );
  }

  @override
  State<WonStageDialog> createState() => _WonStageDialogState();
}

class _WonStageDialogState extends State<WonStageDialog> {
  final SalesLeadService _salesService = SalesLeadService();
  final BackOfficeRepository _boRepo = BackOfficeRepository();
  final ImagePicker _picker = ImagePicker();

  // Helper getters for lead fields
  int get _leadId {
    if (widget.lead is LeadModel) return (widget.lead as LeadModel).id;
    if (widget.lead is Map) return widget.lead['id'] is int ? widget.lead['id'] : int.tryParse('${widget.lead['id']}') ?? 0;
    return 0;
  }

  String get _customerName {
    if (widget.lead is LeadModel) return (widget.lead as LeadModel).customerName;
    if (widget.lead is Map) return widget.lead['customer_name']?.toString() ?? 'Customer';
    return 'Customer';
  }

  String get _mobileNumber {
    if (widget.lead is LeadModel) return (widget.lead as LeadModel).mobileNumber;
    if (widget.lead is Map) return widget.lead['mobile_number']?.toString() ?? '';
    return '';
  }

  // 1. AEN Offices
  final List<String> _aenOffices = const [
    'AEN-A-I Jaipur',
    'AEN-A-II Jaipur',
    'AEN-B-I Jaipur',
    'AEN-C-I Mansarovar',
    'AEN-D-I Sanganer',
    'AEN-E-I Vaishali Nagar',
    'AEN-F-I Vidhyadhar Nagar',
    'AEN-G-I Malviya Nagar',
    'AEN Rural Jaipur',
    'Other AEN Office',
  ];
  String _selectedAen = 'AEN-C-I Mansarovar';

  // Section 1: Customer & Connection Info
  final TextEditingController _kNumberCtrl = TextEditingController();
  final TextEditingController _refNameCtrl = TextEditingController();
  final TextEditingController _refPhoneCtrl = TextEditingController();

  // Section 2: Connection Type
  String _connCategory = 'DS'; // 'DS' or 'NDS'
  String _propertyType = 'House'; // 'House' or 'Flat'
  final TextEditingController _sanctionedLoadCtrl = TextEditingController(text: '2.0');
  bool _modRequired = false;
  String _modType = 'Load Extension';

  // Section 3: Project & Loan
  String _phaseType = '1 Phase';
  bool _isLoan = false;
  final TextEditingController _totalCostCtrl = TextEditingController();

  // Section 4: Solar Technical Specs
  final TextEditingController _kwWithSubCtrl = TextEditingController();
  final TextEditingController _kwWithoutSubCtrl = TextEditingController(text: '0');
  String _panelCompany = 'Waaree';
  String _panelWattage = '540W';
  String _inverterCompany = 'Growatt';
  final TextEditingController _inverterKwCtrl = TextEditingController(text: '3.0');
  String _inverterPhase = '1 Phase';
  final TextEditingController _heightFrontCtrl = TextEditingController(text: '6');
  final TextEditingController _heightBackCtrl = TextEditingController(text: '4');
  final TextEditingController _notesCtrl = TextEditingController();

  // Section 5: Documents Files
  File? _aadhaarFile;
  File? _billFile;
  File? _chequeFile;
  File? _panFile;
  File? _propFile;

  // Section 6: Advance Booking Payment
  final TextEditingController _advanceAmountCtrl = TextEditingController();
  String _paymentMode = 'Cash';
  final TextEditingController _refNumberCtrl = TextEditingController();
  final TextEditingController _bankNameCtrl = TextEditingController();

  String? _error;
  final Map<String, String> _fieldErrors = {};
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    num initialKw = 3.0;
    num initialCost = 0;

    if (widget.lead is LeadModel) {
      final l = widget.lead as LeadModel;
      initialKw = l.requiredKw ?? 3.0;
      initialCost = l.dealAmount ?? l.quotationAmount ?? 0;
    } else if (widget.lead is Map) {
      initialKw = num.tryParse('${widget.lead['required_kw']}') ?? 3.0;
      initialCost = num.tryParse('${widget.lead['deal_amount'] ?? widget.lead['quotation_amount']}') ?? 0;
    }

    _kwWithSubCtrl.text = initialKw.toString();
    _inverterKwCtrl.text = initialKw.toString();
    if (initialCost > 0) {
      _totalCostCtrl.text = initialCost.toStringAsFixed(0);
      _advanceAmountCtrl.text = (initialCost * 0.2).toStringAsFixed(0);
    } else {
      _advanceAmountCtrl.text = '10000';
    }
  }

  @override
  void dispose() {
    _kNumberCtrl.dispose();
    _refNameCtrl.dispose();
    _refPhoneCtrl.dispose();
    _sanctionedLoadCtrl.dispose();
    _totalCostCtrl.dispose();
    _kwWithSubCtrl.dispose();
    _kwWithoutSubCtrl.dispose();
    _inverterKwCtrl.dispose();
    _heightFrontCtrl.dispose();
    _heightBackCtrl.dispose();
    _notesCtrl.dispose();
    _advanceAmountCtrl.dispose();
    _refNumberCtrl.dispose();
    _bankNameCtrl.dispose();
    super.dispose();
  }

  InputDecoration _inputDeco(String label, {String? hint, String? errorText}) {
    final hasErr = errorText != null;
    return InputDecoration(
      labelText: label,
      hintText: hint,
      errorText: errorText,
      errorStyle: const TextStyle(
        color: Color(0xFFDC2626),
        fontSize: 11,
        fontWeight: FontWeight.bold,
      ),
      filled: hasErr,
      fillColor: hasErr ? const Color(0xFFFEF2F2) : Colors.transparent,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(
          color: hasErr ? const Color(0xFFDC2626) : const Color(0xFFCBD5E1),
          width: hasErr ? 1.5 : 1.0,
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(
          color: hasErr ? const Color(0xFFDC2626) : const Color(0xFF005BAC),
          width: 1.5,
        ),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: Color(0xFFDC2626), width: 1.5),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: Color(0xFFDC2626), width: 2.0),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
    );
  }

  Future<void> _pickImage(String docType, String docTitle) async {
    File? currentFile;
    if (docType == 'Aadhaar') currentFile = _aadhaarFile;
    if (docType == 'Bill') currentFile = _billFile;
    if (docType == 'Cheque') currentFile = _chequeFile;
    if (docType == 'PAN') currentFile = _panFile;
    if (docType == 'Property') currentFile = _propFile;

    final source = await ImageSourcePickerSheet.show(
      context: context,
      title: 'Upload $docTitle',
      showRemove: currentFile != null,
      onRemove: () {
        setState(() {
          if (docType == 'Aadhaar') _aadhaarFile = null;
          if (docType == 'Bill') _billFile = null;
          if (docType == 'Cheque') _chequeFile = null;
          if (docType == 'PAN') _panFile = null;
          if (docType == 'Property') _propFile = null;
        });
      },
    );

    if (source == null) return;

    final picked = await _picker.pickImage(
      source: source,
      imageQuality: 80,
    );
    if (picked == null) return;

    setState(() {
      final f = File(picked.path);
      if (docType == 'Aadhaar') { _aadhaarFile = f; _fieldErrors.remove('doc_aadhaar'); }
      if (docType == 'Bill') { _billFile = f; _fieldErrors.remove('doc_bill'); }
      if (docType == 'Cheque') { _chequeFile = f; _fieldErrors.remove('doc_cheque'); }
      if (docType == 'PAN') { _panFile = f; _fieldErrors.remove('doc_pan'); }
      if (docType == 'Property') { _propFile = f; _fieldErrors.remove('doc_prop'); }
      if (_fieldErrors.isEmpty) _error = null;
    });
  }

  Future<void> _submit() async {
    setState(() => _error = null);

    final kNumber = _kNumberCtrl.text.trim();
    final totalCost = double.tryParse(_totalCostCtrl.text.trim()) ?? 0;
    final kwWithSub = double.tryParse(_kwWithSubCtrl.text.trim()) ?? 0;
    final kwWithoutSub = double.tryParse(_kwWithoutSubCtrl.text.trim()) ?? 0;
    final advance = double.tryParse(_advanceAmountCtrl.text.trim()) ?? 0;

    // Strict Validation matching Web ERP rules with INLINE field errors
    final Map<String, String> errors = {};
    if (kNumber.isEmpty) {
      errors['k_number'] = 'K-Number is mandatory';
    }
    if (totalCost <= 0) {
      errors['total_cost'] = 'Total Cost must be greater than 0';
    }
    if (kwWithSub <= 0) {
      errors['kw_with_sub'] = 'Subsidy capacity (kW) is required';
    }
    if (advance <= 0) {
      errors['advance_amount'] = 'Advance booking amount is required';
    }
    if (_aadhaarFile == null) {
      errors['doc_aadhaar'] = 'Aadhaar Card is required';
    }
    if (_billFile == null) {
      errors['doc_bill'] = 'Electricity Bill is required';
    }
    if (_chequeFile == null) {
      errors['doc_cheque'] = 'Cancelled Cheque is required';
    }
    if (_isLoan && _panFile == null) {
      errors['doc_pan'] = 'PAN Card photo is mandatory for Bank Loan';
    }
    if (_modRequired && _propFile == null) {
      errors['doc_prop'] = 'Property Document is required for Modification';
    }

    if (errors.isNotEmpty) {
      setState(() {
        _fieldErrors.clear();
        _fieldErrors.addAll(errors);
        _error = errors.values.first;
      });
      return;
    }

    setState(() => _submitting = true);

    try {
      final totalCapacity = kwWithSub + kwWithoutSub;

      // 1. Update Lead Status in CRM
      await _salesService.updateLeadStatus(_leadId, {
        'status': 'Won',
        'deal_amount': totalCost,
        'required_kw': totalCapacity,
        'system_capacity_kw': totalCapacity,
        'payment_status': 'Advance',
        'remark': 'Converted to Won. Project File created via App. ${_notesCtrl.text.trim()}',
      });

      // 2. Create Project File in Back-Office Pipeline
      final fileRes = await _boRepo.createProjectFile({
        'lead_id': _leadId,
        'customer_name': _customerName,
        'phone_number': _mobileNumber,
        'reference_name': _refNameCtrl.text.trim(),
        'reference_phone': _refPhoneCtrl.text.trim(),
        'aen_office': _selectedAen,
        'k_number': kNumber,
        'connection_category': _connCategory,
        'property_type': _propertyType,
        'current_sanctioned_load': double.tryParse(_sanctionedLoadCtrl.text.trim()) ?? 2.0,
        'modification_required': _modRequired,
        'modification_type': _modType,
        'phase_type': _phaseType,
        'is_loan': _isLoan,
        'total_project_cost': totalCost,
        'kw_with_subsidy': kwWithSub,
        'kw_without_subsidy': kwWithoutSub,
        'panel_company': _panelCompany,
        'panel_wattage': _panelWattage,
        'inverter_company': _inverterCompany,
        'inverter_kw': double.tryParse(_inverterKwCtrl.text.trim()) ?? totalCapacity,
        'inverter_phase': _inverterPhase,
        'structure_height_front': double.tryParse(_heightFrontCtrl.text.trim()) ?? 6.0,
        'structure_height_back': double.tryParse(_heightBackCtrl.text.trim()) ?? 4.0,
        'other_site_notes': _notesCtrl.text.trim(),
        'advance_amount': advance,
        'payment_mode': _paymentMode,
        'reference_number': _refNumberCtrl.text.trim(),
        'bank_name': _bankNameCtrl.text.trim(),
      });

      final int createdFileId = fileRes['file_id'] is int
          ? fileRes['file_id']
          : int.tryParse('${fileRes['file_id']}') ?? 0;

      // 3. Upload Attached Documents
      if (createdFileId > 0) {
        final docs = [
          {'file': _aadhaarFile, 'type': 'Aadhaar Card'},
          {'file': _billFile, 'type': 'Electricity Bill'},
          {'file': _chequeFile, 'type': 'Cancelled Cheque'},
          if (_panFile != null) {'file': _panFile, 'type': 'PAN Card'},
          if (_propFile != null) {'file': _propFile, 'type': 'Property Document'},
        ];

        for (final d in docs) {
          if (d['file'] != null) {
            await _boRepo.uploadDocument(
              fileId: createdFileId,
              file: d['file'] as File,
              docType: d['type'] as String,
            );
          }
        }
      }

      if (!mounted) return;
      setState(() => _submitting = false);
      Navigator.pop(context);
      widget.onSuccess();

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('🎉 File ${fileRes['file_number']} created & dispatched to Back-Office!'),
          backgroundColor: const Color(0xFF16A34A),
          duration: const Duration(seconds: 4),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _submitting = false;
        _error = e.toString();
      });
    }
  }

  Widget _buildDocButton(String title, File? file, VoidCallback onPick, {bool isMandatory = true, String? errorText}) {
    final isSelected = file != null;
    return InkWell(
      onTap: onPick,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFDCFCE7) : const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? const Color(0xFF16A34A) : const Color(0xFFCBD5E1),
          ),
        ),
        child: Row(
          children: [
            Icon(
              isSelected ? Icons.check_circle_rounded : Icons.camera_alt_outlined,
              size: 18,
              color: isSelected ? const Color(0xFF16A34A) : const Color(0xFF005BAC),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                isSelected ? '$title (Captured ✓)' : '$title ${isMandatory ? '*' : ''}',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                  color: isSelected ? const Color(0xFF16A34A) : const Color(0xFF0F172A),
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    final bottomPadding = MediaQuery.of(context).padding.bottom;

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: FractionallySizedBox(
        heightFactor: 0.92,
        child: Column(
          children: [
            const SizedBox(height: 10),
            Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: const Color(0xFFCBD5E1),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: const BoxDecoration(
                border: Border(bottom: BorderSide(color: Color(0xFFE2E8F0))),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE0F2FE),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.emoji_events_rounded, color: Color(0xFF005BAC), size: 20),
                      ),
                      const SizedBox(width: 10),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            "Mark Lead as Won & File Onboarding",
                            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: Color(0xFF0B3A63)),
                          ),
                          Text(
                            "${_customerName} • ${_mobileNumber}",
                            style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                          ),
                        ],
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, size: 22),
                    onPressed: _submitting ? null : () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: EdgeInsets.fromLTRB(16, 16, 16, bottomInset > 0 ? bottomInset + 16 : bottomPadding + 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // 1. Customer & Discom Info
                    const Text('1. Customer & Discom Connection', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: Color(0xFF0B3A63))),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      isExpanded: true,
                      value: _selectedAen,
                      decoration: InputDecoration(
                        labelText: 'AEN Office (Jaipur Discom) *',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      ),
                      items: _aenOffices.map((off) => DropdownMenuItem(
                        value: off,
                        child: Text(
                          off,
                          overflow: TextOverflow.ellipsis,
                          maxLines: 1,
                          style: const TextStyle(fontSize: 12.5),
                        ),
                      )).toList(),
                      onChanged: (val) => setState(() => _selectedAen = val!),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: _kNumberCtrl,
                      onChanged: (val) {
                        if (_fieldErrors.containsKey('k_number')) {
                          setState(() {
                            _fieldErrors.remove('k_number');
                            if (_fieldErrors.isEmpty) _error = null;
                          });
                        }
                      },
                      decoration: _inputDeco(
                        'K-Number (Electricity Account No.) *',
                        hint: 'e.g. 210123456789',
                        errorText: _fieldErrors['k_number'],
                      ),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _refNameCtrl,
                            decoration: InputDecoration(
                              labelText: 'Reference Name',
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextField(
                            controller: _refPhoneCtrl,
                            keyboardType: TextInputType.phone,
                            decoration: InputDecoration(
                              labelText: 'Reference Phone',
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                            ),
                          ),
                        ),
                      ],
                    ),

                    const Divider(height: 28),

                    // 2. Connection Type & Modification
                    const Text('2. Connection Type & Modification', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: Color(0xFF0B3A63))),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            isExpanded: true,
                            value: _connCategory,
                            decoration: InputDecoration(
                              labelText: 'Category',
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                            ),
                            items: const [
                              DropdownMenuItem(value: 'DS', child: Text('Domestic (DS)', overflow: TextOverflow.ellipsis, maxLines: 1, style: TextStyle(fontSize: 12.5))),
                              DropdownMenuItem(value: 'NDS', child: Text('Non-Domestic (NDS)', overflow: TextOverflow.ellipsis, maxLines: 1, style: TextStyle(fontSize: 12.5))),
                            ],
                            onChanged: (val) => setState(() => _connCategory = val!),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            isExpanded: true,
                            value: _propertyType,
                            decoration: InputDecoration(
                              labelText: 'Property',
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                            ),
                            items: const [
                              DropdownMenuItem(value: 'House', child: Text('House', overflow: TextOverflow.ellipsis, maxLines: 1, style: TextStyle(fontSize: 12.5))),
                              DropdownMenuItem(value: 'Flat', child: Text('Flat', overflow: TextOverflow.ellipsis, maxLines: 1, style: TextStyle(fontSize: 12.5))),
                            ],
                            onChanged: (val) => setState(() => _propertyType = val!),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: _sanctionedLoadCtrl,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: 'Current Sanctioned Load (kW) *',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          SwitchListTile(
                            contentPadding: EdgeInsets.zero,
                            title: const Text('Modification Required? (Load Extension / Transfer)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                            value: _modRequired,
                            activeColor: const Color(0xFFD97706),
                            onChanged: (v) => setState(() => _modRequired = v),
                          ),
                          if (_modRequired) ...[
                            const SizedBox(height: 6),
                            DropdownButtonFormField<String>(
                              isExpanded: true,
                              value: _modType,
                              decoration: InputDecoration(
                                labelText: 'Modification Type *',
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                              ),
                              items: const [
                                DropdownMenuItem(value: 'Load Extension', child: Text('Load Extension', overflow: TextOverflow.ellipsis, maxLines: 1, style: TextStyle(fontSize: 12.5))),
                                DropdownMenuItem(value: 'Name Transfer', child: Text('Name Transfer', overflow: TextOverflow.ellipsis, maxLines: 1, style: TextStyle(fontSize: 12.5))),
                                DropdownMenuItem(value: 'New Connection', child: Text('New Connection', overflow: TextOverflow.ellipsis, maxLines: 1, style: TextStyle(fontSize: 12.5))),
                              ],
                              onChanged: (v) => setState(() => _modType = v!),
                            ),
                          ],
                        ],
                      ),
                    ),

                    const Divider(height: 28),

                    // 3. Project & Financials
                    const Text('3. Project & Financials', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: Color(0xFF0B3A63))),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            isExpanded: true,
                            value: _phaseType,
                            decoration: InputDecoration(
                              labelText: 'Phase Type *',
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                            ),
                            items: const [
                              DropdownMenuItem(value: '1 Phase', child: Text('1 Phase', overflow: TextOverflow.ellipsis, maxLines: 1, style: TextStyle(fontSize: 12.5))),
                              DropdownMenuItem(value: '3 Phase', child: Text('3 Phase', overflow: TextOverflow.ellipsis, maxLines: 1, style: TextStyle(fontSize: 12.5))),
                            ],
                            onChanged: (v) => setState(() => _phaseType = v!),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Container(
                            height: 48,
                            padding: const EdgeInsets.symmetric(horizontal: 6),
                            decoration: BoxDecoration(
                              border: Border.all(color: const Color(0xFFCBD5E1)),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Bank Loan?', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                Switch(
                                  value: _isLoan,
                                  activeColor: const Color(0xFF2563EB),
                                  onChanged: (v) => setState(() => _isLoan = v),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: _totalCostCtrl,
                      keyboardType: TextInputType.number,
                      onChanged: (val) {
                        if (_fieldErrors.containsKey('total_cost')) {
                          setState(() {
                            _fieldErrors.remove('total_cost');
                            if (_fieldErrors.isEmpty) _error = null;
                          });
                        }
                      },
                      decoration: _inputDeco(
                        'Total Project Cost (₹) *',
                        errorText: _fieldErrors['total_cost'],
                      ),
                    ),

                    const Divider(height: 28),

                    // 4. Solar Technical Specs
                    const Text('4. Solar Technical Specifications', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: Color(0xFF0B3A63))),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _kwWithSubCtrl,
                            keyboardType: TextInputType.number,
                            onChanged: (val) {
                              if (_fieldErrors.containsKey('kw_with_sub')) {
                                setState(() {
                                  _fieldErrors.remove('kw_with_sub');
                                  if (_fieldErrors.isEmpty) _error = null;
                                });
                              }
                            },
                            decoration: _inputDeco(
                              'In Subsidy kW *',
                              errorText: _fieldErrors['kw_with_sub'],
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextField(
                            controller: _kwWithoutSubCtrl,
                            keyboardType: TextInputType.number,
                            decoration: InputDecoration(
                              labelText: 'Without Subsidy kW',
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: TextEditingController(text: _panelCompany),
                            decoration: InputDecoration(
                              labelText: 'Panel Brand *',
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                            ),
                            onChanged: (v) => _panelCompany = v,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextField(
                            controller: TextEditingController(text: _panelWattage),
                            decoration: InputDecoration(
                              labelText: 'Panel Wattage *',
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                            ),
                            onChanged: (v) => _panelWattage = v,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: TextEditingController(text: _inverterCompany),
                            decoration: InputDecoration(
                              labelText: 'Inverter Brand *',
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                            ),
                            onChanged: (v) => _inverterCompany = v,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextField(
                            controller: _inverterKwCtrl,
                            keyboardType: TextInputType.number,
                            decoration: InputDecoration(
                              labelText: 'Inverter kW *',
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _heightFrontCtrl,
                            keyboardType: TextInputType.number,
                            decoration: InputDecoration(
                              labelText: 'Front Height (ft)',
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextField(
                            controller: _heightBackCtrl,
                            keyboardType: TextInputType.number,
                            decoration: InputDecoration(
                              labelText: 'Back Height (ft)',
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                            ),
                          ),
                        ),
                      ],
                    ),

                    const Divider(height: 28),

                    // 5. Mandatory Documents Upload (Camera or Gallery)
                    const Text('5. Mandatory Document Photos', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: Color(0xFF0B3A63))),
                    const SizedBox(height: 8),
                    _buildDocButton('Aadhaar Card', _aadhaarFile, () => _pickImage('Aadhaar', 'Aadhaar Card'), errorText: _fieldErrors['doc_aadhaar']),
                    const SizedBox(height: 8),
                    _buildDocButton('Electricity Bill', _billFile, () => _pickImage('Bill', 'Electricity Bill'), errorText: _fieldErrors['doc_bill']),
                    const SizedBox(height: 8),
                    _buildDocButton('Cancelled Cheque', _chequeFile, () => _pickImage('Cheque', 'Cancelled Cheque'), errorText: _fieldErrors['doc_cheque']),
                    if (_isLoan) ...[
                      const SizedBox(height: 8),
                      _buildDocButton('PAN Card (Loan Mandatory)', _panFile, () => _pickImage('PAN', 'PAN Card'), errorText: _fieldErrors['doc_pan']),
                    ],
                    if (_modRequired) ...[
                      const SizedBox(height: 8),
                      _buildDocButton('Property Document (Modification)', _propFile, () => _pickImage('Property', 'Property Document'), errorText: _fieldErrors['doc_prop']),
                    ],

                    const Divider(height: 28),

                    // 6. Advance Booking Payment
                    const Text('6. Advance Booking Payment', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: Color(0xFF0B3A63))),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _advanceAmountCtrl,
                            keyboardType: TextInputType.number,
                            onChanged: (val) {
                              if (_fieldErrors.containsKey('advance_amount')) {
                                setState(() {
                                  _fieldErrors.remove('advance_amount');
                                  if (_fieldErrors.isEmpty) _error = null;
                                });
                              }
                            },
                            decoration: _inputDeco(
                              'Advance (₹) *',
                              errorText: _fieldErrors['advance_amount'],
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            isExpanded: true,
                            value: _paymentMode,
                            decoration: InputDecoration(
                              labelText: 'Payment Mode *',
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                            ),
                            items: const [
                              DropdownMenuItem(value: 'Cash', child: Text('Cash', overflow: TextOverflow.ellipsis, maxLines: 1, style: TextStyle(fontSize: 12.5))),
                              DropdownMenuItem(value: 'QR', child: Text('QR / UPI', overflow: TextOverflow.ellipsis, maxLines: 1, style: TextStyle(fontSize: 12.5))),
                              DropdownMenuItem(value: 'Online', child: Text('Online / NEFT', overflow: TextOverflow.ellipsis, maxLines: 1, style: TextStyle(fontSize: 12.5))),
                              DropdownMenuItem(value: 'Cheque', child: Text('Cheque', overflow: TextOverflow.ellipsis, maxLines: 1, style: TextStyle(fontSize: 12.5))),
                            ],
                            onChanged: (v) => setState(() => _paymentMode = v!),
                          ),
                        ),
                      ],
                    ),
                    if (_paymentMode != 'Cash') ...[
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _refNumberCtrl,
                              decoration: InputDecoration(
                                labelText: 'UTR / Ref / Cheque No.',
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: TextField(
                              controller: _bankNameCtrl,
                              decoration: InputDecoration(
                                labelText: 'Bank Name',
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],

                    const SizedBox(height: 20),

                    if (_error != null || _fieldErrors.isNotEmpty) ...[
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF2F2),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFFFECACA)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.error_outline_rounded, color: Color(0xFFDC2626), size: 18),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _error ?? _fieldErrors.values.first,
                                style: const TextStyle(
                                  color: Color(0xFFDC2626),
                                  fontSize: 12.5,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],

                    // Submit Button
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton.icon(
                        onPressed: _submitting ? null : _submit,
                        icon: _submitting
                            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : const Icon(Icons.check_circle_outline, color: Colors.white),
                        label: Text(
                          _submitting ? 'Submitting Project File...' : 'Convert to Won & Initiate File',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF005BAC),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
