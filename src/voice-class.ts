/**
 * WebVoice.ts
 *
 * Example usage:
 *
 * import WebVoice from './WebVoice';
 *
 * const voice = new WebVoice();
 *
 * // Register your event handlers
 * voice.on('call-start', () => console.log('Call started'));
 * voice.on('call-end', () => console.log('Call ended'));
 * voice.on('message', (msg) => console.log('Message:', msg));
 * voice.on('volume-level', (vol) => console.log('Volume:', vol));
 * voice.on('error', (err) => console.error('Error:', err));
 *
 * // Initialize with your agent ID
 * voice.init('YOUR_AGENT_ID');
 *
 * // Start a WebRTC call with server-provided info:
 * await voice.startCall({
 *   callServiceUrl: 'wss://YOUR_WEBSOCKET_SERVER/webrtc-call',
 *   agentData: { ID: 'MyAgent123', ... },
 *   region: 'us-east-1', // or whichever region
 *   convoId: 'abc123',
 * });
 *
 * // Optionally mute/unmute local audio:
 * voice.toggleMute();
 *
 * // End the call when done:
 * voice.endCall();
 */
import { z } from "zod";
import {
  AppIceServers,
  GET_CALL_SERVICE_API_URL,
  InitCallOptionsType,
  initWebRtcCallSchema,
  LLMMessage,
} from "../../../../src/app/Types/firebase";
// import {
//   generateRandomId,
//   GET_CALL_SERVICE_API_URL,
// } from "../../../../src/app/utils/functions";

import { TypedWebCall } from "./voice-only-events";

const initEvent = initWebRtcCallSchema.omit({ type: true });
// @ts-ignore
export type InitCallEvent = z.infer<typeof initEvent>;

function generateRandomId(length: number) {
  return Math.random()
    .toString(36)
    .substring(2, length + 2);
}

export default class WebCall extends TypedWebCall {
  private agentId: string | null = null;
  private region: string | null = null;
  private convoId: string | null = null;
  private sessionId: string | null = null;
  private options: InitCallOptionsType = {};

  private mediaStream: MediaStream | null = null; // Local (microphone) stream
  private remoteStream: MediaStream | null = null; // Remote (assistant) stream
  private audioElement: HTMLAudioElement | null = null; // Hidden audio element for remote playback

  private peerConnection: RTCPeerConnection | null = null;
  private webSocket: WebSocket | null = null;

  // To keep track of whether local mic is muted
  private isMuted: boolean = false;

  // For volume-level detection
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private volumeAnimationFrame: number | null = null;

  /**
   * Initialize the API with the given agent ID.
   * @param agentId - Your unique agent ID (or any string)
   */
  public async init(input: InitCallEvent): Promise<{
    agentId: string | null;
    region: string | null;
    convoId: string | null;
    sessionId: string | null;
    options: InitCallOptionsType;
  }> {
    this.agentId = input.agentId || null;
    this.region = input.region || null;
    this.convoId = input.convoId || generateRandomId(15);
    this.sessionId = input.sessionId || generateRandomId(15);
    this.options = input.options || {};
    if (!this.agentId || !this.region) {
      throw new Error("Agent ID and region are required");
    }
    return {
      agentId: this.agentId,
      region: this.region,
      convoId: this.convoId,
      sessionId: this.sessionId,
      options: this.options,
    };
  }

  /**
   * Start the WebRTC call flow:
   * 1) Open a WebSocket to your signaling server
   * 2) Create a RTCPeerConnection
   * 3) Get local microphone and attach it
   * 4) Handle remote track (attach to hidden <audio>)
   * 5) Exchange offers/answers/candidates
   * 6) Trigger events as needed
   */
  public async startCall(): Promise<void> {
    try {
      // ---------------------------------------------------
      // 1) CREATE WEBSOCKET
      // ---------------------------------------------------
      //  setCallStatus("connecting");
      const webscokerUrl = `${
        window.location.protocol === "https:" ? "wss" : "wss"
      }://${GET_CALL_SERVICE_API_URL({
        forceLive: true,
        region: "eu",
        withHttp: true,
      })}/webrtc-call`;
      const ws = new WebSocket(webscokerUrl);
      this.webSocket = ws;

      console.log(`[TA_DEBUGGER] Connecting_to_${webscokerUrl}`);

      // Wait for WS to open before continuing
      await new Promise<void>((resolve, reject) => {
        if (!this.webSocket) return reject("WebSocket is null");
        this.webSocket.onopen = () => resolve();
        this.webSocket.onerror = (err) => reject(err);
      });

      // ---------------------------------------------------
      // 2) CREATE RTCPeerConnection
      // ---------------------------------------------------
      this.peerConnection = new RTCPeerConnection({
        iceServers: [
          // Provide your STUN/TURN servers
          // Example:
          ...AppIceServers,
          // { urls: 'turn:yourturnserver.com:3478', username: '...', credential: '...' }
        ],
      });

      // Prepare a remote stream
      this.remoteStream = new MediaStream();

      // 3) Create the hidden <audio> element for remote playback
      this.audioElement = document.createElement("audio");
      this.audioElement.style.display = "none";
      this.audioElement.autoplay = true;
      // @ts-ignore
      this.audioElement.playsInline = true;
      document.body.appendChild(this.audioElement);
      this.audioElement.srcObject = this.remoteStream;

      // ---------------------------------------------------
      // 3) HANDLE WEBSOCKET MESSAGES
      // ---------------------------------------------------
      this.webSocket.onmessage = async (event) => {
        if (!this.peerConnection) return;
        const data = JSON.parse(event.data);

        // Some typical fields that come from your signaling server
        const { type, offer, answer, candidate, payload } = data;

        // For debugging or logging
        // console.log('Received WS message:', data);
        switch (type) {
          case "answer": {
            // Accept the remote answer
            await this.peerConnection.setRemoteDescription(
              new RTCSessionDescription(answer)
            );
            break;
          }
          case "offer": {
            // We got an offer from the server => set remote => create answer => send back
            await this.peerConnection.setRemoteDescription(
              new RTCSessionDescription(offer)
            );
            const localAnswer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(localAnswer);
            this.webSocket?.send(
              JSON.stringify({ type: "answer", answer: localAnswer })
            );
            break;
          }
          case "candidate": {
            // Add ICE candidate
            await this.peerConnection.addIceCandidate(candidate);
            break;
          }

          // Additional message types from your server
          //  case 'sync_chat_history':
          case "conversation-update": {
            this.emit("conversation-update", payload);
            break;
          }
          case "transcript":
          case "final_transcript":
          case "on_audio_chunk":
          case "text_speak_chunk":
          case "chunk":
          case "on_tool_start": {
            // Relay everything else as a "message" event
            this.emit("final_transcript", payload);
            break;
          }
          default:
            // Fallback or debug
            this.emit("error", data);
            break;
        }
      };

      // ---------------------------------------------------
      // 4) HANDLE RTCPeerConnection EVENTS
      // ---------------------------------------------------
      this.peerConnection.onicecandidate = (e) => {
        if (e.candidate) {
          this.webSocket?.send(
            JSON.stringify({ type: "candidate", candidate: e.candidate })
          );
        }
      };

      this.peerConnection.ontrack = (e) => {
        // Streams from the remote side
        if (!this.remoteStream) return;
        // Add each track
        this.remoteStream.addTrack(e.track);
      };

      // If you want to monitor the connection states:
      this.peerConnection.onconnectionstatechange = () => {
        if (!this.peerConnection) return;
        // console.log('Connection State:', this.peerConnection.connectionState);
        if (this.peerConnection.connectionState === "connected") {
          // Once connected, inform the server to start the agent
          this.webSocket?.send(
            JSON.stringify({
              type: "init",
              agentId: this.agentId,
              region: this.region,
              convoId: this.convoId,
              sessionId: this.sessionId,
              options: this.options,
            })
          );
        } else if (
          this.peerConnection.connectionState === "disconnected" ||
          this.peerConnection.connectionState === "failed" ||
          this.peerConnection.connectionState === "closed"
        ) {
          // End the call
          this.endCall();
        }
      };

      // ---------------------------------------------------
      // 5) GET LOCAL MIC ACCESS & CREATE OFFER
      // ---------------------------------------------------
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      // Add local tracks to the peer
      this.mediaStream.getTracks().forEach((track) => {
        this.peerConnection?.addTrack(track, this.mediaStream!);
      });

      // Create an offer and send to server
      const localOffer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(localOffer);
      this.webSocket.send(JSON.stringify({ type: "offer", offer: localOffer }));

      // ---------------------------------------------------
      // 6) VOLUME DETECTION (optional)
      // ---------------------------------------------------
      // Trigger 'call-start'
      this.emit("call-start");

      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      const source = this.audioContext.createMediaStreamSource(
        this.mediaStream
      );
      source.connect(this.analyser);
      this.analyser.fftSize = 1024;

      // const trackVolume = () => {
      //   if (!this.analyser) return;
      //   this.analyser.getByteTimeDomainData(dataArray);
      //   let sum = 0;
      //   for (let i = 0; i < dataArray.length; i++) {
      //     sum += (dataArray[i] - 128) ** 2;
      //   }
      //   const avg = Math.sqrt(sum / dataArray.length);
      //   this.trigger('volume-level', avg);

      //   this.volumeAnimationFrame = requestAnimationFrame(trackVolume);
      // };
      // this.volumeAnimationFrame = requestAnimationFrame(trackVolume);
    } catch (err) {
      this.emit("error", err);
    }
  }

  /**
   * Toggle the local microphone tracks (mute/unmute).
   */
  public toggleMute(): void {
    if (!this.mediaStream) return;
    this.isMuted = !this.isMuted;
    this.mediaStream.getAudioTracks().forEach((track) => {
      track.enabled = !this.isMuted;
    });
  }

  /**
   * End the call:
   * 1) Close peer connection
   * 2) Close WS
   * 3) Stop local tracks
   * 4) Remove hidden <audio>
   * 5) Cancel animation frames
   */
  public endCall(): void {
    // 1) Close peer connection
    // console.log(`ending call`);
    this.emit("call-ended");
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // 2) Close WebSocket
    if (this.webSocket) {
      this.webSocket.close();
      this.webSocket = null;
    }

    // 3) Stop local tracks
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    // Stop volume detection
    if (this.volumeAnimationFrame) {
      cancelAnimationFrame(this.volumeAnimationFrame);
      this.volumeAnimationFrame = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    // 4) Remove hidden <audio>
    if (this.audioElement) {
      document.body.removeChild(this.audioElement);
      this.audioElement = null;
    }
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((track) => track.stop());
      this.remoteStream = null;
    }

    // 5) Trigger event
    this.emit("call-end");
  }
}
