import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TitleBar } from './TitleBar'

export function AppShell() {
  const platform = window.korproxy?.app?.platform ?? 'darwin'
  const isMac = platform === 'darwin'

  return (
    <div className="flex flex-col h-screen bg-background">
      <TitleBar />
      <div className={`flex flex-1 overflow-hidden ${isMac ? 'pt-8' : 'pt-10'}`}>
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
