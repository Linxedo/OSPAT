import React, { useEffect } from 'react'
import { Modal, Form, Button } from 'react-bootstrap'
import { useForm } from 'react-hook-form'

const UserModal = ({ show, onHide, editingUser, onSubmit, loading }) => {
    const { register, handleSubmit, reset, formState: { errors }, watch } = useForm()

    useEffect(() => {
        if (show) {
            if (editingUser) {
                reset({
                    name: editingUser.name,
                    employee_id: editingUser.employee_id,
                    nik: editingUser.nik || '',
                    role: editingUser.role,
                    password: ''
                })
            } else {
                reset({
                    name: '',
                    employee_id: '',
                    nik: '',
                    role: 'user',
                    password: ''
                })
            }
        }
    }, [show, editingUser, reset])

    const handleFormSubmit = (data) => {
        // Remove employee_id from data when editing (it shouldn't be sent in update requests)
        if (editingUser) {
            const { employee_id, password, ...submitData } = data;

            // Only include password if it's not empty
            const finalData = password && password.trim() !== ''
                ? { ...submitData, password }
                : submitData;

            onSubmit(finalData);
        } else {
            onSubmit(data);
        }
    }

    const userRole = watch('role')

    return (
        <Modal show={show} onHide={onHide} className="fade-in">
            <Modal.Header closeButton style={{ background: 'var(--gradient-card)', borderBottom: '1px solid var(--border-primary)' }}>
                <Modal.Title style={{ color: 'var(--text-primary)' }}>
                    {editingUser ? 'Edit User' : 'Add User'}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ background: 'var(--bg-card)' }}>
                <Form onSubmit={handleSubmit(handleFormSubmit)}>
                    <Form.Group className="mb-3">
                        <Form.Label style={{ color: 'var(--text-primary)' }}>Name</Form.Label>
                        <Form.Control
                            {...register('name', { required: 'Name is required' })}
                            type="text"
                            placeholder="Enter name"
                            style={{
                                backgroundColor: 'var(--bg-tertiary)',
                                borderColor: 'var(--border-secondary)',
                                color: 'var(--text-primary)'
                            }}
                            isInvalid={!!errors.name}
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.name?.message}
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label style={{ color: 'var(--text-primary)' }}>Employee ID</Form.Label>
                        <Form.Control
                            {...register('employee_id', { required: 'Employee ID is required' })}
                            type="text"
                            placeholder="Enter employee ID"
                            style={{
                                backgroundColor: 'var(--bg-tertiary)',
                                borderColor: 'var(--border-secondary)',
                                color: 'var(--text-primary)'
                            }}
                            isInvalid={!!errors.employee_id}
                            disabled={!!editingUser}
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.employee_id?.message}
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label style={{ color: 'var(--text-primary)' }}>NIK</Form.Label>
                        <Form.Control
                            {...register('nik')}
                            type="text"
                            placeholder="Enter NIK (optional)"
                            style={{
                                backgroundColor: 'var(--bg-tertiary)',
                                borderColor: 'var(--border-secondary)',
                                color: 'var(--text-primary)'
                            }}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label style={{ color: 'var(--text-primary)' }}>Role</Form.Label>
                        <Form.Select
                            {...register('role', { required: 'Role is required' })}
                            style={{
                                backgroundColor: 'var(--bg-tertiary)',
                                borderColor: 'var(--border-secondary)',
                                color: 'var(--text-primary)'
                            }}
                            isInvalid={!!errors.role}
                        >
                            <option value="">Select role</option>
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                            {errors.role?.message}
                        </Form.Control.Feedback>
                    </Form.Group>

                    {userRole === 'admin' && (
                        <Form.Group className="mb-3">
                            <Form.Label style={{ color: 'var(--text-primary)' }}>
                                Password {editingUser && '(leave blank to keep current)'}
                            </Form.Label>
                            <Form.Control
                                {...register('password', editingUser ? {} : { required: 'Password is required for admin users' })}
                                type="password"
                                placeholder="Minimum 6 characters or Numbers, letters, special characters"
                                style={{
                                    backgroundColor: 'var(--bg-tertiary)',
                                    borderColor: 'var(--border-secondary)',
                                    color: 'var(--text-primary)'
                                }}
                                isInvalid={!!errors.password}
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.password?.message}
                            </Form.Control.Feedback>
                        </Form.Group>
                    )}

                    <div className="d-flex justify-content-end gap-2">
                        <Button variant="secondary" onClick={onHide}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={loading}>
                            {loading ? 'Saving...' : (editingUser ? 'Update' : 'Create')}
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    )
}

export default UserModal
