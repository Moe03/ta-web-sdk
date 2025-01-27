import TypedEmitter from "typed-emitter";
import EventEmitter from "events";
import type {
  AppTranscriptPayload,
  OnConversationUpdated,
} from "../../../../src/app/Types/firebase";

// -----------------------------------------------------------
// 1. EVENT TYPE DEFINITIONS
// -----------------------------------------------------------
export type WebCallEventsEmitter = {
  "call-start": () => void;
  "call-end": () => void;
  "call-ended": () => void;
  error: (error: unknown) => void;
  "conversation-update": (payload: OnConversationUpdated) => void;
  final_transcript: (payload: AppTranscriptPayload) => void;
};

export class TypedWebCall extends (EventEmitter as new () => TypedEmitter<WebCallEventsEmitter>) {}
