import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap'
import { adminService } from '../../services/adminService'
import UsersHeader from './components/UsersHeader'
import UsersTable from './components/UsersTable'
import UsersPagination from './components/UsersPagination'
import UserModal from './components/UserModal'
import CSVImportModal from './components/CSVImportModal'
import ImportSuccessModal from './components/ImportSuccessModal'
import SyncModal from './components/SyncModal'
import DeleteModal from './components/DeleteModal'

const Users = () => {
    const [showModal, setShowModal] = useState(false)
    const [editingUser, setEditingUser] = useState(null)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deletingUser, setDeletingUser] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [pagination, setPagination] = useState(null)
    const [showSyncModal, setShowSyncModal] = useState(false)
    const [syncResult, setSyncResult] = useState(null)
    const [showCSVModal, setShowCSVModal] = useState(false)
    const [showImportSuccessModal, setShowImportSuccessModal] = useState(false)
    const [importSuccessData, setImportSuccessData] = useState(null)

    const queryClient = useQueryClient()

    const { data, isLoading, error } = useQuery(['users', currentPage, searchTerm], () => adminService.getUsers(currentPage, searchTerm), {
        retry: 2,
        retryDelay: 1000,
        refetchOnWindowFocus: false,
        keepPreviousData: true,
        onSuccess: (response) => {
            // Response format: { success: true, data: [...users...], pagination: {...} }
            if (response?.pagination) {
                setPagination(response.pagination);
            }
        }
    })

    const createMutation = useMutation(adminService.createUser, {
        onSuccess: () => {
            queryClient.invalidateQueries('users')
            setShowModal(false)
        }
    })

    const updateMutation = useMutation(
        ({ id, data }) => adminService.updateUser(id, data),
        {
            onSuccess: () => {
                queryClient.invalidateQueries('users')
                setShowModal(false)
                setEditingUser(null)
            }
        }
    )

    const deleteMutation = useMutation(adminService.deleteUser, {
        onSuccess: () => {
            queryClient.invalidateQueries('users')
            setShowDeleteModal(false)
            setDeletingUser(null)
        }
    })

    const syncMutation = useMutation(adminService.syncUsers, {
        onSuccess: (data) => {
            queryClient.invalidateQueries('users')
            setSyncResult(data.data)
        },
        onError: (err) => {
            alert(err.response?.data?.message || 'Failed to sync users')
            setShowSyncModal(false)
        }
    })

    // Response format: { success: true, data: [...users...], pagination: {...} }
    const users = data?.data || []

    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm])

    const handleAddUser = () => {
        setEditingUser(null)
        setShowModal(true)
    }

    const handleEditUser = (user) => {
        setEditingUser(user)
        setShowModal(true)
    }

    const handleDeleteUser = (user) => {
        setDeletingUser(user)
        setShowDeleteModal(true)
    }

    const handleSync = () => {
        setSyncResult(null)
        setShowSyncModal(true)
    }

    const handleCSVImport = () => {
        setShowCSVModal(true)
    }

    const handleImportSuccess = (importResult) => {
        queryClient.invalidateQueries('users')
        setShowCSVModal(false)
        setImportSuccessData(importResult)
        setShowImportSuccessModal(true)
    }

    const confirmSync = async () => {
        await syncMutation.mutateAsync()
    }

    const handleUserSubmit = async (data) => {
        try {
            if (editingUser) {
                await updateMutation.mutateAsync({ id: editingUser.id, data })
            } else {
                await createMutation.mutateAsync(data)
            }
        } catch (error) {
            console.error('Submit error:', error)
        }
    }

    const confirmDelete = () => {
        deleteMutation.mutate(deletingUser.id)
    }

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage)
    }

    if (isLoading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
                <div className="text-center">
                    <Spinner animation="border" variant="primary" />
                    <p className="text-muted mt-3">Loading users...</p>
                </div>
            </Container>
        )
    }

    if (error) {
        return (
            <Container>
                <Alert variant="danger">
                    <Alert.Heading>Users Error</Alert.Heading>
                    <p>Unable to load users. Please check:</p>
                    <ul>
                        <li>Backend server is running on port 5000</li>
                        <li>You are logged in with valid credentials</li>
                        <li>Database connection is active</li>
                        <li>Console for detailed error information</li>
                    </ul>
                    <hr />
                    <p className="mb-0">
                        <strong>Error details:</strong> {error.message}
                    </p>
                    <p className="mb-0">
                        <strong>Response:</strong> {JSON.stringify(error.response?.data)}
                    </p>
                </Alert>
            </Container>
        )
    }

    return (
        <Container fluid style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', padding: '2rem' }}>
            <UsersHeader
                onAddUser={handleAddUser}
                onSync={handleSync}
                onCSVImport={handleCSVImport}
                syncLoading={syncMutation.isLoading}
            />

            <UsersTable
                users={users}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onEditUser={handleEditUser}
                onDeleteUser={handleDeleteUser}
                pagination={pagination}
            />

            {pagination && pagination.totalPages > 1 && (
                <UsersPagination
                    pagination={pagination}
                    onPageChange={handlePageChange}
                />
            )}

            <UserModal
                show={showModal}
                onHide={() => setShowModal(false)}
                editingUser={editingUser}
                onSubmit={handleUserSubmit}
                loading={createMutation.isLoading || updateMutation.isLoading}
            />

            <SyncModal
                show={showSyncModal}
                onHide={() => !syncMutation.isLoading && setShowSyncModal(false)}
                onConfirm={confirmSync}
                loading={syncMutation.isLoading}
                result={syncResult}
            />

            <DeleteModal
                show={showDeleteModal}
                onHide={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                user={deletingUser}
                loading={deleteMutation.isLoading}
            />

            <CSVImportModal
                show={showCSVModal}
                onHide={() => setShowCSVModal(false)}
                onImportSuccess={handleImportSuccess}
            />

            <ImportSuccessModal
                show={showImportSuccessModal}
                onHide={() => setShowImportSuccessModal(false)}
                importData={importSuccessData}
            />
        </Container>
    )
}

export default Users
