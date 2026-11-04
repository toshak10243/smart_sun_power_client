#!/usr/bin/env bash
# ==============================================================================
# Solar CRM - Automated Enterprise Backup Script
# Runs daily at 2:00 AM via Crontab
# Saves compressed, timestamped MySQL dumps locally on VPS
# Automatically prunes backups older than 30 days
# Dispatches confirmation email to indiansmartsunpower@gmail.com
# ==============================================================================

set -eo pipefail

BACKUP_DIR="/var/backups/solar_crm"
LOG_FILE="/var/log/solar_crm_backup.log"
TIMESTAMP=$(date +"%Y-%m-%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/solar_crm_backup_${TIMESTAMP}.sql.gz"
DB_USER="solar_crm_user"
DB_PASS="Root@123"
DB_NAME="solar_crm"
RETENTION_DAYS=30
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# 1. Ensure backup directory exists with restricted permissions
mkdir -p "${BACKUP_DIR}"
chmod 700 "${BACKUP_DIR}"

log "=== Starting Solar CRM Daily Database Backup ==="

# 2. Perform consistent mysqldump with single transaction and gzip compression
if mysqldump --single-transaction --quick --routines --triggers \
    -u "${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" 2>/dev/null | gzip -9 > "${BACKUP_FILE}"; then
    
    # 3. Verify archive integrity
    if gzip -t "${BACKUP_FILE}" 2>/dev/null; then
        FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
        log "✅ Backup created successfully: ${BACKUP_FILE} (Size: ${FILE_SIZE})"
    else
        log "❌ Backup file corruption detected! Removing corrupt file."
        rm -f "${BACKUP_FILE}"
        exit 1
    fi
else
    log "❌ mysqldump failed to export database!"
    exit 1
fi

# 4. Clean up backups older than RETENTION_DAYS (30 days) to prevent disk overflow
DELETED_COUNT=$(find "${BACKUP_DIR}" -type f -name "solar_crm_backup_*.sql.gz" -mtime +"${RETENTION_DAYS}" | wc -l)
if [ "${DELETED_COUNT}" -gt 0 ]; then
    find "${BACKUP_DIR}" -type f -name "solar_crm_backup_*.sql.gz" -mtime +"${RETENTION_DAYS}" -delete
    log "🧹 Cleaned up ${DELETED_COUNT} old backup(s) older than ${RETENTION_DAYS} days."
else
    log "ℹ️ No old backups needed pruning (< ${RETENTION_DAYS} days)."
fi

TOTAL_BACKUPS=$(find "${BACKUP_DIR}" -type f -name "solar_crm_backup_*.sql.gz" | wc -l)
log "📦 Total active backups in ${BACKUP_DIR}: ${TOTAL_BACKUPS}"

# 5. Send confirmation email to indiansmartsunpower@gmail.com
log "📧 Sending backup confirmation email to indiansmartsunpower@gmail.com..."
if [ -f "${SCRIPT_DIR}/send_backup_email.js" ]; then
    node "${SCRIPT_DIR}/send_backup_email.js" "${BACKUP_FILE}" "${FILE_SIZE}" "${TOTAL_BACKUPS}" || true
    log "✅ Backup notification email processed."
fi

log "=== Solar CRM Backup Completed Successfully ==="
