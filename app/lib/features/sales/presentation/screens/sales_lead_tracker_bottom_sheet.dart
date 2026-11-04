import 'package:flutter/material.dart';
import 'package:solar_crm_mobile/core/constants/app_colors.dart';
import 'package:solar_crm_mobile/features/sales/data/repositories/back_office_repository.dart';

class SalesLeadTrackerBottomSheet extends StatefulWidget {
  final int leadId;
  final String leadName;

  const SalesLeadTrackerBottomSheet({
    super.key,
    required this.leadId,
    required this.leadName,
  });

  static Future<void> show(BuildContext context, int leadId, String leadName) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => SalesLeadTrackerBottomSheet(leadId: leadId, leadName: leadName),
    );
  }

  @override
  State<SalesLeadTrackerBottomSheet> createState() => _SalesLeadTrackerBottomSheetState();
}

class _SalesLeadTrackerBottomSheetState extends State<SalesLeadTrackerBottomSheet> {
  final _repository = BackOfficeRepository();
  bool _isLoading = true;
  Map<String, dynamic>? _trackerData;
  String? _error;

  final List<String> _stagesList = [
    "File Online",
    "Loan 1st Check",
    "Offline File",
    "Meter Application Photo",
    "Pre-Install Payment",
    "Installation Work",
    "Post-Install Payment",
    "Online Installation Details",
    "Work Completion at AEN",
    "Loan 2nd Check",
    "Meter Installed",
    "Plant Start",
    "WiFi Connected",
    "Customer Explanation",
    "Payment Ledger Verification",
    "Final Closing",
    "Subsidy Redeemed",
  ];

  @override
  void initState() {
    super.initState();
    _loadTracker();
  }

  Future<void> _loadTracker() async {
    try {
      final res = await _repository.getSalesTracker(widget.leadId);
      setState(() {
        _trackerData = res;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Drag handle & Header
          Container(
            margin: const EdgeInsets.only(top: 12, bottom: 8),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Live Pipeline Tracker',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                    ),
                    Text(
                      widget.leadName,
                      style: TextStyle(fontSize: 13, color: Colors.grey[600]),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Content
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24.0),
                          child: Text(_error!, style: const TextStyle(color: Colors.grey)),
                        ),
                      )
                    : _buildTrackerView(),
          ),
        ],
      ),
    );
  }

  Widget _buildTrackerView() {
    final currentStage = _trackerData?['current_stage'] ?? 1;
    final fileStatus = _trackerData?['file_status'] ?? 'Active';
    final totalCost = _trackerData?['total_project_cost'] ?? 0;
    final totalPaid = _trackerData?['total_paid'] ?? 0;
    final balanceDue = _trackerData?['balance_due'] ?? 0;
    final timeline = (_trackerData?['timeline'] as List<dynamic>?) ?? [];

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        // Financial Snapshot
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _statItem('Total Cost', '₹$totalCost', AppColors.primaryDark),
                  _statItem('Advance Paid', '₹$totalPaid', Colors.green),
                  _statItem('Balance Due', '₹$balanceDue', Colors.red),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'File: ${_trackerData?['file_number'] ?? ''}',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: fileStatus == 'On Hold' ? Colors.orange[100] : Colors.blue[100],
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      fileStatus == 'On Hold' ? 'ON HOLD' : 'IN PROGRESS',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: fileStatus == 'On Hold' ? Colors.orange[900] : Colors.blue[900],
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        const SizedBox(height: 24),
        Text(
          'Pipeline Stages ($currentStage / 17)',
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        const SizedBox(height: 12),

        // Stages List
        ...List.generate(_stagesList.length, (idx) {
          final stageNum = idx + 1;
          final isPast = stageNum < currentStage;
          final isCurrent = stageNum == currentStage;
          final matchingLog = timeline.firstWhere(
            (l) => l['stage_number'] == stageNum,
            orElse: () => null,
          );

          Color iconColor = Colors.grey[400]!;
          IconData iconData = Icons.radio_button_unchecked;

          if (isPast) {
            iconColor = Colors.green;
            iconData = Icons.check_circle;
          } else if (isCurrent) {
            iconColor = fileStatus == 'On Hold' ? Colors.orange : AppColors.primary;
            iconData = fileStatus == 'On Hold' ? Icons.pause_circle_filled : Icons.play_circle_fill;
          }

          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Column(
                  children: [
                    Icon(iconData, color: iconColor, size: 22),
                    if (idx < _stagesList.length - 1)
                      Container(
                        width: 2,
                        height: 34,
                        color: isPast ? Colors.green : Colors.grey[300],
                      ),
                  ],
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '$stageNum. ${_stagesList[idx]}',
                            style: TextStyle(
                              fontWeight: isCurrent ? FontWeight.bold : FontWeight.w500,
                              fontSize: 14,
                              color: isCurrent ? Colors.black : Colors.grey[700],
                            ),
                          ),
                          if (isCurrent)
                            Text(
                              fileStatus == 'On Hold' ? 'HOLD' : 'ACTIVE',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: fileStatus == 'On Hold' ? Colors.orange : AppColors.primary,
                              ),
                            ),
                        ],
                      ),
                      if (matchingLog != null && matchingLog['remarks'] != null)
                        Container(
                          margin: const EdgeInsets.only(top: 4),
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.red[50],
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.red[200]!),
                          ),
                          child: Text(
                            'Hold Reason: "${matchingLog['remarks']}"',
                            style: TextStyle(
                              fontSize: 11,
                              fontStyle: FontStyle.italic,
                              color: Colors.red[900],
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          );
        }),
      ],
    );
  }

  Widget _statItem(String label, String value, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(fontSize: 11, color: Colors.grey[600])),
        const SizedBox(height: 2),
        Text(
          value,
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: color),
        ),
      ],
    );
  }
}
