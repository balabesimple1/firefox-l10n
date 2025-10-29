import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Chip,
} from '@mui/material';
import {
  Dashboard,
  Business,
  Translate,
  Receipt,
  People,
  SmartToy,
  AccountCircle,
  AdminPanelSettings,
  AttachMoney,
  Assignment,
  Language,
} from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const getMenuItems = () => {
    const commonItems = [
      { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
      { text: 'AI Assistant', icon: <SmartToy />, path: '/ai-assistant' },
      { text: 'Profile', icon: <AccountCircle />, path: '/profile' },
    ];

    const roleSpecificItems = {
      product: [
        { text: 'Products', icon: <Business />, path: '/products' },
        { text: 'Translations', icon: <Translate />, path: '/translations' },
      ],
      finance: [
        { text: 'Invoices', icon: <Receipt />, path: '/invoices' },
        { text: 'Translations', icon: <Translate />, path: '/translations' },
      ],
      translator: [
        { text: 'My Tasks', icon: <Assignment />, path: '/translations' },
        { text: 'Invoices', icon: <Receipt />, path: '/invoices' },
      ],
      admin: [
        { text: 'Products', icon: <Business />, path: '/products' },
        { text: 'Translations', icon: <Translate />, path: '/translations' },
        { text: 'Invoices', icon: <Receipt />, path: '/invoices' },
        { text: 'Users', icon: <People />, path: '/admin/users' },
      ],
    };

    return [
      ...commonItems,
      ...(roleSpecificItems[user?.role] || []),
    ];
  };

  const getRoleInfo = () => {
    const roleInfo = {
      product: {
        title: 'Product Team',
        description: 'Manage localization projects',
        color: '#2196f3',
        icon: <Business />,
      },
      finance: {
        title: 'Finance Team',
        description: 'Manage invoices and payments',
        color: '#4caf50',
        icon: <AttachMoney />,
      },
      translator: {
        title: 'Translator',
        description: 'Complete translation tasks',
        color: '#ff9800',
        icon: <Language />,
      },
      admin: {
        title: 'Administrator',
        description: 'System administration',
        color: '#f44336',
        icon: <AdminPanelSettings />,
      },
    };

    return roleInfo[user?.role] || roleInfo.admin;
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const menuItems = getMenuItems();
  const roleInfo = getRoleInfo();

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo/Brand */}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          LocalizeHub
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Translation Management
        </Typography>
      </Box>

      <Divider />

      {/* Role Info */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box sx={{ color: roleInfo.color, mr: 1 }}>
            {roleInfo.icon}
          </Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {roleInfo.title}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          {roleInfo.description}
        </Typography>
        <Chip
          label={user?.role?.toUpperCase()}
          size="small"
          sx={{
            mt: 1,
            bgcolor: roleInfo.color,
            color: 'white',
            fontSize: '0.7rem',
            height: 20,
          }}
        />
      </Box>

      <Divider />

      {/* Navigation Menu */}
      <List sx={{ flexGrow: 1, pt: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  mx: 1,
                  borderRadius: 2,
                  mb: 0.5,
                  backgroundColor: isActive ? 'primary.main' : 'transparent',
                  color: isActive ? 'white' : 'text.primary',
                  '&:hover': {
                    backgroundColor: isActive ? 'primary.dark' : 'action.hover',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? 'white' : 'text.secondary',
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: isActive ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Footer */}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          v1.0.0 • {new Date().getFullYear()}
        </Typography>
      </Box>
    </Box>
  );
};

export default Sidebar;