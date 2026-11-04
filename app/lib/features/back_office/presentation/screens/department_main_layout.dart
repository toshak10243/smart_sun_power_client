import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';
import 'department_dashboard_screen.dart';
import 'department_profile_screen.dart';
import '../../../sales/presentation/screens/back_office_tasks_screen.dart';

class DepartmentMainLayout extends StatefulWidget {
  final String deskKey;

  const DepartmentMainLayout({
    super.key,
    required this.deskKey,
  });

  @override
  State<DepartmentMainLayout> createState() => _DepartmentMainLayoutState();
}

class _DepartmentMainLayoutState extends State<DepartmentMainLayout> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final List<Widget> screens = [
      DepartmentDashboardScreen(
        deskKey: widget.deskKey,
        onOpenOperations: () {
          setState(() {
            _currentIndex = 1;
          });
        },
      ),
      BackOfficeTasksScreen(
        initialDesk: widget.deskKey,
        isStandalone: false,
      ),
      const DepartmentProfileScreen(),
    ];

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: screens,
      ),
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
              onTap: (index) {
                setState(() {
                  _currentIndex = index;
                });
              },
              backgroundColor: Colors.transparent,
              elevation: 0,
              type: BottomNavigationBarType.fixed,
              selectedItemColor: const Color(0xFF005BAC),
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
                // Tab 1: Department Dashboard
                BottomNavigationBarItem(
                  icon: Icon(Icons.dashboard_outlined, size: 22),
                  activeIcon: Icon(Icons.dashboard_rounded, size: 22),
                  label: 'Dashboard',
                ),
                // Tab 2: Operations Tasks Queue
                BottomNavigationBarItem(
                  icon: Icon(Icons.task_alt_outlined, size: 22),
                  activeIcon: Icon(Icons.task_alt_rounded, size: 22),
                  label: 'Operations',
                ),
                // Tab 3: Department Profile
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

