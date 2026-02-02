import React from 'react'
import { Card, Table, Button } from 'react-bootstrap'

const UsersTable = ({ users, searchTerm, onSearchChange, onEditUser, onDeleteUser, pagination }) => {
    const handleClearSearch = () => {
        onSearchChange('')
    }

    return (
        <Card className="border-0 shadow-sm fade-in" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
            <Card.Header className="bg-transparent border-0 py-3">
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h5 className="mb-1 fw-bold" style={{ color: 'var(--text-primary)' }}>
                            <i className="bi bi-people me-2" style={{ color: 'var(--accent-primary)' }}></i>
                            Users Directory
                        </h5>
                        <div className="d-flex align-items-center gap-3">
                            <small className="text-muted" style={{ color: 'var(--text-muted)' }}>
                                {pagination ? `${pagination.totalRecords} total` : `${users.length} ${users.length === 1 ? 'user' : 'users'}`}
                            </small>
                            {pagination && pagination.totalPages > 1 && (
                                <small className="text-muted" style={{ color: 'var(--text-muted)' }}>
                                    Page {pagination.currentPage} of {pagination.totalPages}
                                </small>
                            )}
                        </div>
                    </div>
                    <div className="d-flex gap-2">
                        <div className="input-group" style={{ maxWidth: '300px' }}>
                            <span className="input-group-text bg-transparent border-secondary">
                                <i className="bi bi-search"></i>
                            </span>
                            <input
                                type="text"
                                className="form-control bg-transparent border-secondary"
                                placeholder="Search by name or employee ID..."
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                                style={{ color: 'var(--text-primary)' }}
                            />
                            {searchTerm && (
                                <button
                                    className="btn btn-outline-secondary border-secondary"
                                    type="button"
                                    onClick={handleClearSearch}
                                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)', color: 'var(--text-muted)' }}
                                >
                                    <i className="bi bi-x"></i>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </Card.Header>
            <Card.Body className="p-0">
                {users.length === 0 ? (
                    <div className="text-center py-5">
                        <div className="empty-icon mb-3">
                            <i className="bi bi-search" style={{ fontSize: '3rem', color: 'var(--text-muted)' }}></i>
                        </div>
                        <h6 className="text-muted">
                            {searchTerm ? 'No Users Found' : 'No Users Registered'}
                        </h6>
                        <small className="text-muted">
                            {searchTerm
                                ? `No users found matching "${searchTerm}"`
                                : 'No users have been registered yet.'
                            }
                        </small>
                        {searchTerm && (
                            <div className="mt-3">
                                <Button variant="outline-secondary" onClick={handleClearSearch}>
                                    <i className="bi bi-x me-2"></i>
                                    Clear Search
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="table-responsive">
                        <Table className="align-middle table-modern hover" style={{ border: 'none' }}>
                            <thead>
                                <tr>
                                    <th className="border-0">
                                        <div className="d-flex align-items-center">
                                            <i className="bi bi-hash me-2 text-muted"></i>
                                            ID
                                        </div>
                                    </th>
                                    <th className="border-0">
                                        <div className="d-flex align-items-center">
                                            <i className="bi bi-person me-2 text-muted"></i>
                                            Name
                                        </div>
                                    </th>
                                    <th className="border-0">
                                        <div className="d-flex align-items-center">
                                            <i className="bi bi-badge me-2 text-muted"></i>
                                            Employee ID
                                        </div>
                                    </th>
                                    <th className="border-0">
                                        <div className="d-flex align-items-center">
                                            <i className="bi bi-shield me-2 text-muted"></i>
                                            Role
                                        </div>
                                    </th>
                                    <th className="border-0 text-center">
                                        <div className="d-flex align-items-center justify-content-center">
                                            <i className="bi bi-gear me-2 text-muted"></i>
                                            Actions
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id} className="table-row-hover">
                                        <td>
                                            <span className="text-muted fw-mono">#{user.id}</span>
                                        </td>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <div className="user-avatar-small me-3">
                                                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <div className="fw-medium" style={{ color: 'var(--text-primary)' }}>
                                                        {user.name}
                                                    </div>
                                                    <small className="text-muted">User ID: {user.id}</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <i className="bi bi-card-text me-2 text-muted small"></i>
                                                <span className="fw-mono text-muted">{user.employee_id}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge px-3 py-2 ${user.role === 'admin' ? 'bg-danger' : 'bg-primary'} bg-opacity-10 text-${user.role === 'admin' ? 'danger' : 'primary'}`}>
                                                <i className={`bi ${user.role === 'admin' ? 'bi-shield-fill-check' : 'bi-person'} me-1`}></i>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="d-flex justify-content-center gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="outline-warning"
                                                    className="action-btn"
                                                    onClick={() => onEditUser(user)}
                                                    title="Edit User"
                                                >
                                                    <i className="bi bi-pencil"></i>
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline-danger"
                                                    className="action-btn"
                                                    onClick={() => onDeleteUser(user)}
                                                    title="Delete User"
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                )}
            </Card.Body>
        </Card>
    )
}

export default UsersTable
