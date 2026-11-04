import 'package:flutter/material.dart';

class AppUpdateService {
  /// Permanent silence: app updates completely disabled as requested
  static Future<void> checkForUpdate(BuildContext context, {bool isManual = false}) async {
    return;
  }
}
