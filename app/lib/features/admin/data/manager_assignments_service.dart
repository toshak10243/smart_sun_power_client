import 'package:dio/dio.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_client.dart';

class ManagerAssignmentsService {
  final ApiClient _apiClient = ApiClient();

  // 1. Fetch Master List of Managers with Lead Counts & Team Info
  Future<Map<String, dynamic>> fetchManagersSummary() async {
    try {
      final response = await _apiClient.dio.get(ApiEndpoints.managerAssignments);
      final data = response.data;
      final List managers = data != null && data['data'] != null
          ? (data['data'] as List)
          : [];

      return {
        'success': true,
        'managers': managers,
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data?['message'] ?? 'Failed to load manager assignments.',
        'managers': [],
      };
    } catch (_) {
      return {
        'success': false,
        'message': 'An unexpected network error occurred.',
        'managers': [],
      };
    }
  }

  // 2. Fetch Leads Assigned by a Specific Manager (Drill-Down)
  Future<Map<String, dynamic>> fetchManagerLeads(
    dynamic managerId, {
    String? search,
    String? status,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (search != null && search.trim().isNotEmpty) {
        queryParams['search'] = search.trim();
      }
      if (status != null && status.trim().isNotEmpty && status != 'ALL') {
        queryParams['status'] = status.trim();
      }

      final response = await _apiClient.dio.get(
        '${ApiEndpoints.managerAssignments}/$managerId/leads',
        queryParameters: queryParams,
      );

      final data = response.data;
      final List leads = data != null && data['data'] != null
          ? (data['data'] as List)
          : [];

      return {
        'success': true,
        'leads': leads,
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data?['message'] ?? 'Failed to load manager assigned leads.',
        'leads': [],
      };
    } catch (_) {
      return {
        'success': false,
        'message': 'An unexpected network error occurred.',
        'leads': [],
      };
    }
  }
}
