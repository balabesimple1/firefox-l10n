import React from 'react'
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Chip
} from '@mui/material'
import {
  Dashboard,
  Folder,
  Assignment,
  Receipt,
  Assessment,
  People,
  Settings,
  SmartToy,
  Language,
  Translate,
  AccountBalance,
  AdminPanelSettings
} from '@mui/icons-material'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

const Sidebar = ({ onClose }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const handleNavigation = (path) => {
    navigate(path)
    if (onClose) onClose()
  }

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  // Define navigation items based on user role
  const getNavigationItems = () => {
    const commonItems = [
      {
        text: 'Dashboard',
        icon: <Dashboard />,
        path: '/dashboard',
        roles: ['ADMIN', 'PRODUCT_TEAM', 'FINANCE_TEAM', 'TRANSLATOR']
      },
      {
        text: 'Projects',
        icon: <Folder />,
        path: '/projects',
        roles: ['ADMIN', 'PRODUCT_TEAM', 'TRANSLATOR']
      },
      {
        text: 'Translation Tasks',
        icon: <Assignment />,
        path: '/tasks',
        roles: ['ADMIN', 'PRODUCT_TEAM', 'TRANSLATOR']
      },
      {
        text: 'Invoices',
        icon: <Receipt />,
        path: '/invoices',
        roles: ['ADMIN', 'PRODUCT_TEAM', 'FINANCE_TEAM', 'TRANSLATOR']
      }
    ]

    const managementItems = [
      {
        text: 'Reports & Analytics',
        icon: <Assessment />,
        path: '/reports',
        roles: ['ADMIN', 'PRODUCT_TEAM', 'FINANCE_TEAM'],
        badge: 'New'
      },
      {
        text: 'User Management',
        icon: <People />,
        path: '/users',
        roles: ['ADMIN']
      },
      {
        text: 'System Settings',
        icon: <Settings />,
        path: '/settings',
        roles: ['ADMIN']
      }
    ]

    const toolsItems = [
      {
        text: 'AI Assistant',
        icon: <SmartToy />,
        path: '/ai-assistant',
        roles: ['ADMIN', 'PRODUCT_TEAM', 'FINANCE_TEAM', 'TRANSLATOR'],
        badge: 'AI'
      }
    ]

    return { commonItems, managementItems, toolsItems }
  }

  const { commonItems, managementItems, toolsItems } = getNavigationItems()

  const renderNavItem = (item) => {
    if (!item.roles.includes(user?.role)) return null

    return (
      <ListItem key={item.path} disablePadding>
        <ListItemButton
          selected={isActive(item.path)}
          onClick={() => handleNavigation(item.path)}
          sx={{
            borderRadius: 1,
            mx: 1,
            mb: 0.5,
            '&.Mui-selected': {
              backgroundColor: 'primary.main',
              color: 'white',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
              '& .MuiListItemIcon-root': {
                color: 'white',
              },
            },
          }}
        >
          <ListItemIcon
            sx={{
              color: isActive(item.path) ? 'white' : 'text.secondary',
              minWidth: 40,
            }}
          >
            {item.icon}
          </ListItemIcon>
          <ListItemText 
            primary={item.text}
            primaryTypographyProps={{
              fontSize: '0.9rem',
              fontWeight: isActive(item.path) ? 600 : 400,
            }}
          />
          {item.badge && (
            <Chip
              label={item.badge}
              size="small"
              color={item.badge === 'AI' ? 'secondary' : 'primary'}
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          )}
        </ListItemButton>
      </ListItem>
    )
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'ADMIN':
        return <AdminPanelSettings />
      case 'PRODUCT_TEAM':
        return <Folder />
      case 'FINANCE_TEAM':
        return <AccountBalance />
      case 'TRANSLATOR':
        return <Translate />
      default:
        return <Language />
    }
  }

  const getRoleLabel = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrator'
      case 'PRODUCT_TEAM':
        return 'Product Team'
      case 'FINANCE_TEAM':
        return 'Finance Team'
      case 'TRANSLATOR':
        return 'Translator'
      default:
        return role
    }
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
          <Language color="primary" />
          <Typography variant="h6" noWrap component="div" color="primary" fontWeight={600}>
            L10n Workflow
          </Typography>
        </Box>
      </Toolbar>
      
      <Divider />

      {/* User Role Badge */}
      <Box sx={{ p: 2, backgroundColor: 'grey.50' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getRoleIcon(user?.role)}
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {user?.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {getRoleLabel(user?.role)}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider />

      {/* Navigation */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {/* Main Navigation */}
        <List sx={{ pt: 1 }}>
          {commonItems.map(renderNavItem)}
        </List>

        {/* Management Section */}
        {managementItems.some(item => item.roles.includes(user?.role)) && (
          <>
            <Divider sx={{ mx: 2, my: 1 }} />
            <Typography
              variant="overline"
              sx={{
                px: 2,
                py: 1,
                display: 'block',
                color: 'text.secondary',
                fontSize: '0.7rem',
                fontWeight: 600,
                letterSpacing: 1,
              }}
            >
              Management
            </Typography>
            <List dense>
              {managementItems.map(renderNavItem)}
            </List>
          </>
        )}

        {/* Tools Section */}
        <Divider sx={{ mx: 2, my: 1 }} />
        <Typography
          variant="overline"
          sx={{
            px: 2,
            py: 1,
            display: 'block',
            color: 'text.secondary',
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: 1,
          }}
        >
          Tools
        </Typography>
        <List dense>
          {toolsItems.map(renderNavItem)}
        </List>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          Localization Workflow v1.0
        </Typography>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          Mozilla L10n Team
        </Typography>
      </Box>
    </Box>
  )
}

export default Sidebar