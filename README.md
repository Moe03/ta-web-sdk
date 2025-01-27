## Get started:

Make sure to update the package regularly to the latest version.

```bash
pnpm install @tixae-labs/web-sdk@latest
```
Or
```bash
npm install @tixae-labs/web-sdk@latest
```

---

First of all please navigate to the [TIXAE Dashboard](https://tixaeagents.ai/login) and create an agent, then you can use the agent id and region to start a voice call.

We need to know 2 parameters to start a voice call from the URL of the agent you have navigated to:

1. `agentId` - The agent id is a unique identifier for the agent you want to call.
2. `region` - The region is the region of the agent you want to call.

![agent-id](./assets/thing.png)

For example this URL:

```
https://www.tixaeagents.ai/app/eu/agents/enit5lczmqbz1s7d/overview?showDebugger=true&thin=true
```

The `agentId` is `enit5lczmqbz1s7d` and the `region` is `eu`.

---

Example usage with NextJS 13+ (App Router + TypeScript)

```tsx
"use client";
import React from "react";
import { WebCall } from "@tixae-labs/web-sdk";

const page = () => {
  const [voiceState, setVoiceState] = React.useState<WebCall | null>(null);

  async function initVoice() {
    const voice = new WebCall();

    console.log(`starting voice call..`);

    await voice.init({
      agentId: "", // MUST BE A VALID AGENT ID from the URL of the agent you have navigated to
      region: "", // MUST BE A VALID REGION 'eu' or 'na'
    });

    voice.on("call-start", () => {
      console.log(`call has started..`);
    });

    voice.on("final_transcript", (data) => {
      console.log(`data`, data);
    });

    voice.on("conversation-update", (data) => {
      console.log(`conversation-update`, data);
    });

    voice.on("call-ended", () => {
      console.log(`call-ended`);
    });

    voice.on("error", (data) => {
      console.log(`error`, data);
    });

    setVoiceState(voice);
  }

  React.useEffect(() => {
    initVoice();
  }, []);

  return (
    <div className="min-h-screen flex justify-center items-center">
      <button
        onClick={() => {
          voiceState?.startCall();
        }}
      >
        Start
      </button>
      <button
        onClick={() => {
          voiceState?.endCall();
        }}
      >
        Stop
      </button>
    </div>
  );
};

export default page;
```

If you want to append messages to the conversation, you can do so by passing the `options` parameter to the `init` method.

```tsx
await voice.init({
  agentId: "LPTp73I6VFsI0jFVFAPr",
  region: "eu",
  options: {
    messagesHistory: [
      {
        role: "assistant",
        content: "Hi there, how can I help you today?",
      },
      {
        role: "user",
        content: "I'm good my name is Moe btw.",
      },
    ],
  },
});
```

Notes:
- This packages uses WebRTC to make the voice call, any browser that doesn't support that might not be compatible with this package.
- If you have a bug report please open an issue on the [GitHub repository](https://github.com/Moe03/ta-web-sdk/issues).
  
---

```
MIT License

Copyright (c) 2025 Moe Ayman - TIXAE LLC

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```