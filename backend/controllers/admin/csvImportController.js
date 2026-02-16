const csv = require('csv-parser');
const multer = require('multer');
const fs = require('fs');
const pool = require('../../models/db');
const logger = require('../../utils/logger');
const responseFormatter = require('../../utils/responseFormatter');
const { logActivity } = require('../../utils/helpers');

// Configure multer for file upload
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'), false);
        }
    }
});

// Middleware untuk handle FormData dengan file dan text fields
const handleFormData = (req, res, next) => {
    upload.single('csvFile')(req, res, (err) => {
        if (err) {
            return responseFormatter.error(res, err.message, 400);
        }

        // Parse columnMapping dari body (bisa string atau object)
        if (req.body.columnMapping) {
            if (typeof req.body.columnMapping === 'string') {
                try {
                    req.body.columnMapping = JSON.parse(req.body.columnMapping);
                } catch (parseError) {
                    return responseFormatter.error(res, 'Invalid columnMapping format', 400);
                }
            }
        }

        next();
    });
};

// Column detection patterns
const columnPatterns = {
    name: [
        /nama|name|full.*name|employee.*name|user.*name/i,
        /^nama$/i, /^name$/i
    ],
    employee_id: [
        /emp.*id|employee.*id|employee_number|nip|id.*pegawai/i,
        /^emp_id$/i, /^employee_id$/i, /^nip$/i
    ],
    nik: [
        /nik|no.*ktp|identity.*number|ktp|nomor.*induk/i,
        /^nik$/i, /^no_ktp$/i, /^ktp$/i
    ],
    role: [
        /role|jabatan|position|tipe|user.*role/i,
        /^role$/i, /^jabatan$/i, /^position$/i
    ]
};

// Auto-detect column mapping
function detectColumnMapping(headers) {
    const mapping = {};
    const usedHeaders = new Set();

    Object.keys(columnPatterns).forEach(requiredField => {
        let bestMatch = null;
        let bestScore = 0;

        headers.forEach(header => {
            columnPatterns[requiredField].forEach(pattern => {
                if (pattern.test(header)) {
                    const score = header.length === requiredField.length ? 100 :
                        header.toLowerCase() === requiredField.toLowerCase() ? 90 :
                            header.includes(requiredField) ? 80 : 70;

                    if (score > bestScore && !usedHeaders.has(header)) {
                        bestScore = score;
                        bestMatch = header;
                    }
                }
            });
        });

        if (bestMatch) {
            mapping[requiredField] = bestMatch;
            usedHeaders.add(bestMatch);
        }
    });

    return mapping;
}

// Validate CSV data
function validateCSVData(records, mapping) {
    const errors = [];
    const validRecords = [];

    records.forEach((record, index) => {
        const rowNumber = index + 2; // +2 because of header and 0-based index
        const processed = processRecord(record, mapping);

        // Required field validation
        if (!processed.name || processed.name.trim() === '') {
            errors.push({
                row: rowNumber,
                field: 'name',
                error: 'Name is required',
                value: record[mapping.name] || ''
            });
        }

        if (!processed.employee_id || processed.employee_id.trim() === '') {
            errors.push({
                row: rowNumber,
                field: 'employee_id',
                error: 'Employee ID is required',
                value: record[mapping.employee_id] || ''
            });
        }

        // Note: Role validation removed since it auto-sets to 'user'
        // Invalid roles will be automatically corrected in processRecord()

        // Only add to valid records if no critical errors
        const hasCriticalError = errors.some(e => e.row === rowNumber &&
            (e.field === 'name' || e.field === 'employee_id'));

        if (!hasCriticalError) {
            validRecords.push(processed);
        }
    });

    return { validRecords, errors };
}

// Process single record with mapping
function processRecord(record, mapping) {
    let role = (record[mapping.role] || '').toString().trim();

    // Auto-set role to 'user' if empty or invalid
    if (!role || !['user', 'admin'].includes(role.toLowerCase())) {
        role = 'user';
    }

    return {
        name: (record[mapping.name] || '').toString().trim(),
        employee_id: (record[mapping.employee_id] || '').toString().trim(),
        nik: record[mapping.nik] ? record[mapping.nik].toString().trim() : null,
        role: role.toLowerCase() // Normalize to lowercase
    };
}

// Preview CSV endpoint
exports.previewCSV = async (req, res) => {
    try {
        if (!req.file) {
            return responseFormatter.error(res, 'No file uploaded', 400);
        }

        const results = [];
        const filePath = req.file.path;

        await new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', resolve)
                .on('error', reject);
        });

        if (results.length === 0) {
            return responseFormatter.error(res, 'CSV file is empty', 400);
        }

        // Detect column mapping
        const headers = Object.keys(results[0]);
        const columnMapping = detectColumnMapping(headers);

        // Get sample data (first 3 records)
        const sampleData = results.slice(0, 3).map((record, index) => ({
            row: index + 2,
            original: record,
            processed: processRecord(record, columnMapping)
        }));

        // Validate all data
        const validation = validateCSVData(results, columnMapping);

        // Clean up uploaded file
        fs.unlinkSync(filePath);

        res.json({
            success: true,
            data: {
                totalRecords: results.length,
                detectedColumns: headers,
                columnMapping,
                sampleData,
                validation: {
                    validRecords: validation.validRecords.length,
                    errors: validation.errors.slice(0, 10) // Show first 10 errors
                }
            }
        });

    } catch (error) {
        logger.error('CSV preview error', error);

        // Clean up file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        responseFormatter.error(res, 'Failed to process CSV file', 500, error);
    }
};

// Confirm import endpoint
exports.confirmImport = async (req, res) => {
    try {
        const { columnMapping } = req.body;

        console.log('Confirm import request:', {
            file: req.file ? req.file.originalname : 'No file',
            columnMapping: columnMapping,
            columnMappingType: typeof columnMapping
        });

        if (!req.file) {
            return responseFormatter.error(res, 'No file uploaded', 400);
        }

        if (!columnMapping || typeof columnMapping !== 'object') {
            console.log('Column mapping validation failed:', {
                exists: !!columnMapping,
                type: typeof columnMapping,
                value: columnMapping
            });
            return responseFormatter.error(res, 'Column mapping is required and must be an object', 400);
        }

        const results = [];
        const filePath = req.file.path;

        await new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', resolve)
                .on('error', reject);
        });

        // Validate and process data
        const validation = validateCSVData(results, columnMapping);
        const { validRecords, errors } = validation;

        if (validRecords.length === 0) {
            return responseFormatter.error(res, 'No valid records to import', 400);
        }

        // Bulk insert users
        let importedCount = 0;
        let skippedCount = 0;
        const importErrors = [];

        for (const record of validRecords) {
            try {
                // Check if employee_id already exists
                const existingUser = await pool.query(
                    'SELECT id FROM users WHERE employee_id = $1',
                    [record.employee_id]
                );

                if (existingUser.rows.length > 0) {
                    skippedCount++;
                    importErrors.push({
                        employee_id: record.employee_id,
                        error: 'Employee ID already exists'
                    });
                    continue;
                }

                // Insert new user
                await pool.query(
                    'INSERT INTO users (name, employee_id, nik, role) VALUES ($1, $2, $3, $4)',
                    [record.name, record.employee_id, record.nik, record.role]
                );

                importedCount++;
            } catch (error) {
                importErrors.push({
                    employee_id: record.employee_id,
                    error: error.message
                });
            }
        }

        // Clean up uploaded file
        fs.unlinkSync(filePath);

        // Log activity
        await logActivity(
            'csv_import',
            `CSV Import: ${importedCount} users imported, ${skippedCount} skipped, ${errors.length} validation errors`,
            req.user?.id
        );

        res.json({
            success: true,
            message: 'Import completed successfully',
            data: {
                totalRecords: results.length,
                imported: importedCount,
                skipped: skippedCount,
                validationErrors: errors.length,
                importErrors: importErrors.slice(0, 20) // Show first 20 import errors
            }
        });

    } catch (error) {
        console.error('CSV import error:', error);

        // Clean up file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        responseFormatter.error(res, 'Failed to import CSV data', 500, error);
    }
};

// Middleware for file upload
exports.uploadCSV = upload.single('csvFile');
exports.handleFormData = handleFormData;
