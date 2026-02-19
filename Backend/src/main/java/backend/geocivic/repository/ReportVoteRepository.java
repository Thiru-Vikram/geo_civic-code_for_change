package backend.geocivic.repository;

import backend.geocivic.model.ReportVote;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ReportVoteRepository extends JpaRepository<ReportVote, Long> {
    Optional<ReportVote> findByReportIdAndUserId(Long reportId, Long userId);

    Long countByReportId(Long reportId);
}
