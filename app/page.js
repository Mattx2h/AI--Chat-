'use client'
import Image from "next/image"
import { useState } from 'react'
import { Box, Stack, TextField, Button } from '@mui/material'  // Assuming you're using MUI components

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi, I am your personal gym assistant, how can I assist you today?'
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');  // This is intended for user input

  const sendMessage = async () => {
    // Add user message to the messages array
    setMessages((prevMessages) => [
      ...prevMessages,
      { role: 'user', content: inputMessage },
      { role: 'assistant', content: 'Let me think about that...' }
    ]);

    try {
      const response = await fetch('/api/chat', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([...messages, { role: 'user', content: inputMessage }])
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = '';

      const processText = async ({ done, value }) => {
        if (done) {
          return result;
        }
        const text = decoder.decode(value || new Uint8Array(), { stream: true });
        
        setMessages((prevMessages) => {
          let lastMessage = prevMessages[prevMessages.length - 1];
          let otherMessages = prevMessages.slice(0, prevMessages.length - 1);
          return [
            ...otherMessages,
            {
              ...lastMessage,
              content: lastMessage.content + text,
            }
          ];
        });
        
        result += text;
        return reader.read().then(processText);
      };

      await reader.read().then(processText);

    } catch (error) {
      console.error('Error:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: 'assistant', content: 'Sorry, there was an error processing your request.' }
      ]);
    }

    setInputMessage(''); // Clear the input after sending
  };

  return ( 
    <Box 
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <Stack 
        direction="column"
        width="600px"
        height="700px"
        border="1px solid black"
        p={2}
        spacing={3}
      >
        <Stack 
          direction="column"
          spacing={2}
          flexGrow={1}
          overflow="auto"
          maxHeight="100%"
        >
          {messages.map((message, index) => (
            <Box 
              key={index} 
              display='flex' 
              justifyContent={message.role === 'assistant' ? 'flex-start' : 'flex-end'}
            >
              <Box 
                bgcolor={message.role === 'assistant' ? 'primary.main' : 'secondary.main'}
                color="white"
                borderRadius={16}
                p={3}
              >
                {message.content}
              </Box>
            </Box>
          ))}
        </Stack>
        <Stack 
          direction="row" 
          spacing={2}
        >
          <TextField
            label="Message"
            fullWidth
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
          />
          <Button 
            variant="contained" 
            onClick={sendMessage}
          >
            Send
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
