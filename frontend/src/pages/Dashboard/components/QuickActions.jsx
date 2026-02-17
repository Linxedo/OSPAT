import React from 'react'
import { Card, Button } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'

const QuickActions = () => {
    const navigate = useNavigate()

    const actions = [
        {
            variant: 'outline-primary',
            icon: 'bi-person-plus',
            label: 'Add New User',
            onClick: () => navigate('/users')
        },
        {
            variant: 'outline-success',
            icon: 'bi-file-earmark-plus',
            label: 'Create Question',
            onClick: () => navigate('/settings')
        },
        {
            variant: 'outline-info',
            icon: 'bi-gear',
            label: 'System Settings',
            onClick: () => navigate('/settings')
        },
        {
            variant: 'outline-warning',
            icon: 'bi-download',
            label: 'View History',
            onClick: () => navigate('/history')
        }
    ]

    return (
        <Card className="border-0 shadow-sm fade-in"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
            <Card.Header className="bg-transparent border-0 py-3">
                <h5 className="mb-0 fw-bold" style={{ color: 'var(--text-primary)' }}>Quick Actions</h5>
            </Card.Header>
            <Card.Body>
                <div className="quick-actions-grid">
                    {actions.map((action, index) => (
                        <Button
                            key={index}
                            variant={action.variant}
                            className="hover-lift w-100 mb-2"
                            onClick={action.onClick}
                        >
                            <i className={`bi ${action.icon} me-2`}></i>
                            {action.label}
                        </Button>
                    ))}
                </div>
            </Card.Body>
        </Card>
    )
}

export default QuickActions
