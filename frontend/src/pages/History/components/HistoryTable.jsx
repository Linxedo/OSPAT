import React from 'react'
import { Card, Table, Button, Badge } from 'react-bootstrap'
import { calculateFatigueStatus, getFatigueBadgeVariant } from '../../../utils/fatigueStatus'

const HistoryTable = ({
    filteredResults,
    hasActiveFilters,
    onClearFilters,
    onViewScores,
    onViewAnswers,
    minimumPassingScore
}) => {
    const formatDate = (timestamp) => {
        return new Date(new Date(timestamp).getTime() + 8 * 60 * 60 * 1000).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }

    const formatTime = (timestamp) => {
        return new Date(new Date(timestamp).getTime() + 8 * 60 * 60 * 1000).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })
    }

    return (
        <Card className="border-0 shadow-sm fade-in" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
            <Card.Header className="bg-transparent border-0 py-3">
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h5 className="mb-1 fw-bold" style={{ color: 'var(--text-primary)' }}>
                            <i className="bi bi-clock-history me-2" style={{ color: 'var(--accent-primary)' }}></i>
                            Test Results
                        </h5>
                        <small className="text-muted" style={{ color: 'var(--text-muted)' }}>
                            {filteredResults.length} {filteredResults.length === 1 ? 'result' : 'results'} found
                        </small>
                    </div>
                </div>
            </Card.Header>
            <Card.Body className="p-0">
                {filteredResults.length === 0 ? (
                    <div className="text-center py-5">
                        <div className="empty-icon mb-3">
                            <i className="bi bi-inbox" style={{ fontSize: '3rem', color: 'var(--text-muted)' }}></i>
                        </div>
                        <h6 className="text-muted">
                            {hasActiveFilters ? 'No Results Found' : 'No Test Results Found'}
                        </h6>
                        <small className="text-muted">
                            {hasActiveFilters
                                ? 'Try adjusting your filters to see more results'
                                : 'No test results have been recorded yet.'
                            }
                        </small>
                        {hasActiveFilters && (
                            <div className="mt-3">
                                <Button variant="outline-secondary" onClick={onClearFilters}>
                                    <i className="bi bi-x-circle me-2"></i>
                                    Clear All Filters
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="table-responsive">
                        <Table className="align-middle table-modern hover" style={{ border: 'none' }}>
                            <thead>
                                <tr>
                                    <th className="border-0 text-nowrap">
                                        <div className="d-flex align-items-center">
                                            <i className="bi bi-person me-2 text-muted"></i>
                                            User
                                        </div>
                                    </th>
                                    <th className="border-0 text-nowrap">
                                        <div className="d-flex align-items-center">
                                            <i className="bi bi-badge me-2 text-muted"></i>
                                            Employee ID
                                        </div>
                                    </th>
                                    <th className="border-0 text-center text-nowrap">
                                        <div className="d-flex align-items-center justify-content-center">
                                            <i className="bi bi-clipboard-data me-2 text-muted"></i>
                                            Assessment
                                        </div>
                                    </th>
                                    <th className="border-0 text-center text-nowrap">
                                        <div className="d-flex align-items-center justify-content-center">
                                            <i className="bi bi-trophy me-2 text-muted"></i>
                                            Total
                                        </div>
                                    </th>
                                    <th className="border-0 text-nowrap">
                                        <div className="d-flex align-items-center">
                                            <i className="bi bi-calendar me-2 text-muted"></i>
                                            Date
                                        </div>
                                    </th>
                                    <th className="border-0 text-center text-nowrap">
                                        <div className="d-flex align-items-center justify-content-center">
                                            <i className="bi bi-patch-check me-2 text-muted"></i>
                                            Status
                                        </div>
                                    </th>
                                    <th className="border-0 text-center text-nowrap">
                                        <div className="d-flex align-items-center justify-content-center">
                                            <i className="bi bi-gear me-2 text-muted"></i>
                                            Actions
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredResults.map((result, index) => {
                                    const fatigueStatus = calculateFatigueStatus(result.total_score, minimumPassingScore)
                                    const badgeVariant = getFatigueBadgeVariant(fatigueStatus)

                                    return (
                                        <tr key={result.result_id || index}>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div className="user-avatar-small me-3">
                                                        {result.name?.charAt(0).toUpperCase() || 'U'}
                                                    </div>
                                                    <div>
                                                        <div className="fw-medium" style={{ color: 'var(--text-primary)' }}>
                                                            {result.name}
                                                        </div>
                                                        <small className="text-muted">Test #{result.result_id || index + 1}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <i className="bi bi-card-text me-2 text-muted small"></i>
                                                    <span className="fw-mono text-muted">{result.employee_id}</span>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <div className="d-flex justify-content-center">
                                                    <span className="badge px-3 py-2 bg-primary bg-opacity-10 text-primary">
                                                        <i className="bi bi-clipboard-check me-1"></i>
                                                        {result.assessment_score}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <span className={`badge px-3 py-2 ${result.total_score >= minimumPassingScore ? 'bg-success' : 'bg-danger'} bg-opacity-10 text-${result.total_score >= minimumPassingScore ? 'success' : 'danger'}`}>
                                                    <i className={`bi ${result.total_score >= minimumPassingScore ? 'bi-trophy-fill' : 'bi-emoji-frown'} me-1`}></i>
                                                    {result.total_score}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="d-flex flex-column">
                                                    <span className="text-muted small">
                                                        {formatDate(result.test_timestamp)}
                                                    </span>
                                                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                        {formatTime(result.test_timestamp)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <Badge
                                                    bg={badgeVariant}
                                                    className="px-3 py-2"
                                                >
                                                    <i className={`bi ${fatigueStatus === 'Normal' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-1`}></i>
                                                    {fatigueStatus}
                                                </Badge>
                                            </td>
                                            <td className="text-center">
                                                <div className="d-flex gap-2 justify-content-center flex-wrap">
                                                    <Button
                                                        variant="outline-info"
                                                        size="sm"
                                                        onClick={() => onViewScores(result)}
                                                        className="px-3"
                                                        title="View minigame scores breakdown"
                                                    >
                                                        <i className="bi bi-controller me-1"></i>
                                                        Score
                                                    </Button>
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={() => onViewAnswers(result)}
                                                        className="px-3"
                                                    >
                                                        <i className="bi bi-eye me-1"></i>
                                                        Jawaban
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </Table>
                    </div>
                )}
            </Card.Body>
        </Card>
    )
}

export default HistoryTable
