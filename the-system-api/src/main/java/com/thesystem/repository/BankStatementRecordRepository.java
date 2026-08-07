package com.thesystem.repository;

import com.thesystem.entity.BankStatementRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BankStatementRecordRepository extends JpaRepository<BankStatementRecord, Long> {
    List<BankStatementRecord> findByPlayerIdOrderByUploadDateDesc(Long playerId);
}
