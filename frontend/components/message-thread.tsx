"use client"

import { useState } from "react"
import { Send } from "lucide-react"
import { cn } from "@/lib/utils"

interface Msg {
  from: "Dr. Sarah Chen" | "Dr. Amir Hosseini"
  text: string
}

const SEED: Msg[] = [
  { from: "Dr. Sarah Chen", text: "Hi Dr. Hosseini, flagging this one as urgent given the exertional symptoms." },
  { from: "Dr. Amir Hosseini", text: "Thanks Sarah, received. I'll fit Margaret in this week and run a stress test." },
  { from: "Dr. Sarah Chen", text: "Appreciate it. Patient also has poorly controlled BP, around 155/90." },
]

export function MessageThread({ self }: { self: Msg["from"] }) {
  const [messages, setMessages] = useState<Msg[]>(SEED)
  const [text, setText] = useState("")

  const send = () => {
    if (!text.trim()) return
    setMessages((m) => [...m, { from: self, text: text.trim() }])
    setText("")
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Messages</h3>
      <div className="mb-3 flex flex-col gap-2">
        {messages.map((m, i) => {
          const mine = m.from === self
          return (
            <div key={i} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[75%] rounded-2xl px-3 py-2 text-sm", mine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
                <p className={cn("mb-0.5 text-xs font-medium", mine ? "text-emerald-50/80" : "text-muted-foreground")}>{m.from}</p>
                {m.text}
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type a message…"
          className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <button onClick={send} className="rounded-lg bg-primary px-3 py-2 text-primary-foreground hover:bg-emerald-600" aria-label="Send">
          <Send className="size-4" />
        </button>
      </div>
    </div>
  )
}
