import React from 'react'
import { Modal, Card, Row, Col, Badge } from 'react-bootstrap'

const ScoresModal = ({ show, onHide, selectedResult, hardModeThreshold }) => {
    const getMinigameName = (mgKey) => {
        const names = {
            mg1_score: 'Reaction Speed',
            mg2_score: 'Color Matching', 
            mg3_score: 'Memory Test',
            mg4_score: 'Rhythm Game OSU',
            mg5_score: 'Shape Game'
        }
        return names[mgKey] || mgKey
    }

    const getMinigameIcon = (mgKey) => {
        const icons = {
            mg1_score: 'bi-lightning-fill',
            mg2_score: 'bi-palette-fill',
            mg3_score: 'bi-memory',
            mg4_score: 'bi-music-note-beamed',
            mg5_score: 'bi-triangle-fill'
        }
        return icons[mgKey] || 'bi-controller'
    }

    const getDifficulty = (score) => {
        return score >= hardModeThreshold ? 'Hard' : 'Normal'
    }

    const getDifficultyVariant = (score) => {
        return score >= hardModeThreshold ? 'warning' : 'info'
    }

    const minigameScores = selectedResult ? [
        { key: 'mg1_score', score: selectedResult.mg1_score },
        { key: 'mg2_score', score: selectedResult.mg2_score },
        { key: 'mg3_score', score: selectedResult.mg3_score },
        { key: 'mg4_score', score: selectedResult.mg4_score },
        { key: 'mg5_score', score: selectedResult.mg5_score }
    ].filter(mg => mg.score !== null && mg.score !== undefined) : []

    return (
        <Modal
            show={show}
            onHide={onHide}
            size="lg"
            centered
            className="scores-modal"
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
                    <i className="bi bi-controller me-2" style={{ color: 'var(--accent-primary)' }}></i>
                    <span style={{ color: 'var(--text-primary)' }}>Minigame Scores Breakdown</span>
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
                    <>
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
                                                    <Badge bg="success" className="px-3 py-2">{selectedResult.total_score}</Badge>
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </div>

                        <h5 className="mb-3 fw-bold" style={{ color: 'var(--text-primary)' }}>
                            <i className="bi bi-joystick me-2" style={{ color: 'var(--accent-primary)' }}></i>
                            Minigame Performance
                        </h5>

                        <Row className="g-3">
                            {minigameScores.map((minigame, index) => (
                                <Col md={6} lg={4} key={minigame.key}>
                                    <Card className="border-0 shadow-sm h-100" style={{ background: 'var(--bg-secondary)' }}>
                                        <Card.Body className="p-3 text-center">
                                            <div className="mb-3">
                                                <i 
                                                    className={`bi ${getMinigameIcon(minigame.key)} text-primary`} 
                                                    style={{ fontSize: '2rem' }}
                                                ></i>
                                            </div>
                                            <h6 className="mb-2 fw-bold" style={{ color: 'var(--text-primary)' }}>
                                                {getMinigameName(minigame.key)}
                                            </h6>
                                            <div className="mb-2">
                                                <Badge bg="primary" className="px-3 py-2 fs-6">
                                                    {minigame.score}
                                                </Badge>
                                            </div>
                                            <div>
                                                <Badge 
                                                    bg={getDifficultyVariant(minigame.score)} 
                                                    className="px-2 py-1"
                                                >
                                                    {getDifficulty(minigame.score)} Mode
                                                </Badge>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>

                        {minigameScores.length === 0 && (
                            <div className="text-center py-4">
                                <i className="bi bi-controller" style={{ fontSize: '3rem', color: 'var(--text-muted)' }}></i>
                                <h6 className="text-muted mt-3">No minigame scores found</h6>
                                <small className="text-muted">This user hasn't completed any minigames yet.</small>
                            </div>
                        )}
                    </>
                )}
            </Modal.Body>
        </Modal>
    )
}

export default ScoresModal
