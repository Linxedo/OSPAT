import React, { useState } from 'react'
import { Modal, Form, Button, Alert, ProgressBar, Table } from 'react-bootstrap'
import { uploadCSV, previewCSV } from '../../../services/adminService'

const CSVImportModal = ({ show, onHide, onImportSuccess }) => {
    const [step, setStep] = useState('upload') // upload, mapping, confirm
    const [file, setFile] = useState(null)
    const [preview, setPreview] = useState(null)
    const [columnMapping, setColumnMapping] = useState({})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    // Handle file selection
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0]
        if (selectedFile) {
            // Validate file type
            if (!selectedFile.name.endsWith('.csv')) {
                setError('Please select a CSV file')
                return
            }
            setFile(selectedFile)
            setError(null)
        }
    }

    // Preview CSV
    const handlePreview = async () => {
        if (!file) {
            setError('Please select a file first')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const formData = new FormData()
            formData.append('csvFile', file)

            console.log('Sending preview request:', {
                file: file.name,
                size: file.size,
                type: file.type
            })

            const response = await previewCSV(formData)

            console.log('Preview response:', response)

            if (response.success) {
                setPreview(response.data)
                setColumnMapping(response.data.columnMapping)
                setStep('mapping')
            } else {
                setError(response.message || 'Failed to preview CSV')
            }
        } catch (err) {
            console.error('Preview error:', err)

            // Better error handling
            if (err.response) {
                const errorData = err.response.data
                console.error('Error response:', errorData)

                if (err.response.status === 400) {
                    if (errorData.message) {
                        setError(`Bad Request: ${errorData.message}`)
                    } else {
                        setError('Bad Request: Invalid CSV format or empty file')
                    }
                } else if (err.response.status === 413) {
                    setError('File too large. Maximum size is 5MB.')
                } else {
                    setError(`Error ${err.response.status}: ${errorData.message || 'Preview failed'}`)
                }
            } else if (err.request) {
                setError('Network error. Please check your connection and try again.')
            } else {
                setError('Failed to process CSV file. Please check the file format.')
            }
        } finally {
            setLoading(false)
        }
    }

    // Handle column mapping change
    const handleMappingChange = (requiredField, csvColumn) => {
        setColumnMapping(prev => ({
            ...prev,
            [requiredField]: csvColumn
        }))
    }

    // Confirm import
    const handleConfirmImport = async () => {
        if (!file) {
            setError('No file to import')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const formData = new FormData()
            formData.append('csvFile', file)

            // Pastikan columnMapping terkirim sebagai string JSON
            const mappingString = JSON.stringify(columnMapping)
            formData.append('columnMapping', mappingString)

            console.log('Sending import request:', {
                file: file.name,
                size: file.size,
                columnMapping: mappingString,
                columnMappingObject: columnMapping
            })

            const response = await uploadCSV(formData)

            console.log('Import response:', response)

            if (response.success) {
                onImportSuccess(response.data)
                handleClose()
            } else {
                setError(response.message || 'Import failed')
            }
        } catch (err) {
            console.error('Import error:', err)

            // Better error handling
            if (err.response) {
                const errorData = err.response.data
                console.error('Error response:', errorData)

                if (err.response.status === 400) {
                    if (errorData.message) {
                        setError(`Bad Request: ${errorData.message}`)
                    } else {
                        setError('Bad Request: Invalid data format or missing required fields')
                    }
                } else if (err.response.status === 413) {
                    setError('File too large. Maximum size is 5MB.')
                } else if (err.response.status === 500) {
                    setError('Server error. Please try again later.')
                } else {
                    setError(`Error ${err.response.status}: ${errorData.message || 'Unknown error'}`)
                }
            } else if (err.request) {
                setError('Network error. Please check your connection and try again.')
            } else {
                setError('Import failed. Please try again.')
            }
        } finally {
            setLoading(false)
        }
    }

    // Close modal
    const handleClose = () => {
        setStep('upload')
        setFile(null)
        setPreview(null)
        setColumnMapping({})
        setError(null)
        onHide()
    }

    // Get available columns for mapping
    const getAvailableColumns = () => {
        return preview ? preview.detectedColumns : []
    }

    // Get required fields
    const getRequiredFields = () => [
        { key: 'name', label: 'Name', required: true },
        { key: 'employee_id', label: 'Employee ID', required: true },
        { key: 'nik', label: 'NIK', required: false },
        { key: 'role', label: 'Role', required: false, note: 'Will auto-set to "user" if empty or invalid' }
    ]

    return (
        <Modal
            show={show}
            onHide={handleClose}
            size="xl"
            className="fade-in"
            style={{ background: 'var(--bg-card)' }}
        >
            <Modal.Header
                closeButton
                style={{ background: 'var(--gradient-card)', borderBottom: '1px solid var(--border-primary)' }}
            >
                <Modal.Title style={{ color: 'var(--text-primary)' }}>
                    <i className="bi bi-file-earmark-csv me-2"></i>
                    Import Users from CSV
                </Modal.Title>
            </Modal.Header>

            <Modal.Body style={{ background: 'var(--bg-card)' }}>
                {error && (
                    <Alert variant="danger" dismissible onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {step === 'upload' && (
                    <div>
                        <h5 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
                            Step 1: Select CSV File
                        </h5>

                        <Form.Group className="mb-3">
                            <Form.Label style={{ color: 'var(--text-primary)' }}>
                                Choose CSV File
                            </Form.Label>
                            <Form.Control
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                style={{
                                    backgroundColor: 'var(--bg-tertiary)',
                                    borderColor: 'var(--border-secondary)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                            <Form.Text className="text-muted">
                                Select a CSV file containing user data. Maximum file size: 5MB
                            </Form.Text>
                        </Form.Group>

                        <Alert variant="info">
                            <i className="bi bi-info-circle me-2"></i>
                            <strong>Auto-Role Assignment:</strong> All imported users will automatically be assigned the role "user".
                            If you need admin users, you can update their roles after import.
                        </Alert>

                        {file && (
                            <div className="mb-3">
                                <Alert variant="info">
                                    <i className="bi bi-info-circle me-2"></i>
                                    Selected file: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
                                </Alert>
                            </div>
                        )}

                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="secondary" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handlePreview}
                                disabled={!file || loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-eye me-2"></i>
                                        Preview CSV
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'mapping' && preview && (
                    <div>
                        <h5 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
                            Step 2: Map Columns
                        </h5>

                        <Alert variant="info">
                            <i className="bi bi-lightbulb me-2"></i>
                            We detected <strong>{preview.detectedColumns.length}</strong> columns in your CSV.
                            Please map them to the required fields.
                        </Alert>

                        <div className="row mb-4">
                            <div className="col-md-6">
                                <h6 style={{ color: 'var(--text-primary)' }}>
                                    Column Mapping
                                </h6>
                                {getRequiredFields().map(field => (
                                    <Form.Group key={field.key} className="mb-3">
                                        <Form.Label style={{ color: 'var(--text-primary)' }}>
                                            {field.label} {field.required && <span className="text-danger">*</span>}
                                            {field.note && (
                                                <small className="text-muted d-block">
                                                    <i className="bi bi-info-circle me-1"></i>
                                                    {field.note}
                                                </small>
                                            )}
                                        </Form.Label>
                                        <Form.Select
                                            value={columnMapping[field.key] || ''}
                                            onChange={(e) => handleMappingChange(field.key, e.target.value)}
                                            style={{
                                                backgroundColor: 'var(--bg-tertiary)',
                                                borderColor: 'var(--border-secondary)',
                                                color: 'var(--text-primary)'
                                            }}
                                        >
                                            <option value="">-- Select Column --</option>
                                            {getAvailableColumns().map(col => (
                                                <option key={col} value={col}>
                                                    {col} {columnMapping[field.key] === col && '✓'}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                ))}
                            </div>
                            <div className="col-md-6">
                                <h6 style={{ color: 'var(--text-primary)' }}>
                                    Import Summary
                                </h6>
                                <div className="card" style={{
                                    background: 'var(--bg-tertiary)',
                                    border: '1px solid var(--border-secondary)'
                                }}>
                                    <div className="card-body">
                                        <p className="mb-2">
                                            <strong>Total Records:</strong> {preview.totalRecords}
                                        </p>
                                        <p className="mb-2">
                                            <strong>Valid Records:</strong> {preview.validation.validRecords}
                                        </p>
                                        <p className="mb-2">
                                            <strong>Validation Errors:</strong> {preview.validation.errors.length}
                                        </p>
                                        {preview.validation.errors.length > 0 && (
                                            <Alert variant="warning" className="mb-0">
                                                <small>
                                                    <i className="bi bi-exclamation-triangle me-1"></i>
                                                    Some records have validation errors. They will be skipped during import.
                                                </small>
                                            </Alert>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <h6 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
                            Sample Data (First 3 Records)
                        </h6>
                        <div className="table-responsive">
                            <Table striped bordered hover size="sm">
                                <thead>
                                    <tr>
                                        <th>Row</th>
                                        <th>Original Data</th>
                                        <th>Processed Data</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {preview.sampleData.map((sample, index) => (
                                        <tr key={index}>
                                            <td>{sample.row}</td>
                                            <td>
                                                <pre style={{ fontSize: '0.8rem', margin: 0 }}>
                                                    {JSON.stringify(sample.original, null, 2)}
                                                </pre>
                                            </td>
                                            <td>
                                                <pre style={{ fontSize: '0.8rem', margin: 0 }}>
                                                    {JSON.stringify(sample.processed, null, 2)}
                                                </pre>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>

                        <div className="d-flex justify-content-between gap-2">
                            <Button variant="secondary" onClick={() => setStep('upload')}>
                                <i className="bi bi-arrow-left me-2"></i>
                                Back
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => setStep('confirm')}
                                disabled={Object.keys(columnMapping).filter(key =>
                                    getRequiredFields().find(f => f.key === key && f.required)
                                ).some(key => !columnMapping[key])}
                            >
                                <i className="bi bi-arrow-right me-2"></i>
                                Continue to Import
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'confirm' && (
                    <div>
                        <h5 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
                            Step 3: Confirm Import
                        </h5>

                        <Alert variant="warning">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            <strong>Important:</strong> Users with existing Employee IDs will be skipped during import.
                        </Alert>

                        <div className="text-center mb-4">
                            <h4 style={{ color: 'var(--text-primary)' }}>
                                Ready to Import
                            </h4>
                            <p className="text-muted">
                                {preview.validation.validRecords} valid records will be imported
                            </p>
                        </div>

                        <div className="d-flex justify-content-center gap-3">
                            <Button variant="secondary" onClick={() => setStep('mapping')}>
                                <i className="bi bi-arrow-left me-2"></i>
                                Back to Mapping
                            </Button>
                            <Button
                                variant="success"
                                onClick={handleConfirmImport}
                                disabled={loading}
                                size="lg"
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Importing...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-upload me-2"></i>
                                        Import Users
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {loading && (
                    <div className="text-center">
                        <ProgressBar animated now={100} />
                        <p className="mt-2 text-muted">Processing...</p>
                    </div>
                )}
            </Modal.Body>
        </Modal>
    )
}

export default CSVImportModal
