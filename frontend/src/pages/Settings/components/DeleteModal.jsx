import React from 'react'
import { Modal, Button, Spinner } from 'react-bootstrap'

const DeleteModal = ({ show, onHide, onConfirm, question, loading }) => {
    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-primary)' }}>
                <Modal.Title style={{ color: 'var(--text-primary)' }}>
                    <i className="bi bi-exclamation-triangle-fill text-danger me-2"></i>
                    Confirm Delete
                </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                <p className="mb-3">Are you sure you want to delete this question?</p>
                {question && (
                    <div style={{
                        padding: '12px',
                        backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-secondary)'
                    }}>
                        <h6 className="mb-2" style={{ color: 'var(--text-primary)' }}>Question Details:</h6>
                        <p className="mb-1" style={{ color: 'var(--text-secondary)' }}>
                            <strong>ID:</strong> {question.question_id}
                        </p>
                        <p className="mb-1" style={{ color: 'var(--text-secondary)' }}>
                            <strong>Question:</strong> {question.question_text}
                        </p>
                        <p className="mb-0" style={{ color: 'var(--text-secondary)' }}>
                            <strong>Answers:</strong> {question.answers?.length || 0} answer(s)
                        </p>
                    </div>
                )}
                <div className="mt-3" style={{ color: '#dc3545' }}>
                    <small>
                        <i className="bi bi-info-circle me-1"></i>
                        This action cannot be undone. The question will be permanently deleted.
                    </small>
                </div>
            </Modal.Body>
            <Modal.Footer style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border-primary)' }}>
                <Button
                    variant="secondary"
                    onClick={onHide}
                    style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        borderColor: 'var(--border-secondary)',
                        color: 'var(--text-primary)'
                    }}
                >
                    Cancel
                </Button>
                <Button
                    variant="danger"
                    onClick={onConfirm}
                    disabled={loading}
                    style={{
                        backgroundColor: '#dc3545',
                        borderColor: '#dc3545'
                    }}
                >
                    {loading ? (
                        <>
                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                            <span className="ms-2">Deleting...</span>
                        </>
                    ) : (
                        <>
                            <i className="bi bi-trash3 me-2"></i>
                            Delete Question
                        </>
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    )
}

export default DeleteModal
