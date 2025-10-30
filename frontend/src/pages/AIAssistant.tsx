import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  List,
  ListItem,
  Avatar,
  Chip,
  IconButton,
  Divider,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  Send,
  SmartToy,
  Person,
  Refresh,
  Translate,
  Clear,
} from '@mui/icons-material';
import { useQuery, useMutation } from 'react-query';
import { aiAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ChatMessage } from '../types';

const AIAssistant: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [sessionId, setSessionId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversationStarters } = useQuery(
    'conversation-starters',
    aiAPI.getConversationStarters
  );

  const chatMutation = useMutation(
    ({ message, sessionId }: { message: string; sessionId?: string }) =>
      aiAPI.chat(message, sessionId),
    {
      onSuccess: (response) => {
        setSessionId(response.session_id);
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: response.message,
            timestamp: new Date().toISOString(),
          }
        ]);
      },
    }
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: currentMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate({ message: currentMessage, sessionId });
    setCurrentMessage('');
  };

  const handleStarterClick = (starter: string) => {
    setCurrentMessage(starter);
  };

  const handleClearChat = () => {
    setMessages([]);
    setSessionId('');
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        AI Assistant
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        Get help with your localization workflow. Ask questions about projects, tasks, reports, and more.
      </Typography>

      <Grid container spacing={3}>
        {/* Chat Interface */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ height: 600, display: 'flex', flexDirection: 'column' }}>
            {/* Chat Header */}
            <Box
              sx={{
                p: 2,
                borderBottom: 1,
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <SmartToy />
                </Avatar>
                <Box>
                  <Typography variant="h6">AI Assistant</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {user?.role?.toUpperCase()} Mode
                  </Typography>
                </Box>
              </Box>
              <IconButton onClick={handleClearChat} color="error">
                <Clear />
              </IconButton>
            </Box>

            {/* Messages */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
              {messages.length === 0 ? (
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  height="100%"
                  textAlign="center"
                >
                  <SmartToy sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="textSecondary">
                    Welcome to your AI Assistant!
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Ask me anything about your localization workflow.
                  </Typography>
                </Box>
              ) : (
                <List>
                  {messages.map((message, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        display: 'flex',
                        flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                        alignItems: 'flex-start',
                        gap: 1,
                      }}
                    >
                      <Avatar
                        sx={{
                          bgcolor: message.role === 'user' ? 'secondary.main' : 'primary.main',
                          width: 32,
                          height: 32,
                        }}
                      >
                        {message.role === 'user' ? <Person /> : <SmartToy />}
                      </Avatar>
                      <Box
                        sx={{
                          maxWidth: '70%',
                          backgroundColor: message.role === 'user' ? 'primary.light' : 'grey.100',
                          borderRadius: 2,
                          p: 2,
                          ml: message.role === 'user' ? 'auto' : 0,
                          mr: message.role === 'assistant' ? 'auto' : 0,
                        }}
                      >
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                          {message.content}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="textSecondary"
                          sx={{ display: 'block', mt: 1 }}
                        >
                          {formatTime(message.timestamp)}
                        </Typography>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
              <div ref={messagesEndRef} />
            </Box>

            {/* Message Input */}
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Box display="flex" gap={1}>
                <TextField
                  fullWidth
                  placeholder="Ask me anything about your localization workflow..."
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  multiline
                  maxRows={3}
                  disabled={chatMutation.isLoading}
                />
                <Button
                  variant="contained"
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim() || chatMutation.isLoading}
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
          <Box display="flex" flexDirection="column" gap={2}>
            {/* Conversation Starters */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Conversation Starters
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  Try these questions to get started:
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  {conversationStarters?.starters?.map((starter: string, index: number) => (
                    <Chip
                      key={index}
                      label={starter}
                      onClick={() => handleStarterClick(starter)}
                      clickable
                      variant="outlined"
                      sx={{ justifyContent: 'flex-start', height: 'auto', py: 1 }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>

            {/* AI Translation Tool */}
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Translate color="primary" />
                  <Typography variant="h6">Quick Translation</Typography>
                </Box>
                <TextField
                  fullWidth
                  placeholder="Enter text to translate..."
                  multiline
                  rows={3}
                  sx={{ mb: 2 }}
                />
                <Box display="flex" gap={1} mb={2}>
                  <TextField
                    select
                    label="From"
                    value="en-US"
                    size="small"
                    sx={{ flex: 1 }}
                    SelectProps={{ native: true }}
                  >
                    <option value="en-US">English</option>
                    <option value="fr-FR">French</option>
                    <option value="de-DE">German</option>
                    <option value="es-ES">Spanish</option>
                  </TextField>
                  <TextField
                    select
                    label="To"
                    value="fr-FR"
                    size="small"
                    sx={{ flex: 1 }}
                    SelectProps={{ native: true }}
                  >
                    <option value="fr-FR">French</option>
                    <option value="de-DE">German</option>
                    <option value="es-ES">Spanish</option>
                    <option value="it-IT">Italian</option>
                  </TextField>
                </Box>
                <Button variant="outlined" fullWidth startIcon={<Translate />}>
                  Translate
                </Button>
              </CardContent>
            </Card>

            {/* Help & Tips */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Tips & Help
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  • Ask about project status and progress
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  • Get cost estimates and financial reports
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  • Find translator recommendations
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  • Generate invoices and track payments
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  • Access translation memory and glossary
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AIAssistant;