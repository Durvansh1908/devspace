// src/components/MeetingRoom.tsx
import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:3001";
const ICE_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }] };

interface Participant { socketId: string; name: string; stream?: MediaStream; muted?: boolean; videoOff?: boolean; }
interface MeetingRoomProps { roomId: string; userName: string; onLeave: () => void; }

export default function MeetingRoom({ roomId, userName, onLeave }: MeetingRoomProps) {
  const [participants, setParticipants] = useState<Record<string, Participant>>({});
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [activeView, setActiveView] = useState<"grid" | "spotlight">("grid");

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const t = setInterval(() => setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const createPeer = useCallback((targetId: string, initiator: boolean, socket: Socket): RTCPeerConnection => {
    const peer = new RTCPeerConnection(ICE_SERVERS);
    localStreamRef.current?.getTracks().forEach(t => peer.addTrack(t, localStreamRef.current!));
    peer.onicecandidate = e => { if (e.candidate) socket.emit("webrtc-ice", { to: targetId, candidate: e.candidate }); };
    peer.ontrack = e => setParticipants(prev => ({ ...prev, [targetId]: { ...prev[targetId], stream: e.streams[0] } }));
    peer.onconnectionstatechange = () => {
      if (["failed", "disconnected", "closed"].includes(peer.connectionState)) {
        setParticipants(prev => { const n = { ...prev }; delete n[targetId]; return n; });
      }
    };
    if (initiator) {
      peer.onnegotiationneeded = async () => {
        try {
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          socket.emit("webrtc-offer", { to: targetId, offer });
        } catch {}
      };
    }
    peersRef.current[targetId] = peer;
    return peer;
  }, []);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        const socket = io(SOCKET_URL);
        socketRef.current = socket;
        socket.emit("call-join", { roomId, user: { id: socket.id, name: userName } });
        socket.on("call-user-joined", async ({ socketId, user }: { socketId: string; user: { name: string } }) => {
          if (!mounted) return;
          setParticipants(prev => ({ ...prev, [socketId]: { socketId, name: user.name } }));
          createPeer(socketId, true, socket);
        });
        socket.on("call-user-left", ({ socketId }: { socketId: string }) => {
          if (!mounted) return;
          peersRef.current[socketId]?.close(); delete peersRef.current[socketId];
          setParticipants(prev => { const n = { ...prev }; delete n[socketId]; return n; });
        });
        socket.on("webrtc-offer", async ({ from, offer }: any) => {
          if (!mounted) return;
          const peer = createPeer(from, false, socket);
          await peer.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          socket.emit("webrtc-answer", { to: from, answer });
        });
        socket.on("webrtc-answer", async ({ from, answer }: any) => { await peersRef.current[from]?.setRemoteDescription(new RTCSessionDescription(answer)); });
        socket.on("webrtc-ice", async ({ from, candidate }: any) => { try { await peersRef.current[from]?.addIceCandidate(new RTCIceCandidate(candidate)); } catch {} });
        if (mounted) setIsConnecting(false);
      } catch {
        if (mounted) { setError("Camera/microphone access denied. Check browser permissions."); setIsConnecting(false); }
      }
    };
    init();
    return () => {
      mounted = false;
      Object.values(peersRef.current).forEach(p => p.close());
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      socketRef.current?.emit("call-leave", roomId);
      socketRef.current?.disconnect();
    };
  }, [roomId, userName, createPeer]);

  const toggleMute = () => {
    const t = localStreamRef.current?.getAudioTracks()[0];
    if (t) { t.enabled = !t.enabled; setIsMuted(m => !m); }
  };

  const toggleVideo = () => {
    const t = localStreamRef.current?.getVideoTracks()[0];
    if (t) { t.enabled = !t.enabled; setIsVideoOff(v => !v); }
  };

  const toggleScreen = async () => {
    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
      const videoTrack = localStreamRef.current?.getVideoTracks()[0];
      if (videoTrack) {
        Object.values(peersRef.current).forEach(peer => {
          const sender = peer.getSenders().find(s => s.track?.kind === "video");
          sender?.replaceTrack(videoTrack);
        });
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];
        Object.values(peersRef.current).forEach(peer => {
          const sender = peer.getSenders().find(s => s.track?.kind === "video");
          sender?.replaceTrack(screenTrack);
        });
        screenTrack.onended = () => { setIsScreenSharing(false); screenStreamRef.current = null; };
        setIsScreenSharing(true);
      } catch {}
    }
  };

  const handleLeave = () => {
    Object.values(peersRef.current).forEach(p => p.close());
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    socketRef.current?.emit("call-leave", roomId); socketRef.current?.disconnect();
    onLeave();
  };

  const pList = Object.values(participants);
  const total = pList.length + 1;
  const cols = total <= 1 ? 1 : total <= 4 ? 2 : total <= 9 ? 3 : 4;

  return (
    <div className="meet-container">
      {/* Header */}
      <div className="meet-header">
        <div className="meet-header-left">
          <div className="meet-logo">
            <span className="meet-logo-icon">📹</span>
            <span className="meet-logo-text">DevSpace Meet</span>
          </div>
          <div className="meet-room-badge">
            <span className="meet-room-dot" />
            {roomId}
          </div>
        </div>
        <div className="meet-header-center">
          <span className="meet-timer">{fmt(duration)}</span>
          <span className="meet-participant-count">{total} participant{total !== 1 ? "s" : ""}</span>
        </div>
        <div className="meet-header-right">
          <button
            className={`meet-view-btn ${activeView === "grid" ? "active" : ""}`}
            onClick={() => setActiveView("grid")} title="Grid view">⊞</button>
          <button
            className={`meet-view-btn ${activeView === "spotlight" ? "active" : ""}`}
            onClick={() => setActiveView("spotlight")} title="Spotlight view">▣</button>
          <button className="meet-leave-header" onClick={handleLeave}>← Back to Dashboard</button>
        </div>
      </div>

      {/* Error */}
      {error && <div className="meet-error"><span>⚠️</span> {error}</div>}

      {/* Connecting */}
      {isConnecting && (
        <div className="meet-connecting">
          <div className="meet-spinner" />
          <p>Joining room...</p>
        </div>
      )}

      {/* Video Grid */}
      <div className={`meet-grid meet-grid-${Math.min(cols, 4)}`}>
        {/* Local tile */}
        <div className="meet-tile meet-tile-local">
          <video ref={localVideoRef} autoPlay muted playsInline className="meet-video" />
          {isVideoOff && (
            <div className="meet-video-off">
              <div className="meet-avatar-large">{userName[0].toUpperCase()}</div>
            </div>
          )}
          {isScreenSharing && <div className="meet-screen-badge">🖥️ Sharing</div>}
          <div className="meet-tile-footer">
            <div className="meet-name-tag">
              {isMuted && <span className="meet-muted-icon">🔇</span>}
              <span>{userName} (You)</span>
            </div>
            <div className="meet-tile-status">
              <span className="meet-status-dot" />
            </div>
          </div>
        </div>

        {/* Remote tiles */}
        {pList.map(p => <RemoteTile key={p.socketId} participant={p} />)}

        {/* Empty slot */}
        {pList.length === 0 && !isConnecting && (
          <div className="meet-tile meet-tile-empty">
            <div className="meet-empty-content">
              <div className="meet-empty-icon">👥</div>
              <p className="meet-empty-title">Waiting for teammates</p>
              <p className="meet-empty-sub">Share this room ID to invite:</p>
              <div className="meet-room-copy">
                <code>{roomId}</code>
                <button onClick={() => navigator.clipboard.writeText(roomId)} className="meet-copy-btn">Copy</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="meet-controls">
        <div className="meet-controls-inner">
          <button className={`meet-ctrl-btn ${isMuted ? "meet-ctrl-danger" : ""}`} onClick={toggleMute}>
            <span className="meet-ctrl-icon">{isMuted ? "🔇" : "🎙️"}</span>
            <span className="meet-ctrl-label">{isMuted ? "Unmute" : "Mute"}</span>
          </button>
          <button className={`meet-ctrl-btn ${isVideoOff ? "meet-ctrl-danger" : ""}`} onClick={toggleVideo}>
            <span className="meet-ctrl-icon">{isVideoOff ? "📷" : "📹"}</span>
            <span className="meet-ctrl-label">{isVideoOff ? "Start Cam" : "Stop Cam"}</span>
          </button>
          <button className={`meet-ctrl-btn ${isScreenSharing ? "meet-ctrl-active" : ""}`} onClick={toggleScreen}>
            <span className="meet-ctrl-icon">🖥️</span>
            <span className="meet-ctrl-label">{isScreenSharing ? "Stop Share" : "Share Screen"}</span>
          </button>
          <button className="meet-ctrl-btn meet-ctrl-leave" onClick={handleLeave}>
            <span className="meet-ctrl-icon">📵</span>
            <span className="meet-ctrl-label">Leave</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function RemoteTile({ participant }: { participant: Participant }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => { if (ref.current && participant.stream) ref.current.srcObject = participant.stream; }, [participant.stream]);
  return (
    <div className="meet-tile">
      {participant.stream
        ? <video ref={ref} autoPlay playsInline className="meet-video" />
        : <div className="meet-video-off"><div className="meet-avatar-large">{participant.name[0].toUpperCase()}</div></div>
      }
      <div className="meet-tile-footer">
        <div className="meet-name-tag"><span>{participant.name}</span></div>
        <div className="meet-tile-status"><span className="meet-status-dot meet-status-green" /></div>
      </div>
    </div>
  );
}