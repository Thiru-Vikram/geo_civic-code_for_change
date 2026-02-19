package backend.geocivic.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String location;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private String status = "Open";

    private String imagePath;
    private Double latitude;
    private Double longitude;

    private String assignedAgentName;
    private Long assignedStaffId;
    private String proofImagePath;
    private Double resolvedLatitude;
    private Double resolvedLongitude;
    private String assignedAgentPhoto;
    private LocalDateTime expectedResolutionTime;
    private Boolean isVerified = false;

    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({ "password", "reports" })
    private User user;

    @OneToMany(mappedBy = "report", cascade = CascadeType.ALL)
    @JsonIgnoreProperties("report")
    private java.util.List<ReportUpdate> updates;

    private Integer upvoteCount = 0;

    public Report() {
    }

    public Report(String title, String location, String description, String category, User user) {
        this.title = title;
        this.location = location;
        this.description = description;
        this.category = category;
        this.user = user;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getImagePath() {
        return imagePath;
    }

    public void setImagePath(String imagePath) {
        this.imagePath = imagePath;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public String getAssignedAgentName() {
        return assignedAgentName;
    }

    public void setAssignedAgentName(String assignedAgentName) {
        this.assignedAgentName = assignedAgentName;
    }

    public String getAssignedAgentPhoto() {
        return assignedAgentPhoto;
    }

    public Long getAssignedStaffId() {
        return assignedStaffId;
    }

    public void setAssignedStaffId(Long assignedStaffId) {
        this.assignedStaffId = assignedStaffId;
    }

    public String getProofImagePath() {
        return proofImagePath;
    }

    public void setProofImagePath(String proofImagePath) {
        this.proofImagePath = proofImagePath;
    }

    public Double getResolvedLatitude() {
        return resolvedLatitude;
    }

    public void setResolvedLatitude(Double resolvedLatitude) {
        this.resolvedLatitude = resolvedLatitude;
    }

    public Double getResolvedLongitude() {
        return resolvedLongitude;
    }

    public void setResolvedLongitude(Double resolvedLongitude) {
        this.resolvedLongitude = resolvedLongitude;
    }

    public void setAssignedAgentPhoto(String assignedAgentPhoto) {
        this.assignedAgentPhoto = assignedAgentPhoto;
    }

    public LocalDateTime getExpectedResolutionTime() {
        return expectedResolutionTime;
    }

    public void setExpectedResolutionTime(LocalDateTime expectedResolutionTime) {
        this.expectedResolutionTime = expectedResolutionTime;
    }

    public Boolean getIsVerified() {
        return isVerified;
    }

    public void setIsVerified(Boolean isVerified) {
        this.isVerified = isVerified;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public java.util.List<ReportUpdate> getUpdates() {
        return updates;
    }

    public void setUpdates(java.util.List<ReportUpdate> updates) {
        this.updates = updates;
    }

    public Integer getUpvoteCount() {
        return upvoteCount;
    }

    public void setUpvoteCount(Integer upvoteCount) {
        this.upvoteCount = upvoteCount;
    }
}
