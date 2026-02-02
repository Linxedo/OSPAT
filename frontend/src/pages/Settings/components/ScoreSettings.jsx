import React, { useEffect } from 'react'
import { Card, Form, Button, Row, Col } from 'react-bootstrap'
import { useForm } from 'react-hook-form'

const ScoreSettings = ({ settings, onSubmit, loading }) => {
    const settingsForm = useForm()

    useEffect(() => {
        if (settings && !settingsForm.formState.isDirty) {
            settingsForm.reset(settings)
        }
    }, [settings, settingsForm])

    const handleFormSubmit = (data) => {
        onSubmit(data)
    }

    return (
        <Card className="border-0 shadow-sm" style={{ background: 'var(--bg-card)' }}>
            <Card.Body>
                <Form onSubmit={settingsForm.handleSubmit(handleFormSubmit)}>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label style={{ color: 'var(--text-primary)' }}>Minimum Passing Score</Form.Label>
                                <Form.Control 
                                    type="number" 
                                    {...settingsForm.register('minimum_passing_score', { valueAsNumber: true })}
                                    style={{
                                        backgroundColor: 'var(--bg-tertiary)',
                                        borderColor: 'var(--border-secondary)',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label style={{ color: 'var(--text-primary)' }}>Hard Mode Threshold</Form.Label>
                                <Form.Control 
                                    type="number" 
                                    {...settingsForm.register('hard_mode_threshold', { valueAsNumber: true })}
                                    style={{
                                        backgroundColor: 'var(--bg-tertiary)',
                                        borderColor: 'var(--border-secondary)',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Button 
                        type="submit" 
                        disabled={loading}
                        style={{
                            backgroundColor: 'var(--accent-primary)',
                            borderColor: 'var(--accent-primary)'
                        }}
                    >
                        {loading ? 'Saving...' : 'Update Score Settings'}
                    </Button>
                </Form>
            </Card.Body>
        </Card>
    )
}

export default ScoreSettings
