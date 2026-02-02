import React from 'react'
import { Modal, Button, Alert, Card, Spinner } from 'react-bootstrap'

const DeleteModal = ({ show, onHide, onConfirm, user, loading }) => {
    return (
        <Modal show={show} onHide={onHide} className="fade-in">
            <Modal.Header closeButton style={{ background: 'var(--gradient-card)', borderBottom: '1px solid var(--border-primary)' }}>
                <Modal.Title style={{ color: 'var(--text-primary)' }}>
                    <i className="bi bi-exclamation-triangle me-2" style={{ color: '#ff6b6b' }}></i>
                    Delete User
                </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                {user && (
                    <>
                        <Alert variant="danger" className="bg-opacity-10 border-danger text-danger mb-3">
                            <i className="bi bi-exclamation-circle me-2"></i>
                            This action cannot be undone!
                        </Alert>
                        <p>Are you sure you want to delete this user?</p>
                        <Card className="border-0 bg-opacity-10 bg-secondary p-3" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                            <div className="mb-2">
                                <strong style={{ color: 'var(--text-primary)' }}>Name:</strong>
                                <br />
                                <span className="text-muted">{user.name}</span>
                            </div>
                            <div className="mb-2">
                                <strong style={{ color: 'var(--text-primary)' }}>Employee ID:</strong>
                                <br />
                                <span className="text-muted">{user.employee_id}</span>
                            </div>
                            <div>
                                <strong style={{ color: 'var(--text-primary)' }}>Role:</strong>
                                <br />
                                <span className="text-muted">{user.role}</span>
                            </div>
                        </Card>
                    </>
                )}
            </Modal.Body>
            <Modal.Footer style={{ background: 'var(--gradient-card)', borderTop: '1px solid var(--border-primary)' }}>
                <Button variant="secondary" onClick={onHide} disabled={loading}>
                    Cancel
                </Button>
                <Button 
                    variant="danger" 
                    onClick={onConfirm} 
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                            <span className="ms-2">Deleting...</span>
                        </>
                    ) : (
                        <>
                            <i className="bi bi-trash me-2"></i>
                            Delete User
                        </>
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    )
}

export default DeleteModal
