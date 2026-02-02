import { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { Container, Spinner, Alert } from 'react-bootstrap'
import { adminService } from '../../services/adminService'
import HistoryHeader from './components/HistoryHeader'
import HistoryFilters from './components/HistoryFilters'
import HistoryTable from './components/HistoryTable'
import HistoryPagination from './components/HistoryPagination'
import AnswersModal from './components/AnswersModal'
import ScoresModal from './components/ScoresModal'

const History = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedDate, setSelectedDate] = useState('')
    const [filteredResults, setFilteredResults] = useState([])
    const [showAnswersModal, setShowAnswersModal] = useState(false)
    const [selectedResult, setSelectedResult] = useState(null)
    const [userAnswers, setUserAnswers] = useState([])
    const [loadingAnswers, setLoadingAnswers] = useState(false)
    const [showScoreModal, setShowScoreModal] = useState(false)
    const [selectedScoreResult, setSelectedScoreResult] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [pagination, setPagination] = useState(null)

    const { data, isLoading, error } = useQuery(['history', currentPage, searchTerm, selectedDate], () => adminService.getHistory(currentPage, searchTerm, selectedDate), {
        retry: 2,
        retryDelay: 1000,
        refetchOnWindowFocus: false,
        keepPreviousData: true,
        onSuccess: (data) => {
            setPagination(data.pagination);
        },
        onError: (error) => {
            console.log('History error:', error);
        }
    })

    const { data: settingsData } = useQuery('settings', adminService.getSettings, {
        refetchOnWindowFocus: false
    })

    const testResults = data?.data || []
    const settings = settingsData?.data || {}
    const minimumPassingScore = settings.minimum_passing_score || 80
    const hardModeThreshold = settings.hard_mode_threshold || 60

    useEffect(() => {
        setFilteredResults(testResults)
    }, [testResults])

    const handleClearFilters = () => {
        setSearchTerm('')
        setSelectedDate('')
        setCurrentPage(1)
    }

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage)
    }

    const handleViewScores = (result) => {
        setSelectedScoreResult(result)
        setShowScoreModal(true)
    }

    const handleCloseScoreModal = () => {
        setShowScoreModal(false)
        setSelectedScoreResult(null)
    }

    const handleViewAnswers = async (result) => {
        setSelectedResult(result)
        setShowAnswersModal(true)
        setLoadingAnswers(true)

        try {
            const response = await adminService.getUserAnswers(result.result_id)
            if (response.success) {
                setUserAnswers(response.data.answers || [])
            } else {
                console.error('Failed to load user answers:', response.message)
                setUserAnswers([])
            }
        } catch (error) {
            console.error('Error loading user answers:', error)
            setUserAnswers([])
        } finally {
            setLoadingAnswers(false)
        }
    }

    const handleCloseAnswersModal = () => {
        setShowAnswersModal(false)
        setSelectedResult(null)
        setUserAnswers([])
    }

    const hasActiveFilters = searchTerm || selectedDate

    if (isLoading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
                <div className="text-center">
                    <Spinner animation="border" variant="primary" />
                    <p className="text-muted mt-3">Loading test results...</p>
                </div>
            </Container>
        )
    }

    if (error) {
        return (
            <Container>
                <Alert variant="danger">
                    <Alert.Heading>History Error</Alert.Heading>
                    <p>Unable to load test history. Please check:</p>
                    <ul>
                        <li>Backend server is running on port 5000</li>
                        <li>You are logged in with valid credentials</li>
                        <li>Database connection is active</li>
                    </ul>
                    <hr />
                    <p className="mb-0">
                        <strong>Error details:</strong> {error.message}
                    </p>
                </Alert>
            </Container>
        )
    }

    return (
        <Container fluid style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', padding: '2rem' }}>
            <HistoryHeader />
            
            <HistoryFilters
                searchTerm={searchTerm}
                selectedDate={selectedDate}
                onSearchChange={setSearchTerm}
                onDateChange={setSelectedDate}
                onClearFilters={handleClearFilters}
                filteredResults={filteredResults}
                testResults={testResults}
                hasActiveFilters={hasActiveFilters}
                pagination={pagination}
            />

            <HistoryTable
                filteredResults={filteredResults}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={handleClearFilters}
                onViewScores={handleViewScores}
                onViewAnswers={handleViewAnswers}
                minimumPassingScore={minimumPassingScore}
            />

            {pagination && pagination.totalPages > 1 && (
                <HistoryPagination
                    pagination={pagination}
                    onPageChange={handlePageChange}
                />
            )}

            <AnswersModal
                show={showAnswersModal}
                onHide={handleCloseAnswersModal}
                selectedResult={selectedResult}
                userAnswers={userAnswers}
                loading={loadingAnswers}
                minimumPassingScore={minimumPassingScore}
            />

            <ScoresModal
                show={showScoreModal}
                onHide={handleCloseScoreModal}
                selectedResult={selectedScoreResult}
                hardModeThreshold={hardModeThreshold}
            />
        </Container>
    )
}

export default History
