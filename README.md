## Get started with TIXAE Agents Web Call SDK:

Make sure to update the package regularly to the latest version.

```bash
pnpm install @tixae-labs/web-sdk@latest
```
Or
```bash
npm install @tixae-labs/web-sdk@latest
```

---

Example usage with NextJS 13+ (App Router + TypeScript)

```tsx
"use client";
import React from "react";
import { Button } from "@nextui-org/react";
import { WebCall } from "@tixae-labs/web-sdk";

const page = () => {
  const [voiceState, setVoiceState] = React.useState<WebCall | null>(null);

  async function initVoice() {
    const voice = new WebCall();

    console.log(`starting voice call..`);

    await voice.init({
      agentId: "LPTp73I6VFsI0jFVFAPr",
      region: "eu",
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
      <Button
        onPress={() => {
          voiceState?.startCall();
        }}
      >
        Start
      </Button>
      <Button
        onPress={() => {
          voiceState?.endCall();
        }}
      >
        Stop
      </Button>
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