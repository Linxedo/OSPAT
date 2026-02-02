import React from 'react'
import { Card, Table, Button, Badge } from 'react-bootstrap'

const QuestionsManagement = ({ questions, onAddQuestion, onEditQuestion, onDeleteQuestion }) => {
    return (
        <Card className="border-0 shadow-sm" style={{ background: 'var(--bg-card)' }}>
            <Card.Header className="bg-transparent d-flex justify-content-between align-items-center">
                <h5 className="mb-0" style={{ color: 'var(--text-primary)' }}>Questions Management</h5>
                <Button 
                    onClick={onAddQuestion}
                    style={{
                        backgroundColor: 'var(--accent-primary)',
                        borderColor: 'var(--accent-primary)'
                    }}
                >
                    Add Question
                </Button>
            </Card.Header>
            <Card.Body>
                {questions.length === 0 ? (
                    <div className="text-center py-5">
                        <i className="bi bi-question-circle" style={{ fontSize: '3rem', color: 'var(--text-muted)' }}></i>
                        <h6 className="text-muted mt-3">No Questions Found</h6>
                        <small className="text-muted">No questions have been created yet.</small>
                        <div className="mt-3">
                            <Button 
                                variant="outline-primary"
                                onClick={onAddQuestion}
                            >
                                <i className="bi bi-plus-circle me-2"></i>
                                Create First Question
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Table hover responsive>
                        <thead>
                            <tr>
                                <th style={{ color: 'var(--text-primary)' }}>ID</th>
                                <th style={{ color: 'var(--text-primary)' }}>Question</th>
                                <th style={{ color: 'var(--text-primary)' }}>Answers</th>
                                <th style={{ color: 'var(--text-primary)' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {questions.map((q) => (
                                <tr key={q.question_id}>
                                    <td style={{ color: 'var(--text-primary)' }}>{q.question_id}</td>
                                    <td style={{ color: 'var(--text-primary)' }}>
                                        <div style={{ 
                                            maxWidth: '300px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {q.question_text}
                                        </div>
                                    </td>
                                    <td>
                                        {q.answers?.map((a, i) => (
                                            <Badge key={i} bg="info" className="me-1">
                                                {a.answer_text} ({a.score})
                                            </Badge>
                                        ))}
                                    </td>
                                    <td>
                                        <Button 
                                            size="sm" 
                                            variant="outline-warning" 
                                            className="me-2" 
                                            onClick={() => onEditQuestion(q)}
                                        >
                                            Edit
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant="outline-danger" 
                                            onClick={() => onDeleteQuestion(q)}
                                        >
                                            Delete
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
            </Card.Body>
        </Card>
    )
}

export default QuestionsManagement
