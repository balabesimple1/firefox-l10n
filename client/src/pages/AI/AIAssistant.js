import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from 'react-query';
import {
  Container,
  Paper,
  Box,
  TextField,
  Button,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  Card,
  CardContent,
  Grid,
  IconButton,
} from '@mui/material';
import {
  Send,
  SmartToy,
  Person,
  Refresh,
  LightbulbOutlined,
} from '@mui/icons-material';
import axios from 'axios';

import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const AIAssistant = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Fetch conversation starters
  const { data: starters } = useQuery(
    'conversation-starters',
    async () => {
      const response = await axios.get('/api/ai/conversation-starters');
      return response.data;
    }
  );

  // Chat mutation
  const chatMutation = useMutation(
    async (message) => {
      const response = await axios.post('/api/ai/chat', { message });
      return response.data;
    },
    {
      onSuccess: (data) => {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          text: data.response,
          sender: 'ai',
          timestamp: new Date(),
        }]);
      },
      onError: (error) => {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          text: 'Sorry, I encountered an error. Please try again.',
          sender: 'ai',
          timestamp: new Date(),
          error: true,
        }]);
      }
    }
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (message = inputMessage) => {
    if (!message.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      text: message,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    // Send to AI
    chatMutation.mutate(message);
  };

  const handleStarterClick = (starter) => {
    handleSendMessage(starter);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: '#f44336',
      product: '#2196f3',
      finance: '#4caf50',
      translator: '#ff9800',
    };
    return colors[role] || '#757575';
  };

  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Typography variant="h4" gutterBottom>
          AI Assistant
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Get help with your localization tasks and questions
        </Typography>

        <Grid container spacing={3}>
          {/* Chat Interface */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
              {/* Messages */}
              <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                {messages.length === 0 && (
                  <Box textAlign="center" py={4}>
                    <SmartToy sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Hello! I'm your AI assistant
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      I can help you with localization management tasks.
                      Try one of the suggestions on the right or ask me anything!
                    </Typography>
                  </Box>
                )}

                <List>
                  {messages.map((message) => (
                    <ListItem
                      key={message.id}
                      sx={{
                        flexDirection: message.sender === 'user' ? 'row-reverse' : 'row',
                        alignItems: 'flex-start',
                        mb: 1,
                      }}
                    >
                      <ListItemAvatar sx={{ 
                        minWidth: message.sender === 'user' ? 'auto' : 40,
                        ml: message.sender === 'user' ? 1 : 0,
                        mr: message.sender === 'user' ? 0 : 1,
                      }}>
                        <Avatar
                          sx={{
                            bgcolor: message.sender === 'user' 
                              ? getRoleColor(user?.role) 
                              : '#1976d2',
                            width: 32,
                            height: 32,
                          }}
                        >
                          {message.sender === 'user' ? (
                            <Person />
                          ) : (
                            <SmartToy />
                          )}
                        </Avatar>
                      </ListItemAvatar>
                      
                      <Box
                        sx={{
                          maxWidth: '70%',
                          bgcolor: message.sender === 'user' 
                            ? getRoleColor(user?.role)
                            : message.error 
                              ? '#ffebee' 
                              : '#f5f5f5',
                          color: message.sender === 'user' 
                            ? 'white' 
                            : message.error 
                              ? '#d32f2f' 
                              : 'text.primary',
                          p: 2,
                          borderRadius: 2,
                          wordBreak: 'break-word',
                        }}
                      >
                        <Typography variant="body2">
                          {message.text}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            opacity: 0.7,
                            display: 'block',
                            mt: 0.5,
                          }}
                        >
                          {message.timestamp.toLocaleTimeString()}
                        </Typography>
                      </Box>
                    </ListItem>
                  ))}
                  
                  {chatMutation.isLoading && (
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#1976d2', width: 32, height: 32 }}>
                          <SmartToy />
                        </Avatar>
                      </ListItemAvatar>
                      <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 2 }}>
                        <LoadingSpinner size={20} message="Thinking..." />
                      </Box>
                    </ListItem>
                  )}
                </List>
                <div ref={messagesEndRef} />
              </Box>

              {/* Input */}
              <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Box display="flex" gap={1}>
                  <TextField
                    fullWidth
                    placeholder="Ask me anything about localization..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    multiline
                    maxRows={3}
                    disabled={chatMutation.isLoading}
                  />
                  <Button
                    variant="contained"
                    onClick={() => handleSendMessage()}
                    disabled={!inputMessage.trim() || chatMutation.isLoading}
                    sx={{ minWidth: 'auto', px: 2 }}
                  >
                    <Send />
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6">
                    Your Role
                  </Typography>
                  <Chip
                    label={user?.role?.toUpperCase()}
                    sx={{
                      bgcolor: getRoleColor(user?.role),
                      color: 'white',
                    }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  I'm customized to help with {user?.role} team tasks and workflows.
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <LightbulbOutlined sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Conversation Starters
                  </Typography>
                </Box>
                
                {starters?.starters?.map((starter, index) => (
                  <Button
                    key={index}
                    variant="outlined"
                    size="small"
                    onClick={() => handleStarterClick(starter)}
                    sx={{
                      mb: 1,
                      mr: 1,
                      textAlign: 'left',
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      fontSize: '0.8rem',
                    }}
                    disabled={chatMutation.isLoading}
                  >
                    {starter}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default AIAssistant;