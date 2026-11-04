import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/constants/app_colors.dart';
import '../../data/manager_assignments_service.dart';

// ============================================================================
// 1. MASTER VIEW: MANAGERS DIRECTORY WITH ASSIGNMENTS SUMMARY
// ============================================================================
class ManagerAssignmentsScreen extends StatefulWidget {
  const ManagerAssignmentsScreen({super.key});

  @override
  State<ManagerAssignmentsScreen> createState() => _ManagerAssignmentsScreenState();
}

class _ManagerAssignmentsScreenState extends State<ManagerAssignmentsScreen> {
  final ManagerAssignmentsService _service = ManagerAssignmentsService();

  List<dynamic> _managers = [];
  bool _isLoading = true;
  String? _errorMessage;

  final TextEditingController _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchManagers();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchManagers() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final res = await _service.fetchManagersSummary();

    if (mounted) {
      if (res['success'] == true) {
        setState(() {
          _managers = res['managers'] as List;
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = res['message']?.toString() ?? 'Failed to load manager assignments.';
          _isLoading = false;
        });
      }
    }
  }

  List<dynamic> get _filteredManagers {
    final q = _searchCtrl.text.trim().toLowerCase();
    if (q.isEmpty) return _managers;
    return _managers.where((m) {
      final name = m['full_name']?.toString().toLowerCase() ?? '';
      final email = m['email']?.toString().toLowerCase() ?? '';
      final phone = m['phone']?.toString().toLowerCase() ?? '';
      final username = m['username']?.toString().toLowerCase() ?? '';
      return name.contains(q) || email.contains(q) || phone.contains(q) || username.contains(q);
    }).toList();
  }

  String _getInitials(String? name) {
    if (name == null || name.trim().isEmpty) return 'M';
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts[0].isEmpty) return 'M';
    if (parts.length == 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  String? _resolveAvatar(String? imgPath) {
    if (imgPath == null || imgPath.isEmpty || imgPath == 'null' || imgPath == 'undefined') {
      return null;
    }
    if (imgPath.startsWith('http')) return imgPath;
    var clean = imgPath.startsWith('/') ? imgPath.substring(1) : imgPath;
    if (!clean.startsWith('uploads/profiles/')) {
      if (clean.startsWith('uploads/')) {
        clean = clean.replaceFirst('uploads/', 'uploads/profiles/');
      } else {
        clean = 'uploads/profiles/$clean';
      }
    }
    return '${ApiEndpoints.baseUrl.replaceAll('/api', '')}/$clean';
  }

  @override
  Widget build(BuildContext context) {
    final totalManagers = _managers.length;
    final totalAssignedLeads = _managers.fold<int>(
      0,
      (sum, m) => sum + (int.tryParse(m['total_assigned_leads']?.toString() ?? '0') ?? 0),
    );
    final totalActiveReps = _managers.fold<int>(
      0,
      (sum, m) => sum + (int.tryParse(m['active_team_members']?.toString() ?? '0') ?? 0),
    );

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Manager Assignments',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
            Text('Super Admin Team & Lead Allocation',
                style: TextStyle(
                    fontSize: 11,
                    color: AppColors.textSecondary,
                    fontWeight: FontWeight.w500)),
          ],
        ),
        elevation: 0,
        backgroundColor: AppColors.card,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: AppColors.primary),
            onPressed: () => _fetchManagers(),
            tooltip: 'Refresh',
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: SafeArea(
        child: _isLoading
            ? const Center(
                child: CircularProgressIndicator(
                    color: AppColors.primary, strokeWidth: 2.5),
              )
            : RefreshIndicator(
                onRefresh: _fetchManagers,
                color: AppColors.primary,
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(
                      parent: BouncingScrollPhysics()),
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (_errorMessage != null) ...[
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                              color: AppColors.dangerSoft,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                  color: AppColors.danger.withOpacity(0.3))),
                          child: Row(
                            children: [
                              const Icon(Icons.error_outline_rounded,
                                  size: 18, color: AppColors.danger),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(_errorMessage!,
                                    style: const TextStyle(
                                        color: AppColors.danger,
                                        fontWeight: FontWeight.w600,
                                        fontSize: 12.5)),
                              ),
                              TextButton(
                                onPressed: () => _fetchManagers(),
                                child: const Text('Retry',
                                    style: TextStyle(
                                        fontWeight: FontWeight.w800,
                                        color: AppColors.danger)),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],

                      // 1. KPI SUMMARY CARDS
                      GridView.count(
                        crossAxisCount: 2,
                        crossAxisSpacing: 10,
                        mainAxisSpacing: 10,
                        childAspectRatio: 1.8,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        children: [
                          _buildKpiCard(
                            'TOTAL MANAGERS',
                            '$totalManagers',
                            'Lead Controllers',
                            Icons.manage_accounts_rounded,
                            AppColors.primaryDark,
                            AppColors.primarySoft,
                          ),
                          _buildKpiCard(
                            'ASSIGNED LEADS',
                            '$totalAssignedLeads',
                            'Across all managers',
                            Icons.assignment_ind_rounded,
                            AppColors.primary,
                            AppColors.primarySoft,
                          ),
                          _buildKpiCard(
                            'ACTIVE TEAM REPS',
                            '$totalActiveReps',
                            'Sales Personnel',
                            Icons.groups_rounded,
                            AppColors.purple,
                            AppColors.purpleSoft,
                          ),
                          _buildKpiCard(
                            'AVG LEADS / MGR',
                            totalManagers > 0
                                ? (totalAssignedLeads / totalManagers).toStringAsFixed(1)
                                : '0',
                            'Team distribution',
                            Icons.insights_rounded,
                            AppColors.success,
                            AppColors.successSoft,
                          ),
                        ],
                      ),

                      const SizedBox(height: 16),

                      // 2. SEARCH BAR
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                            color: AppColors.card,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: AppColors.border)),
                        child: TextField(
                          controller: _searchCtrl,
                          onChanged: (_) => setState(() {}),
                          style: const TextStyle(
                              fontSize: 13, fontWeight: FontWeight.w600),
                          decoration: InputDecoration(
                            hintText: 'Search manager name, phone, email...',
                            hintStyle: const TextStyle(
                                fontSize: 12.5, color: AppColors.textMuted),
                            prefixIcon: const Icon(Icons.search_rounded,
                                size: 20, color: AppColors.primary),
                            suffixIcon: _searchCtrl.text.isNotEmpty
                                ? IconButton(
                                    icon: const Icon(Icons.clear_rounded, size: 18),
                                    onPressed: () => setState(() => _searchCtrl.clear()),
                                  )
                                : null,
                            border: InputBorder.none,
                            isDense: true,
                            contentPadding: const EdgeInsets.symmetric(vertical: 8),
                          ),
                        ),
                      ),

                      const SizedBox(height: 16),

                      // 3. MANAGERS LIST
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'MANAGERS DIRECTORY',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              color: AppColors.primaryDark,
                              letterSpacing: 0.5,
                            ),
                          ),
                          Text(
                            '${_filteredManagers.length} Managers',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),

                      if (_filteredManagers.isEmpty)
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(32),
                          decoration: BoxDecoration(
                              color: AppColors.card,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: AppColors.border)),
                          child: const Column(
                            children: [
                              Icon(Icons.group_off_outlined,
                                  size: 40, color: AppColors.textMuted),
                              SizedBox(height: 12),
                              Text('No Managers Found',
                                  style: TextStyle(
                                      fontWeight: FontWeight.w800,
                                      fontSize: 15,
                                      color: AppColors.textPrimary)),
                              SizedBox(height: 4),
                              Text('Try adjusting your search query.',
                                  style: TextStyle(
                                      fontSize: 12,
                                      color: AppColors.textSecondary)),
                            ],
                          ),
                        )
                      else
                        ListView.separated(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: _filteredManagers.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            final mgr = _filteredManagers[index];
                            final id = mgr['id'];
                            final name = mgr['full_name']?.toString() ?? 'Manager';
                            final username = mgr['username']?.toString() ?? '';
                            final phone = mgr['phone']?.toString() ?? 'No Phone';
                            final email = mgr['email']?.toString() ?? 'No Email';
                            final totalLeads = int.tryParse(mgr['total_assigned_leads']?.toString() ?? '0') ?? 0;
                            final activeReps = int.tryParse(mgr['active_team_members']?.toString() ?? '0') ?? 0;
                            final wonLeads = int.tryParse(mgr['won_leads']?.toString() ?? '0') ?? 0;
                            final avatarUrl = _resolveAvatar(mgr['profile_image']?.toString());
                            final isMgrActive = mgr['status'] == 'Active';

                            return Container(
                              decoration: BoxDecoration(
                                color: AppColors.card,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: AppColors.border),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.02),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Material(
                                color: Colors.transparent,
                                borderRadius: BorderRadius.circular(16),
                                child: InkWell(
                                  borderRadius: BorderRadius.circular(16),
                                  onTap: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (_) => ManagerAssignedLeadsScreen(manager: mgr),
                                      ),
                                    );
                                  },
                                  child: Padding(
                                    padding: const EdgeInsets.all(16),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        // Header Row: Avatar + Info + Arrow
                                        Row(
                                          children: [
                                            CircleAvatar(
                                              radius: 24,
                                              backgroundColor: AppColors.primaryDark,
                                              backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl) : null,
                                              child: avatarUrl == null
                                                  ? Text(_getInitials(name),
                                                      style: const TextStyle(
                                                          color: Colors.white,
                                                          fontWeight: FontWeight.w800,
                                                          fontSize: 14))
                                                  : null,
                                            ),
                                            const SizedBox(width: 12),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Row(
                                                    children: [
                                                      Flexible(
                                                        child: Text(
                                                          name,
                                                          style: const TextStyle(
                                                            fontSize: 15,
                                                            fontWeight: FontWeight.w800,
                                                            color: AppColors.textPrimary,
                                                          ),
                                                          overflow: TextOverflow.ellipsis,
                                                        ),
                                                      ),
                                                      const SizedBox(width: 6),
                                                      Container(
                                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                        decoration: BoxDecoration(
                                                          color: isMgrActive ? AppColors.successSoft : AppColors.dangerSoft,
                                                          borderRadius: BorderRadius.circular(6),
                                                        ),
                                                        child: Text(
                                                          isMgrActive ? 'ACTIVE' : 'INACTIVE',
                                                          style: TextStyle(
                                                            fontSize: 9,
                                                            fontWeight: FontWeight.w800,
                                                            color: isMgrActive ? AppColors.success : AppColors.danger,
                                                          ),
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                  const SizedBox(height: 2),
                                                  Text(
                                                    '@$username • ID: #$id',
                                                    style: const TextStyle(
                                                      fontSize: 11.5,
                                                      color: AppColors.textSecondary,
                                                      fontWeight: FontWeight.w500,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                            const Icon(Icons.arrow_forward_ios_rounded,
                                                size: 16, color: AppColors.textMuted),
                                          ],
                                        ),

                                        const SizedBox(height: 12),
                                        const Divider(height: 1, color: AppColors.border),
                                        const SizedBox(height: 12),

                                        // Contact details
                                        Row(
                                          children: [
                                            const Icon(Icons.phone_outlined, size: 14, color: AppColors.textMuted),
                                            const SizedBox(width: 6),
                                            Text(phone,
                                                style: const TextStyle(
                                                    fontSize: 12,
                                                    color: AppColors.textPrimary,
                                                    fontWeight: FontWeight.w600)),
                                            const SizedBox(width: 16),
                                            const Icon(Icons.email_outlined, size: 14, color: AppColors.textMuted),
                                            const SizedBox(width: 6),
                                            Expanded(
                                              child: Text(email,
                                                  style: const TextStyle(
                                                      fontSize: 12,
                                                      color: AppColors.textSecondary),
                                                  overflow: TextOverflow.ellipsis),
                                            ),
                                          ],
                                        ),

                                        const SizedBox(height: 12),

                                        // Badges Row: Assigned Leads + Team Size
                                        Wrap(
                                          spacing: 8,
                                          runSpacing: 6,
                                          children: [
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                              decoration: BoxDecoration(
                                                color: AppColors.primarySoft,
                                                borderRadius: BorderRadius.circular(10),
                                              ),
                                              child: Row(
                                                mainAxisSize: MainAxisSize.min,
                                                children: [
                                                  const Icon(Icons.assignment_ind_rounded,
                                                      size: 14, color: AppColors.primaryDark),
                                                  const SizedBox(width: 6),
                                                  Text(
                                                    '$totalLeads Leads Assigned',
                                                    style: const TextStyle(
                                                      fontSize: 12,
                                                      fontWeight: FontWeight.w800,
                                                      color: AppColors.primaryDark,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                              decoration: BoxDecoration(
                                                color: AppColors.purpleSoft,
                                                borderRadius: BorderRadius.circular(10),
                                              ),
                                              child: Row(
                                                mainAxisSize: MainAxisSize.min,
                                                children: [
                                                  const Icon(Icons.groups_rounded,
                                                      size: 14, color: AppColors.purple),
                                                  const SizedBox(width: 6),
                                                  Text(
                                                    '$activeReps Active Reps',
                                                    style: const TextStyle(
                                                      fontSize: 12,
                                                      fontWeight: FontWeight.w800,
                                                      color: AppColors.purple,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ],
                                        ),

                                        if (wonLeads > 0) ...[
                                          const SizedBox(height: 8),
                                          Text(
                                            'Won Deals: $wonLeads closed',
                                            style: const TextStyle(
                                                fontSize: 11,
                                                fontWeight: FontWeight.w600,
                                                color: AppColors.success),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                    ],
                  ),
                ),
              ),
      ),
    );
  }

  Widget _buildKpiCard(String label, String value, String subtext,
      IconData icon, Color color, Color bgColor) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                label,
                style: const TextStyle(
                    fontSize: 9.5,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textSecondary,
                    letterSpacing: 0.3),
              ),
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: bgColor,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 14, color: color),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
                fontSize: 17, fontWeight: FontWeight.w900, color: color),
          ),
          Text(
            subtext,
            style: const TextStyle(
                fontSize: 9.5,
                color: AppColors.textMuted,
                fontWeight: FontWeight.w500),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

// ============================================================================
// 2. DRILL-DOWN VIEW: LEADS ASSIGNED BY SPECIFIC MANAGER
// ============================================================================
class ManagerAssignedLeadsScreen extends StatefulWidget {
  final dynamic manager;
  const ManagerAssignedLeadsScreen({super.key, required this.manager});

  @override
  State<ManagerAssignedLeadsScreen> createState() => _ManagerAssignedLeadsScreenState();
}

class _ManagerAssignedLeadsScreenState extends State<ManagerAssignedLeadsScreen> {
  final ManagerAssignmentsService _service = ManagerAssignmentsService();

  List<dynamic> _leads = [];
  bool _isLoading = true;
  String? _errorMessage;

  final TextEditingController _searchCtrl = TextEditingController();
  String _statusFilter = 'ALL';

  final List<String> _statusOptions = [
    'New Lead',
    'Contacted',
    'Follow-up Pending',
    'Site Visit Scheduled',
    'Quotation Sent',
    'Negotiation',
    'Won',
    'Lost',
    'Not Interested',
  ];

  @override
  void initState() {
    super.initState();
    _fetchLeads();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchLeads() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final res = await _service.fetchManagerLeads(
      widget.manager['id'],
      search: _searchCtrl.text.trim(),
      status: _statusFilter,
    );

    if (mounted) {
      if (res['success'] == true) {
        setState(() {
          _leads = res['leads'] as List;
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = res['message']?.toString() ?? 'Failed to load manager leads.';
          _isLoading = false;
        });
      }
    }
  }

  List<dynamic> get _filteredLeads {
    final q = _searchCtrl.text.trim().toLowerCase();
    return _leads.where((l) {
      final code = l['lead_code']?.toString().toLowerCase() ?? '';
      final name = l['customer_name']?.toString().toLowerCase() ?? '';
      final phone = l['mobile_number']?.toString().toLowerCase() ?? '';
      final rep = l['assigned_to_name']?.toString().toLowerCase() ?? '';
      final city = l['city']?.toString().toLowerCase() ?? '';

      final matchesQuery = q.isEmpty ||
          code.contains(q) ||
          name.contains(q) ||
          phone.contains(q) ||
          rep.contains(q) ||
          city.contains(q);

      final matchesStatus = _statusFilter == 'ALL' || l['status'] == _statusFilter;

      return matchesQuery && matchesStatus;
    }).toList();
  }

  String _formatDate(String? value) {
    if (value == null || value.isEmpty || value == 'null') return '—';
    try {
      final d = DateTime.parse(value).toLocal();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return '${d.day.toString().padLeft(2, '0')} ${months[d.month - 1]} ${d.year}';
    } catch (_) {
      return value;
    }
  }

  void _makePhoneCall(String? phone) async {
    if (phone == null || phone.trim().isEmpty) return;
    final uri = Uri.parse('tel:${phone.trim()}');
    try {
      if (await canLaunchUrl(uri)) await launchUrl(uri);
    } catch (_) {}
  }

  void _openWhatsApp(String? phone) async {
    if (phone == null || phone.trim().isEmpty) return;
    final clean = phone.replaceAll(RegExp(r'\D'), '');
    final fullNumber = clean.length == 10 ? '91$clean' : clean;
    final uri = Uri.parse('https://wa.me/$fullNumber');
    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    } catch (_) {}
  }

  void _openLeadDetailSheet(dynamic lead) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => FractionallySizedBox(
        heightFactor: 0.75,
        child: Container(
          decoration: const BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: SafeArea(
            child: Column(
              children: [
                // Sheet Handle
                Center(
                  child: Container(
                    margin: const EdgeInsets.only(top: 10, bottom: 8),
                    width: 38,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppColors.borderStrong,
                      borderRadius: BorderRadius.circular(2),
                    ),
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
                          Text('Lead #${lead['lead_code'] ?? ''}',
                              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                          Text(lead['customer_name']?.toString() ?? '',
                              style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                        ],
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1, color: AppColors.border),
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.all(20),
                    children: [
                      _detailRow('Customer Name', lead['customer_name']?.toString() ?? '—'),
                      _detailRow('Phone Number', lead['mobile_number']?.toString() ?? '—'),
                      _detailRow('Email', lead['email']?.toString() ?? '—'),
                      _detailRow('City & State', '${lead['city'] ?? '—'}, ${lead['state'] ?? '—'}'),
                      _detailRow('Assigned Sales Rep', lead['assigned_to_name']?.toString() ?? 'Unassigned'),
                      _detailRow('Assigned By Manager', lead['assigned_by_name']?.toString() ?? widget.manager['full_name']),
                      _detailRow('Solar Requirement', lead['solar_requirement']?.toString() ?? 'Residential'),
                      _detailRow('Required Capacity', lead['required_kw'] != null ? '${lead['required_kw']} kW' : '—'),
                      _detailRow('Pipeline Status', lead['status']?.toString() ?? 'New Lead'),
                      _detailRow('Quotation Amount', lead['quotation_amount'] != null ? '₹${lead['quotation_amount']}' : 'Not Sent'),
                      _detailRow('Assigned Date', _formatDate(lead['created_at']?.toString())),
                      if (lead['remark'] != null && lead['remark'].toString().isNotEmpty)
                        _detailRow('Remark', lead['remark'].toString()),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 140,
            child: Text(label,
                style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                    fontWeight: FontWeight.w600)),
          ),
          Expanded(
            child: Text(value,
                style: const TextStyle(
                    fontSize: 12.5,
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final mgrName = widget.manager['full_name']?.toString() ?? 'Manager';

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('$mgrName\'s Leads',
                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
            Text('Manager Assigned Leads Drill-down',
                style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textSecondary,
                    fontWeight: FontWeight.w500)),
          ],
        ),
        elevation: 0,
        backgroundColor: AppColors.card,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: AppColors.primary),
            onPressed: _fetchLeads,
            tooltip: 'Refresh',
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Manager Info Banner
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: const BoxDecoration(
                color: AppColors.card,
                border: Border(bottom: BorderSide(color: AppColors.border)),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 18,
                    backgroundColor: AppColors.primaryDark,
                    child: Text(
                      mgrName.isNotEmpty ? mgrName[0].toUpperCase() : 'M',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          mgrName,
                          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13.5),
                        ),
                        Text(
                          '${widget.manager['email']} • ${_filteredLeads.length} Leads found',
                          style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            if (_errorMessage != null)
              Container(
                margin: const EdgeInsets.all(12),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.dangerSoft,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline_rounded, size: 18, color: AppColors.danger),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(color: AppColors.danger, fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                    ),
                    TextButton(
                      onPressed: _fetchLeads,
                      child: const Text('Retry', style: TextStyle(color: AppColors.danger, fontWeight: FontWeight.w800)),
                    ),
                  ],
                ),
              ),

            // Search & Filter Bar
            Container(
              padding: const EdgeInsets.all(12),
              color: AppColors.card,
              child: Column(
                children: [
                  TextField(
                    controller: _searchCtrl,
                    onChanged: (_) => setState(() {}),
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                    decoration: InputDecoration(
                      hintText: 'Search customer, code, rep, city...',
                      hintStyle: const TextStyle(fontSize: 12.5, color: AppColors.textMuted),
                      prefixIcon: const Icon(Icons.search_rounded, size: 20, color: AppColors.primary),
                      suffixIcon: _searchCtrl.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear_rounded, size: 18),
                              onPressed: () => setState(() => _searchCtrl.clear()),
                            )
                          : null,
                      filled: true,
                      fillColor: AppColors.bg,
                      isDense: true,
                      contentPadding: const EdgeInsets.symmetric(vertical: 8, horizontal: 10),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: const BorderSide(color: AppColors.border),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: const BorderSide(color: AppColors.border),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    value: _statusFilter,
                    isExpanded: true,
                    decoration: InputDecoration(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      filled: true,
                      fillColor: AppColors.bg,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: const BorderSide(color: AppColors.border),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: const BorderSide(color: AppColors.border),
                      ),
                    ),
                    style: const TextStyle(
                        fontSize: 12, color: AppColors.textPrimary, fontWeight: FontWeight.w700),
                    items: [
                      const DropdownMenuItem(value: 'ALL', child: Text('All Pipeline Statuses')),
                      ..._statusOptions.map((s) => DropdownMenuItem(value: s, child: Text(s))),
                    ],
                    onChanged: (val) => setState(() => _statusFilter = val!),
                  ),
                ],
              ),
            ),

            // Leads List View
            Expanded(
              child: _isLoading
                  ? const Center(
                      child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2.5),
                    )
                  : _filteredLeads.isEmpty
                      ? Center(
                          child: Padding(
                            padding: const EdgeInsets.all(24),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.inventory_2_outlined, size: 44, color: AppColors.textMuted),
                                const SizedBox(height: 12),
                                const Text('No Leads Found',
                                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                                const SizedBox(height: 4),
                                Text('No leads assigned by $mgrName match your filter.',
                                    textAlign: TextAlign.center,
                                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                              ],
                            ),
                          ),
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: _filteredLeads.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            final lead = _filteredLeads[index];
                            final code = lead['lead_code']?.toString() ?? '#LD';
                            final customer = lead['customer_name']?.toString() ?? 'Customer';
                            final mobile = lead['mobile_number']?.toString() ?? '';
                            final repName = lead['assigned_to_name']?.toString() ?? 'Unassigned';
                            final status = lead['status']?.toString() ?? 'New Lead';
                            final city = lead['city']?.toString() ?? 'City N/A';
                            final kw = lead['required_kw']?.toString();
                            final date = _formatDate(lead['created_at']?.toString());

                            return Container(
                              decoration: BoxDecoration(
                                color: AppColors.card,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: AppColors.border),
                              ),
                              child: Material(
                                color: Colors.transparent,
                                borderRadius: BorderRadius.circular(16),
                                child: InkWell(
                                  borderRadius: BorderRadius.circular(16),
                                  onTap: () => _openLeadDetailSheet(lead),
                                  child: Padding(
                                    padding: const EdgeInsets.all(14),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        // Row 1: Code + Status
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Text(code,
                                                style: const TextStyle(
                                                    fontWeight: FontWeight.w800,
                                                    fontSize: 12.5,
                                                    color: AppColors.primary)),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                              decoration: BoxDecoration(
                                                color: AppColors.primarySoft,
                                                borderRadius: BorderRadius.circular(6),
                                              ),
                                              child: Text(
                                                status,
                                                style: const TextStyle(
                                                    fontSize: 10,
                                                    fontWeight: FontWeight.w800,
                                                    color: AppColors.primaryDark),
                                              ),
                                            ),
                                          ],
                                        ),

                                        const SizedBox(height: 8),

                                        // Row 2: Customer Name
                                        Text(customer,
                                            style: const TextStyle(
                                                fontWeight: FontWeight.w800,
                                                fontSize: 14.5,
                                                color: AppColors.textPrimary)),

                                        const SizedBox(height: 4),

                                        // Row 3: City & Solar kW
                                        Text(
                                          '$city${kw != null ? ' • $kw kW' : ''}',
                                          style: const TextStyle(
                                              fontSize: 11.5,
                                              color: AppColors.textSecondary,
                                              fontWeight: FontWeight.w500),
                                        ),

                                        const SizedBox(height: 10),
                                        const Divider(height: 1, color: AppColors.border),
                                        const SizedBox(height: 10),

                                        // Row 4: Assigned Sales Rep & Date (Line 1)
                                        Row(
                                          children: [
                                            Expanded(
                                              child: Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                                decoration: BoxDecoration(
                                                  color: AppColors.purpleSoft,
                                                  borderRadius: BorderRadius.circular(8),
                                                ),
                                                child: Row(
                                                  mainAxisSize: MainAxisSize.min,
                                                  children: [
                                                    const Icon(Icons.person_outline_rounded,
                                                        size: 13, color: AppColors.purple),
                                                    const SizedBox(width: 4),
                                                    Flexible(
                                                      child: Text(
                                                        'Assigned Rep: $repName',
                                                        style: const TextStyle(
                                                            fontSize: 11,
                                                            fontWeight: FontWeight.w800,
                                                            color: AppColors.purple),
                                                        overflow: TextOverflow.ellipsis,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            ),
                                            const SizedBox(width: 8),
                                            Text(
                                              date,
                                              style: const TextStyle(
                                                  fontSize: 10.5,
                                                  color: AppColors.textMuted,
                                                  fontWeight: FontWeight.w500),
                                            ),
                                          ],
                                        ),

                                        // Row 5: Action Buttons (Line 2)
                                        if (mobile.isNotEmpty) ...[
                                          const SizedBox(height: 8),
                                          Row(
                                            mainAxisAlignment: MainAxisAlignment.end,
                                            children: [
                                              InkWell(
                                                onTap: () => _makePhoneCall(mobile),
                                                borderRadius: BorderRadius.circular(8),
                                                child: Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                                  decoration: BoxDecoration(
                                                    color: AppColors.successSoft,
                                                    borderRadius: BorderRadius.circular(8),
                                                  ),
                                                  child: const Row(
                                                    mainAxisSize: MainAxisSize.min,
                                                    children: [
                                                      Icon(Icons.phone_rounded, size: 13, color: AppColors.success),
                                                      SizedBox(width: 4),
                                                      Text(
                                                        'Call',
                                                        style: TextStyle(
                                                          fontSize: 11,
                                                          fontWeight: FontWeight.w700,
                                                          color: AppColors.success,
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                              ),
                                              const SizedBox(width: 8),
                                              InkWell(
                                                onTap: () => _openWhatsApp(mobile),
                                                borderRadius: BorderRadius.circular(8),
                                                child: Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                                  decoration: BoxDecoration(
                                                    color: AppColors.primarySoft,
                                                    borderRadius: BorderRadius.circular(8),
                                                  ),
                                                  child: const Row(
                                                    mainAxisSize: MainAxisSize.min,
                                                    children: [
                                                      Icon(Icons.chat_bubble_outline_rounded, size: 13, color: AppColors.primary),
                                                      SizedBox(width: 4),
                                                      Text(
                                                        'WhatsApp',
                                                        style: TextStyle(
                                                          fontSize: 11,
                                                          fontWeight: FontWeight.w700,
                                                          color: AppColors.primary,
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }
}
