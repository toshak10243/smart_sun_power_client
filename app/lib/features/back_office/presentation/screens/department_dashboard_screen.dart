import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../../sales/data/repositories/back_office_repository.dart';

class DepartmentDashboardScreen extends ConsumerStatefulWidget {
  final VoidCallback onOpenOperations;
  final String deskKey;

  const DepartmentDashboardScreen({
    super.key,
    required this.onOpenOperations,
    required this.deskKey,
  });

  @override
  ConsumerState<DepartmentDashboardScreen> createState() =>
      _DepartmentDashboardScreenState();
}

class _DepartmentDashboardScreenState
    extends ConsumerState<DepartmentDashboardScreen> {
  final _repository = BackOfficeRepository();
  bool _isLoading = true;
  String? _errorMessage;
  List<dynamic> _queueFiles = [];

  @override
  void initState() {
    super.initState();
    _fetchQueueData();
  }

  Future<void> _fetchQueueData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = await _repository.getMyQueue();
      if (!mounted) return;
      setState(() {
        _queueFiles = res['files'] ?? [];
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  Map<String, dynamic> _getDeskMeta(String userRole) {
    final r = userRole.toLowerCase();
    if (r.contains('online')) {
      return {
        'title': 'Discom Online Desk',
        'deskName': 'Jitu — Online Discom Specialist',
        'stages': ['Stage 0: Modification Sub-Branch', 'Stage 1: File Online (Discom Portal)'],
        'color': const Color(0xFF005BAC),
        'bgSoft': const Color(0xFFE0F2FE),
        'icon': Icons.language_rounded,
        'description': 'Discom portal submissions, modification applications, and load approvals.',
      };
    } else if (r.contains('field')) {
      return {
        'title': 'Offline AEN & Commissioning Desk',
        'deskName': 'Suresh — Offline & AEN Operations Lead',
        'stages': [
          'Stage 3: Offline File Submission',
          'Stage 4: Meter Application Photo',
          'Stage 9: Work Completion at AEN Office',
          'Stage 11: Net Meter Installed',
          'Stage 12: Solar Plant Commissioning',
          'Stage 13: WiFi Datalogger Setup',
          'Stage 14: Customer Handover & Explanation',
        ],
        'color': const Color(0xFFEA580C),
        'bgSoft': const Color(0xFFFFEDD5),
        'icon': Icons.home_work_rounded,
        'description': 'Offline Discom coordination, meter testing, plant activation, and handover.',
      };
    } else if (r.contains('loan')) {
      return {
        'title': 'Bank Loan & Finance Desk',
        'deskName': 'Rahul — Loan Officer',
        'stages': [
          'Stage 2: Bank Submission 1st Check',
          'Stage 10: Loan Disbursement 2nd Check',
        ],
        'color': const Color(0xFF2563EB),
        'bgSoft': const Color(0xFFDBEAFE),
        'icon': Icons.account_balance_rounded,
        'description': 'Nationalized & NBFC bank sanction approvals, document verification, and disbursements.',
      };
    } else if (r.contains('account')) {
      return {
        'title': 'Accounts & Dual Ledger Desk',
        'deskName': 'Ashok & Pawan — Accounts Team',
        'stages': [
          'Stage 5: Pre-Install Payment Check (80% / 100%)',
          'Stage 7: Post-Install Payment Verification',
          'Stage 15: Dual Ledger Audit & Final Settlement',
        ],
        'color': const Color(0xFF16A34A),
        'bgSoft': const Color(0xFFDCFCE7),
        'icon': Icons.account_balance_wallet_rounded,
        'description': 'Dual ledger payment recording, verification, receipts, and subsidy clearances.',
      };
    } else if (r.contains('install')) {
      return {
        'title': 'Solar Installation Desk',
        'deskName': 'Narendra — Installation Lead',
        'stages': [
          'Stage 6: Solar Structure, Panel & Inverter Installation',
        ],
        'color': const Color(0xFFD97706),
        'bgSoft': const Color(0xFFFEF3C7),
        'icon': Icons.engineering_rounded,
        'description': 'Site work execution, mechanical structure assembly, PV panel array mounting, and inverter wiring.',
      };
    } else if (r.contains('portal')) {
      return {
        'title': 'Portal Documentation & Subsidy Desk',
        'deskName': 'Moin — Portal Entry Specialist',
        'stages': [
          'Stage 8: Online Installation Details',
          'Stage 17: PM Surya Ghar Subsidy Redemption',
        ],
        'color': const Color(0xFF7C3AED),
        'bgSoft': const Color(0xFFEDE9FE),
        'icon': Icons.cloud_done_rounded,
        'description': 'National Portal photo uploads, work completion certificate, and final subsidy redemption.',
      };
    }

    return {
      'title': 'Operations Task Desk',
      'deskName': 'Operations Executive',
      'stages': ['All 17 Pipeline Stages'],
      'color': const Color(0xFF0B3A63),
      'bgSoft': const Color(0xFFE2E8F0),
      'icon': Icons.assignment_rounded,
      'description': 'Solar CRM end-to-end back-office operations and task verification.',
    };
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final fullName = user?['full_name'] ?? user?['name'] ?? 'Staff Member';
    final userRole = authState.userRole;
    final meta = _getDeskMeta(userRole);

    final totalCount = _queueFiles.length;
    final awaitingCount = _queueFiles.where((f) => f['stage_status'] != 'Done' && f['file_status'] != 'Hold').length;
    final holdCount = _queueFiles.where((f) => f['file_status'] == 'Hold').length;
    final doneCount = _queueFiles.where((f) => f['stage_status'] == 'Done').length;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        title: Row(
          children: [
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                color: const Color(0xFFE0F2FE),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(meta['icon'] as IconData, color: AppColors.primary, size: 18),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    meta['title'] as String,
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.2,
                    ),
                  ),
                  Text(
                    fullName,
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontSize: 11.5,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: AppColors.primary),
            tooltip: 'Refresh Dashboard',
            onPressed: _fetchQueueData,
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _errorMessage != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline_rounded, color: Colors.red, size: 40),
                        const SizedBox(height: 12),
                        Text(_errorMessage!, textAlign: TextAlign.center, style: const TextStyle(color: Colors.red)),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _fetchQueueData,
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                )
              : RefreshIndicator(
              onRefresh: _fetchQueueData,
              color: AppColors.primary,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // 1. HERO GREETING CARD
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.02),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 24,
                            backgroundColor: (meta['bgSoft'] as Color),
                            child: Icon(meta['icon'] as IconData, color: meta['color'] as Color, size: 24),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  meta['deskName'] as String,
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w800,
                                    color: Color(0xFF0F172A),
                                  ),
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  meta['description'] as String,
                                  style: const TextStyle(
                                    fontSize: 11,
                                    color: Color(0xFF64748B),
                                    height: 1.3,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // 2. 4 EXECUTIVE KPI STAT CARDS
                    RepaintBoundary(
                      child: Column(
                        children: [
                          Row(
                      children: [
                        Expanded(
                          child: _buildStatCard(
                            label: 'TOTAL QUEUE',
                            value: '$totalCount Orders',
                            sub: 'Assigned to Desk',
                            color: const Color(0xFF005BAC),
                            bg: const Color(0xFFE0F2FE),
                            icon: Icons.folder_open_rounded,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildStatCard(
                            label: 'AWAITING ACTION',
                            value: '$awaitingCount Tasks',
                            sub: 'Needs Verification',
                            color: const Color(0xFFD97706),
                            bg: const Color(0xFFFEF3C7),
                            icon: Icons.hourglass_top_rounded,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _buildStatCard(
                            label: 'HELD INQUIRIES',
                            value: '$holdCount Files',
                            sub: 'Logged Remarks',
                            color: const Color(0xFFDC2626),
                            bg: const Color(0xFFFEE2E2),
                            icon: Icons.pause_circle_outline_rounded,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildStatCard(
                            label: 'COMPLETED',
                            value: '$doneCount Done',
                            sub: 'Processed & Moved',
                            color: const Color(0xFF16A34A),
                            bg: const Color(0xFFDCFCE7),
                            icon: Icons.check_circle_outline_rounded,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

                    const SizedBox(height: 18),

                    // 3. JUMP TO OPERATIONS CTA BUTTON
                    InkWell(
                      onTap: widget.onOpenOperations,
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF005BAC), Color(0xFF0B3A63)],
                            begin: Alignment.centerLeft,
                            end: Alignment.centerRight,
                          ),
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF005BAC).withOpacity(0.3),
                              blurRadius: 8,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(Icons.task_alt_rounded, color: Colors.white, size: 20),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Open Live Operations Queue',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                    ),
                                  ),
                                  Text(
                                    '$awaitingCount pending tasks waiting for your action',
                                    style: TextStyle(
                                      color: Colors.white.withOpacity(0.85),
                                      fontSize: 11,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const Icon(Icons.arrow_forward_ios_rounded, color: Colors.white, size: 16),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 20),

                    // 4. ASSIGNED WORKFLOW STAGES
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.hub_rounded, size: 18, color: Color(0xFF0B3A63)),
                              const SizedBox(width: 8),
                              const Text(
                                'My Assigned Department Stages',
                                style: TextStyle(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 13,
                                  color: Color(0xFF0F172A),
                                ),
                              ),
                              const Spacer(),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF1F5F9),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  '${(meta['stages'] as List).length} Stages',
                                  style: const TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF64748B),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const Divider(height: 20, color: Color(0xFFF1F5F9)),
                          ...(meta['stages'] as List<String>).map((stageName) {
                            return Padding(
                              padding: const EdgeInsets.symmetric(vertical: 5),
                              child: Row(
                                children: [
                                  Container(
                                    width: 6,
                                    height: 6,
                                    decoration: BoxDecoration(
                                      color: meta['color'] as Color,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Text(
                                      stageName,
                                      style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        color: Color(0xFF334155),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }).toList(),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    // 5. RECENT PENDING TASKS PREVIEW
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Recent Pending Tasks',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                        TextButton(
                          onPressed: widget.onOpenOperations,
                          child: const Text('View All', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),

                    if (_queueFiles.isEmpty)
                      Container(
                        padding: const EdgeInsets.all(24),
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: const Center(
                          child: Column(
                            children: [
                              Icon(Icons.check_circle_outline, color: Colors.green, size: 36),
                              SizedBox(height: 8),
                              Text(
                                'No Pending Orders in Queue!',
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF0F172A)),
                              ),
                              SizedBox(height: 4),
                              Text(
                                'All tasks for your department are completed.',
                                style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                              ),
                            ],
                          ),
                        ),
                      )
                    else
                      ..._queueFiles.take(4).map((file) {
                        return Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 36,
                                height: 36,
                                decoration: BoxDecoration(
                                  color: const Color(0xFFE0F2FE),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Center(
                                  child: Text(
                                    'S${file['current_stage'] ?? 1}',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                      color: Color(0xFF005BAC),
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Text(
                                          file['file_number'] ?? '',
                                          style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 12,
                                            color: Color(0xFF0B3A63),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFF1F5F9),
                                            borderRadius: BorderRadius.circular(4),
                                          ),
                                          child: Text(
                                            '${file['system_capacity_kw'] ?? '—'} kW',
                                            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 3),
                                    Text(
                                      file['customer_name'] ?? 'Customer',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        color: Color(0xFF0F172A),
                                      ),
                                    ),
                                    Text(
                                      'AEN: ${file['aen_office'] ?? 'Discom'}',
                                      style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                                    ),
                                  ],
                                ),
                              ),
                              ElevatedButton(
                                onPressed: widget.onOpenOperations,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF005BAC),
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                  minimumSize: const Size(0, 30),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                                ),
                                child: const Text('Open', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildStatCard({
    required String label,
    required String value,
    required String sub,
    required Color color,
    required Color bg,
    required IconData icon,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF64748B),
                  letterSpacing: 0.5,
                ),
              ),
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: bg,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 14, color: color),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w900,
              color: color,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            sub,
            style: const TextStyle(
              fontSize: 10,
              color: Color(0xFF94A3B8),
            ),
          ),
        ],
      ),
    );
  }
}
