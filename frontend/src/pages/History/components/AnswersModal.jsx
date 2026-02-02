import React from 'react'
import { Modal, Card, Row, Col, Badge, Spinner } from 'react-bootstrap'

const AnswersModal = ({ show, onHide, selectedResult, userAnswers, loading, minimumPassingScore }) => {
    return (
        <Modal
            show={show}
            onHide={onHide}
            size="lg"
            centered
            className="answer-modal"
        >
            <Modal.Header
                closeButton
                className="border-0"
                style={{
                    background: 'var(--bg-card)',
                    borderBottom: '1px solid var(--border-primary)'
                }}
            >
                <Modal.Title className="fw-bold">
                    <i className="bi bi-clipboard-check me-2" style={{ color: 'var(--accent-primary)' }}></i>
                    <span style={{ color: 'var(--text-primary)' }}>Detail Jawaban User</span>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body
                className="p-4"
                style={{
                    background: 'var(--bg-card)',
                    maxHeight: '70vh',
                    overflowY: 'auto'
                }}
            >
                {selectedResult && (
                    <div className="mb-4">
                        <Card className="border-0 shadow-sm" style={{ background: 'var(--bg-secondary)' }}>
                            <Card.Body className="p-4">
                                <Row className="g-3">
                                    <Col md={6}>
                                        <div className="d-flex align-items-center">
                                            <i className="bi bi-person-circle me-2" style={{ color: 'var(--accent-primary)' }}></i>
                                            <div>
                                                <small className="text-muted d-block" style={{ color: 'var(--text-muted)' }}>Nama</small>
                                                <strong style={{ color: 'var(--text-primary)' }}>{selectedResult.name}</strong>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col md={6}>
                                        <div className="d-flex align-items-center">
                                            <i className="bi bi-badge me-2" style={{ color: 'var(--accent-primary)' }}></i>
                                            <div>
                                                <small className="text-muted d-block" style={{ color: 'var(--text-muted)' }}>Employee ID</small>
                                                <strong style={{ color: 'var(--text-primary)' }}>{selectedResult.employee_id}</strong>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col md={6}>
                                        <div className="d-flex align-items-center">
                                            <i className="bi bi-clipboard-data me-2" style={{ color: 'var(--accent-primary)' }}></i>
                                            <div>
                                                <small className="text-muted d-block" style={{ color: 'var(--text-muted)' }}>Assessment Score</small>
                                                <Badge bg="primary" className="px-3 py-2">{selectedResult.assessment_score}</Badge>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col md={6}>
                                        <div className="d-flex align-items-center">
                                            <i className="bi bi-trophy me-2" style={{ color: 'var(--accent-primary)' }}></i>
                                            <div>
                                                <small className="text-muted d-block" style={{ color: 'var(--text-muted)' }}>Total Score</small>
                                                <Badge
                                                    bg={selectedResult.total_score >= minimumPassingScore ? 'success' : 'danger'}
                                                    className="px-3 py-2"
                                                >
                                                    {selectedResult.total_score}
                                                </Badge>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-4">
                        <Spinner animation="border" variant="primary" className="mb-3" />
                        <p className="mb-0">Loading user answers...</p>
                    </div>
                ) : userAnswers.length > 0 ? (
                    <div className="answers-list">
                        {userAnswers.map((answer, index) => (
                            <Card key={index} className="mb-3 border-0 shadow-sm" style={{ background: 'var(--bg-secondary)' }}>
                                <Card.Body className="p-3">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <h6 className="mb-0 fw-bold" style={{ color: 'var(--text-primary)' }}>
                                            Question {index + 1}
                                        </h6>
                                        <Badge bg={answer.is_correct ? 'success' : 'danger'} className="px-2 py-1">
                                            {answer.is_correct ? 'Correct' : 'Incorrect'}
                                        </Badge>
                                    </div>
                                    <p className="mb-2" style={{ color: 'var(--text-secondary)' }}>
                                        {answer.question_text}
                                    </p>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <small className="text-muted d-block">User Answer:</small>
                                            <span style={{ color: 'var(--text-primary)' }}>{answer.user_answer}</span>
                                        </div>
                                        <div className="text-end">
                                            <small className="text-muted d-block">Score:</small>
                                            <strong style={{ color: 'var(--accent-primary)' }}>{answer.score}</strong>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-4">
                        <i className="bi bi-inbox" style={{ fontSize: '3rem', color: 'var(--text-muted)' }}></i>
                        <h6 className="text-muted mt-3">No answers found</h6>
                        <small className="text-muted">This user hasn't answered any questions yet.</small>
                    </div>
                )}
            </Modal.Body>
        </Modal>
    )
}

export default AnswersModal
