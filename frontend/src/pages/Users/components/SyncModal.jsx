import React from 'react'
import { Modal, Button, Spinner, Alert, Row, Col, Card } from 'react-bootstrap'

const SyncModal = ({ show, onHide, onConfirm, loading, result }) => {
    return (
        <Modal show={show} onHide={!loading && onHide} className="fade-in">
            <Modal.Header closeButton={!loading} style={{ background: 'var(--gradient-card)', borderBottom: '1px solid var(--border-primary)' }}>
                <Modal.Title style={{ color: 'var(--text-primary)' }}>
                    <i className="bi bi-arrow-repeat me-2" style={{ color: 'var(--accent-primary)' }}></i>
                    Synchronize Users
                </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                {!result ? (
                    <>
                        <p>You are about to synchronize user data from the external HR system.</p>
                        <Alert variant="info" className="bg-opacity-10 border-info text-info">
                            <i className="bi bi-info-circle me-2"></i>
                            This will add new users and update existing ones. No users will be deleted.
                        </Alert>
                        {loading && (
                            <div className="text-center py-4">
                                <Spinner animation="border" variant="primary" className="mb-3" />
                                <p className="mb-0">Syncing with external database...</p>
                                <small className="text-muted">This may take a few moments</small>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-3">
                        <div className="mb-4">
                            <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '3rem' }}></i>
                            <h4 className="mt-2">Synchronization Complete!</h4>
                        </div>
                        <Row className="g-3">
                            <Col xs={6}>
                                <Card className="border-0 bg-opacity-10 bg-primary text-primary py-3">
                                    <h3 className="mb-0 fw-bold">{result.added}</h3>
                                    <small>New Users</small>
                                </Card>
                            </Col>
                            <Col xs={6}>
                                <Card className="border-0 bg-opacity-10 bg-info text-info py-3">
                                    <h3 className="mb-0 fw-bold">{result.updated}</h3>
                                    <small>Updated</small>
                                </Card>
                            </Col>
                        </Row>
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer style={{ background: 'var(--gradient-card)', borderTop: '1px solid var(--border-primary)' }}>
                {!result ? (
                    <>
                        <Button variant="secondary" onClick={onHide} disabled={loading}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={onConfirm} disabled={loading}>
                            {loading ? 'Syncing...' : 'Start Synchronize'}
                        </Button>
                    </>
                ) : (
                    <Button variant="primary" onClick={onHide}>
                        Close
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    )
}

export default SyncModal
