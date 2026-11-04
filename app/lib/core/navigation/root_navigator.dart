import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/app_colors.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/sales/presentation/screens/sales_main_layout.dart';
// 🟢 IMPORT MANAGER MAIN LAYOUT
import '../../features/manager/presentation/screens/manager_main_layout.dart';
// 🔵 IMPORT ADMIN MAIN LAYOUT
import '../../features/admin/presentation/screens/admin_main_layout.dart';
// 🟠 IMPORT DEPARTMENT MAIN LAYOUT FOR ALL BACK-OFFICE DESKS
import '../../features/back_office/presentation/screens/department_main_layout.dart';

class RootNavigator extends ConsumerStatefulWidget {
  const RootNavigator({Key? key}) : super(key: key);

  @override
  ConsumerState<RootNavigator> createState() => _RootNavigatorState();
}

class _RootNavigatorState extends ConsumerState<RootNavigator> {
  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    // 1. Initial Launch Loading Indicator
    if (authState.isLoading) {
      return const Scaffold(
        backgroundColor: AppColors.bg,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(color: AppColors.primary),
              SizedBox(height: 16),
              Text(
                'Connecting to Portal...',
                style: TextStyle(
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ),
      );
    }

    // 2. Not Authenticated -> Show Login Screen
    if (!authState.isAuthenticated || authState.user == null) {
      return const LoginScreen();
    }

    final role = authState.userRole.toLowerCase().trim();

    // 3. Authenticated -> Auto Redirect based on Exact User Role

    // 🔵 1. ADMIN & SUPER ADMIN -> ADMIN MAIN LAYOUT
    if (role.contains('admin') || role.contains('super')) {
      return const AdminMainLayout();
    }

    // 🟢 2. MANAGER -> MANAGER MAIN LAYOUT
    if (role.contains('manager')) {
      return const ManagerMainLayout();
    }

    // 🟡 3. SALES EXECUTIVE -> SALES MAIN LAYOUT
    if (authState.isSales || role.contains('sales')) {
      return const SalesMainLayout();
    }

    // 🟠 4. JITU — DISCOM ONLINE & MODIFICATION (S0, S1)
    if (role.contains('online')) {
      return const DepartmentMainLayout(deskKey: 'online');
    }

    // 🟠 5. SURESH — OFFLINE AEN & COMMISSIONING (S3, S4, S9, S11-14)
    if (role.contains('field')) {
      return const DepartmentMainLayout(deskKey: 'field');
    }

    // 🔵 6. RAHUL — BANK LOAN OFFICER (S2, S10)
    if (role.contains('loan')) {
      return const DepartmentMainLayout(deskKey: 'loan');
    }

    // 🟢 7. ASHOK & PAWAN — ACCOUNTS & DUAL LEDGER (S5, S7, S15)
    if (role.contains('account')) {
      return const DepartmentMainLayout(deskKey: 'accounts');
    }

    // 🟠 8. NARENDRA — SOLAR INSTALLATION LEAD (S6)
    if (role.contains('install')) {
      return const DepartmentMainLayout(deskKey: 'installation');
    }

    // 🟣 9. MOIN — PORTAL ENTRY & SUBSIDY (S8, S17)
    if (role.contains('portal')) {
      return const DepartmentMainLayout(deskKey: 'portal');
    }

    // 🟠 10. GENERIC BACK-OFFICE FALLBACK
    if (role.contains('back office') || role.contains('office')) {
      return const DepartmentMainLayout(deskKey: 'all');
    }

    // Default Fallback Placeholder
    return const PortalPlaceholder(
      portalName: 'Portal',
      roleBadge: 'User',
      accentColor: AppColors.primaryDark,
    );
  }
}

class PortalPlaceholder extends ConsumerWidget {
  final String portalName;
  final String roleBadge;
  final Color accentColor;

  const PortalPlaceholder({
    Key? key,
    required this.portalName,
    required this.roleBadge,
    required this.accentColor,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final fullName = user?['full_name'] ?? user?['name'] ?? 'User';

    return Scaffold(
      appBar: AppBar(
        title: Text(portalName),
        backgroundColor: accentColor,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout_rounded),
            onPressed: () => ref.read(authProvider.notifier).logout(),
          ),
        ],
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircleAvatar(
                radius: 40,
                backgroundColor: accentColor.withOpacity(0.1),
                child: Icon(Icons.person_rounded, size: 40, color: accentColor),
              ),
              const SizedBox(height: 16),
              Text(
                fullName,
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Chip(label: Text(roleBadge)),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: () => ref.read(authProvider.notifier).logout(),
                icon: const Icon(Icons.logout),
                label: const Text('Sign Out'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
