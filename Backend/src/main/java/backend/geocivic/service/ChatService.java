package backend.geocivic.service;

import backend.geocivic.dto.ChatRequest;
import backend.geocivic.model.Report;
import backend.geocivic.repository.ReportRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * ChatService — orchestrates the full chatbot flow.
 *
 * Responsibilities:
 * 1. Detect whether the citizen is asking about a specific ticket.
 * 2. If yes → fetch the ticket from MySQL via ReportRepository,
 * validate ownership, and build a structured context block.
 * 3. Build a system prompt that explains the GeoCivic workflow.
 * 4. Combine system prompt + (optional context) + user message.
 * 5. Delegate the final API call to AiClient.
 *
 * The database is NEVER exposed to the AI directly.
 * Only a curated, plain-text context block is passed.
 */
@Service
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);

    // Matches patterns like: #12, ticket 12, complaint 12, report 12, id 12
    private static final Pattern TICKET_ID_PATTERN = Pattern.compile(
            "(?:#|ticket\\s*|complaint\\s*|report\\s*|id\\s*)(\\d+)",
            Pattern.CASE_INSENSITIVE);

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

    private final ReportRepository reportRepository;
    private final AiClient aiClient;

    public ChatService(ReportRepository reportRepository, AiClient aiClient) {
        this.reportRepository = reportRepository;
        this.aiClient = aiClient;
    }

    /**
     * /**
     * Main entry point called by ChatController.
     * Tries AI first; falls back to rule-based engine if AI is unavailable.
     */
    public String processMessage(ChatRequest chatRequest) {

        String userMessage = chatRequest.getMessage();
        Long userId = chatRequest.getUserId();

        log.info("ChatService: processing message for userId={}, message='{}'", userId, userMessage);

        // ── Step 1: Detect ticket ID in message ───────────────────────────────
        Long ticketId = extractTicketId(userMessage);

        // ── Step 2: If ticket mentioned, validate ownership and fetch context ──
        if (ticketId != null) {
            String ticketContext = buildTicketContext(ticketId, userId);
            if (ticketContext == null) {
                return "I'm sorry, I couldn't find that ticket or it doesn't belong to your account. " +
                        "Please check the ticket number and try again.";
            }
            // Try AI first, fall back to formatted ticket reply
            List<Map<String, String>> messages = buildMessages(userMessage, ticketContext);
            String aiReply = tryAi(messages);
            if (aiReply != null)
                return aiReply;
            return buildFormattedTicketReply(ticketId, userId);
        }

        // ── Step 3: Try AI for general questions ──────────────────────────────
        List<Map<String, String>> messages = buildMessages(userMessage, null);
        String aiReply = tryAi(messages);
        if (aiReply != null)
            return aiReply;

        // ── Step 4: Rule-based fallback ───────────────────────────────────────
        return ruleBasedReply(userMessage);
    }

    /**
     * Wraps the AI call — returns null instead of throwing so callers can fall back
     * gracefully.
     */
    private String tryAi(List<Map<String, String>> messages) {
        try {
            String reply = aiClient.chat(messages);
            // Treat known fallback strings as failures so rule-based kicks in
            if (reply == null ||
                    reply.contains("temporarily unavailable") ||
                    reply.contains("trouble connecting")) {
                return null;
            }
            return reply;
        } catch (Exception e) {
            log.warn("ChatService: AI call failed, using rule-based fallback. Reason: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Rule-based reply engine — covers the most common citizen queries.
     * Keyword matching is case-insensitive. Add more rules here as needed.
     */
    private String ruleBasedReply(String message) {
        String m = message.toLowerCase();

        // ── Greetings ─────────────────────────────────────────────────────────
        if (m.matches(".*(\\bhi\\b|\\bhello\\b|\\bhey\\b|\\bhola\\b|\\bvanakam\\b).*")) {
            return "Hello! 👋 I'm **GeoBot**, your GeoCivic assistant.\n\n" +
                    "I can help you with:\n" +
                    "• Checking your complaint/ticket status\n" +
                    "• Understanding how GeoCivic works\n" +
                    "• Civic Coins & Rewards\n" +
                    "• Reporting an issue\n\n" +
                    "Just ask me anything, or say **\"ticket #12\"** to check a specific complaint!";
        }

        // ── How to use the platform / general overview ────────────────────────
        if (m.contains("how to use") || m.contains("how does this work") ||
                m.contains("how does geocivic work") || m.contains("what is geocivic") ||
                m.contains("explain this") || m.contains("guide me") ||
                m.contains("get started") || m.contains("how to start") ||
                m.contains("what can i do") || m.contains("how to use this") ||
                m.contains("explain") || m.contains("how it works") ||
                m.contains("how this works") || m.contains("how does it work") ||
                m.contains("tell me about") || m.contains("overview") ||
                m.contains("about this") || m.contains("about geocivic") ||
                m.contains("what does this") || m.contains("what does geocivic") ||
                m.contains("how the website") || m.contains("how the app") ||
                m.contains("how the platform") || m.contains("generally") ||
                m.contains("in simple") || m.contains("brief") ||
                m.contains("steps") || m.contains("workflow") ||
                m.contains("process") || m.contains("how does the website") ||
                m.equals("explain") || m.equals("overview") || m.equals("guide")) {
            return "🏙️ **Here's how GeoCivic works — in simple steps:**\n\n" +
                    "**Step 1 — You report the problem** 📸\n" +
                    "Take a photo of the issue (pothole, broken light, garbage, etc.) and submit it via **Add Report**. Your location is saved automatically.\n\n"
                    +
                    "**Step 2 — Admin reviews & assigns** 👨‍💼\n" +
                    "An admin looks at your report and assigns it to the right staff member to handle it.\n\n" +
                    "**Step 3 — Staff fixes it & uploads proof** 🔧\n" +
                    "The staff member works on the issue and uploads a photo as proof that it's been resolved.\n\n" +
                    "**Step 4 — You go there & verify** 📍\n" +
                    "Once it's marked resolved, you visit the actual location. The app checks if you're physically nearby (**geofencing**). Only then can you click **Verify** to confirm the fix.\n\n"
                    +
                    "**Step 5 — Earn Civic Coins** 🪙\n" +
                    "You earn coins for reporting and verifying. Collect them for rewards!\n\n" +
                    "Ask me *\"how to report\"*, *\"check ticket status\"*, or *\"what are civic coins\"* to learn more!";
        }

        // ── How to file / submit a report ─────────────────────────────────────
        if (m.matches(".*(file|submit|raise|create|report|add).*(complaint|report|issue|problem|ticket).*") ||
                m.contains("how to report") || m.contains("how do i report")) {
            return "📝 **How to File a Complaint on GeoCivic:**\n\n" +
                    "1. Go to **Add Report** from the sidebar.\n" +
                    "2. Enter a title and choose the **category** (Pothole, Garbage, etc.).\n" +
                    "3. Upload a **geo-tagged photo** of the issue.\n" +
                    "4. Your GPS location is captured automatically.\n" +
                    "5. Submit — your complaint is instantly logged!\n\n" +
                    "You can track it anytime from **My Reports**.";
        }

        // ── Ticket / complaint status ─────────────────────────────────────────
        if (m.matches(".*(status|update|progress|check).*(ticket|complaint|report|issue).*") ||
                m.matches(".*(ticket|complaint|report|issue).*(status|update|progress).*")) {
            return "🔍 **To check your complaint status**, say something like:\n\n" +
                    "  **\"What is the status of ticket #12?\"**\n\n" +
                    "Here's what each status means:\n" +
                    "🔴 **Open** — Received, waiting for assignment.\n" +
                    "🟠 **In Progress** — Authorities are working on it.\n" +
                    "🟠 **Pending Verification** — Repair done! Please verify physically using geofencing.\n" +
                    "🟢 **Resolved** — Verified and closed. Thank you!";
        }

        // ── Geofencing ────────────────────────────────────────────────────────
        if (m.contains("geofenc") || m.contains("geo fence") ||
                m.contains("physical verif") || m.contains("verify location") ||
                m.contains("how to verify") || m.contains("verify repair")) {
            return "📍 **How Geofencing Verification Works:**\n\n" +
                    "When authorities complete a repair, your ticket moves to **🟠 Pending Verification**.\n\n" +
                    "To close it:\n" +
                    "1. Physically visit the repaired location.\n" +
                    "2. Open the GeoCivic app at that spot.\n" +
                    "3. Tap **Verify Repair** — the app checks your GPS against the complaint location.\n" +
                    "4. Once confirmed, the ticket turns **🟢 Resolved** and you earn Civic Coins!\n\n" +
                    "This ensures repairs are actually done before tickets close. 🏙️";
        }

        // ── Civic Coins ───────────────────────────────────────────────────────
        if (m.contains("civic coin") || m.contains("coins") || m.contains("earn") ||
                m.contains("reward") || m.contains("points") || m.contains("redeem")) {
            return "🪙 **Civic Coins — Your Reward for Being a Good Citizen!**\n\n" +
                    "You earn Civic Coins by:\n" +
                    "• ✅ **Filing a complaint** — coins on submission\n" +
                    "• 👍 **Getting upvotes** on your report\n" +
                    "• 🔍 **Verifying a repair** using geofencing\n\n" +
                    "**Redeem coins** from the **Rewards** page for:\n" +
                    "GeoCivic T-shirts, caps, water bottles, badges, and more!\n\n" +
                    "Check your coin balance in the top bar. 🎁";
        }

        // ── Status meaning: open ──────────────────────────────────────────────
        if (m.contains("red status") || m.contains("open status") || m.contains("what is open")) {
            return "🔴 **Open Status** means your complaint has been successfully received by the system but has not yet been assigned to a staff member or authority.\n\nNo action is needed from you right now — you'll be notified once it's assigned.";
        }

        // ── Status meaning: in progress ───────────────────────────────────────
        if (m.contains("orange status") || m.contains("in progress") || m.contains("progress status")) {
            return "🟠 **In Progress / Pending Verification:**\n\n" +
                    "• **In Progress** — Authorities are actively working on your complaint.\n" +
                    "• **Pending Verification** — Work is complete! Please visit the location and verify using geofencing to close the ticket and earn Civic Coins.";
        }

        // ── Status meaning: resolved ──────────────────────────────────────────
        if (m.contains("green status") || m.contains("resolved") || m.contains("closed status")) {
            return "🟢 **Resolved** means your complaint has been fully addressed and you have physically verified the repair using geofencing.\n\nThank you for helping improve your community! 🏙️";
        }

        // ── Upvote ────────────────────────────────────────────────────────────
        if (m.contains("upvote") || m.contains("vote") || m.contains("support report")) {
            return "👍 **Upvoting a Report:**\n\nYou can upvote any public complaint to show it's a shared issue in your community. More upvotes = higher priority for authorities.\n\nYou also earn Civic Coins when your report gets upvoted!";
        }

        // ── Assigned agent ────────────────────────────────────────────────────
        if (m.contains("agent") || m.contains("staff") || m.contains("assigned") || m.contains("who is handling")) {
            return "👷 **Assigned Agent:**\n\nOnce your complaint is reviewed, it gets assigned to a staff member or authority agent.\nYou can see the assigned agent's name in your **Report Details** page.\n\nNot yet assigned? Your report is still **🔴 Open** — it will be picked up soon!";
        }

        // ── Notifications ─────────────────────────────────────────────────────
        if (m.contains("notification") || m.contains("alert") || m.contains("update me")) {
            return "🔔 **Notifications:**\n\nGeoCivic sends you notifications when:\n" +
                    "• Your complaint is assigned to an agent\n" +
                    "• The status changes (In Progress, Pending Verification, Resolved)\n" +
                    "• Your report gets upvoted\n\n" +
                    "Check the 🔔 bell icon in the top bar for all your notifications.";
        }

        // ── Help / what can you do ────────────────────────────────────────────
        if (m.contains("help") || m.contains("what can you") || m.contains("what do you") || m.equals("?")) {
            return "🤖 **I'm GeoBot! Here's what I can help with:**\n\n" +
                    "• **Ticket status** — say \"ticket #12\" to check any complaint\n" +
                    "• **How to file a complaint**\n" +
                    "• **Understanding statuses** (Open, In Progress, etc.)\n" +
                    "• **Geofencing verification** process\n" +
                    "• **Civic Coins & Rewards**\n" +
                    "• **Upvotes, agents, notifications**\n\n" +
                    "Just type your question naturally! 💬";
        }

        // ── Thank you ─────────────────────────────────────────────────────────
        if (m.matches(".*(thank|thanks|thx|ty|great|awesome|perfect|nice).*")) {
            return "You're welcome! 😊 Happy to help. If you have any more questions about your complaints or GeoCivic, feel free to ask anytime!";
        }

        // ── Default fallback ──────────────────────────────────────────────────
        return "I'm not sure I understood that. Here are some things I can help with:\n\n" +
                "• Type **\"ticket #ID\"** to check a complaint status\n" +
                "• Ask about **Civic Coins**, **geofencing**, or **how to file a report**\n" +
                "• Type **\"help\"** to see everything I can do!\n\n" +
                "I'm still learning, so try rephrasing if needed. 🤖";
    }

    /**
     * Builds a clean, formatted reply for ticket queries when AI is unavailable.
     * Fetches fresh data from DB so the response is always accurate.
     */
    private String buildFormattedTicketReply(Long ticketId, Long userId) {
        Optional<Report> optional = reportRepository.findById(ticketId);
        if (optional.isEmpty()) {
            return "I couldn't find ticket #" + ticketId + ". Please double-check the ticket number.";
        }
        Report r = optional.get();

        // Ownership check
        if (userId != null && r.getUser() != null && !r.getUser().getId().equals(userId)) {
            return "I'm sorry, ticket #" + ticketId + " doesn't belong to your account.";
        }

        String status = mapStatusToLabel(r.getStatus());
        String agent = r.getAssignedAgentName() != null ? r.getAssignedAgentName() : "Not yet assigned";
        String proof = r.getProofImagePath() != null ? "✅ Uploaded" : "⏳ Not yet uploaded";
        String verified = Boolean.TRUE.equals(r.getIsVerified()) ? "✅ Verified"
                : "⏳ Pending your physical verification";
        String submitted = r.getCreatedAt() != null ? r.getCreatedAt().format(DATE_FMT) : "Unknown";

        return "📋 **Ticket #" + r.getId() + " — " + safe(r.getTitle()) + "**\n\n" +
                "**Category:** " + safe(r.getCategory()) + "\n" +
                "**Location:** " + safe(r.getLocation()) + "\n" +
                "**Status:** " + status + "\n" +
                "**Assigned Agent:** " + agent + "\n" +
                "**Repair Proof:** " + proof + "\n" +
                "**Citizen Verified:** " + verified + "\n" +
                "**Submitted:** " + submitted + "\n\n" +
                nextStepHint(r.getStatus(), r.getIsVerified());
    }

    /** Returns a helpful next-step hint based on current status. */
    private String nextStepHint(String status, Boolean isVerified) {
        if (status == null)
            return "";
        return switch (status.trim()) {
            case "Open", "Pending" -> "💡 **Next step:** Wait for an authority to be assigned. You'll be notified!";
            case "Progress", "In Progress" -> "💡 **Next step:** Authorities are working on it. Hang tight!";
            case "PendingVerification" ->
                "💡 **Next step:** Visit the location and use the app to verify the repair using geofencing to close this ticket and earn Civic Coins!";
            case "Resolved" -> "🎉 This ticket is fully resolved. Thank you for helping improve your community!";
            default -> "";
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Extracts the first ticket/report ID found in the message.
     * Returns null if no ID is mentioned.
     */
    private Long extractTicketId(String message) {
        if (message == null || message.isBlank())
            return null;
        Matcher m = TICKET_ID_PATTERN.matcher(message);
        if (m.find()) {
            try {
                return Long.parseLong(m.group(1));
            } catch (NumberFormatException e) {
                log.warn("ChatService: found ticket pattern but couldn't parse ID");
            }
        }
        return null;
    }

    /**
     * Fetches the report from MySQL and builds a plain-text context block.
     *
     * Security rules enforced here:
     * – If the report doesn't exist, return null (caller sends a refusal message).
     * – If userId is provided and doesn't match the report owner, return null.
     * – Null fields are replaced with "Not available" so the AI never sees nulls.
     */
    private String buildTicketContext(Long ticketId, Long requestingUserId) {

        Optional<Report> optional = reportRepository.findById(ticketId);

        if (optional.isEmpty()) {
            log.warn("ChatService: ticket #{} not found in database", ticketId);
            return null; // triggers refusal message in caller
        }

        Report report = optional.get();

        // Ownership validation — only skip if userId wasn't provided
        if (requestingUserId != null &&
                report.getUser() != null &&
                !report.getUser().getId().equals(requestingUserId)) {

            log.warn("ChatService: userId={} attempted to access ticket #{} owned by userId={}",
                    requestingUserId, ticketId, report.getUser().getId());
            return null; // triggers refusal message in caller
        }

        // ── Map status to human-readable colour ───────────────────────────────
        String statusLabel = mapStatusToLabel(report.getStatus());

        // ── Build safe, structured context — no raw Java objects passed to AI ─
        StringBuilder ctx = new StringBuilder();
        ctx.append("=== TICKET CONTEXT (from MySQL — do NOT make up additional details) ===\n");
        ctx.append("Ticket ID        : ").append(safe(report.getId())).append("\n");
        ctx.append("Title            : ").append(safe(report.getTitle())).append("\n");
        ctx.append("Category         : ").append(safe(report.getCategory())).append("\n");
        ctx.append("Description      : ").append(safe(report.getDescription())).append("\n");
        ctx.append("Location/Address : ").append(safe(report.getLocation())).append("\n");
        ctx.append("Current Status   : ").append(statusLabel).append("\n");
        ctx.append("Assigned Agent   : ").append(safe(report.getAssignedAgentName())).append("\n");
        ctx.append("Repair Proof     : ").append(report.getProofImagePath() != null ? "Uploaded" : "Not yet uploaded")
                .append("\n");
        ctx.append("Citizen Verified : ")
                .append(Boolean.TRUE.equals(report.getIsVerified()) ? "Yes" : "No — pending physical verification")
                .append("\n");
        ctx.append("Submitted On     : ")
                .append(report.getCreatedAt() != null ? report.getCreatedAt().format(DATE_FMT) : "Unknown")
                .append("\n");
        ctx.append("Expected By      : ")
                .append(report.getExpectedResolutionTime() != null ? report.getExpectedResolutionTime().format(DATE_FMT)
                        : "Not set")
                .append("\n");
        ctx.append("Upvotes          : ").append(safe(report.getUpvoteCount())).append("\n");
        ctx.append("=======================================================================\n");

        return ctx.toString();
    }

    /**
     * Maps raw DB status strings to colour-coded, human-friendly labels.
     */
    private String mapStatusToLabel(String status) {
        if (status == null)
            return "Unknown";
        return switch (status.trim()) {
            case "Open", "Pending" -> "🔴 OPEN — Your complaint has been received and is awaiting assignment.";
            case "Progress", "In Progress" -> "🟠 IN PROGRESS — Authorities are actively working on this issue.";
            case "PendingVerification" ->
                "🟠 PENDING VERIFICATION — Repair work is done. Please visit the location and verify physically using geofencing.";
            case "Resolved" -> "🟢 RESOLVED — The issue has been resolved and citizen verification is complete.";
            default -> status;
        };
    }

    /**
     * Constructs the final messages list sent to the AI.
     * Structure: [system prompt] + (optional ticket context merged into user
     * message).
     */
    private List<Map<String, String>> buildMessages(String userMessage, String ticketContext) {

        List<Map<String, String>> messages = new ArrayList<>();

        // ── System prompt — defines the AI's persona and constraints ──────────
        messages.add(Map.of(
                "role", "system",
                "content", buildSystemPrompt()));

        // ── User message — prepend ticket context only if it is genuinely present ──
        String fullUserContent = (ticketContext != null && !ticketContext.isBlank())
                ? ticketContext + "\nCitizen's question: " + userMessage
                : userMessage;

        messages.add(Map.of(
                "role", "user",
                "content", fullUserContent));

        return messages;
    }

    /**
     * The master system prompt.
     * Explains the GeoCivic workflow, the AI's role, and strict safety rules.
     * Extensible: add multilingual instruction or memory summaries here later.
     */
    private String buildSystemPrompt() {
        return """
                You are GeoBot, a helpful and friendly AI assistant for the GeoCivic platform.

                GeoCivic is a civic complaint management system where citizens report local issues
                (potholes, broken streetlights, garbage, etc.) and track their resolution.

                ========================
                YOUR RESPONSIBILITY
                ========================
                You operate in TWO MODES:

                1\uFE0F\u20E3 GENERAL ASSISTANCE MODE (Default)
                Use this when NO ticket context is provided.
                - Answer questions like:
                  \u2022 What is GeoCivic?
                  \u2022 How do I report an issue?
                  \u2022 How does verification work?
                  \u2022 Greetings or help requests
                - Guide the citizen on how to use the platform.
                - Be conversational and helpful.

                2\uFE0F\u20E3 TICKET ASSISTANCE MODE
                Use this ONLY when ticket data is provided in the prompt.
                - Explain the ticket status using ONLY the provided data.
                - Never guess or fabricate missing information.
                - Clarify what the citizen must do next.

                If ticket information is incomplete, say what is missing instead of assuming.

                ========================
                HOW GeoCivic WORKS
                ========================
                1. A citizen uploads a geo-tagged photo of a civic issue.
                2. The complaint is assigned to local authorities.
                3. Authorities repair the issue and upload proof.
                4. Status becomes \uD83D\uDFE0 PENDING VERIFICATION.
                5. Citizen must physically visit the site (geofencing validation).
                6. After verification \u2192 \uD83D\uDFE2 RESOLVED.

                ========================
                STATUS COLOUR GUIDE
                ========================
                \uD83D\uDD34 RED    \u2014 Complaint received.
                \uD83D\uDFE0 ORANGE \u2014 Work in progress OR waiting for citizen verification.
                \uD83D\uDFE2 GREEN  \u2014 Verified and closed.

                ========================
                BEHAVIOUR RULES
                ========================
                - Always try to help. Do NOT reject normal conversation.
                - If user greets you \u2192 greet back.
                - If user asks about the website \u2192 explain GeoCivic.
                - Only restrict yourself when discussing a specific ticket.
                - Never expose other citizens' data.
                - Keep replies clear, friendly, and concise.
                - Match the user's language automatically.
                """;
    }

    /**
     * Null-safe helper — converts any value to string or returns "Not available".
     */
    private String safe(Object value) {
        return value != null ? value.toString() : "Not available";
    }
}
