package com.thesystem.repository;

import com.thesystem.entity.FinancialAsset;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FinancialAssetRepository extends JpaRepository<FinancialAsset, Long> {
    List<FinancialAsset> findByPlayerId(Long playerId);
}
