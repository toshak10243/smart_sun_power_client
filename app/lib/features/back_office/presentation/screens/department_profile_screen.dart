import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../../sales/data/profile_service.dart';

class DepartmentProfileScreen extends ConsumerStatefulWidget {
  const DepartmentProfileScreen({super.key});

  @override
  ConsumerState<DepartmentProfileScreen> createState() =>
      _DepartmentProfileScreenState();
}

class _DepartmentProfileScreenState
    extends ConsumerState<DepartmentProfileScreen> {
  final ProfileService _profileService = ProfileService();
  final ImagePicker _picker = ImagePicker();

  // Photo States
  File? _selectedLocalImage;
  bool _isUploadingPhoto = false;

  // Password States
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _showCurrentPassword = false;
  bool _showNewPassword = false;
  bool _showConfirmPassword = false;
  bool _updatingPassword = false;
  String? _currentPasswordError;
  String? _newPasswordError;
  String? _confirmPasswordError;

  @override
  void dispose() {
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _showNotification(String message, {bool isError = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(
              isError ? Icons.error_outline_rounded : Icons.check_circle_rounded,
              color: Colors.white,
              size: 20,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
              ),
            ),
          ],
        ),
        backgroundColor: isError ? AppColors.danger : AppColors.success,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        margin: const EdgeInsets.all(16),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  // Pick Image Sheet
  void _showImageSourceSheet() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 18),
              const Text(
                'Change Profile Photo',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _buildPickerOption(
                    icon: Icons.camera_alt_rounded,
                    label: 'Camera',
                    color: AppColors.primary,
                    onTap: () {
                      Navigator.pop(ctx);
                      _pickImage(ImageSource.camera);
                    },
                  ),
                  _buildPickerOption(
                    icon: Icons.photo_library_rounded,
                    label: 'Gallery',
                    color: AppColors.success,
                    onTap: () {
                      Navigator.pop(ctx);
                      _pickImage(ImageSource.gallery);
                    },
                  ),
                ],
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPickerOption({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            CircleAvatar(
              radius: 28,
              backgroundColor: color.withOpacity(0.12),
              child: Icon(icon, color: color, size: 26),
            ),
            const SizedBox(height: 8),
            Text(
              label,
              style: const TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 12,
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? pickedFile = await _picker.pickImage(
        source: source,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 85,
      );
      if (pickedFile == null) return;

      final file = File(pickedFile.path);
      final fileSize = await file.length();
      if (fileSize > 2 * 1024 * 1024) {
        _showNotification('Image size must be under 2MB.', isError: true);
        return;
      }

      setState(() {
        _selectedLocalImage = file;
        _isUploadingPhoto = true;
      });

      final result = await _profileService.uploadProfilePhoto(file.path);
      if (!mounted) return;

      setState(() => _isUploadingPhoto = false);
      if (result['success'] == true) {
        _showNotification('Profile photo updated successfully!');
        // Refresh Auth user state
        final refreshed = await _profileService.getProfile();
        if (refreshed['success'] == true && refreshed['profile'] != null) {
          ref.read(authProvider.notifier).checkAuthStatus();
        }
      } else {
        setState(() => _selectedLocalImage = null);
        _showNotification(result['message'] ?? 'Failed to upload photo.', isError: true);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isUploadingPhoto = false;
          _selectedLocalImage = null;
        });
        _showNotification('Error picking image: $e', isError: true);
      }
    }
  }

  // Change Password
  Future<void> _changePassword() async {
    final current = _currentPasswordController.text.trim();
    final newPass = _newPasswordController.text.trim();
    final confirm = _confirmPasswordController.text.trim();

    setState(() {
      _currentPasswordError = current.isEmpty ? 'Current password is required' : null;
      _newPasswordError = newPass.isEmpty
          ? 'New password is required'
          : (newPass.length < 6 ? 'Password must be at least 6 characters' : null);
      _confirmPasswordError = confirm.isEmpty
          ? 'Please confirm new password'
          : (confirm != newPass ? 'Passwords do not match' : null);
    });

    if (_currentPasswordError != null ||
        _newPasswordError != null ||
        _confirmPasswordError != null) {
      return;
    }

    setState(() => _updatingPassword = true);

    final result = await _profileService.changePassword(
      currentPassword: current,
      newPassword: newPass,
      confirmPassword: confirm,
    );

    if (!mounted) return;
    setState(() => _updatingPassword = false);

    if (result['success'] == true) {
      _currentPasswordController.clear();
      _newPasswordController.clear();
      _confirmPasswordController.clear();
      _showNotification('Password updated successfully!');
    } else {
      _showNotification(result['message'] ?? 'Failed to update password.', isError: true);
    }
  }

  void _confirmLogout() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.logout_rounded, color: AppColors.danger, size: 22),
            SizedBox(width: 8),
            Text(
              'Sign Out',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
          ],
        ),
        content: const Text(
          'Are you sure you want to sign out from your Department Portal?',
          style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(fontWeight: FontWeight.w600)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              ref.read(authProvider.notifier).logout();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.danger,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text('Sign Out', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final fullName = user?['full_name'] ?? user?['name'] ?? 'Staff Member';
    final email = user?['email'] ?? 'Not provided';
    final phone = user?['phone'] ?? user?['mobile'] ?? 'Not provided';
    final roleName = user?['role_name'] ?? user?['role'] ?? authState.userRole;
    final profileImg = user?['profile_image']?.toString() ?? user?['photo']?.toString();

    String avatarUrl = ApiEndpoints.getProfileImageUrl(profileImg);
    final companyLogoUrl = ApiEndpoints.getCompanyLogoUrl('1786600705586_770872333.webp');
    if (avatarUrl.isEmpty) {
      avatarUrl = companyLogoUrl;
    }

    String initials = 'SM';
    if (fullName.isNotEmpty) {
      final parts = fullName.trim().split(' ');
      if (parts.length >= 2) {
        initials = '${parts[0][0]}${parts[1][0]}'.toUpperCase();
      } else {
        initials = parts[0].substring(0, parts[0].length >= 2 ? 2 : 1).toUpperCase();
      }
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text(
          'My Operational Profile',
          style: TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 18,
            color: AppColors.textPrimary,
          ),
        ),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout_rounded, color: AppColors.danger),
            tooltip: 'Sign Out',
            onPressed: _confirmLogout,
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // ============ 1. PERSONAL PORTAL CARD WITH PHOTO & AVATAR ============
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.03),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Stack(
                    alignment: Alignment.bottomRight,
                    children: [
                      Container(
                        width: 84,
                        height: 84,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: const Color(0xFF005BAC),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.12),
                              blurRadius: 8,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: ClipOval(
                          child: _selectedLocalImage != null
                              ? Image.file(_selectedLocalImage!, fit: BoxFit.cover)
                              : (avatarUrl.isNotEmpty
                                  ? CachedNetworkImage(
                                      imageUrl: avatarUrl,
                                      fit: BoxFit.contain,
                                      placeholder: (_, __) =>
                                          Image.asset('assets/images/logo.png', fit: BoxFit.contain),
                                      errorWidget: (_, __, ___) => Image.asset(
                                        'assets/images/logo.png',
                                        fit: BoxFit.contain,
                                        errorBuilder: (_, __, ___) => Center(
                                          child: Text(
                                            initials,
                                            style: const TextStyle(
                                              fontSize: 24,
                                              fontWeight: FontWeight.bold,
                                              color: Color(0xFF005BAC),
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
                                          initials,
                                          style: const TextStyle(
                                            fontSize: 24,
                                            fontWeight: FontWeight.bold,
                                            color: Color(0xFF005BAC),
                                          ),
                                        ),
                                      ),
                                    )),
                        ),
                      ),
                      // Camera Icon Badge for Photo Change
                      Positioned(
                        right: 0,
                        bottom: 0,
                        child: Material(
                          color: AppColors.primary,
                          shape: const CircleBorder(),
                          elevation: 3,
                          child: InkWell(
                            onTap: _isUploadingPhoto ? null : _showImageSourceSheet,
                            customBorder: const CircleBorder(),
                            child: Padding(
                              padding: const EdgeInsets.all(7),
                              child: _isUploadingPhoto
                                  ? const SizedBox(
                                      width: 14,
                                      height: 14,
                                      child: CircularProgressIndicator(
                                        color: Colors.white,
                                        strokeWidth: 2,
                                      ),
                                    )
                                  : const Icon(
                                      Icons.camera_alt_rounded,
                                      color: Colors.white,
                                      size: 15,
                                    ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    fullName,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE0F2FE),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFFBAE6FD)),
                    ),
                    child: Text(
                      roleName,
                      style: const TextStyle(
                        color: Color(0xFF005BAC),
                        fontWeight: FontWeight.w700,
                        fontSize: 12,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Divider(color: Color(0xFFF1F5F9)),
                  const SizedBox(height: 8),
                  _buildProfileRow(Icons.email_outlined, 'Email', email),
                  const SizedBox(height: 10),
                  _buildProfileRow(Icons.phone_outlined, 'Mobile', phone),
                  const SizedBox(height: 10),
                  _buildProfileRow(Icons.verified_user_outlined, 'Account Status',
                      'Active & Verified', isPill: true),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // ============ 2. OFFICIAL COMPANY BRANDING CARD ============
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
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
                  Container(
                    width: 58,
                    height: 58,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.04),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: ClipOval(
                      child: CachedNetworkImage(
                        imageUrl: companyLogoUrl,
                        fit: BoxFit.contain,
                        placeholder: (_, __) => Image.asset('assets/images/logo.png', fit: BoxFit.contain),
                        errorWidget: (_, __, ___) => Image.asset('assets/images/logo.png', fit: BoxFit.contain),
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Smart Sun Power',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'Official Enterprise Operations Portal',
                          style: TextStyle(
                            fontSize: 11.5,
                            color: Color(0xFF64748B),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'Jaipur, Rajasthan • support@smartsunpower.com',
                          style: TextStyle(
                            fontSize: 10.5,
                            color: Color(0xFF94A3B8),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // ============ 3. SECURITY & CHANGE PASSWORD CARD ============
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.03),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.lock_reset_rounded, size: 20, color: Color(0xFF005BAC)),
                      SizedBox(width: 8),
                      Text(
                        'Change Password',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Ensure your department account is using a strong password.',
                    style: TextStyle(fontSize: 11.5, color: Color(0xFF64748B)),
                  ),
                  const Divider(height: 22, color: Color(0xFFF1F5F9)),

                  // Current Password
                  _buildPasswordField(
                    controller: _currentPasswordController,
                    label: 'Current Password',
                    obscure: !_showCurrentPassword,
                    error: _currentPasswordError,
                    onToggle: () => setState(() => _showCurrentPassword = !_showCurrentPassword),
                  ),
                  const SizedBox(height: 14),

                  // New Password
                  _buildPasswordField(
                    controller: _newPasswordController,
                    label: 'New Password',
                    obscure: !_showNewPassword,
                    error: _newPasswordError,
                    onToggle: () => setState(() => _showNewPassword = !_showNewPassword),
                  ),
                  const SizedBox(height: 14),

                  // Confirm Password
                  _buildPasswordField(
                    controller: _confirmPasswordController,
                    label: 'Confirm New Password',
                    obscure: !_showConfirmPassword,
                    error: _confirmPasswordError,
                    onToggle: () => setState(() => _showConfirmPassword = !_showConfirmPassword),
                  ),
                  const SizedBox(height: 18),

                  SizedBox(
                    width: double.infinity,
                    height: 46,
                    child: ElevatedButton.icon(
                      onPressed: _updatingPassword ? null : _changePassword,
                      icon: _updatingPassword
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            )
                          : const Icon(Icons.check_rounded, size: 18),
                      label: Text(
                        _updatingPassword ? 'Updating Password...' : 'Update Password',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13.5,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF005BAC),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // ============ 4. DEPARTMENTAL ACCESS RIGHTS ============
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.business_center_rounded, size: 18, color: Color(0xFF0B3A63)),
                      SizedBox(width: 8),
                      Text(
                        'Departmental Access Rights',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 20, color: Color(0xFFF1F5F9)),
                  _buildAccessItem(
                      'Workflow Execution', 'Full Stage Verification & Approval rights for assigned desk'),
                  _buildAccessItem(
                      'Mandatory Audit', '10-word minimum logged remark for any stage Hold or Cancellation'),
                  _buildAccessItem(
                      'Mobile Camera Access', 'Direct document & meter receiving photo uploads'),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // ============ 5. SECURITY & SYSTEM INFO ============
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.shield_outlined, size: 18, color: Color(0xFF0B3A63)),
                      SizedBox(width: 8),
                      Text(
                        'System Security & App Version',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                    ],
                  ),
                  Divider(height: 20, color: Color(0xFFF1F5F9)),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Application Build', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                      Text('v2.0.0 Enterprise Mobile',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                    ],
                  ),
                  SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Data Encryption', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                      Text('SSL / TLS 256-Bit',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.green)),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // ============ 6. LOGOUT BUTTON ============
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                onPressed: _confirmLogout,
                icon: const Icon(Icons.logout_rounded, size: 18),
                label: const Text(
                  'Sign Out From Portal',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFEE2E2),
                  foregroundColor: const Color(0xFFDC2626),
                  elevation: 0,
                  side: const BorderSide(color: Color(0xFFFECACA)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
            const SizedBox(height: 10),
          ],
        ),
      ),
    );
  }

  Widget _buildPasswordField({
    required TextEditingController controller,
    required String label,
    required bool obscure,
    required VoidCallback onToggle,
    String? error,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: Color(0xFF334155),
          ),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          obscureText: obscure,
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
          decoration: InputDecoration(
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            filled: true,
            fillColor: const Color(0xFFF8FAFC),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(
                color: error != null ? AppColors.danger : const Color(0xFFE2E8F0),
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Color(0xFF005BAC), width: 1.5),
            ),
            suffixIcon: IconButton(
              icon: Icon(
                obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                size: 18,
                color: const Color(0xFF94A3B8),
              ),
              onPressed: onToggle,
            ),
          ),
        ),
        if (error != null) ...[
          const SizedBox(height: 4),
          Text(
            error,
            style: const TextStyle(color: AppColors.danger, fontSize: 11),
          ),
        ],
      ],
    );
  }

  Widget _buildProfileRow(IconData icon, String title, String value,
      {bool isPill = false}) {
    return Row(
      children: [
        Icon(icon, size: 16, color: const Color(0xFF64748B)),
        const SizedBox(width: 10),
        Text(
          title,
          style: const TextStyle(
              fontSize: 12, color: Color(0xFF64748B), fontWeight: FontWeight.w500),
        ),
        const Spacer(),
        if (isPill)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: const Color(0xFFDCFCE7),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              value,
              style: const TextStyle(
                  fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF16A34A)),
            ),
          )
        else
          Text(
            value,
            style: const TextStyle(
                fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
          ),
      ],
    );
  }

  Widget _buildAccessItem(String title, String desc) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.check_circle_rounded, size: 16, color: Color(0xFF16A34A)),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                      fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                ),
                Text(
                  desc,
                  style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

