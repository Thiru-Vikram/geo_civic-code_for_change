package backend.geocivic.dto;

/**
 * DTO for responses returned to the React chat UI.
 * Keeping this as a dedicated class makes it easy to add
 * metadata (timestamp, sessionId, language) later.
 */
public class ChatResponse {

    /** The AI-generated text the citizen will see in the chat bubble. */
    private String reply;

    public ChatResponse() {
    }

    public ChatResponse(String reply) {
        this.reply = reply;
    }

    // ── Getter & Setter ────────────────────────────────────────────────────

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }
}
