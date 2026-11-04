import 'dart:io';
import 'package:dio/dio.dart';
import 'package:solar_crm_mobile/core/constants/api_endpoints.dart';
import 'package:solar_crm_mobile/core/network/api_client.dart';

class BackOfficeRepository {
  final ApiClient _apiClient;

  BackOfficeRepository({ApiClient? apiClient})
      : _apiClient = apiClient ?? ApiClient();

  // Helper method to safely extract user-friendly error messages without throwing index type exceptions
  String _extractErrorMessage(dynamic error, String fallback) {
    if (error is DioException) {
      final data = error.response?.data;
      if (data is Map) {
        final msg = data['message'] ?? data['error'];
        if (msg != null && msg.toString().trim().isNotEmpty) {
          return msg.toString();
        }
      } else if (data is String && data.trim().isNotEmpty) {
        if (!data.trim().startsWith('<')) {
          return data.trim();
        }
      }
      if (error.response?.statusCode == 404) {
        return 'Operations & Documents service not found (404). Please ensure server is running.';
      }
      return error.message ?? fallback;
    }
    return error?.toString() ?? fallback;
  }

  // 1. Create Project File on Lead Won
  Future<Map<String, dynamic>> createProjectFile(Map<String, dynamic> data) async {
    try {
      final response = await _apiClient.dio.post(
        ApiEndpoints.filesCreate,
        data: data,
      );
      if (response.data is Map) {
        return Map<String, dynamic>.from(response.data as Map);
      }
      return {'success': true};
    } on DioException catch (e) {
      throw _extractErrorMessage(e, 'Failed to create file');
    } catch (e) {
      throw _extractErrorMessage(e, 'Failed to create file');
    }
  }

  // 2. Upload Document (Aadhaar, Bill, Meter Photo, etc.)
  Future<String> uploadDocument({
    required int fileId,
    required File file,
    required String docType,
    String? docNumber,
  }) async {
    try {
      final fileName = file.path.split('/').last.split('\\').last;
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(file.path, filename: fileName),
        'doc_type': docType,
        if (docNumber != null) 'document_number': docNumber,
      });

      final response = await _apiClient.dio.post(
        '${ApiEndpoints.filesDocument}/$fileId/document',
        data: formData,
      );

      if (response.data is Map) {
        return response.data['file_url']?.toString() ?? '';
      }
      return '';
    } on DioException catch (e) {
      throw _extractErrorMessage(e, 'Document upload failed');
    } catch (e) {
      throw _extractErrorMessage(e, 'Document upload failed');
    }
  }

  // 3. Get User Assigned Stage Queue (Field Staff & Back Office)
  Future<Map<String, dynamic>> getMyQueue() async {
    try {
      final response = await _apiClient.dio.get(ApiEndpoints.filesMyQueue);
      if (response.data is Map) {
        return Map<String, dynamic>.from(response.data as Map);
      }
      return {'success': true, 'role': 'Staff', 'files': []};
    } on DioException catch (e) {
      throw _extractErrorMessage(e, 'Failed to fetch queue');
    } catch (e) {
      throw _extractErrorMessage(e, 'Failed to fetch queue');
    }
  }

  // 4. Perform Stage Action (Submit, Hold, Clear, Yes, No, Paid, Due)
  Future<Map<String, dynamic>> performStageAction({
    required int fileId,
    required int stageNumber,
    required String action,
    String? remarks,
    String? proofUrl,
    String? wifiReason,
  }) async {
    try {
      final payload = {
        'stage_number': stageNumber,
        'action': action,
        if (remarks != null) 'remarks': remarks,
        if (proofUrl != null) 'proof_url': proofUrl,
        if (wifiReason != null) 'wifi_not_connected_reason': wifiReason,
      };

      final response = await _apiClient.dio.post(
        '${ApiEndpoints.filesStageAction}/$fileId/stage-action',
        data: payload,
      );
      if (response.data is Map) {
        return Map<String, dynamic>.from(response.data as Map);
      }
      return {'success': true};
    } on DioException catch (e) {
      throw _extractErrorMessage(e, 'Action failed');
    } catch (e) {
      throw _extractErrorMessage(e, 'Action failed');
    }
  }

  // 5. Get Sales Live Tracker
  Future<Map<String, dynamic>> getSalesTracker(int leadId) async {
    try {
      final response = await _apiClient.dio.get(
        '${ApiEndpoints.filesLeadTracker}/$leadId/tracker',
      );
      if (response.data is Map) {
        return Map<String, dynamic>.from(response.data as Map);
      }
      return {'success': true};
    } on DioException catch (e) {
      throw _extractErrorMessage(e, 'Failed to load tracker');
    } catch (e) {
      throw _extractErrorMessage(e, 'Failed to load tracker');
    }
  }

  // 6. Get Full File Detail with Timeline & Ledgers
  Future<Map<String, dynamic>> getFileDetail(int fileId) async {
    try {
      final response = await _apiClient.dio.get(
        '${ApiEndpoints.filesDetail}/$fileId',
      );
      if (response.data is Map) {
        return Map<String, dynamic>.from(response.data as Map);
      }
      return {'success': true};
    } on DioException catch (e) {
      throw _extractErrorMessage(e, 'Failed to load file detail');
    } catch (e) {
      throw _extractErrorMessage(e, 'Failed to load file detail');
    }
  }

  // 7. Add Project Payment (Accounts Desk Stage 5 & 7)
  Future<Map<String, dynamic>> addPayment({
    required int fileId,
    required String paymentStage,
    required double amount,
    required String paymentMode,
    String? referenceNumber,
    String? bankName,
    String? chequeDate,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        '${ApiEndpoints.filesPayment}/$fileId/payment',
        data: {
          'payment_stage': paymentStage,
          'amount': amount,
          'payment_mode': paymentMode,
          if (referenceNumber != null) 'reference_number': referenceNumber,
          if (bankName != null) 'bank_name': bankName,
          if (chequeDate != null) 'cheque_date': chequeDate,
        },
      );
      if (response.data is Map) {
        return Map<String, dynamic>.from(response.data as Map);
      }
      return {'success': true};
    } on DioException catch (e) {
      throw _extractErrorMessage(e, 'Payment logging failed');
    } catch (e) {
      throw _extractErrorMessage(e, 'Payment logging failed');
    }
  }

  // 8. Super Admin Initial Rate Approval
  Future<Map<String, dynamic>> updateRateApproval({
    required int fileId,
    required String action,
    String? remarks,
  }) async {
    try {
      final response = await _apiClient.dio.patch(
        '${ApiEndpoints.filesRateApproval}/$fileId/rate-approval',
        data: {
          'action': action,
          if (remarks != null) 'remarks': remarks,
        },
      );
      if (response.data is Map) {
        return Map<String, dynamic>.from(response.data as Map);
      }
      return {'success': true};
    } on DioException catch (e) {
      throw _extractErrorMessage(e, 'Rate approval failed');
    } catch (e) {
      throw _extractErrorMessage(e, 'Rate approval failed');
    }
  }

  // 9. Get All Project Documents (Document Repository & Vault)
  Future<List<dynamic>> getAllDocuments({String? docType, String? search}) async {
    try {
      final queryParams = <String, dynamic>{};
      if (docType != null && docType.isNotEmpty && docType != 'All') {
        queryParams['doc_type'] = docType;
      }
      if (search != null && search.isNotEmpty) {
        queryParams['search'] = search;
      }

      final response = await _apiClient.dio.get(
        ApiEndpoints.filesDocumentsAll,
        queryParameters: queryParams.isNotEmpty ? queryParams : null,
      );

      if (response.data is Map) {
        final data = response.data as Map;
        final docs = data['documents'];
        if (docs is List) {
          return docs;
        }
      } else if (response.data is List) {
        return response.data as List<dynamic>;
      }
      return [];
    } on DioException catch (e) {
      throw _extractErrorMessage(e, 'Failed to fetch documents');
    } catch (e) {
      throw _extractErrorMessage(e, 'Failed to fetch documents');
    }
  }
}
