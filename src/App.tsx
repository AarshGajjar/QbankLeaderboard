import QBankTracker from './components/QBankTracker'
import DashboardLayout from './components/functionality/DashboardLayout'

function App() {
  return (
    <DashboardLayout>
      <div className="lg:col-span-12">
        <QBankTracker />
      </div>
    </DashboardLayout>
  )
}

export default App
