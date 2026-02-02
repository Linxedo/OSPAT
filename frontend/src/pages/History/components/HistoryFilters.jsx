import React from 'react'
import { Card, Row, Col, Form, Button, Badge } from 'react-bootstrap'

const HistoryFilters = ({ 
    searchTerm, 
    selectedDate, 
    onSearchChange, 
    onDateChange, 
    onClearFilters, 
    filteredResults, 
    testResults, 
    hasActiveFilters, 
    pagination 
}) => {
    const handleSearchChange = (value) => {
        onSearchChange(value)
    }

    const handleDateChange = (value) => {
        onDateChange(value)
    }

    return (
        <Card className="border-0 shadow-sm mb-4 fade-in" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
            <Card.Body>
                <Row className="g-3">
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label style={{ color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: '500' }}>
                                <i className="bi bi-search me-2"></i>
                                Search by Name or Employee ID
                            </Form.Label>
                            <div className="input-group">
                                <span className="input-group-text bg-transparent border-secondary">
                                    <i className="bi bi-search"></i>
                                </span>
                                <Form.Control
                                    type="text"
                                    placeholder="Enter name or employee ID..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    style={{
                                        backgroundColor: 'var(--bg-tertiary)',
                                        borderColor: 'var(--border-secondary)',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                                {searchTerm && (
                                    <button
                                        className="btn btn-outline-secondary border-secondary"
                                        type="button"
                                        onClick={() => handleSearchChange('')}
                                        style={{
                                            backgroundColor: 'var(--bg-tertiary)',
                                            borderColor: 'var(--border-secondary)',
                                            color: 'var(--text-muted)'
                                        }}
                                    >
                                        <i className="bi bi-x"></i>
                                    </button>
                                )}
                            </div>
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group>
                            <Form.Label style={{ color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: '500' }}>
                                <i className="bi bi-calendar-event me-2"></i>
                                Filter by Date
                            </Form.Label>
                            <Form.Control
                                type="date"
                                value={selectedDate}
                                onChange={(e) => handleDateChange(e.target.value)}
                                style={{
                                    backgroundColor: 'var(--bg-tertiary)',
                                    borderColor: 'var(--border-secondary)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={2} className="d-flex align-items-end">
                        {hasActiveFilters && (
                            <Button
                                variant="outline-secondary"
                                onClick={onClearFilters}
                                className="w-100"
                            >
                                <i className="bi bi-x-circle me-2"></i>
                                Clear Filters
                            </Button>
                        )}
                    </Col>
                </Row>

                {/* Filter Info */}
                <div className="mt-3 d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                        <small className="text-muted" style={{ color: 'var(--text-muted)' }}>
                            <i className="bi bi-funnel me-1"></i>
                            Showing {filteredResults.length} of {testResults.length} results
                        </small>
                        {hasActiveFilters && (
                            <div className="d-flex gap-2 flex-wrap">
                                {searchTerm && (
                                    <Badge bg="primary" className="px-2 py-1">
                                        <i className="bi bi-search me-1"></i>
                                        "{searchTerm}"
                                    </Badge>
                                )}
                                {selectedDate && (
                                    <Badge bg="info" className="px-2 py-1">
                                        <i className="bi bi-calendar-event me-1"></i>
                                        {new Date(selectedDate).toLocaleDateString()}
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>
                    {pagination && pagination.totalPages > 1 && (
                        <div className="d-flex align-items-center gap-2">
                            <small className="text-muted" style={{ color: 'var(--text-muted)' }}>
                                Page {pagination.currentPage} of {pagination.totalPages}
                            </small>
                        </div>
                    )}
                </div>
            </Card.Body>
        </Card>
    )
}

export default HistoryFilters
