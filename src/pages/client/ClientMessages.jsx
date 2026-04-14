import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { MessageSquare, Send, Loader2, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function ClientMessages() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      setUser(me);
      const msgs = await base44.entities.Message.filter({ contact_email: me.email }, "-created_date", 50);
      setMessages(msgs.reverse());
      setLoading(false);
    };
    load();
  }, []);

  const envoyer = async () => {
    if (!input.trim() || !user) return;
    setSending(true);
    const msg = await base44.entities.Message.create({
      canal: "note_interne",
      direction: "entrant",
      contenu: input.trim(),
      contact_email: user.email,
      contact_nom: user.full_name || user.email,
      auteur_email: user.email,
      auteur_nom: user.full_name || user.email,
    });
    setMessages(prev => [...prev, msg]);
    setInput("");
    setSending(false);
  };

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-sm text-muted-foreground mt-1">Échangez avec votre agence</p>
      </div>

      <div className="bg-white rounded-2xl border border-border/50 flex flex-col" style={{ minHeight: "500px" }}>
        {/* Messages */}
        <div className="flex-1 p-5 space-y-4 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Aucun message — écrivez à votre agence</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.auteur_email === user?.email && msg.direction === "entrant";
              return (
                <div key={msg.id} className={`flex gap-3 ${isMe ? "justify-end" : "justify-start"}`}>
                  {!isMe && (
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${isMe ? "bg-primary text-white" : "bg-secondary/40 text-foreground"}`}>
                    {msg.contenu}
                    <p className={`text-[11px] mt-1 ${isMe ? "text-white/60" : "text-muted-foreground"}`}>
                      {new Date(msg.created_date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border/50 p-4 flex gap-3">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), envoyer())}
            placeholder="Écrivez votre message..."
            className="flex-1 resize-none min-h-[60px] rounded-xl text-sm"
          />
          <Button className="rounded-xl h-auto px-4" onClick={envoyer} disabled={sending || !input.trim()}>
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}