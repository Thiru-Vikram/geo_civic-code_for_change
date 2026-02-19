package backend.geocivic.repository;

import backend.geocivic.model.ReportUpdate;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReportUpdateRepository extends JpaRepository<ReportUpdate, Long> {
    List<ReportUpdate> findByReportIdOrderByCreatedAtDesc(Long reportId);
}
