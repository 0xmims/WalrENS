import { } from 'react' // React import for JSX
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Builder from './pages/Builder'
import Dashboard from './pages/Dashboard'
import Preview from './pages/Preview'
import ErrorBoundary from './components/ErrorBoundary'
import ErrorToast from './components/ErrorToast'
import { useErrorHandler } from './hooks/useErrorHandler'

function App() {
  const { errors, removeError } = useErrorHandler()

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/builder" element={<Builder />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/preview" element={<Preview />} />
        </Routes>
        <ErrorToast errors={errors} onRemove={removeError} />
      </div>
    </ErrorBoundary>
  )
}

export default App
