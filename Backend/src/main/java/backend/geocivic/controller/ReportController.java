package backend.geocivic.controller;

import backend.geocivic.model.*;
import backend.geocivic.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "http://localhost:5173")
public class ReportController {

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private ReportUpdateRepository reportUpdateRepository;

    @Autowired
    private ReportVoteRepository reportVoteRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    private final String UPLOAD_DIR = "./uploads/";

    @GetMapping
    public List<Report> getAllReports() {
        return reportRepository.findAll();
    }

    @GetMapping("/user/{userId}")
    public List<Report> getReportsByUser(@PathVariable Long userId) {
        return reportRepository.findByUserId(userId);
    }

    @PostMapping
    public ResponseEntity<?> createReport(
            @RequestParam("title") String title,
            @RequestParam("location") String location,
            @RequestParam("description") String description,
            @RequestParam("category") String category,
            @RequestParam("userId") Long userId,
            @RequestParam(value = "latitude", required = false) Double latitude,
            @RequestParam(value = "longitude", required = false) Double longitude,
            @RequestParam(value = "image", required = false) MultipartFile image) {

        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null)
                return ResponseEntity.badRequest().body("User not found");

            Report report = new Report(title, location, description, category, user);
            report.setLatitude(latitude);
            report.setLongitude(longitude);

            if (image != null && !image.isEmpty()) {
                // Ensure directory exists
                Path uploadPath = Paths.get(UPLOAD_DIR);
                if (!Files.exists(uploadPath)) {
                    Files.createDirectories(uploadPath);
                }

                String fileName = UUID.randomUUID().toString() + "_" + image.getOriginalFilename();
                Path filePath = uploadPath.resolve(fileName);
                Files.copy(image.getInputStream(), filePath);
                report.setImagePath("/uploads/" + fileName);
            }

            Report savedReport = reportRepository.save(report);

            // Initial notification
            notificationRepository.save(new Notification(user, "New report '" + title + "' submitted successfully!"));

            return ResponseEntity.ok(savedReport);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Error saving image: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/vote")
    public ResponseEntity<?> voteReport(@PathVariable Long id, @RequestParam Long userId) {
        return reportRepository.findById(id).map(report -> {
            boolean alreadyVoted = reportVoteRepository.findByReportIdAndUserId(id, userId).isPresent();
            if (alreadyVoted) {
                return ResponseEntity.badRequest().body("You have already voted for this report.");
            }

            User user = userRepository.findById(userId).orElse(null);
            if (user == null)
                return ResponseEntity.notFound().build();

            reportVoteRepository.save(new ReportVote(report, user));
            report.setUpvoteCount(report.getUpvoteCount() + 1);
            reportRepository.save(report);

            return ResponseEntity.ok(report);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Report> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String status = payload.get("status");
        String comment = payload.get("comment");

        return reportRepository.findById(id).map(report -> {
            report.setStatus(status);
            Report savedReport = reportRepository.save(report);

            // Log the update
            reportUpdateRepository.save(new ReportUpdate(report, status, comment));

            // Notify the user
            notificationRepository.save(new Notification(report.getUser(),
                    "Your report '" + report.getTitle() + "' status changed to " + status));

            return ResponseEntity.ok(savedReport);
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/updates")
    public List<ReportUpdate> getReportUpdates(@PathVariable Long id) {
        return reportUpdateRepository.findByReportIdOrderByCreatedAtDesc(id);
    }
}
