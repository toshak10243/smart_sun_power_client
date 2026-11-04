import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';

// Import Admin Portal Screens
import 'admin_dashboard_screen.dart';
import 'user_management_screen.dart';
import 'manager_assignments_screen.dart';
import 'admin_leads_screen.dart';
import 'admin_reports_screen.dart';
import 'admin_profile_screen.dart';
import 'document_repository_screen.dart';
import 'package:solar_crm_mobile/features/sales/presentation/screens/back_office_tasks_screen.dart';
import '../widgets/admin_drawer.dart';

class AdminMainLayout extends StatefulWidget {
  const AdminMainLayout({super.key});

  @override
  State<AdminMainLayout> createState() => _AdminMainLayoutState();
}

class _AdminMainLayoutState extends State<AdminMainLayout> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  int _currentIndex = 0;

  // Track which tabs have been visited so we lazy-load them without loading all 8 on startup
  final Set<int> _loadedScreens = {0};

  Widget _buildScreen(int index) {
    if (!_loadedScreens.contains(index)) {
      return const SizedBox.shrink();
    }
    switch (index) {
      case 0:
        return const AdminDashboardScreen();
      case 1:
        return const UserManagementScreen();
      case 2:
        return const BackOfficeTasksScreen();
      case 3:
        return const DocumentRepositoryScreen();
      case 4:
        return const ManagerAssignmentsScreen();
      case 5:
        return const AdminLeadsScreen();
      case 6:
        return const AdminReportsScreen();
      case 7:
        return const AdminProfileScreen();
      default:
        return const SizedBox.shrink();
    }
  }

  void _switchTab(int index) {
    setState(() {
      _currentIndex = index;
      _loadedScreens.add(index);
    });
  }

  int _getBottomNavIndex() {
    switch (_currentIndex) {
      case 0:
        return 0; // Dashboard
      case 5:
        return 1; // Leads
      case 2:
        return 2; // Operations
      case 3:
        return 3; // Documents
      default:
        return 4; // Menu / More
    }
  }

  void _onBottomNavTapped(int index) {
    switch (index) {
      case 0:
        _switchTab(0);
        break;
      case 1:
        _switchTab(5); // Leads
        break;
      case 2:
        _switchTab(2); // Operations
        break;
      case 3:
        _switchTab(3); // Documents
        break;
      case 4:
        _scaffoldKey.currentState?.openEndDrawer();
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      endDrawer: AdminDrawer(
        currentIndex: _currentIndex,
        onSelectScreen: (idx) {
          Navigator.pop(context); // Close drawer
          _switchTab(idx);
        },
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: List.generate(8, (i) => _buildScreen(i)),
      ),

      // 5-Tab Enterprise Bottom Navigation Bar with Quick "Menu" Drawer trigger
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppColors.card,
          border: const Border(
            top: BorderSide(color: AppColors.border, width: 1),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: SafeArea(
          child: BottomNavigationBar(
            currentIndex: _getBottomNavIndex(),
            onTap: _onBottomNavTapped,
            backgroundColor: Colors.transparent,
            elevation: 0,
            type: BottomNavigationBarType.fixed,
            selectedItemColor: const Color(0xFF005BAC),
            unselectedItemColor: AppColors.textMuted,
            selectedLabelStyle: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w800,
            ),
            unselectedLabelStyle: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w600,
            ),
            items: const [
              BottomNavigationBarItem(
                icon: Icon(Icons.dashboard_outlined, size: 22),
                activeIcon: Icon(Icons.dashboard_rounded, size: 22),
                label: 'Dashboard',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.solar_power_outlined, size: 22),
                activeIcon: Icon(Icons.solar_power_rounded, size: 22),
                label: 'Leads',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.task_alt_outlined, size: 22),
                activeIcon: Icon(Icons.task_alt_rounded, size: 22),
                label: 'Operations',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.folder_shared_outlined, size: 22),
                activeIcon: Icon(Icons.folder_shared_rounded, size: 22),
                label: 'Documents',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.menu_rounded, size: 22),
                activeIcon: Icon(Icons.menu_open_rounded, size: 22),
                label: 'Menu',
              ),
            ],
          ),
        ),
      ),
    );
  }
}
