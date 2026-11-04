import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:solar_crm_mobile/features/sales/data/repositories/back_office_repository.dart';
import 'package:solar_crm_mobile/features/admin/presentation/screens/document_repository_screen.dart';
import 'package:solar_crm_mobile/shared_widgets/image_source_picker_sheet.dart';
import 'package:solar_crm_mobile/core/constants/app_colors.dart';

class BackOfficeTasksScreen extends StatefulWidget {
  final String? initialDesk;
  final bool isStandalone;

  const BackOfficeTasksScreen({
    super.key,
    this.initialDesk,
    this.isStandalone = true,
  });

  @override
  State<BackOfficeTasksScreen> createState() => _BackOfficeTasksScreenState();
}

class _BackOfficeTasksScreenState extends State<BackOfficeTasksScreen>
    with SingleTickerProviderStateMixin {
  final _repository = BackOfficeRepository();
  final _picker = ImagePicker();

  late TabController _tabController;
  bool _isLoading = true;
  String _userRole = '';
  List<dynamic> _allFiles = [];
  String? _errorMessage;

  // Desk Filter for Admin or multi-desk viewing: 'all', 'online', 'loan', 'field', 'accounts', 'installation', 'portal'
  String _selectedDeskFilter = 'all';

  // Search Filter
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    if (widget.initialDesk != null && widget.initialDesk!.isNotEmpty) {
      _selectedDeskFilter = widget.initialDesk!;
    }
    _tabController = TabController(length: 4, vsync: this);
    _loadQueue();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadQueue() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = await _repository.getMyQueue();
      if (!mounted) return;
      setState(() {
        _userRole = (res['role'] ?? 'Staff').toString();
        final rawFiles = res['files'];
        _allFiles = (rawFiles is List) ? rawFiles : [];
        if (widget.initialDesk != null && widget.initialDesk!.isNotEmpty) {
          _selectedDeskFilter = widget.initialDesk!;
        } else if (_selectedDeskFilter == 'all') {
          final r = _userRole.toLowerCase();
          if (r.contains('online')) {
            _selectedDeskFilter = 'online';
          } else if (r.contains('field')) {
            _selectedDeskFilter = 'field';
          } else if (r.contains('loan')) {
            _selectedDeskFilter = 'loan';
          } else if (r.contains('account')) {
            _selectedDeskFilter = 'accounts';
          } else if (r.contains('install')) {
            _selectedDeskFilter = 'installation';
          } else if (r.contains('portal')) {
            _selectedDeskFilter = 'portal';
          }
        }
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
        _allFiles = [];
        _isLoading = false;
      });
    }
  }

  bool get _isAdmin =>
      _userRole.toLowerCase().contains('admin') ||
      _userRole.toLowerCase().contains('super');

  List<dynamic> _getFilteredFiles(int tabIndex) {
    return _allFiles.where((f) {
      if (f is! Map) return false;
      final int stage = f['current_stage'] is int
          ? f['current_stage']
          : int.tryParse('${f['current_stage']}') ?? 0;
      final fileStatus = f['file_status'] ?? 'Active';
      final stageStatus = f['stage_status'] ?? 'Pending';

      // 1. Search Query Filter
      if (_searchQuery.isNotEmpty) {
        final q = _searchQuery.toLowerCase();
        final fileNum = (f['file_number'] ?? '').toString().toLowerCase();
        final name = (f['customer_name'] ?? '').toString().toLowerCase();
        final phone = (f['phone_number'] ?? '').toString().toLowerCase();
        final aen = (f['aen_office'] ?? '').toString().toLowerCase();
        if (!fileNum.contains(q) &&
            !name.contains(q) &&
            !phone.contains(q) &&
            !aen.contains(q)) {
          return false;
        }
      }

      // 2. Desk Filter (For Admin or Custom selector)
      if (_selectedDeskFilter != 'all') {
        if (_selectedDeskFilter == 'online' && stage != 0 && stage != 1) return false;
        if (_selectedDeskFilter == 'loan' && stage != 2 && stage != 10) return false;
        if (_selectedDeskFilter == 'field' &&
            ![3, 4, 9, 11, 12, 13, 14].contains(stage)) return false;
        if (_selectedDeskFilter == 'accounts' && ![5, 7, 15].contains(stage)) {
          return false;
        }
        if (_selectedDeskFilter == 'installation' && stage != 6) return false;
        if (_selectedDeskFilter == 'portal' && stage != 8 && stage != 17) {
          return false;
        }
      }

      // 3. Tab Index Filter (0: All Files, 1: Pending, 2: Completed, 3: On Hold)
      if (tabIndex == 0) {
        return true; // All Files
      } else if (tabIndex == 1) {
        return fileStatus != 'On Hold' &&
            fileStatus != 'Cancelled' &&
            fileStatus != 'Completed' &&
            stageStatus != 'Completed';
      } else if (tabIndex == 2) {
        return fileStatus == 'Completed' || stageStatus == 'Completed';
      } else if (tabIndex == 3) {
        return fileStatus == 'On Hold';
      } else {
        return true; // All Files
      }
    }).toList();
  }

  // 10-Word Remark Modal for Hold / Cancel
  Future<void> _showRemarkModal({
    required Map<String, dynamic> file,
    required String action, // 'Hold' or 'Cancel'
  }) async {
    final textController = TextEditingController();
    int wordCount = 0;

    await showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final isSatisfied = wordCount >= 10;
            return AlertDialog(
              backgroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: Row(
                children: [
                  Icon(
                    action == 'Hold' ? Icons.pause_circle_outline : Icons.cancel_outlined,
                    color: action == 'Hold' ? const Color(0xFFD97706) : const Color(0xFFDC2626),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    action == 'Hold' ? 'Put File On Hold' : 'Cancel Project File',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                ],
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Audit Quality Rule: Minimum 10 words reason is mandatory.',
                    style: TextStyle(fontSize: 12, color: Colors.grey[700]),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: textController,
                    maxLines: 4,
                    decoration: InputDecoration(
                      hintText: 'Enter detailed explanation (e.g. Bank approval query pending regarding customer pan card copy)...',
                      hintStyle: const TextStyle(fontSize: 12),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      contentPadding: const EdgeInsets.all(12),
                    ),
                    onChanged: (val) {
                      final words = val.trim().split(RegExp(r'\s+')).where((w) => w.isNotEmpty);
                      setModalState(() {
                        wordCount = val.trim().isEmpty ? 0 : words.length;
                      });
                    },
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Words: $wordCount / 10 required',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: isSatisfied ? const Color(0xFF16A34A) : const Color(0xFFDC2626),
                        ),
                      ),
                      if (!isSatisfied)
                        Text(
                          '${10 - wordCount} more words needed',
                          style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                        ),
                    ],
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Dismiss', style: TextStyle(color: Colors.grey)),
                ),
                ElevatedButton(
                  onPressed: !isSatisfied
                      ? null
                      : () async {
                          Navigator.pop(ctx);
                          _executeAction(
                            file: file,
                            action: action,
                            remarks: textController.text.trim(),
                          );
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: action == 'Hold' ? const Color(0xFFD97706) : const Color(0xFFDC2626),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: Text('Confirm $action'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  // Stage 13 WiFi Exception Modal (Yes, No with mandatory reason)
  Future<void> _showWiFiNoReasonModal(Map<String, dynamic> file) async {
    final textController = TextEditingController();
    await showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        return AlertDialog(
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Row(
            children: [
              Icon(Icons.wifi_off_rounded, color: Color(0xFFDC2626)),
              SizedBox(width: 8),
              Text(
                'WiFi Not Synced Reason',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Please specify reason why WiFi sync could not be established (e.g. Customer router not available or network range issue):',
                style: TextStyle(fontSize: 12, color: Colors.black87),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: textController,
                maxLines: 3,
                decoration: InputDecoration(
                  hintText: 'Enter reason...',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  contentPadding: const EdgeInsets.all(12),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Back', style: TextStyle(color: Colors.grey)),
            ),
            ElevatedButton(
              onPressed: () {
                final reason = textController.text.trim();
                if (reason.isEmpty) return;
                Navigator.pop(ctx);
                _executeAction(
                  file: file,
                  action: 'No',
                  wifiReason: reason,
                  remarks: 'WiFi Not Connected: $reason',
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFDC2626),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              child: const Text('Submit No WiFi Exception'),
            ),
          ],
        );
      },
    );
  }

  // Stage 4 Photo Upload (Camera or Gallery)
  Future<void> _handleStage4PhotoUpload(Map<String, dynamic> file) async {
    final source = await ImageSourcePickerSheet.show(
      context: context,
      title: 'Meter Application Receiving Photo',
    );
    if (source == null) return;

    final picked = await _picker.pickImage(
      source: source,
      imageQuality: 80,
    );

    if (picked == null) return;

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Uploading Meter Receiving Photo...')),
    );

    try {
      final photoUrl = await _repository.uploadDocument(
        fileId: file['id'],
        file: File(picked.path),
        docType: 'Meter Application Photo',
      );

      await _executeAction(
        file: file,
        action: 'Submit',
        proofUrl: photoUrl,
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Upload failed: $e'), backgroundColor: Colors.red),
      );
    }
  }

  // Record Payment Modal (Accounts Desk)
  Future<void> _showAddPaymentModal(Map<String, dynamic> file) async {
    final amountController = TextEditingController();
    final refController = TextEditingController();
    String paymentMode = 'Cash';
    String paymentStage = (file['current_stage'] == 5) ? 'Pre-Install' : 'Post-Install';

    await showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return AlertDialog(
              backgroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: Text(
                'Record Payment (${file['file_number']})',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Customer: ${file['customer_name']}', style: const TextStyle(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 12),
                    const Text('Payment Stage', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    DropdownButtonFormField<String>(
                      isExpanded: true,
                      value: paymentStage,
                      decoration: InputDecoration(
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      ),
                      items: const [
                        DropdownMenuItem(value: 'Pre-Install', child: Text('Pre-Install Gate')),
                        DropdownMenuItem(value: 'Post-Install', child: Text('Post-Install Gate')),
                        DropdownMenuItem(value: 'Part-Payment', child: Text('Part Payment')),
                      ],
                      onChanged: (val) => setModalState(() => paymentStage = val!),
                    ),
                    const SizedBox(height: 12),
                    const Text('Amount (₹)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    TextField(
                      controller: amountController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        hintText: 'Enter amount...',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text('Payment Mode', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    DropdownButtonFormField<String>(
                      isExpanded: true,
                      value: paymentMode,
                      decoration: InputDecoration(
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      ),
                      items: const [
                        DropdownMenuItem(value: 'Cash', child: Text('Cash')),
                        DropdownMenuItem(value: 'Online/UPI', child: Text('Online / UPI')),
                        DropdownMenuItem(value: 'Cheque', child: Text('Cheque')),
                        DropdownMenuItem(value: 'Bank Transfer', child: Text('Bank Transfer (NEFT/RTGS)')),
                      ],
                      onChanged: (val) => setModalState(() => paymentMode = val!),
                    ),
                    const SizedBox(height: 12),
                    const Text('Reference / UTR / Cheque #', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    TextField(
                      controller: refController,
                      decoration: InputDecoration(
                        hintText: 'Optional ref number...',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
                ),
                ElevatedButton(
                  onPressed: () async {
                    final amt = double.tryParse(amountController.text.trim()) ?? 0;
                    if (amt <= 0) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Please enter valid amount')),
                      );
                      return;
                    }
                    Navigator.pop(ctx);
                    try {
                      await _repository.addPayment(
                        fileId: file['id'],
                        paymentStage: paymentStage,
                        amount: amt,
                        paymentMode: paymentMode,
                        referenceNumber: refController.text.trim(),
                      );
                      if (!mounted) return;
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Payment recorded successfully!'), backgroundColor: Colors.green),
                      );
                      _loadQueue();
                    } catch (e) {
                      if (!mounted) return;
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Payment failed: $e'), backgroundColor: Colors.red),
                      );
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF16A34A),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: const Text('Save Payment'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  // Rate Approval Action (For Super Admin Pawan Maan)
  Future<void> _handleRateApproval(Map<String, dynamic> file, String action) async {
    if (action == 'Hold') {
      await _showRemarkModal(file: file, action: 'Hold');
      return;
    }

    try {
      await _repository.updateRateApproval(fileId: file['id'], action: action);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Initial Rate $action successfully!'), backgroundColor: Colors.green),
      );
      _loadQueue();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Rate approval failed: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _executeAction({
    required Map<String, dynamic> file,
    required String action,
    String? remarks,
    String? proofUrl,
    String? wifiReason,
  }) async {
    try {
      await _repository.performStageAction(
        fileId: file['id'],
        stageNumber: file['current_stage'],
        action: action,
        remarks: remarks,
        proofUrl: proofUrl,
        wifiReason: wifiReason,
      );

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Stage action "$action" updated!'), backgroundColor: Colors.green),
      );
      _loadQueue();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed: $e'), backgroundColor: Colors.red),
      );
    }
  }

  // Detailed File Inspector Bottom Sheet
  void _openFileDetailSheet(Map<String, dynamic> file) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return DraggableScrollableSheet(
          initialChildSize: 0.75,
          maxChildSize: 0.95,
          minChildSize: 0.5,
          expand: false,
          builder: (context, scrollController) {
            return SingleChildScrollView(
              controller: scrollController,
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        file['file_number'] ?? '',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFF0B3A63)),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE0F2FE),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFFBAE6FD)),
                        ),
                        child: Text(
                          'Stage ${file['current_stage']}',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF005BAC)),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    file['customer_name'] ?? '',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  Text('Phone: ${file['phone_number']}'),
                  Text('AEN Office: ${file['aen_office'] ?? 'N/A'}'),
                  Text('K-Number: ${file['k_number'] ?? 'N/A'}'),
                  const Divider(height: 24),
                  const Text('System & Commercials', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  const SizedBox(height: 6),
                  Text('Total Project Cost: ₹${file['total_project_cost'] ?? 0}'),
                  Text('Financing: ${file['is_loan'] == 1 ? 'Bank Loan' : 'Self Funded / Cash'}'),
                  Text('Solar Panels: ${file['panel_company'] ?? 'N/A'} (${file['panel_wattage'] ?? 0}W)'),
                  Text('Inverter: ${file['inverter_company'] ?? 'N/A'} (${file['inverter_capacity_kw'] ?? 0} kW)'),
                  const Divider(height: 24),
                  const Text('Assigned Desk & Role', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  const SizedBox(height: 6),
                  Text('Stage Name: ${file['stage_name']}'),
                  Text('Assigned Desk: ${file['assigned_role']}'),
                  if (file['latest_remarks'] != null && file['latest_remarks'].toString().isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF3C7),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFFFDE68A)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Latest Remark:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF92400E))),
                          const SizedBox(height: 4),
                          Text('${file['latest_remarks']}', style: const TextStyle(fontSize: 13, color: Color(0xFF78350F))),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(ctx),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0B3A63),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      child: const Text('Close Details'),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  // 100% Matching Web 6-Desks Action Buttons
  Widget _buildStageButtons(Map<String, dynamic> file) {
    final int stage = file['current_stage'] is int
        ? file['current_stage']
        : int.tryParse('${file['current_stage']}') ?? 1;

    // Super Admin Rate Approval Gate
    if (_isAdmin && file['rate_approval_status'] == 'Pending') {
      return Container(
        margin: const EdgeInsets.only(top: 8),
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: const Color(0xFFFFFBEB),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0xFFFDE68A)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.verified_user_outlined, size: 16, color: Color(0xFFD97706)),
                SizedBox(width: 6),
                Text(
                  'Super Admin Initial Rate Approval Required',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Color(0xFF92400E)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => _handleRateApproval(file, 'Approved'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF16A34A),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                    ),
                    child: const Text('Approve Rate', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                  ),
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => _handleRateApproval(file, 'Hold'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFFD97706),
                      side: const BorderSide(color: Color(0xFFD97706)),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                    ),
                    child: const Text('Hold Rate', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ],
        ),
      );
    }

    // 🟢 1. Jitu Online Desk (Stage 0 & 1)
    if (stage == 0) {
      if (file['sub_pipeline_step'] == 'Step C') {
        return Wrap(
          spacing: 6,
          runSpacing: 6,
          children: [
            ElevatedButton(
              onPressed: () => _executeAction(file: file, action: 'Paid'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF16A34A),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
              ),
              child: const Text('Paid (Unlock Stg 1)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
            ),
            OutlinedButton(
              onPressed: () => _executeAction(file: file, action: 'Due'),
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFFD97706),
                side: const BorderSide(color: Color(0xFFD97706)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
              ),
              child: const Text('Due', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
            ),
            OutlinedButton(
              onPressed: () => _showRemarkModal(file: file, action: 'Hold'),
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFFD97706),
                side: const BorderSide(color: Color(0xFFD97706)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
              ),
              child: const Text('Hold', style: TextStyle(fontSize: 11)),
            ),
          ],
        );
      }
      return Row(
        children: [
          Expanded(
            child: ElevatedButton(
              onPressed: () => _executeAction(file: file, action: 'Submit'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF005BAC),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
              ),
              child: const Text('Submit Sub-File', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
            ),
          ),
          const SizedBox(width: 6),
          OutlinedButton(
            onPressed: () => _showRemarkModal(file: file, action: 'Hold'),
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFFD97706),
              side: const BorderSide(color: Color(0xFFD97706)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
            child: const Text('Hold', style: TextStyle(fontSize: 11)),
          ),
        ],
      );
    }

    if (stage == 1) {
      return Row(
        children: [
          Expanded(
            child: ElevatedButton(
              onPressed: () => _executeAction(file: file, action: 'Submit'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF16A34A),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
              ),
              child: const Text('Submit Filing', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
            ),
          ),
          const SizedBox(width: 6),
          OutlinedButton(
            onPressed: () => _showRemarkModal(file: file, action: 'Hold'),
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFFD97706),
              side: const BorderSide(color: Color(0xFFD97706)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
            child: const Text('Hold', style: TextStyle(fontSize: 11)),
          ),
        ],
      );
    }

    // 🔵 2. Rahul Loan Officer (Stage 2 & 10)
    if (stage == 2) {
      return Row(
        children: [
          Expanded(
            child: ElevatedButton(
              onPressed: () => _executeAction(file: file, action: 'Submit'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2563EB),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
              ),
              child: const Text('Sanction Approved', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
            ),
          ),
          const SizedBox(width: 6),
          OutlinedButton(
            onPressed: () => _showRemarkModal(file: file, action: 'Hold'),
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFFD97706),
              side: const BorderSide(color: Color(0xFFD97706)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
            child: const Text('Hold', style: TextStyle(fontSize: 11)),
          ),
        ],
      );
    }

    if (stage == 10) {
      return Row(
        children: [
          Expanded(
            child: ElevatedButton(
              onPressed: () => _executeAction(file: file, action: 'Submit'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF16A34A),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
              ),
              child: const Text('2nd Disbursement Done', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      );
    }

    // 🟠 3. Suresh Field Desk (Stage 3, 4, 9, 11, 12, 13, 14)
    if (stage == 4) {
      return Row(
        children: [
          Expanded(
            child: ElevatedButton.icon(
              onPressed: () => _handleStage4PhotoUpload(file),
              icon: const Icon(Icons.camera_alt, size: 16),
              label: const Text('Upload Photo & Submit', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFEA580C),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
              ),
            ),
          ),
          const SizedBox(width: 6),
          OutlinedButton(
            onPressed: () => _showRemarkModal(file: file, action: 'Hold'),
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFFD97706),
              side: const BorderSide(color: Color(0xFFD97706)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
            child: const Text('Hold', style: TextStyle(fontSize: 11)),
          ),
        ],
      );
    }

    if (stage == 11) {
      return Row(
        children: [
          Expanded(
            child: ElevatedButton(
              onPressed: () => _executeAction(file: file, action: 'Yes'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF16A34A),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
              ),
              child: const Text('Meter Installed (Yes)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
            ),
          ),
          const SizedBox(width: 6),
          OutlinedButton(
            onPressed: () => _executeAction(file: file, action: 'No'),
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFFDC2626),
              side: const BorderSide(color: Color(0xFFDC2626)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
            child: const Text('No', style: TextStyle(fontSize: 11)),
          ),
          const SizedBox(width: 6),
          OutlinedButton(
            onPressed: () => _showRemarkModal(file: file, action: 'Hold'),
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFFD97706),
              side: const BorderSide(color: Color(0xFFD97706)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
            child: const Text('Hold', style: TextStyle(fontSize: 11)),
          ),
        ],
      );
    }

    if (stage == 12 || stage == 14) {
      final label = stage == 12 ? 'Plant Started (Yes)' : 'Explanation Done (Yes)';
      return Row(
        children: [
          Expanded(
            child: ElevatedButton(
              onPressed: () => _executeAction(file: file, action: 'Yes'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF16A34A),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
              ),
              child: Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
            ),
          ),
          const SizedBox(width: 6),
          OutlinedButton(
            onPressed: () => _showRemarkModal(file: file, action: 'Hold'),
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFFD97706),
              side: const BorderSide(color: Color(0xFFD97706)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
            child: const Text('Hold', style: TextStyle(fontSize: 11)),
          ),
        ],
      );
    }

    if (stage == 13) {
      return Row(
        children: [
          Expanded(
            child: ElevatedButton(
              onPressed: () => _executeAction(file: file, action: 'Yes'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF16A34A),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
              ),
              child: const Text('WiFi Synced (Yes)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
            ),
          ),
          const SizedBox(width: 6),
          OutlinedButton(
            onPressed: () => _showWiFiNoReasonModal(file),
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFFDC2626),
              side: const BorderSide(color: Color(0xFFDC2626)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
            child: const Text('No (Reason)', style: TextStyle(fontSize: 11)),
          ),
          const SizedBox(width: 6),
          OutlinedButton(
            onPressed: () => _showRemarkModal(file: file, action: 'Hold'),
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFFD97706),
              side: const BorderSide(color: Color(0xFFD97706)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
            child: const Text('Hold', style: TextStyle(fontSize: 11)),
          ),
        ],
      );
    }

    // 🟢 4. Ashok & Pawan Accounts Desk (Stage 5, 7, 15)
    if (stage == 5 || stage == 7) {
      return Wrap(
        spacing: 6,
        runSpacing: 6,
        children: [
          ElevatedButton(
            onPressed: () => _executeAction(file: file, action: 'Clear'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF16A34A),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
            child: const Text('Clear (Green)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
          ),
          OutlinedButton(
            onPressed: () => _showRemarkModal(file: file, action: 'Hold'),
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFFDC2626),
              side: const BorderSide(color: Color(0xFFDC2626)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
            child: const Text('Hold (Red)', style: TextStyle(fontSize: 11)),
          ),
          OutlinedButton(
            onPressed: () => _showAddPaymentModal(file),
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFF005BAC),
              side: const BorderSide(color: Color(0xFF005BAC)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
            child: const Text('+ Record Pay', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
          ),
        ],
      );
    }

    if (stage == 15) {
      return Wrap(
        spacing: 6,
        runSpacing: 6,
        children: [
          ElevatedButton(
            onPressed: () => _executeAction(file: file, action: 'Submit'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF16A34A),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
            child: const Text('Clear Stg 15', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
          ),
          OutlinedButton(
            onPressed: () => _showRemarkModal(file: file, action: 'Hold'),
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFFD97706),
              side: const BorderSide(color: Color(0xFFD97706)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
            child: const Text('Hold', style: TextStyle(fontSize: 11)),
          ),
        ],
      );
    }

    // 🟡 5. Narendra Installation Desk (Stage 6)
    if (stage == 6) {
      return Wrap(
        spacing: 6,
        runSpacing: 6,
        children: [
          ElevatedButton(
            onPressed: file['stage_status'] == 'In Process'
                ? null
                : () => _executeAction(file: file, action: 'In Process'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0284C7),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
            child: Text(
              file['stage_status'] == 'In Process' ? 'In Process ✓' : 'In Process',
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
            ),
          ),
          ElevatedButton(
            onPressed: () => _executeAction(file: file, action: 'Submit'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF16A34A),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
            child: const Text('Completed', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
          ),
          OutlinedButton(
            onPressed: () => _showRemarkModal(file: file, action: 'Hold'),
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFFD97706),
              side: const BorderSide(color: Color(0xFFD97706)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
            child: const Text('Hold', style: TextStyle(fontSize: 11)),
          ),
        ],
      );
    }

    // 🟣 6. Moin Portal Entry Desk (Stage 8 & 17)
    if (stage == 8) {
      return Row(
        children: [
          Expanded(
            child: ElevatedButton(
              onPressed: () => _executeAction(file: file, action: 'Submit'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF7C3AED),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
              ),
              child: const Text('Portal Upload Done', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
            ),
          ),
          const SizedBox(width: 6),
          OutlinedButton(
            onPressed: () => _showRemarkModal(file: file, action: 'Hold'),
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFFD97706),
              side: const BorderSide(color: Color(0xFFD97706)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
            child: const Text('Hold', style: TextStyle(fontSize: 11)),
          ),
        ],
      );
    }

    if (stage == 17) {
      return Wrap(
        spacing: 6,
        runSpacing: 6,
        children: [
          ElevatedButton(
            onPressed: () => _executeAction(file: file, action: 'Yes'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF16A34A),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
            child: const Text('Yes (Claimed)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
          ),
          OutlinedButton(
            onPressed: () => _executeAction(file: file, action: 'No'),
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFFDC2626),
              side: const BorderSide(color: Color(0xFFDC2626)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
            child: const Text('No', style: TextStyle(fontSize: 11)),
          ),
          OutlinedButton(
            onPressed: () => _executeAction(file: file, action: 'Pending'),
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFFD97706),
              side: const BorderSide(color: Color(0xFFD97706)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
            child: const Text('Pending', style: TextStyle(fontSize: 11)),
          ),
        ],
      );
    }

    // Standard Fallback Stage Button
    return Row(
      children: [
        Expanded(
          child: ElevatedButton(
            onPressed: () => _executeAction(file: file, action: 'Submit'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0B3A63),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
            child: const Text('Submit Next Stage', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
          ),
        ),
        const SizedBox(width: 6),
        OutlinedButton(
          onPressed: () => _showRemarkModal(file: file, action: 'Hold'),
          style: OutlinedButton.styleFrom(
            foregroundColor: const Color(0xFFD97706),
            side: const BorderSide(color: Color(0xFFD97706)),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
          ),
          child: const Text('Hold', style: TextStyle(fontSize: 11)),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Back-Office Operations Hub',
              style: TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 18,
                color: AppColors.textPrimary,
                letterSpacing: -0.3,
              ),
            ),
            Text(
              'Desk: $_userRole | 17-Stage Pipeline',
              style: const TextStyle(
                fontSize: 11,
                color: AppColors.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.folder_shared_rounded, color: AppColors.primary),
            tooltip: 'Document Vault',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const DocumentRepositoryScreen(),
                ),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: AppColors.primary),
            tooltip: 'Refresh Queue',
            onPressed: _loadQueue,
          ),
          const SizedBox(width: 4),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Container(
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(
                bottom: BorderSide(color: Color(0xFFE2E8F0), width: 1),
              ),
            ),
            child: TabBar(
              controller: _tabController,
              indicatorColor: AppColors.primary,
              indicatorWeight: 3,
              labelColor: AppColors.primary,
              unselectedLabelColor: AppColors.textSecondary,
              labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
              tabs: [
                Tab(text: 'All (${_getFilteredFiles(0).length})'),
                Tab(text: 'Pending (${_getFilteredFiles(1).length})'),
                Tab(text: 'Done (${_getFilteredFiles(2).length})'),
                Tab(text: 'Hold (${_getFilteredFiles(3).length})'),
              ],
            ),
          ),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF005BAC)))
          : _errorMessage != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.info_outline_rounded, color: AppColors.primary, size: 48),
                        const SizedBox(height: 14),
                        const Text(
                          'Operations Desk Notice',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF0F172A)),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _errorMessage!,
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 12.5, color: Color(0xFF64748B), height: 1.4),
                        ),
                        const SizedBox(height: 18),
                        ElevatedButton.icon(
                          onPressed: _loadQueue,
                          icon: const Icon(Icons.refresh_rounded, size: 18),
                          label: const Text('Retry Connection'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              : Column(
                  children: [
                    // Search & Desk Filter Bar
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      color: Colors.white,
                      child: Column(
                        children: [
                          TextField(
                            controller: _searchController,
                            decoration: InputDecoration(
                              hintText: 'Search file #, customer, phone, AEN...',
                              hintStyle: const TextStyle(fontSize: 12, color: Colors.grey),
                              prefixIcon: const Icon(Icons.search, size: 20, color: Colors.grey),
                              suffixIcon: _searchQuery.isNotEmpty
                                  ? IconButton(
                                      icon: const Icon(Icons.clear, size: 18),
                                      onPressed: () {
                                        _searchController.clear();
                                        setState(() => _searchQuery = '');
                                      },
                                    )
                                  : null,
                              filled: true,
                              fillColor: const Color(0xFFF1F5F9),
                              contentPadding: const EdgeInsets.symmetric(vertical: 0),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10),
                                borderSide: BorderSide.none,
                              ),
                            ),
                            onChanged: (val) {
                              setState(() => _searchQuery = val.trim());
                            },
                          ),
                          // Dropdown for Admins to view any specific desk
                          if (_isAdmin) ...[
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                const Text(
                                  'Viewing Desk: ',
                                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF64748B)),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Container(
                                    height: 34,
                                    padding: const EdgeInsets.symmetric(horizontal: 10),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF1F5F9),
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: const Color(0xFFE2E8F0)),
                                    ),
                                    child: DropdownButtonHideUnderline(
                                      child: DropdownButton<String>(
                                        value: _selectedDeskFilter,
                                        isDense: true,
                                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF0F172A)),
                                        items: const [
                                          DropdownMenuItem(value: 'all', child: Text('⚡ Master Operations Hub (All 17 Stages)')),
                                          DropdownMenuItem(value: 'online', child: Text('Jitu — Discom Online & Modification (S0, S1)')),
                                          DropdownMenuItem(value: 'loan', child: Text('Rahul — Bank Loan & Sanction (S2, S10)')),
                                          DropdownMenuItem(value: 'field', child: Text('Suresh — Offline AEN & Commissioning')),
                                          DropdownMenuItem(value: 'accounts', child: Text('Ashok & Pawan — Accounts & Dual Ledger')),
                                          DropdownMenuItem(value: 'installation', child: Text('Narendra — Solar Installation (S6)')),
                                          DropdownMenuItem(value: 'portal', child: Text('Moin — Portal Entry & Subsidy (S8, S17)')),
                                        ],
                                        onChanged: (val) {
                                          if (val != null) {
                                            setState(() => _selectedDeskFilter = val);
                                          }
                                        },
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ],
                      ),
                    ),

                    // Tab Views
                    Expanded(
                      child: TabBarView(
                        controller: _tabController,
                        children: [0, 1, 2, 3].map((idx) {
                          final list = _getFilteredFiles(idx);
                          if (list.isEmpty) {
                            return Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.inventory_2_outlined, size: 48, color: Colors.grey[400]),
                                  const SizedBox(height: 8),
                                  Text(
                                    'No files found in this tab.',
                                    style: TextStyle(color: Colors.grey[600], fontSize: 14, fontWeight: FontWeight.w500),
                                  ),
                                ],
                              ),
                            );
                          }
                          return ListView.separated(
                            padding: const EdgeInsets.all(12),
                            itemCount: list.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 10),
                            itemBuilder: (context, i) {
                              if (list[i] is! Map) return const SizedBox.shrink();
                              final file = Map<String, dynamic>.from(list[i] as Map);
                              final slaColor = file['sla_color'] == 'red'
                                  ? const Color(0xFFDC2626)
                                  : file['sla_color'] == 'orange'
                                      ? const Color(0xFFD97706)
                                      : const Color(0xFF16A34A);

                              return Card(
                                elevation: 0,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  side: const BorderSide(color: Color(0xFFE2E8F0)),
                                ),
                                color: Colors.white,
                                child: InkWell(
                                  onTap: () => _openFileDetailSheet(file),
                                  borderRadius: BorderRadius.circular(12),
                                  child: Padding(
                                    padding: const EdgeInsets.all(14),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        // Header: File # & SLA Badge
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Row(
                                              children: [
                                                Text(
                                                  file['file_number'] ?? '',
                                                  style: const TextStyle(
                                                    fontWeight: FontWeight.w800,
                                                    fontSize: 14,
                                                    color: Color(0xFF0B3A63),
                                                  ),
                                                ),
                                                const SizedBox(width: 6),
                                                if (file['is_loan'] == 1)
                                                  Container(
                                                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                                                    decoration: BoxDecoration(
                                                      color: const Color(0xFFEFF6FF),
                                                      borderRadius: BorderRadius.circular(4),
                                                      border: Border.all(color: const Color(0xFFBFDBFE)),
                                                    ),
                                                    child: const Text('LOAN', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF1D4ED8))),
                                                  ),
                                              ],
                                            ),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                                              decoration: BoxDecoration(
                                                color: slaColor.withValues(alpha: 0.1),
                                                borderRadius: BorderRadius.circular(20),
                                                border: Border.all(color: slaColor.withValues(alpha: 0.3)),
                                              ),
                                              child: Row(
                                                children: [
                                                  Icon(Icons.timer_outlined, size: 12, color: slaColor),
                                                  const SizedBox(width: 4),
                                                  Text(
                                                    '${file['hours_remaining']}h left',
                                                    style: TextStyle(
                                                      fontSize: 10,
                                                      fontWeight: FontWeight.bold,
                                                      color: slaColor,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 6),
                                        // Customer Info
                                        Text(
                                          file['customer_name'] ?? '',
                                          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: Color(0xFF0F172A)),
                                        ),
                                        Text(
                                          '${file['phone_number']} • AEN: ${file['aen_office'] ?? 'N/A'}',
                                          style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                                        ),
                                        const SizedBox(height: 8),
                                        // Stage & Desk Indicator
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFF1F5F9),
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                          child: Row(
                                            children: [
                                              const Icon(Icons.account_tree_outlined, size: 14, color: Color(0xFF005BAC)),
                                              const SizedBox(width: 6),
                                              Expanded(
                                                child: Text(
                                                  'Stage ${file['current_stage']}: ${file['stage_name']} (${file['assigned_role']})',
                                                  style: const TextStyle(
                                                    fontWeight: FontWeight.w700,
                                                    fontSize: 11,
                                                    color: Color(0xFF1E293B),
                                                  ),
                                                  overflow: TextOverflow.ellipsis,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        // Remarks Alert if On Hold
                                        if (file['file_status'] == 'On Hold' && file['latest_remarks'] != null) ...[
                                          const SizedBox(height: 6),
                                          Container(
                                            padding: const EdgeInsets.all(6),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFFEF2F2),
                                              borderRadius: BorderRadius.circular(6),
                                              border: Border.all(color: const Color(0xFFFECACA)),
                                            ),
                                            child: Text(
                                              'Hold: "${file['latest_remarks']}"',
                                              style: const TextStyle(fontSize: 10, color: Color(0xFFDC2626), fontWeight: FontWeight.w500),
                                            ),
                                          ),
                                        ],
                                        const Divider(height: 18),
                                        // Action Buttons
                                        _buildStageButtons(file),
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            },
                          );
                        }).toList(),
                      ),
                    ),
                  ],
                ),
    );
  }
}
