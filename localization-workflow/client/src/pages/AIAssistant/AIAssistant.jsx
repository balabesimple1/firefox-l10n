import React, { useState, useRef, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  Divider,
  CircularProgress
} from '@mui/material'
import {
  Send,
  SmartToy,
  Person,
  ContentCopy,
  ThumbUp,
  ThumbDown,
  Refresh,
  Clear,
  AutoAwesome
} from '@mui/icons-material'
import { useAIChat, useConversationStarters } from '../../services/queries'
import { useAuthStore } from '../../stores/authStore'
import toast from 'react-hot-toast'

const MessageBubble = ({ message, isUser, timestamp }) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      mb: 2,
    }}
  >
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1,
        maxWidth: '80%',
        flexDirection: isUser ? 'row-reverse' : 'row',
      }}
    >
      <Avatar
        sx={{
          width: 32,
          height: 32,
          bgcolor: isUser ? 'primary.main' : 'secondary.main',
        }}
      >
        {isUser ? <Person /> : <SmartToy />}
      </Avatar>
      
      <Paper
        sx={{
          p: 2,
          bgcolor: isUser ? 'primary.main' : 'grey.100',
          color: isUser ? 'white' : 'text.primary',
          borderRadius: 2,
          borderTopLeftRadius: isUser ? 2 : 0.5,
          borderTopRightRadius: isUser ? 0.5 : 2,
        }}
      >
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
          {message}
        </Typography>
        
        {timestamp && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 1,
              opacity: 0.7,
            }}
          >
            {new Date(timestamp).toLocaleTimeString()}
          </Typography>
        )}
        
        {!isUser && (
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Tooltip title="Copy message">
              <IconButton
                size="small"
                onClick={() => {
                  navigator.clipboard.writeText(message)
                  toast.success('Message copied to clipboard')
                }}
                sx={{ color: 'inherit', opacity: 0.7 }}
              >
                <ContentCopy fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Helpful">
              <IconButton
                size="small"
                sx={{ color: 'inherit', opacity: 0.7 }}
              >
                <ThumbUp fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Not helpful">
              <IconButton
                size="small"
                sx={{ color: 'inherit', opacity: 0.7 }}
              >
                <ThumbDown fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Paper>
    </Box>
  </Box>
)

const AIAssistant = () => {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const messagesEndRef = useRef(null)
  
  const { data: starters } = useConversationStarters()
  const aiChatMutation = useAIChat()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Welcome message
    setMessages([
      {
        id: 1,
        message: `Hello ${user?.name}! I'm your AI assistant for the localization workflow system. I can help you with questions about projects, translations, invoices, and reports. What would you like to know?`,
        isUser: false,
        timestamp: new Date(),
      },
    ])
  }, [user])

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage = {
      id: Date.now(),
      message: inputMessage,
      isUser: true,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')

    try {
      const response = await aiChatMutation.mutateAsync({
        message: inputMessage,
        context: {
          userRole: user?.role,
          userId: user?.id,
        },
      })

      const aiMessage = {
        id: Date.now() + 1,
        message: response.data.response,
        isUser: false,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        message: 'I apologize, but I\'m having trouble processing your request right now. Please try again in a moment.',
        isUser: false,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  const handleStarterClick = (starter) => {
    setInputMessage(starter)
  }

  const handleClearChat = () => {
    setMessages([
      {
        id: 1,
        message: `Hello ${user?.name}! I'm your AI assistant for the localization workflow system. How can I help you today?`,
        isUser: false,
        timestamp: new Date(),
      },
    ])
  }

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSendMessage()
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'ADMIN': return 'error'
      case 'PRODUCT_TEAM': return 'primary'
      case 'FINANCE_TEAM': return 'success'
      case 'TRANSLATOR': return 'warning'
      default: return 'default'
    }
  }

  const getRoleLabel = (role) => {
    switch (role) {
      case 'ADMIN': return 'Administrator'
      case 'PRODUCT_TEAM': return 'Product Team'
      case 'FINANCE_TEAM': return 'Finance Team'
      case 'TRANSLATOR': return 'Translator'
      default: return role
    }
  }

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'secondary.main', width: 48, height: 48 }}>
              <SmartToy />
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1" fontWeight={600}>
                AI Assistant
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your intelligent localization workflow companion
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              label={getRoleLabel(user?.role)}
              color={getRoleColor(user?.role)}
              variant="outlined"
              size="small"
            />
            <Tooltip title="Clear conversation">
              <IconButton onClick={handleClearChat}>
                <Clear />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Conversation Starters */}
        {starters?.starters && messages.length <= 1 && (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AutoAwesome fontSize="small" />
                Conversation Starters
              </Typography>
              <Grid container spacing={1}>
                {starters.starters.slice(0, 4).map((starter, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      onClick={() => handleStarterClick(starter)}
                      sx={{
                        justifyContent: 'flex-start',
                        textAlign: 'left',
                        textTransform: 'none',
                        py: 1,
                      }}
                    >
                      {starter}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Chat Area */}
      <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Messages */}
        <Box
          sx={{
            flexGrow: 1,
            p: 2,
            overflow: 'auto',
            maxHeight: 'calc(100vh - 300px)',
          }}
        >
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message.message}
              isUser={message.isUser}
              timestamp={message.timestamp}
            />
          ))}
          
          {aiChatMutation.isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                  <SmartToy />
                </Avatar>
                <Paper sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="body2" color="text.secondary">
                      AI is thinking...
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            </Box>
          )}
          
          <div ref={messagesEndRef} />
        </Box>

        <Divider />

        {/* Input Area */}
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="Ask me anything about your localization workflow..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={aiChatMutation.isLoading}
              variant="outlined"
              size="small"
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || aiChatMutation.isLoading}
              sx={{ minWidth: 'auto', px: 2 }}
            >
              <Send />
            </Button>
          </Box>
          
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Press Enter to send, Shift+Enter for new line
          </Typography>
        </Box>
      </Card>
    </Box>
  )
}

export default AIAssistant