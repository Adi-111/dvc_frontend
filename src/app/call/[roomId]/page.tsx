"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Peer from "simple-peer";
import {
    Box,
    Typography,
    IconButton,
    Button,
    Stack,
    TextField,
    Modal,
    Backdrop,
    Fade,
} from "@mui/material";
import { PhoneDisabled, Mic, MicOff, Videocam, VideocamOff } from "@mui/icons-material";

export default function CallRoomPage() {
    const router = useRouter();
    const { roomId } = useParams();
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [peer, setPeer] = useState<Peer.Instance | null>(null);
    const [yourSignal, setYourSignal] = useState<string>("");
    const [remoteSignal, setRemoteSignal] = useState<string>("");
    const [isInitiator, setIsInitiator] = useState<boolean | null>(null);
    const [muted, setMuted] = useState<boolean>(false);
    const [videoEnabled, setVideoEnabled] = useState<boolean>(true);
    const [openRoleModal, setOpenRoleModal] = useState<boolean>(true);
    const [openSignalModal, setOpenSignalModal] = useState<boolean>(false);

    // Initialize local media (audio and video)
    useEffect(() => {
        let initialStream: MediaStream | null = null;
        const initializeMedia = async () => {
            try {
                initialStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setLocalStream(initialStream);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = initialStream;
                }
            } catch (error) {
                console.error("Error accessing media devices:", error);
            }
        };
        initializeMedia();
        return () => {
            initialStream?.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        };
    }, []);

    // Create a simple-peer instance when localStream is ready and role is chosen
    useEffect(() => {
        if (localStream && isInitiator !== null && !peer) {
            const newPeer = new Peer({
                initiator: isInitiator,
                trickle: false,
                stream: localStream,
            });

            newPeer.on("signal", (data) => {
                console.log("SIGNAL", data);
                setYourSignal(JSON.stringify(data));
            });

            newPeer.on("stream", (remoteStream) => {
                console.log("Remote stream received");
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = remoteStream;
                }
            });

            newPeer.on("error", (err) => {
                console.error("Peer error:", err);
            });

            setPeer(newPeer);
        }
    }, [localStream, isInitiator, peer]);

    // Handle manual signaling data exchange
    const connectPeer = () => {
        try {
            const signal = JSON.parse(remoteSignal);
            if (peer) {
                peer.signal(signal);
            }
        } catch (error) {
            console.error("Invalid remote signal data", error);
        }
    };

    // End the call by stopping local tracks and destroying the peer connection
    const handleEndCall = () => {
        localStream?.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        peer?.destroy();
        router.push("/");
    };

    // Toggle audio by stopping or re-adding audio tracks
    const toggleAudio = async () => {
        if (!localStream) return;
        if (!muted) {
            localStream.getAudioTracks().forEach((track: MediaStreamTrack) => track.stop());
            const newStream = new MediaStream(localStream.getVideoTracks());
            setLocalStream(newStream);
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = newStream;
            }
            setMuted(true);
        } else {
            try {
                const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const newAudioTrack = audioStream.getAudioTracks()[0];
                const newStream = new MediaStream([...localStream.getVideoTracks(), newAudioTrack]);
                setLocalStream(newStream);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = newStream;
                }
                setMuted(false);
            } catch (error) {
                console.error("Error enabling audio:", error);
            }
        }
    };

    // Toggle video by stopping or re-adding video tracks
    const toggleVideo = async () => {
        if (!localStream) return;
        if (videoEnabled) {
            localStream.getVideoTracks().forEach((track: MediaStreamTrack) => track.stop());
            const newStream = new MediaStream(localStream.getAudioTracks());
            setLocalStream(newStream);
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = newStream;
            }
            setVideoEnabled(false);
        } else {
            try {
                const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
                const newVideoTrack = videoStream.getVideoTracks()[0];
                const newStream = new MediaStream([...localStream.getAudioTracks(), newVideoTrack]);
                setLocalStream(newStream);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = newStream;
                }
                setVideoEnabled(true);
            } catch (error) {
                console.error("Error enabling video:", error);
            }
        }
    };

    // Modal for selecting a role (host or joiner)
    const RoleSelectionModal = (
        <Modal
            open={openRoleModal}
            closeAfterTransition
            BackdropComponent={Backdrop}
            BackdropProps={{
                timeout: 500,
            }}
        >
            <Fade in={openRoleModal}>
                <Box
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 300,
                        bgcolor: "background.paper",
                        borderRadius: 2,
                        boxShadow: 24,
                        p: 4,
                        textAlign: "center",
                    }}
                >
                    <Typography variant="h6" gutterBottom>
                        Join Meeting
                    </Typography>
                    <Stack spacing={2}>
                        <Button
                            variant="contained"
                            onClick={() => {
                                setIsInitiator(true);
                                setOpenRoleModal(false);
                            }}
                        >
                            Start Call (Host)
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => {
                                setIsInitiator(false);
                                setOpenRoleModal(false);
                            }}
                        >
                            Join Call
                        </Button>
                    </Stack>
                </Box>
            </Fade>
        </Modal>
    );

    // Modal for manual signaling (for development/testing)
    const SignalModal = (
        <Modal
            open={openSignalModal}
            onClose={() => setOpenSignalModal(false)}
            closeAfterTransition
            BackdropComponent={Backdrop}
            BackdropProps={{
                timeout: 500,
            }}
        >
            <Fade in={openSignalModal}>
                <Box
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 400,
                        bgcolor: "background.paper",
                        borderRadius: 2,
                        boxShadow: 24,
                        p: 4,
                    }}
                >
                    <Typography variant="subtitle1" gutterBottom>
                        Your Signal Data (share with your peer):
                    </Typography>
                    <TextField
                        multiline
                        fullWidth
                        rows={4}
                        value={yourSignal}
                        InputProps={{
                            readOnly: true,
                        }}
                        variant="outlined"
                    />
                    <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                        Paste Remote Signal Data:
                    </Typography>
                    <TextField
                        multiline
                        fullWidth
                        rows={4}
                        value={remoteSignal}
                        onChange={(e) => setRemoteSignal(e.target.value)}
                        variant="outlined"
                    />
                    <Button variant="contained" onClick={connectPeer} sx={{ mt: 2 }}>
                        Connect
                    </Button>
                </Box>
            </Fade>
        </Modal>
    );

    return (
        <Box sx={{ position: "relative", width: "100vw", height: "100vh", backgroundColor: "#000" }}>
            {/* Fullscreen remote video */}
            <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }}
            />
            {/* Top header bar */}
            <Box
                sx={{
                    position: "absolute",
                    top: 0,
                    width: "100%",
                    p: 2,
                    display: "flex",
                    justifyContent: "center",
                    background: "rgba(0,0,0,0.5)",
                }}
            >
                <Typography variant="h6" color="white">
                    Room: {roomId}
                </Typography>
            </Box>
            {/* Local video overlay (picture-in-picture) */}
            <Box
                sx={{
                    position: "absolute",
                    bottom: 80,
                    right: 20,
                    width: 200,
                    height: 120,
                    border: "2px solid #fff",
                    borderRadius: 2,
                    overflow: "hidden",
                    backgroundColor: "#000",
                }}
            >
                {videoEnabled ? (
                    <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
                    />
                ) : (
                    <Box
                        sx={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                        }}
                    >
                        <VideocamOff fontSize="large" />
                    </Box>
                )}
            </Box>
            {/* Bottom control bar */}
            <Box
                sx={{
                    position: "absolute",
                    bottom: 20,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "rgba(0,0,0,0.5)",
                    borderRadius: 2,
                    p: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                }}
            >
                <IconButton onClick={toggleAudio} sx={{ color: "white" }}>
                    {muted ? <MicOff /> : <Mic />}
                </IconButton>
                <IconButton onClick={toggleVideo} sx={{ color: "white" }}>
                    {videoEnabled ? <Videocam /> : <VideocamOff />}
                </IconButton>
                <IconButton onClick={handleEndCall} sx={{ color: "red" }}>
                    <PhoneDisabled />
                </IconButton>
                {/* Button to open the signaling modal for development */}
                <Button variant="contained" onClick={() => setOpenSignalModal(true)}>
                    Signal
                </Button>
            </Box>
            {RoleSelectionModal}
            {SignalModal}
        </Box>
    );
}
