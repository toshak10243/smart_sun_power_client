import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';
import 'sales_dashboard_screen.dart';
import 'sales_leads_screen.dart';
import 'sales_profile_screen.dart';
import 'back_office_tasks_screen.dart';

class SalesMainLayout extends StatefulWidget {
  const SalesMainLayout({Key? key}) : super(key: key);

  @override
  State<SalesMainLayout> createState() => _SalesMainLayoutState();
}

class _SalesMainLayoutState extends State<SalesMainLayout> {
  int _currentIndex = 0;
  final Set<int> _loadedScreens = {0};

  Widget _buildScreen(int index) {
    if (!_loadedScreens.contains(index)) {
      return const SizedBox.shrink();
    }
    switch (index) {
      case 0:
        return const SalesDashboardScreen();
      case 1:
        return const SalesLeadsScreen();
      case 2:
        return const BackOfficeTasksScreen();
      case 3:
        return const SalesProfileScreen();
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: List.generate(4, (i) => _buildScreen(i)),
      ),

      // 🟢 PREMIUM FOOTER / BOTTOM NAVIGATION BAR
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
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: BottomNavigationBar(
              currentIndex: _currentIndex,
              onTap: _switchTab,
              backgroundColor: Colors.transparent,
              elevation: 0,
              type: BottomNavigationBarType.fixed,
              selectedItemColor: AppColors.primary,
              unselectedItemColor: AppColors.textMuted,
              selectedLabelStyle: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                height: 1.5,
              ),
              unselectedLabelStyle: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                height: 1.5,
              ),
              items: const [
                // Tab 1: Dashboard
                BottomNavigationBarItem(
                  icon: Icon(Icons.dashboard_outlined, size: 22),
                  activeIcon: Icon(Icons.dashboard_rounded, size: 22),
                  label: 'Dashboard',
                ),
                // Tab 2: Leads
                BottomNavigationBarItem(
                  icon: Icon(Icons.assignment_outlined, size: 22),
                  activeIcon: Icon(Icons.assignment_rounded, size: 22),
                  label: 'My Leads',
                ),
                // Tab 3: Back-Office Operations
                BottomNavigationBarItem(
                  icon: Icon(Icons.task_alt_outlined, size: 22),
                  activeIcon: Icon(Icons.task_alt_rounded, size: 22),
                  label: 'Operations',
                ),
                // Tab 4: Profile
                BottomNavigationBarItem(
                  icon: Icon(Icons.person_outline_rounded, size: 22),
                  activeIcon: Icon(Icons.person_rounded, size: 22),
                  label: 'Profile',
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
