import React from 'react'
import { Row, Col, Card } from 'react-bootstrap'

const StatsCards = ({ dashboardData }) => {
    const stats = [
        {
            key: 'totalUsers',
            label: 'Total Users',
            subLabel: 'Registered users',
            color: 'var(--accent-primary)',
            icon: null
        },
        {
            key: 'totalTestResults',
            label: 'Test Conducted',
            subLabel: 'Completed tests',
            color: 'var(--success)',
            icon: null
        },
        {
            key: 'totalQuestions',
            label: 'Active Questions',
            subLabel: 'Available questions',
            color: 'var(--warning)',
            icon: null
        }
    ]

    return (
        <Row className="g-4">
            {stats.map((stat, index) => (
                <Col lg={4} md={6} className="mb-4" key={stat.key}>
                    <Card className="border-0 shadow-sm h-100 hover-lift stat-card-modern" 
                          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
                        <Card.Body className="p-4 text-center">
                            <div className="stat-number-wrapper mb-3">
                                <h2 className="stat-number mb-0 fw-bold" 
                                    style={{ color: stat.color, fontSize: '2.5rem' }}>
                                    {dashboardData[stat.key] || 0}
                                </h2>
                            </div>
                            <div className="stat-label">
                                <h6 className="mb-0 fw-semibold" style={{ color: 'var(--text-primary)' }}>
                                    {stat.label}
                                </h6>
                                <small className="text-muted" style={{ color: 'var(--text-muted)' }}>
                                    {stat.subLabel}
                                </small>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            ))}
        </Row>
    )
}

export default StatsCards
