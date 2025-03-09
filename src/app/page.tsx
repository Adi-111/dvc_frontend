"use client";
import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Container, Paper } from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import { useRouter } from 'next/navigation';

function DVCPage() {
    const [roomId, setRoomId] = useState("");
    const router = useRouter();

    const handleJoinCall = () => {
        if (roomId.trim()) {
            router.push(`/call/${roomId}`); // Redirect to dynamic room page
        }
    };
    return (
        <Container maxWidth="sm" sx={{ mt: 8 }}>
            <Paper elevation={4} sx={{ p: 4, borderRadius: 2 }}>
                <Box display="flex" flexDirection="column" alignItems="center">
                    {/* Heading with Phone Icon */}
                    <Box display="flex" alignItems="center" mb={2}>
                        <PhoneIcon sx={{ fontSize: 48, color: 'primary.main', mr: 1 }} />
                        <Typography variant="h3" component="h1" gutterBottom>
                            DVC
                        </Typography>
                    </Box>

                    {/* Subheading */}
                    <Typography
                        variant="subtitle1"
                        align="center"
                        color="text.secondary"
                        sx={{ mb: 4 }}
                    >
                        DVC utilizes WebRTC technology to enable secure, low-latency peer-to-peer video calls directly in your browser.
                    </Typography>

                    {/* Room ID Input */}
                    <TextField
                        fullWidth
                        label="Enter Room ID"
                        variant="outlined"
                        placeholder="Enter or create a room ID"
                        sx={{ mb: 3 }}
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                    />

                    {/* Join Button */}
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<PhoneIcon />}
                        sx={{ px: 6 }}
                        onClick={handleJoinCall}
                    >
                        Join Call
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}

export default DVCPage;
