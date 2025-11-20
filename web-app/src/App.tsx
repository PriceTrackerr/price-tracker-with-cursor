import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import History from './pages/History'
import Alerts from './pages/Alerts'
import Settings from './pages/Settings'
import ProductDetails from './pages/ProductDetails'
import Subscription from './pages/Subscription'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsAndConditions from './pages/TermsAndConditions'

import { AuthProvider, useAuth } from './components/AuthContext'
import { ReconnectingIndicator } from './components/AuthContext'
import './i18n'
import { I18nextProvider } from 'react-i18next'
import i18n from './i18n'

function AppContent() {
  const { reconnecting } = useAuth();
  
  return (
    <I18nextProvider i18n={i18n}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <ReconnectingIndicator reconnecting={reconnecting} />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={
              <Layout>
                <Dashboard />
              </Layout>
            } />
            <Route path="/products" element={
              <Layout>
                <Products />
              </Layout>
            } />
            <Route path="/history" element={
              <Layout>
                <History />
              </Layout>
            } />
            <Route path="/alerts" element={
              <Layout>
                <Alerts />
              </Layout>
            } />
            <Route path="/settings" element={
              <Layout>
                <Settings />
              </Layout>
            } />
            <Route path="/products/:productId" element={
              <Layout>
                <ProductDetails />
              </Layout>
            } />
            <Route path="/subscription" element={
              <Layout>
                <Subscription />
              </Layout>
            } />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />

          </Routes>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </div>
      </Router>
    </I18nextProvider>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App 