import React from 'react'
import { Modal, Button } from 'react-bootstrap'

const ImportSuccessModal = ({ show, onHide, importData }) => {
    if (!importData) return null

    const { imported, skipped, validationErrors, importErrors } = importData

    return (
        <Modal
            show={show}
            onHide={onHide}
            centered
            size="md"
            className="fade-in"
        >
            <Modal.Header
                closeButton
                className="bg-success text-white"
            >
                <Modal.Title className="d-flex align-items-center gap-3">
                    <span className="text-white" style={{ fontSize: '24px' }}>✓</span>
                    <span>Import Berhasil!</span>
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <div className="text-center">
                    <h5 className="mb-4">Ringkasan Import</h5>

                    <div className="row g-3 mb-4">
                        <div className="col-4">
                            <div className="card border-success">
                                <div className="card-body text-center py-3">
                                    <div className="text-success fw-bold fs-4">{imported}</div>
                                    <div className="text-muted">Berhasil Diimport</div>
                                </div>
                            </div>
                        </div>
                        <div className="col-4">
                            <div className="card border-warning">
                                <div className="card-body text-center py-3">
                                    <div className="text-warning fw-bold fs-4">{skipped}</div>
                                    <div className="text-muted">Dilewati</div>
                                </div>
                            </div>
                        </div>
                        <div className="col-4">
                            <div className="card border-danger">
                                <div className="card-body text-center py-3">
                                    <div className="text-danger fw-bold fs-4">{validationErrors + importErrors.length}</div>
                                    <div className="text-muted">Error</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {imported > 0 && (
                        <div className="alert alert-success">
                            <i className="bi bi-check-circle me-2"></i>
                            <strong>{imported}</strong> user berhasil diimport ke sistem.
                            {skipped > 0 && (
                                <span className="d-block mt-1">
                                    <strong>{skipped}</strong> user dilewati karena Employee ID sudah ada.
                                </span>
                            )}
                        </div>
                    )}

                    {(importErrors.length > 0 || validationErrors > 0) && (
                        <div className="alert alert-warning">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            <strong>Perhatian:</strong> Ada beberapa masalah saat import.
                            {importErrors.length > 0 && (
                                <div className="small mt-1">
                                    <strong>Error Import:</strong> {importErrors.length} user gagal diimport.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Modal.Body>

            <Modal.Footer className="d-flex justify-content-between">
                <div className="text-muted small">
                    {new Date().toLocaleString('id-ID')}
                </div>
                <div>
                    <Button variant="secondary" onClick={onHide}>
                        Tutup
                    </Button>
                    {imported > 0 && (
                        <Button
                            variant="primary"
                            onClick={() => {
                                window.location.reload()
                            }}
                            className="ms-2"
                        >
                            <i className="bi bi-arrow-clockwise me-2"></i>
                            Refresh Data
                        </Button>
                    )}
                </div>
            </Modal.Footer>
        </Modal>
    )
}

export default ImportSuccessModal
