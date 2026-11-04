import 'package:flutter/material.dart';
import '../core/constants/app_colors.dart';
import '../features/sales/data/models/lead_model.dart';
import '../features/sales/data/sales_lead_service.dart';

class AuditHistoryBottomSheet extends StatefulWidget {
  final int leadId;

  const AuditHistoryBottomSheet({Key? key, required this.leadId}) : super(key: key);

  static void show(BuildContext context, int leadId) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => FractionallySizedBox(
        heightFactor: 0.75,
        child: AuditHistoryBottomSheet(leadId: leadId),
      ),
    );
  }

  @override
  State<AuditHistoryBottomSheet> createState() => _AuditHistoryBottomSheetState();
}

class _AuditHistoryBottomSheetState extends State<AuditHistoryBottomSheet> {
  final SalesLeadService _service = SalesLeadService();
  List<ActivityLogModel> _logs = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadLogs();
  }

  Future<void> _loadLogs() async {
    setState(() => _loading = true);
    final res = await _service.getActivityLogs(widget.leadId);
    if (!mounted) return;
    setState(() {
      _logs = (res['logs'] as List<ActivityLogModel>?) ?? [];
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: const [
                  Icon(Icons.history_rounded, color: AppColors.primary, size: 22),
                  SizedBox(width: 8),
                  Text(
                    'Audit Log & History',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const Divider(),
          const SizedBox(height: 8),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _logs.isEmpty
                    ? const Center(
                        child: Text(
                          'No audit trail entries found.',
                          style: TextStyle(color: AppColors.textSecondary),
                        ),
                      )
                    : ListView.builder(
                        itemCount: _logs.length,
                        itemBuilder: (context, i) {
                          final l = _logs[i];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 10),
                            elevation: 1,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        l.actionType,
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                      ),
                                      Text(
                                        l.createdAt ?? '',
                                        style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Performed By: ${l.performedByName ?? "System"}',
                                    style: const TextStyle(fontSize: 12, color: AppColors.textPrimary),
                                  ),
                                  if (l.oldValue != null || l.newValue != null) ...[
                                    const SizedBox(height: 4),
                                    Text(
                                      '${l.oldValue ?? "Initial"} ➔ ${l.newValue ?? "Updated"}',
                                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.primary),
                                    ),
                                  ],
                                  if (l.remark != null && l.remark!.isNotEmpty) ...[
                                    const SizedBox(height: 4),
                                    Text(
                                      '"${l.remark}"',
                                      style: const TextStyle(fontSize: 12, fontStyle: FontStyle.italic, color: AppColors.textSecondary),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
