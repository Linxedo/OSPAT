import React from 'react'
import { Toast } from 'react-bootstrap'

const ToastNotification = ({ show, onClose, message, variant }) => {
    const getToastIcon = () => {
        switch (variant) {
            case 'success':
                return 'bi-check-circle-fill'
            case 'danger':
                return 'bi-x-circle-fill'
            case 'info':
                return 'bi-info-circle-fill'
            default:
                return 'bi-info-circle-fill'
        }
    }

    const getToastTitle = () => {
        switch (variant) {
            case 'success':
                return 'Success'
            case 'danger':
                return 'Error'
            case 'info':
                return 'Info'
            default:
                return 'Info'
        }
    }

    const getToastEmoji = () => {
        switch (variant) {
            case 'success':
                return 'bi-emoji-smile-fill'
            case 'danger':
                return 'bi-exclamation-triangle-fill'
            case 'info':
                return 'bi-lightbulb-fill'
            default:
                return 'bi-lightbulb-fill'
        }
    }

    const getHeaderBgColor = () => {
        switch (variant) {
            case 'success':
                return '#28a745'
            case 'danger':
                return '#dc3545'
            case 'info':
                return '#17a2b8'
            default:
                return '#17a2b8'
        }
    }

    return (
        <Toast
            onClose={onClose}
            show={show}
            delay={3000}
            autohide
            style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                zIndex: 9999,
                minWidth: '300px',
                maxWidth: '400px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-secondary)',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
        >
            <Toast.Header
                style={{
                    backgroundColor: getHeaderBgColor(),
                    color: 'white',
                    borderBottom: 'none',
                    borderRadius: '8px 8px 0 0',
                    padding: '12px 16px'
                }}
                closeButton={false}
            >
                <div className="d-flex align-items-center">
                    <span style={{ marginRight: '8px', fontSize: '16px' }}>
                        <i className={`bi ${getToastIcon()}`}></i>
                    </span>
                    <strong className="me-auto">
                        {getToastTitle()}
                    </strong>
                    <button
                        type="button"
                        className="btn-close btn-close-white"
                        onClick={onClose}
                        style={{
                            fontSize: '12px',
                            opacity: 0.8,
                            border: 'none',
                            background: 'none'
                        }}
                    />
                </div>
            </Toast.Header>
            <Toast.Body
                style={{
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    padding: '16px',
                    borderRadius: '0 0 8px 8px'
                }}
            >
                <div className="d-flex align-items-start">
                    <span style={{
                        marginRight: '12px',
                        fontSize: '14px',
                        marginTop: '2px'
                    }}>
                        <i className={`bi ${getToastEmoji()} text-${variant}`}></i>
                    </span>
                    <div style={{ flex: 1 }}>
                        {message}
                    </div>
                </div>
            </Toast.Body>
        </Toast>
    )
}

export default ToastNotification
