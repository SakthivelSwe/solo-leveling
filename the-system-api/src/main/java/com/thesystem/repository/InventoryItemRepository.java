package com.thesystem.repository;

import com.thesystem.entity.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {
    List<InventoryItem> findByPlayerId(Long playerId);
    List<InventoryItem> findByPlayerIdAndEquippedTrue(Long playerId);
    Optional<InventoryItem> findByPlayerIdAndItemKey(Long playerId, String itemKey);
    boolean existsByPlayerIdAndItemKey(Long playerId, String itemKey);
}
