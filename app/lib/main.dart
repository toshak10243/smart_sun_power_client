import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'core/theme/app_theme.dart';
import 'core/services/firebase_messaging_service.dart';
import 'features/splash/splash_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Crash-Proofing: Catch framework & platform errors gracefully
  FlutterError.onError = (FlutterErrorDetails details) {
    FlutterError.presentError(details);
    debugPrint("Flutter Framework Error: ${details.exception}");
  };

  PlatformDispatcher.instance.onError = (error, stack) {
    debugPrint("Platform Async Error caught: $error");
    return true; // Prevents app process termination
  };

  // Firebase initialize (safe try-catch for local development)
  try {
    await Firebase.initializeApp();
    await FirebaseMessagingService.initialize();
  } catch (e) {
    debugPrint("Firebase/FCM init warning: $e");
  }

  runApp(
    const ProviderScope(
      child: SolarCrmApp(),
    ),
  );
}

class SolarCrmApp extends StatelessWidget {
  const SolarCrmApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Solar CRM',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const SplashScreen(),
    );
  }
}
