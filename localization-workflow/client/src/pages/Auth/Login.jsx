import React, { useState } from 'react'
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Card,
  CardContent,
  Chip,
  Divider
} from '@mui/material'
import { Language, Login as LoginIcon } from '@mui/icons-material'
import { useAuthStore } from '../../stores/authStore'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { login } = useAuthStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(email, password)
      if (!result.success) {
        setError(result.error)
      }
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const demoAccounts = [
    { role: 'Admin', email: 'admin@localization.com', password: 'admin123', color: 'error' },
    { role: 'Product Team', email: 'product@localization.com', password: 'product123', color: 'primary' },
    { role: 'Finance Team', email: 'finance@localization.com', password: 'finance123', color: 'success' },
    { role: 'Translator', email: 'maria@translator.com', password: 'translator123', color: 'warning' }
  ]

  const handleDemoLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail)
    setPassword(demoPassword)
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2,
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
          {/* Login Form */}
          <Paper
            elevation={10}
            sx={{
              p: 4,
              width: '100%',
              maxWidth: 400,
              borderRadius: 3,
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Language sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
                Welcome Back
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sign in to your localization workflow account
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
                autoComplete="email"
                autoFocus
                disabled={loading}
              />
              
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                autoComplete="current-password"
                disabled={loading}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
                sx={{ mt: 3, mb: 2, py: 1.5 }}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </Paper>

          {/* Demo Accounts */}
          <Card sx={{ width: '100%', maxWidth: 400 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Demo Accounts
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Click on any account below to auto-fill the login form and explore different user roles.
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {demoAccounts.map((account, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 2,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                        borderColor: 'primary.main',
                      },
                    }}
                    onClick={() => handleDemoLogin(account.email, account.password)}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {account.role}
                      </Typography>
                      <Chip
                        label={account.role.split(' ')[0]}
                        size="small"
                        color={account.color}
                        variant="outlined"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {account.email}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography variant="body2" color="text.secondary" align="center">
                <strong>Features by Role:</strong>
              </Typography>
              <Box sx={{ mt: 2, fontSize: '0.8rem', color: 'text.secondary' }}>
                <Typography variant="caption" display="block">
                  • <strong>Admin:</strong> Full system access, user management
                </Typography>
                <Typography variant="caption" display="block">
                  • <strong>Product:</strong> Project management, cost tracking
                </Typography>
                <Typography variant="caption" display="block">
                  • <strong>Finance:</strong> Invoice management, payments
                </Typography>
                <Typography variant="caption" display="block">
                  • <strong>Translator:</strong> Task management, invoicing
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </Box>
  )
}

export default Login