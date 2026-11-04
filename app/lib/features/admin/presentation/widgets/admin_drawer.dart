import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../../../core/constants/api_endpoints.dart';
import 'package:cached_network_image/cached_network_image.dart';

class AdminDrawer extends ConsumerWidget {
  final int currentIndex;
  final ValueChanged<int> onSelectScreen;

  const AdminDrawer({
    super.key,
    required this.currentIndex,
    required this.onSelectScreen,
  });

  String _getInitials(String name) {
    if (name.isEmpty) return 'A';
    final parts = name.trim().split(' ');
    if (parts.length == 1) return parts[0][0].toUpperCase();
    return '${parts[0][0]}${parts[parts.length - 1][0]}'.toUpperCase();
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final fullName = user?['full_name'] ?? user?['name'] ?? 'Super Admin';
    final email = user?['email'] ?? '';
    final roleName = (user?['role'] ?? 'Super Admin').toString().toUpperCase();
    final profileImg = user?['profile_image']?.toString() ?? user?['photo']?.toString();
    String avatarUrl = ApiEndpoints.getProfileImageUrl(profileImg);
    if (avatarUrl.isEmpty) {
      avatarUrl = ApiEndpoints.getCompanyLogoUrl('1786600705586_770872333.webp');
    }

    return Drawer(
      backgroundColor: Colors.white,
      child: Column(
        children: [
          // 1. BRAND & USER PROFILE HEADER (Matches Web Admin Sidebar)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(20, 48, 20, 20),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFF0B3A63), Color(0xFF005BAC)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.15),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      padding: const EdgeInsets.all(4),
                      child: Image.asset(
                        'assets/images/logo.png',
                        fit: BoxFit.contain,
                        errorBuilder: (_, __, ___) => const Icon(
                          Icons.solar_power_rounded,
                          color: Color(0xFF005BAC),
                          size: 26,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'SMART SUN POWER',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.5,
                            ),
                          ),
                          Text(
                            'ENTERPRISE ERP PORTAL',
                            style: TextStyle(
                              color: Color(0xFF38BDF8),
                              fontSize: 9.5,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                const Divider(height: 1, color: Colors.white24),
                const SizedBox(height: 14),

                // User Profile Row
                Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white,
                        border: Border.all(color: Colors.white, width: 2),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.15),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: ClipOval(
                        child: (avatarUrl.isNotEmpty)
                            ? CachedNetworkImage(
                                imageUrl: avatarUrl,
                                fit: BoxFit.contain,
                                placeholder: (_, __) => Image.asset('assets/images/logo.png', fit: BoxFit.contain),
                                errorWidget: (_, __, ___) => Image.asset(
                                  'assets/images/logo.png',
                                  fit: BoxFit.contain,
                                  errorBuilder: (_, __, ___) => Center(
                                    child: Text(
                                      _getInitials(fullName),
                                      style: const TextStyle(
                                        color: Color(0xFF005BAC),
                                        fontWeight: FontWeight.w900,
                                        fontSize: 13,
                                      ),
                                    ),
                                  ),
                                ),
                              )
                            : Image.asset(
                                'assets/images/logo.png',
                                fit: BoxFit.contain,
                                errorBuilder: (_, __, ___) => Center(
                                  child: Text(
                                    _getInitials(fullName),
                                    style: const TextStyle(
                                      color: Color(0xFF005BAC),
                                      fontWeight: FontWeight.w900,
                                      fontSize: 13,
                                    ),
                                  ),
                                ),
                              ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            fullName,
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w800,
                              fontSize: 13.5,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          if (email.isNotEmpty)
                            Text(
                              email,
                              style: const TextStyle(
                                color: Colors.white70,
                                fontSize: 11,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFF38BDF8).withOpacity(0.2),
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(color: const Color(0xFF38BDF8).withOpacity(0.4)),
                            ),
                            child: Text(
                              roleName,
                              style: const TextStyle(
                                color: Color(0xFF38BDF8),
                                fontSize: 9,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // 2. SCROLLABLE CATEGORIZED NAVIGATION ITEMS (Exact 1:1 with Web Admin)
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 10),
              children: [
                // SECTION 1: MAIN
                _buildSectionHeader('MAIN'),
                _buildDrawerItem(
                  icon: Icons.dashboard_outlined,
                  activeIcon: Icons.dashboard_rounded,
                  title: 'Dashboard',
                  index: 0,
                ),

                const SizedBox(height: 10),

                // SECTION 2: SALES & LEADS
                _buildSectionHeader('SALES & LEADS'),
                _buildDrawerItem(
                  icon: Icons.solar_power_outlined,
                  activeIcon: Icons.solar_power_rounded,
                  title: 'Lead Management',
                  subtitle: 'All Leads, Follow-ups & +Add',
                  index: 5,
                ),
                _buildDrawerItem(
                  icon: Icons.assignment_ind_outlined,
                  activeIcon: Icons.assignment_ind_rounded,
                  title: 'Manager Assignments',
                  subtitle: 'Assign sales reps to managers',
                  index: 4,
                ),

                const SizedBox(height: 10),

                // SECTION 3: PROJECT EXECUTION
                _buildSectionHeader('PROJECT EXECUTION'),
                _buildDrawerItem(
                  icon: Icons.task_alt_outlined,
                  activeIcon: Icons.task_alt_rounded,
                  title: 'Back-Office Operations',
                  subtitle: '6 Desks Workflow & Verification',
                  badge: '6 Desks',
                  index: 2,
                ),
                _buildDrawerItem(
                  icon: Icons.folder_shared_outlined,
                  activeIcon: Icons.folder_shared_rounded,
                  title: 'Project Documents Vault',
                  subtitle: 'KYC & Technical Documents',
                  index: 3,
                ),

                const SizedBox(height: 10),

                // SECTION 4: ADMINISTRATION
                _buildSectionHeader('ADMINISTRATION'),
                _buildDrawerItem(
                  icon: Icons.manage_accounts_outlined,
                  activeIcon: Icons.manage_accounts_rounded,
                  title: 'User Management',
                  subtitle: 'Create, Edit & Roles',
                  index: 1,
                ),
                _buildDrawerItem(
                  icon: Icons.bar_chart_outlined,
                  activeIcon: Icons.bar_chart_rounded,
                  title: 'Reports & Analytics',
                  subtitle: 'Closed deals & revenue',
                  index: 6,
                ),
                _buildDrawerItem(
                  icon: Icons.settings_outlined,
                  activeIcon: Icons.settings_rounded,
                  title: 'Settings & Profile',
                  subtitle: 'App version, password & profile',
                  index: 7,
                ),
              ],
            ),
          ),

          // 3. LOGOUT FOOTER
          const Divider(height: 1, color: Color(0xFFE2E8F0)),
          ListTile(
            leading: const Icon(Icons.logout_rounded, color: Color(0xFFDC2626), size: 22),
            title: const Text(
              'Sign Out',
              style: TextStyle(
                color: Color(0xFFDC2626),
                fontWeight: FontWeight.w700,
                fontSize: 13,
              ),
            ),
            subtitle: const Text('End current session securely', style: TextStyle(fontSize: 11, color: Colors.grey)),
            onTap: () {
              Navigator.pop(context);
              _showLogoutDialog(context, ref);
            },
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 8, 14, 4),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w800,
          color: Color(0xFF94A3B8),
          letterSpacing: 0.8,
        ),
      ),
    );
  }

  Widget _buildDrawerItem({
    required IconData icon,
    required IconData activeIcon,
    required String title,
    String? subtitle,
    String? badge,
    required int index,
  }) {
    final isSelected = currentIndex == index;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: ListTile(
        selected: isSelected,
        selectedTileColor: const Color(0xFFE0F2FE),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        leading: Icon(
          isSelected ? activeIcon : icon,
          color: isSelected ? const Color(0xFF005BAC) : const Color(0xFF64748B),
          size: 22,
        ),
        title: Text(
          title,
          style: TextStyle(
            fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
            fontSize: 12.5,
            color: isSelected ? const Color(0xFF005BAC) : const Color(0xFF1E293B),
          ),
        ),
        subtitle: subtitle != null
            ? Text(
                subtitle,
                style: TextStyle(
                  fontSize: 10,
                  color: isSelected ? const Color(0xFF0284C7) : const Color(0xFF94A3B8),
                ),
              )
            : null,
        trailing: badge != null
            ? Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: isSelected ? const Color(0xFF005BAC) : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  badge,
                  style: TextStyle(
                    fontSize: 9.5,
                    fontWeight: FontWeight.w800,
                    color: isSelected ? Colors.white : const Color(0xFF475569),
                  ),
                ),
              )
            : null,
        onTap: () {
          onSelectScreen(index);
        },
      ),
    );
  }

  void _showLogoutDialog(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Confirm Logout', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        content: const Text(
          'Are you sure you want to end your current session?',
          style: TextStyle(fontSize: 13, color: Color(0xFF475569)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await ref.read(authProvider.notifier).logout();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFDC2626),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text('Logout'),
          ),
        ],
      ),
    );
  }
}
