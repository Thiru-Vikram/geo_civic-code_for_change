package backend.geocivic.dto;

/**
 * DTO for incoming chat requests from the React frontend.
 * The userId is optional — when provided it is used for ticket ownership
 * validation.
 */
public class ChatRequest {

    /** The plain-text message typed by the citizen. */
    private String message;

    /**
     * Optional: The logged-in citizen's user ID.
     * Passed by the frontend so the backend can verify a ticket belongs to this
     * user
     * before exposing its data to the AI.
     */
    private Long userId;

    public ChatRequest() {
    }

    public ChatRequest(String message, Long userId) {
        this.message = message;
        this.userId = userId;
    }

    // ── Getters & Setters ──────────────────────────────────────────────────

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
}
