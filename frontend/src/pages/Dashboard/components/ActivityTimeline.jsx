import React from 'react'

const ActivityTimeline = ({ dashboardData }) => {
    const formatTimeAgo = (timestamp) => {
        if (!timestamp) return 'Recently'

        try {
            const now = new Date()
            const past = new Date(timestamp)
            const diffMs = now - past
            const diffMins = Math.floor(diffMs / 60000)
            const diffHours = Math.floor(diffMs / 3600000)
            const diffDays = Math.floor(diffMs / 86400000)

            if (diffMins < 1) return 'Just now'
            if (diffMins < 60) return `${diffMins} min ago`
            if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
        } catch (e) {
            return 'Recently'
        }
    }

    const formatFullDate = (timestamp) => {
        if (!timestamp) return ''
        return new Date(timestamp).toLocaleString()
    }

    const getActivityIcon = (activityType) => {
        switch (activityType) {
            case 'user_created':
                return 'bi-person-plus'
            case 'user_deleted':
                return 'bi-person-dash'
            case 'setting_updated':
                return 'bi-gear'
            case 'question_created':
                return 'bi-question-circle'
            case 'question_updated':
                return 'bi-question-circle'
            case 'question_deleted':
                return 'bi-question-circle'
            default:
                return 'bi-activity'
        }
    }

    const getActivityTitle = (activityType) => {
        switch (activityType) {
            case 'user_created':
                return 'New User Registered'
            case 'user_deleted':
                return 'User Deleted'
            case 'setting_updated':
                return 'Setting Updated'
            case 'question_created':
                return 'New Question Added'
            case 'question_updated':
                return 'Question Updated'
            case 'question_deleted':
                return 'Question Removed'
            default:
                return 'System Activity'
        }
    }

    const getActivityVariant = (activityType) => {
        switch (activityType) {
            case 'user_created':
                return 'success'
            case 'user_deleted':
                return 'danger'
            case 'setting_updated':
                return 'warning'
            default:
                return 'primary'
        }
    }

    const hasActivities = dashboardData.recentActivities && dashboardData.recentActivities.length > 0

    return (
        <div className="activity-timeline">
            {hasActivities ? (
                dashboardData.recentActivities.map((activity, index) => (
                    <div key={`activity-${index}`} className="activity-item">
                        <div className={`activity-indicator ${getActivityVariant(activity.activity_type)}`}>
                            <i className={`bi ${getActivityIcon(activity.activity_type)}`}></i>
                        </div>
                        <div className="activity-content">
                            <div className="activity-header">
                                <span className="activity-title">
                                    {getActivityTitle(activity.activity_type)}
                                </span>
                                <span className="activity-time" title={formatFullDate(activity.timestamp)}>
                                    {formatTimeAgo(activity.timestamp)}
                                </span>
                            </div>
                            <div className="activity-description">
                                {activity.description}
                                {activity.admin_name && (
                                    <span className="d-block mt-1 text-muted small">
                                        <i className="bi bi-person-fill me-1"></i>
                                        by {activity.admin_name}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="empty-state text-center py-5">
                    <div className="empty-icon mb-3">
                        <i className="bi bi-inbox" style={{ fontSize: '3rem', color: 'var(--text-muted)' }}></i>
                    </div>
                    <h6 className="text-muted">No Recent Activity</h6>
                    <small className="text-muted">
                        Activity will appear here when users are added, deleted, or settings are changed
                    </small>
                </div>
            )}
        </div>
    )
}

export default ActivityTimeline
