import 'package:flutter/material.dart';
import '../core/constants/app_colors.dart';
import '../features/sales/data/models/lead_model.dart';
import '../features/sales/data/sales_lead_service.dart';

class NotInterestedDialog extends StatefulWidget {
  final LeadModel lead;
  final VoidCallback onSuccess;

  const NotInterestedDialog({
    Key? key,
    required this.lead,
    required this.onSuccess,
  }) : super(key: key);

  static Future<void> show(BuildContext context, LeadModel lead, VoidCallback onSuccess) {
    return showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => NotInterestedDialog(lead: lead, onSuccess: onSuccess),
    );
  }

  @override
  State<NotInterestedDialog> createState() => _NotInterestedDialogState();
}

class _NotInterestedDialogState extends State<NotInterestedDialog> {
  final SalesLeadService _service = SalesLeadService();
  final TextEditingController _remarkCtrl = TextEditingController();

  static const List<String> _categories = [
    'Price issue',
    'Already installed',
    'Not interested in solar',
    'Competitor selected',
    'No response',
    'Other',
  ];

  String _selectedCategory = 'Price issue';
  String? _error;
  bool _submitting = false;

  int get _charCount {
    return _remarkCtrl.text.replaceAll(RegExp(r'\s+'), '').length;
  }

  @override
  void dispose() {
    _remarkCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _error = null);

    if (_charCount < 10) {
      setState(() {
        _error = 'Minimum 10 alphabets/characters required (Currently $_charCount).';
      });
      return;
    }

    setState(() => _submitting = true);

    final res = await _service.updateLeadStatus(widget.lead.id, {
      'status': 'Not Interested',
      'reason_category': _selectedCategory,
      'remark': _remarkCtrl.text.trim(),
    });

    if (!mounted) return;
    setState(() => _submitting = false);

    if (res['success'] == true) {
      Navigator.pop(context);
      widget.onSuccess();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Lead marked as Not Interested with verified reason.'),
          backgroundColor: AppColors.success,
        ),
      );
    } else {
      setState(() {
        _error = res['message'] ?? 'Failed to update status.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final count = _charCount;
    final isEnough = count >= 10;

    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: Row(
        children: const [
          Icon(Icons.remove_circle_outline, color: AppColors.danger, size: 24),
          SizedBox(width: 8),
          Text(
            'Mark Not Interested',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Reason Category *',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 6),
            DropdownButtonFormField<String>(
              value: _selectedCategory,
              isExpanded: true,
              decoration: InputDecoration(
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              ),
              items: _categories
                  .map((c) => DropdownMenuItem(value: c, child: Text(c, style: const TextStyle(fontSize: 14))))
                  .toList(),
              onChanged: (v) => setState(() => _selectedCategory = v!),
            ),
            const SizedBox(height: 14),

            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Detailed Explanation *',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: isEnough ? AppColors.successSoft : AppColors.dangerSoft,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    isEnough
                        ? '$count alphabets ✓'
                        : '$count / 10 alphabets (min 10 required)',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: isEnough ? AppColors.success : AppColors.danger,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            TextField(
              controller: _remarkCtrl,
              maxLines: 4,
              onChanged: (_) => setState(() => _error = null),
              decoration: InputDecoration(
                hintText: 'Explain customer objection (minimum 10 alphabets)...',
                hintStyle: const TextStyle(fontSize: 13),
                contentPadding: const EdgeInsets.all(12),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                errorText: _error,
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: _submitting ? null : () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: _submitting || !isEnough ? null : _submit,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.danger,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          ),
          child: _submitting
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                )
              : const Text('Confirm Not Interested', style: TextStyle(color: Colors.white)),
        ),
      ],
    );
  }
}
