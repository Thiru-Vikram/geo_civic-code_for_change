package backend.geocivic.controller;

import backend.geocivic.model.User;
import backend.geocivic.model.Notification;
import backend.geocivic.repository.UserRepository;
import backend.geocivic.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:5174" })
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    // Get all staff users (for admin dropdown)
    @GetMapping("/staff")
    public List<User> getStaffUsers() {
        return userRepository.findByRole("STAFF");
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserProfile(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/notifications")
    public List<Notification> getNotifications(@PathVariable Long id) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(id);
    }

    @PutMapping("/notifications/{id}/read")
    public ResponseEntity<?> markNotificationRead(@PathVariable Long id) {
        return notificationRepository.findById(id).map(notif -> {
            notif.setIsRead(true);
            notificationRepository.save(notif);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUserProfile(@PathVariable Long id, @RequestBody User userDetails) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setFullName(userDetails.getFullName());
                    user.setPhoneNumber(userDetails.getPhoneNumber());
                    user.setArea(userDetails.getArea());
                    user.setAvatarUrl(userDetails.getAvatarUrl());
                    userRepository.save(user);
                    return ResponseEntity.ok(user);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
