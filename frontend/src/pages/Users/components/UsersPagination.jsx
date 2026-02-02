import React from 'react'
import { Card, Button } from 'react-bootstrap'

const UsersPagination = ({ pagination, onPageChange }) => {
    const renderPageNumbers = () => {
        const { currentPage, totalPages } = pagination
        const pages = []
        
        for (let i = 1; i <= Math.min(5, totalPages); i++) {
            let pageNum;
            if (totalPages <= 5) {
                pageNum = i;
            } else if (currentPage <= 3) {
                pageNum = i;
            } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
            } else {
                pageNum = currentPage - 2 + i;
            }

            pages.push(
                <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? "primary" : "outline-secondary"}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    style={{
                        backgroundColor: pageNum === currentPage ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                        borderColor: 'var(--border-secondary)',
                        color: pageNum === currentPage ? 'white' : 'var(--text-primary)'
                    }}
                >
                    {pageNum}
                </Button>
            );
        }
        
        return pages;
    }

    return (
        <Card className="border-0 shadow-sm mt-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
            <Card.Body className="py-3">
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <small className="text-muted" style={{ color: 'var(--text-muted)' }}>
                            Showing {((pagination.currentPage - 1) * pagination.recordsPerPage) + 1} to {Math.min(pagination.currentPage * pagination.recordsPerPage, pagination.totalRecords)} of {pagination.totalRecords} users
                        </small>
                    </div>
                    <div className="d-flex gap-2">
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => onPageChange(pagination.currentPage - 1)}
                            disabled={!pagination.hasPrevPage}
                            style={{
                                backgroundColor: 'var(--bg-tertiary)',
                                borderColor: 'var(--border-secondary)',
                                color: 'var(--text-primary)'
                            }}
                        >
                            <i className="bi bi-chevron-left me-1"></i>
                            Previous
                        </Button>

                        {renderPageNumbers()}

                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => onPageChange(pagination.currentPage + 1)}
                            disabled={!pagination.hasNextPage}
                            style={{
                                backgroundColor: 'var(--bg-tertiary)',
                                borderColor: 'var(--border-secondary)',
                                color: 'var(--text-primary)'
                            }}
                        >
                            Next
                            <i className="bi bi-chevron-right ms-1"></i>
                        </Button>
                    </div>
                </div>
            </Card.Body>
        </Card>
    )
}

export default UsersPagination
