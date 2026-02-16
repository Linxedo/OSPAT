import React from 'react'
import { Row, Col, Button } from 'react-bootstrap'

const UsersHeader = ({ onAddUser, onSync, onCSVImport, syncLoading }) => {
    return (
        <Row className="mb-4 fade-in">
            <Col>
                <h2 className="fw-bold" style={{ color: 'var(--text-primary)' }}>User Management</h2>
                <p className="text-muted" style={{ color: 'var(--text-muted)' }}>Manage system users and their roles</p>
            </Col>
            <Col className="text-end d-flex justify-content-end gap-2">
                <Button
                    onClick={onSync}
                    className="hover-lift"
                    disabled={syncLoading}
                    variant="primary"
                >
                    <i className="bi bi-arrow-repeat me-2"></i>
                    Sync Data
                </Button>
                <Button
                    onClick={onCSVImport}
                    className="hover-lift"
                    variant="primary"
                >
                    <i className="bi bi-file-earmark-csv me-2"></i>
                    Import CSV
                </Button>
                <Button onClick={onAddUser} className="hover-lift">
                    <i className="bi bi-person-plus me-2"></i>
                    Add User
                </Button>
            </Col>
        </Row>
    )
}

export default UsersHeader
