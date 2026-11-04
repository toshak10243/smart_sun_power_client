import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

class ImageSourcePickerSheet {
  static Future<ImageSource?> show({
    required BuildContext context,
    String title = 'Select Photo Source',
    bool showRemove = false,
    VoidCallback? onRemove,
  }) {
    return showModalBottomSheet<ImageSource>(
      context: context,
      backgroundColor: Colors.white,
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
                  color: const Color(0xFFCBD5E1),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                title,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 16,
                  color: Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Choose how you want to upload the photo',
                style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _buildOption(
                    icon: Icons.camera_alt_rounded,
                    label: 'Camera',
                    color: const Color(0xFF005BAC),
                    bgColor: const Color(0xFFE0F2FE),
                    onTap: () => Navigator.pop(ctx, ImageSource.camera),
                  ),
                  _buildOption(
                    icon: Icons.photo_library_rounded,
                    label: 'Gallery',
                    color: const Color(0xFF0284C7),
                    bgColor: const Color(0xFFE0F2FE),
                    onTap: () => Navigator.pop(ctx, ImageSource.gallery),
                  ),
                  if (showRemove)
                    _buildOption(
                      icon: Icons.delete_outline_rounded,
                      label: 'Remove',
                      color: const Color(0xFFDC2626),
                      bgColor: const Color(0xFFFEE2E2),
                      onTap: () {
                        Navigator.pop(ctx);
                        if (onRemove != null) onRemove();
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

  static Widget _buildOption({
    required IconData icon,
    required String label,
    required Color color,
    required Color bgColor,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 58,
              height: 58,
              decoration: BoxDecoration(
                color: bgColor,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(icon, color: color, size: 28),
            ),
            const SizedBox(height: 8),
            Text(
              label,
              style: TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 12,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

