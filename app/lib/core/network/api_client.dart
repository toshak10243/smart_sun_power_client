import 'package:dio/dio.dart';
import '../constants/api_endpoints.dart';
import '../utils/storage_service.dart';

class ApiClient {
  late final Dio dio;

  ApiClient() {
    dio = Dio(
      BaseOptions(
        baseUrl: ApiEndpoints.baseUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await StorageService.getToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) async {
          if (error.response?.statusCode == 401) {
            await StorageService.clearSession();
            return handler.next(error);
          }

          // If the live server returns 404 for un-deployed endpoints (e.g. /files, /settings/app-update),
          // fallback to the connected local development backend (via ADB reverse / USB port 5000)
          final requestPath = error.requestOptions.path;
          final currentBase = error.requestOptions.baseUrl;
          if (error.response?.statusCode == 404 &&
              (requestPath.contains('/files') || requestPath.contains('/settings/app-update')) &&
              !currentBase.contains('127.0.0.1')) {
            try {
              final newOptions = Options(
                method: error.requestOptions.method,
                headers: error.requestOptions.headers,
                responseType: error.requestOptions.responseType,
                contentType: error.requestOptions.contentType,
              );
              final fallbackUrl = 'http://127.0.0.1:5000/api$requestPath';
              final retryResponse = await dio.request(
                fallbackUrl,
                data: error.requestOptions.data,
                queryParameters: error.requestOptions.queryParameters,
                options: newOptions,
              );
              return handler.resolve(retryResponse);
            } catch (_) {
              // Try LAN IP fallback if available
              try {
                final lanOptions = Options(
                  method: error.requestOptions.method,
                  headers: error.requestOptions.headers,
                  responseType: error.requestOptions.responseType,
                  contentType: error.requestOptions.contentType,
                );
                final lanUrl = 'http://10.27.146.188:5000/api$requestPath';
                final retryLan = await dio.request(
                  lanUrl,
                  data: error.requestOptions.data,
                  queryParameters: error.requestOptions.queryParameters,
                  options: lanOptions,
                );
                return handler.resolve(retryLan);
              } catch (_) {}
            }
          }

          return handler.next(error);
        },
      ),
    );
  }
}
