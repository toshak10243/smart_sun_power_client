import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../sales/data/repositories/back_office_repository.dart';

class DocumentRepositoryScreen extends StatefulWidget {
  const DocumentRepositoryScreen({super.key});

  @override
  State<DocumentRepositoryScreen> createState() =>
      _DocumentRepositoryScreenState();
}

class _DocumentRepositoryScreenState extends State<DocumentRepositoryScreen> {
  final _repository = BackOfficeRepository();
  bool _isLoading = true;
  String? _errorMessage;
  List<dynamic> _allDocuments = [];

  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();
  String _selectedDocType = 'All';

  final List<String> _docTypes = [
    'All',
    'Aadhaar Card',
    'Electricity Bill',
    'Bank Cheque',
    'PAN Card',
    'Property Document',
    'Meter Application Photo',
  ];

  @override
  void initState() {
    super.initState();
    _fetchDocuments();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchDocuments() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final docs = await _repository.getAllDocuments();
      if (!mounted) return;
      setState(() {
        _allDocuments = docs;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
        _allDocuments = [];
        _isLoading = false;
      });
    }
  }

  List<dynamic> get _filteredDocuments {
    return _allDocuments.where((doc) {
      if (doc is! Map) return false;
      // 1. Doc Type filter
      if (_selectedDocType != 'All') {
        final dt = (doc['doc_type'] ?? '').toString().toLowerCase();
        if (!dt.contains(_selectedDocType.toLowerCase())) {
          return false;
        }
      }

      // 2. Search query filter
      if (_searchQuery.isNotEmpty) {
        final q = _searchQuery.toLowerCase();
        final fileNum = (doc['file_number'] ?? '').toString().toLowerCase();
        final custName = (doc['customer_name'] ?? '').toString().toLowerCase();
        final phone = (doc['phone_number'] ?? '').toString().toLowerCase();
        final docNum = (doc['document_number'] ?? '').toString().toLowerCase();
        final originalName = (doc['original_filename'] ?? '').toString().toLowerCase();

        if (!fileNum.contains(q) &&
            !custName.contains(q) &&
            !phone.contains(q) &&
            !docNum.contains(q) &&
            !originalName.contains(q)) {
          return false;
        }
      }

      return true;
    }).toList();
  }

  Map<String, dynamic> _getDocTypeStyle(String type) {
    final t = type.toLowerCase();
    if (t.contains('aadhaar')) {
      return {
        'color': const Color(0xFF005BAC),
        'bg': const Color(0xFFE0F2FE),
        'icon': Icons.badge_outlined,
      };
    } else if (t.contains('bill') || t.contains('electricity')) {
      return {
        'color': const Color(0xFFEA580C),
        'bg': const Color(0xFFFFEDD5),
        'icon': Icons.receipt_long_outlined,
      };
    } else if (t.contains('cheque') || t.contains('bank')) {
      return {
        'color': const Color(0xFF16A34A),
        'bg': const Color(0xFFDCFCE7),
        'icon': Icons.account_balance_outlined,
      };
    } else if (t.contains('pan')) {
      return {
        'color': const Color(0xFF7C3AED),
        'bg': const Color(0xFFEDE9FE),
        'icon': Icons.credit_card_outlined,
      };
    } else if (t.contains('property')) {
      return {
        'color': const Color(0xFF2563EB),
        'bg': const Color(0xFFDBEAFE),
        'icon': Icons.home_work_outlined,
      };
    } else if (t.contains('meter') || t.contains('photo')) {
      return {
        'color': const Color(0xFF0D9488),
        'bg': const Color(0xFFCCFBF1),
        'icon': Icons.photo_camera_outlined,
      };
    }

    return {
      'color': const Color(0xFF475569),
      'bg': const Color(0xFFF1F5F9),
      'icon': Icons.description_outlined,
    };
  }

  bool _isImageFile(String url) {
    final clean = url.toLowerCase().split('?').first;
    return clean.endsWith('.jpg') ||
        clean.endsWith('.jpeg') ||
        clean.endsWith('.png') ||
        clean.endsWith('.webp');
  }

  Future<void> _openDocument(Map<String, dynamic> doc) async {
    final rawUrl = doc['file_url']?.toString() ?? '';
    if (rawUrl.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Document link not available')),
      );
      return;
    }

    final fullUrl = ApiEndpoints.getFullFileUrl(rawUrl);

    if (_isImageFile(fullUrl)) {
      _showImageDialog(fullUrl, doc);
      return;
    }

    // For PDF, DOCX, XLSX etc. -> Download & trigger Share/View
    await _downloadAndShareDocument(fullUrl, doc);
  }

  void _showImageDialog(String fullUrl, Map<String, dynamic> doc) {
    final safeUrl = Uri.encodeFull(fullUrl);

    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(12),
        child: Stack(
          children: [
            Container(
              decoration: BoxDecoration(
                color: Colors.black,
                borderRadius: BorderRadius.circular(16),
              ),
              child: InteractiveViewer(
                maxScale: 5.0,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Image.network(
                    safeUrl,
                    fit: BoxFit.contain,
                    loadingBuilder: (context, child, loadingProgress) {
                      if (loadingProgress == null) return child;
                      return const Center(
                        child: Padding(
                          padding: EdgeInsets.all(40),
                          child: CircularProgressIndicator(color: Colors.white),
                        ),
                      );
                    },
                    errorBuilder: (context, error, stackTrace) {
                      return Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.broken_image, color: Colors.white70, size: 48),
                              const SizedBox(height: 12),
                              const Text(
                                'Could not preview image directly',
                                style: TextStyle(color: Colors.white, fontSize: 13),
                              ),
                              const SizedBox(height: 16),
                              ElevatedButton.icon(
                                onPressed: () {
                                  Navigator.pop(ctx);
                                  _downloadAndShareDocument(fullUrl, doc);
                                },
                                icon: const Icon(Icons.download_rounded, size: 16),
                                label: const Text('Download / Share File'),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),
            ),
            Positioned(
              top: 10,
              right: 10,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircleAvatar(
                    backgroundColor: Colors.black54,
                    child: IconButton(
                      icon: const Icon(Icons.share, color: Colors.white, size: 18),
                      tooltip: 'Share Image',
                      onPressed: () => _downloadAndShareDocument(fullUrl, doc),
                    ),
                  ),
                  const SizedBox(width: 8),
                  CircleAvatar(
                    backgroundColor: Colors.black54,
                    child: IconButton(
                      icon: const Icon(Icons.close, color: Colors.white, size: 20),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _downloadAndShareDocument(String fullUrl, Map<String, dynamic> doc) async {
    // Show download indicator dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        content: Row(
          children: [
            const CircularProgressIndicator(color: Color(0xFF005BAC)),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Preparing Document...', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  const SizedBox(height: 4),
                  Text(
                    doc['original_filename'] ?? 'Downloading file safely',
                    style: const TextStyle(fontSize: 11, color: Colors.grey),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );

    try {
      final dio = Dio();
      final tempDir = await getTemporaryDirectory();
      String filename = (doc['original_filename'] ?? '').toString().trim();
      if (filename.isEmpty) {
        filename = fullUrl.split('/').last.split('?').first;
      }
      if (filename.isEmpty) {
        filename = 'doc_${doc['id'] ?? DateTime.now().millisecondsSinceEpoch}';
      }

      // Clean invalid characters
      filename = filename.replaceAll(RegExp(r'[\\/:*?"<>|]'), '_');

      // Ensure proper extension
      final urlPath = fullUrl.split('?').first;
      if (urlPath.contains('.')) {
        final ext = urlPath.split('.').last.toLowerCase();
        if (!filename.toLowerCase().endsWith('.$ext')) {
          filename = '$filename.$ext';
        }
      }

      final filePath = '${tempDir.path}/$filename';
      final safeUrl = Uri.encodeFull(fullUrl);

      await dio.download(
        safeUrl,
        filePath,
        options: Options(
          responseType: ResponseType.bytes,
          followRedirects: true,
        ),
      );

      final file = File(filePath);
      if (!await file.exists() || await file.length() == 0) {
        throw Exception('Downloaded file is empty');
      }

      if (mounted) Navigator.pop(context); // Close dialog

      // Open with system share sheet (Google Drive, WhatsApp, Adobe Reader, Word)
      await Share.shareXFiles(
        [XFile(filePath)],
        text: 'Document: ${doc['doc_type'] ?? 'Project Document'} (${doc['file_number'] ?? ''})',
      );
    } catch (e) {
      if (mounted) Navigator.pop(context); // Close dialog

      // Fallback: try opening URL directly in external application/browser
      try {
        final safeUri = Uri.parse(Uri.encodeFull(fullUrl));
        await launchUrl(safeUri, mode: LaunchMode.externalApplication);
      } catch (launchErr) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Could not open document: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final docs = _filteredDocuments;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Project Documents Vault',
              style: TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 18,
                color: AppColors.textPrimary,
                letterSpacing: -0.3,
              ),
            ),
            Text(
              'KYC & Technical Documents (${_allDocuments.length} files)',
              style: const TextStyle(
                fontSize: 11,
                color: AppColors.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: AppColors.primary),
            tooltip: 'Refresh Documents',
            onPressed: _fetchDocuments,
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: Column(
        children: [
          // 1. Search Box
          Container(
            padding: const EdgeInsets.fromLTRB(14, 12, 14, 8),
            color: Colors.white,
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search file #, customer, phone, doc #...',
                hintStyle: const TextStyle(fontSize: 12, color: Colors.grey),
                prefixIcon: const Icon(Icons.search, size: 20, color: Colors.grey),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 18),
                        onPressed: () {
                          _searchController.clear();
                          setState(() => _searchQuery = '');
                        },
                      )
                    : null,
                contentPadding: const EdgeInsets.symmetric(vertical: 10),
                filled: true,
                fillColor: const Color(0xFFF1F5F9),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide.none,
                ),
              ),
              onChanged: (val) {
                setState(() => _searchQuery = val.trim());
              },
            ),
          ),

          // 2. Category Filter Chips
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(14, 4, 14, 10),
            color: Colors.white,
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: _docTypes.map((type) {
                  final isSel = _selectedDocType == type;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      selected: isSel,
                      label: Text(type),
                      labelStyle: TextStyle(
                        fontSize: 11,
                        fontWeight: isSel ? FontWeight.w700 : FontWeight.w500,
                        color: isSel ? Colors.white : const Color(0xFF475569),
                      ),
                      backgroundColor: const Color(0xFFF1F5F9),
                      selectedColor: const Color(0xFF005BAC),
                      checkmarkColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      side: BorderSide.none,
                      onSelected: (_) {
                        setState(() => _selectedDocType = type);
                      },
                    ),
                  );
                }).toList(),
              ),
            ),
          ),

          const Divider(height: 1, color: Color(0xFFE2E8F0)),

          // 3. Document List View
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                : _errorMessage != null
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(20),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.error_outline_rounded, color: Colors.red, size: 40),
                              const SizedBox(height: 10),
                              Text(_errorMessage!, textAlign: TextAlign.center, style: const TextStyle(color: Colors.red)),
                              const SizedBox(height: 14),
                              ElevatedButton(
                                onPressed: _fetchDocuments,
                                child: const Text('Retry'),
                              ),
                            ],
                          ),
                        ),
                      )
                    : docs.isEmpty
                        ? Center(
                            child: Padding(
                              padding: const EdgeInsets.all(32),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.folder_open_rounded, size: 54, color: Colors.grey[400]),
                                  const SizedBox(height: 12),
                                  const Text(
                                    'No Documents Found',
                                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF0F172A)),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    _searchQuery.isNotEmpty
                                        ? 'No documents match "$_searchQuery"'
                                        : 'No documents uploaded for this filter yet.',
                                    textAlign: TextAlign.center,
                                    style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                                  ),
                                ],
                              ),
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: _fetchDocuments,
                            color: AppColors.primary,
                            child: ListView.builder(
                              padding: const EdgeInsets.all(14),
                              itemCount: docs.length,
                              itemBuilder: (context, idx) {
                                if (docs[idx] is! Map) return const SizedBox.shrink();
                                final doc = Map<String, dynamic>.from(docs[idx] as Map);
                                final docType = doc['doc_type']?.toString() ?? 'Document';
                                final style = _getDocTypeStyle(docType);
                                final fileNum = doc['file_number']?.toString() ?? 'SSP-FILE';
                                final custName = doc['customer_name']?.toString() ?? 'Customer';
                                final phone = doc['phone_number']?.toString() ?? '';
                                final aen = doc['aen_office']?.toString() ?? '';
                                final docNumber = doc['document_number']?.toString();
                                final date = doc['created_at']?.toString().split('T')[0] ?? '';
                                final rawUrl = doc['file_url']?.toString() ?? '';
                                final fullUrl = ApiEndpoints.getFullFileUrl(rawUrl);
                                final isImage = _isImageFile(fullUrl);

                                return Card(
                                  margin: const EdgeInsets.only(bottom: 12),
                                  elevation: 0,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    side: const BorderSide(color: Color(0xFFE2E8F0)),
                                  ),
                                  child: Padding(
                                    padding: const EdgeInsets.all(14),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        // Header Row: Doc Badge + File No
                                        Row(
                                          children: [
                                            Container(
                                              padding: const EdgeInsets.all(8),
                                              decoration: BoxDecoration(
                                                color: style['bg'] as Color,
                                                borderRadius: BorderRadius.circular(8),
                                              ),
                                              child: Icon(style['icon'] as IconData, size: 18, color: style['color'] as Color),
                                            ),
                                            const SizedBox(width: 10),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    docType,
                                                    style: TextStyle(
                                                      fontWeight: FontWeight.w800,
                                                      fontSize: 13,
                                                      color: style['color'] as Color,
                                                    ),
                                                  ),
                                                  if (docNumber != null && docNumber.isNotEmpty)
                                                    Text(
                                                      'No: $docNumber',
                                                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF334155)),
                                                    ),
                                                ],
                                              ),
                                            ),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFFF1F5F9),
                                                borderRadius: BorderRadius.circular(6),
                                              ),
                                              child: Text(
                                                fileNum,
                                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Color(0xFF0B3A63)),
                                              ),
                                            ),
                                          ],
                                        ),

                                        const SizedBox(height: 12),
                                        const Divider(height: 1, color: Color(0xFFF1F5F9)),
                                        const SizedBox(height: 10),

                                        // Customer & Meta Info
                                        Row(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    custName,
                                                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: Color(0xFF0F172A)),
                                                  ),
                                                  const SizedBox(height: 2),
                                                  Row(
                                                    children: [
                                                      if (phone.isNotEmpty) ...[
                                                        const Icon(Icons.phone, size: 11, color: Colors.grey),
                                                        const SizedBox(width: 4),
                                                        Text(phone, style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                                                        const SizedBox(width: 8),
                                                      ],
                                                      if (aen.isNotEmpty) ...[
                                                        const Icon(Icons.location_on_outlined, size: 11, color: Colors.grey),
                                                        const SizedBox(width: 2),
                                                        Text(aen, style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                                                      ],
                                                    ],
                                                  ),
                                                  const SizedBox(height: 2),
                                                  Text(
                                                    'Uploaded on: $date',
                                                    style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8)),
                                                  ),
                                                ],
                                              ),
                                            ),
                                            Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                // Share button
                                                IconButton(
                                                  icon: const Icon(Icons.share_outlined, size: 18, color: Color(0xFF64748B)),
                                                  tooltip: 'Share via WhatsApp / Drive',
                                                  constraints: const BoxConstraints(),
                                                  padding: const EdgeInsets.all(8),
                                                  onPressed: () => _downloadAndShareDocument(fullUrl, doc),
                                                ),
                                                const SizedBox(width: 4),
                                                // View / Open button
                                                ElevatedButton.icon(
                                                  onPressed: () => _openDocument(doc),
                                                  icon: Icon(
                                                    isImage ? Icons.visibility_outlined : Icons.download_rounded,
                                                    size: 14,
                                                  ),
                                                  label: Text(
                                                    isImage ? 'View' : 'Open',
                                                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                                                  ),
                                                  style: ElevatedButton.styleFrom(
                                                    backgroundColor: const Color(0xFF005BAC),
                                                    foregroundColor: Colors.white,
                                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                                    minimumSize: const Size(0, 32),
                                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }
}
