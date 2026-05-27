import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Bot, CornerDownLeft, Loader2, RefreshCw, Sparkles, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Streamdown } from "streamdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "最新的公告有哪些？",
  "近期有什麼活動？",
  "如何下載課程資料？",
  "系學會幹部有哪些人？",
  "如何聯繫系學會？",
  "有哪些學習資源可以下載？",
];

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const chatMutation = trpc.ai.chat.useMutation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await chatMutation.mutateAsync({
        message: text.trim(),
        history: messages.slice(-10).map(m => ({ role: m.role, content: typeof m.content === 'string' ? m.content : '' })),
      });
      const aiContent = typeof response.content === 'string' ? response.content : String(response.content ?? '');
      setMessages([...newMessages, { role: "assistant", content: aiContent }]);
    } catch (err) {
      toast.error("AI 助理暫時無法回應，請稍後再試");
      setMessages(newMessages.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setInput("");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-primary py-12">
        <div className="container">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px w-6 bg-accent" />
            <span className="text-accent text-xs font-medium uppercase tracking-wider">智慧助理</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center">
              <Bot className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white font-serif">資管小幫手</h1>
              <p className="text-white/60 text-sm">AI 問答助理 · 隨時解答你的疑問</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 container py-6 flex flex-col max-w-3xl">
        {/* Chat Area */}
        <div className="flex-1 min-h-[400px] max-h-[600px] overflow-y-auto rounded-2xl border border-border bg-card p-4 space-y-4 mb-4">
          {messages.length === 0 ? (
            <WelcomeScreen onSuggest={sendMessage} />
          ) : (
            <>
              {messages.map((msg, i) => (
                <MessageBubble key={i} message={msg} />
              ))}
              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="space-y-3">
          {messages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.slice(0, 3).map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  disabled={isLoading}
                  className="text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="輸入你的問題... (Enter 送出，Shift+Enter 換行)"
                className="resize-none min-h-[52px] max-h-[120px] pr-12 text-sm"
                rows={1}
                disabled={isLoading}
              />
              <Button
                size="sm"
                className="absolute right-2 bottom-2 w-8 h-8 p-0 bg-primary hover:bg-primary/90"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CornerDownLeft className="w-3.5 h-3.5" />
                )}
              </Button>
            </div>
            {messages.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-[52px] px-3 gap-1.5 text-xs"
                onClick={handleReset}
                disabled={isLoading}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                重置
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            AI 助理根據系學會公告、活動與資源資料回答問題，僅供參考
          </p>
        </div>
      </div>
    </div>
  );
}

function WelcomeScreen({ onSuggest }: { onSuggest: (q: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/8 flex items-center justify-center mb-4">
        <Sparkles className="w-8 h-8 text-primary" />
      </div>
      <h3 className="font-semibold text-lg mb-2 font-serif">你好！我是資管小幫手</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs leading-relaxed">
        我能根據系學會的最新公告、活動與資源，即時回答你的問題。
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => onSuggest(q)}
            className="text-left text-sm px-4 py-2.5 rounded-xl border border-border bg-muted/40 hover:border-primary/40 hover:bg-primary/5 transition-colors text-muted-foreground hover:text-foreground"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
          isUser ? "bg-primary text-primary-foreground" : "bg-accent/20 text-accent"
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted text-foreground rounded-tl-sm"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:font-serif prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-code:text-primary prose-pre:bg-background">
            <Streamdown>{message.content}</Streamdown>
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
        <Bot className="w-4 h-4 text-accent" />
      </div>
      <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
