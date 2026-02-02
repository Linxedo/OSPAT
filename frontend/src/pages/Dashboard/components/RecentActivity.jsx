import React from 'react'
import { Card, Button } from 'react-bootstrap'
import ActivityTimeline from './ActivityTimeline'

const RecentActivity = ({ dashboardData, onRefresh }) => {
    const totalItems = (dashboardData.recentUsers?.length || 0) + (dashboardData.recentActivities?.length || 0)

    return (
        <Card className="border-0 shadow-sm fade-in" 
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
            <Card.Header className="bg-transparent border-0 py-3">
                <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fw-bold" style={{ color: 'var(--text-primary)' }}>
                        <i className="bi bi-activity me-2" style={{ color: 'var(--accent-primary)' }}></i>
                        Recent Activity
                    </h5>
                    <div className="d-flex align-items-center gap-2">
                        <small className="badge bg-primary bg-opacity-10 text-primary px-2 py-1">
                            {totalItems} items
                        </small>
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={onRefresh}
                            title="Refresh recent activity"
                            style={{
                                backgroundColor: 'var(--bg-tertiary)',
                                borderColor: 'var(--border-secondary)',
                                color: 'var(--text-primary)'
                            }}
                        >
                            <i className="bi bi-arrow-clockwise"></i>
                        </Button>
                    </div>
                </div>
            </Card.Header>
            <Card.Body className="p-0">
                <ActivityTimeline dashboardData={dashboardData} />
            </Card.Body>
        </Card>
    )
}

export default RecentActivity
