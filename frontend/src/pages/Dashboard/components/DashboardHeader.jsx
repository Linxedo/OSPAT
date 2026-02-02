import React from 'react'

const DashboardHeader = () => {
    return (
        <div className="d-flex justify-content-between align-items-center mb-4 fade-in">
            <div>
                <h2 className="mb-0 fw-bold" style={{ color: 'var(--text-primary)' }}>ADMIN DASHBOARD</h2>
                <p className="text-muted mb-0" style={{ color: 'var(--text-muted)' }}>
                    Welcome back! Here's what's happening with the system today.
                </p>
            </div>
            <div className="text-end">
                <small className="text-muted" style={{ color: 'var(--text-muted)' }}>Last updated</small>
                <div className="fw-bold" style={{ color: 'var(--text-primary)' }}>
                    {new Date().toLocaleString()}
                </div>
            </div>
        </div>
    )
}

export default DashboardHeader
