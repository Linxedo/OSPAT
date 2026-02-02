import React from 'react'
import { Card, Button } from 'react-bootstrap'

const SettingsTabs = ({ activeTab, onTabChange }) => {
    const tabs = ['settings', 'minigame', 'questions']

    return (
        <Card className="border-0 shadow-sm mb-4" style={{ background: 'var(--bg-card)' }}>
            <Card.Body className="p-0 d-flex">
                {tabs.map((tab) => (
                    <Button
                        key={tab}
                        className="rounded-0 border-0 flex-grow-1"
                        style={{
                            background: activeTab === tab ? 'var(--accent-primary)' : 'transparent',
                            color: activeTab === tab ? 'white' : 'var(--text-muted)',
                            padding: '12px'
                        }}
                        onClick={() => onTabChange(tab)}
                    >
                        {tab === 'settings' ? 'Score Settings' :
                            tab === 'minigame' ? 'Minigame Settings' :
                                tab.charAt(0).toUpperCase() + tab.slice(1) + ' Settings'}
                    </Button>
                ))}
            </Card.Body>
        </Card>
    )
}

export default SettingsTabs
