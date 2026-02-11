import { Container } from 'react-bootstrap'
import { useQuery, useQueryClient } from 'react-query'
import { adminService } from '../../services/adminService'
import DashboardHeader from './components/DashboardHeader'
import StatsCards from './components/StatsCards'
import RecentActivity from './components/RecentActivity'
import QuickActions from './components/QuickActions'
import '../../styles/layouts/dashboard.css'

const Dashboard = () => {
    const queryClient = useQueryClient()

    const { data, isLoading, error } = useQuery('dashboard', adminService.getDashboard, {
        retry: 2,
        retryDelay: 1000,
        refetchOnWindowFocus: false
    })

    const { data: settingsData } = useQuery('settings', adminService.getSettings, {
        refetchOnWindowFocus: false
    })

    const handleRefresh = () => {
        queryClient.invalidateQueries('dashboard')
    }

    if (isLoading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </Container>
        )
    }

    if (error) {
        return (
            <Container>
                <div className="alert alert-danger" role="alert">
                    <h4 className="alert-heading">Dashboard Error</h4>
                    <p>Unable to load dashboard data. Please check:</p>
                    <ul>
                        <li>Backend server is running on port 5000</li>
                        <li>You are logged in with valid credentials</li>
                        <li>Database connection is active</li>
                    </ul>
                    <hr />
                    <p className="mb-0">
                        <strong>Error details:</strong> {error.message}
                    </p>
                    <div className="mt-3">
                        <button className="btn btn-primary me-2" onClick={() => window.location.reload()}>
                            Reload Page
                        </button>
                        <button className="btn btn-outline-secondary" onClick={() => window.location.href = '/login'}>
                            Go to Login
                        </button>
                    </div>
                </div>
            </Container>
        )
    }

    const dashboardData = data?.data || {}
    const settings = settingsData?.data || {}
    const minimumPassingScore = settings.minimum_passing_score || 80

    return (
        <Container fluid>
            <DashboardHeader />
            <StatsCards dashboardData={dashboardData} />
            <div className="row">
                <div className="col-lg-8 mb-4">
                    <RecentActivity
                        dashboardData={dashboardData}
                        onRefresh={handleRefresh}
                    />
                </div>
                <div className="col-lg-4 mb-4">
                    <QuickActions />
                </div>
            </div>
        </Container>
    )
}

export default Dashboard
