package com.thesystem.repository;

import com.thesystem.entity.ShopItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShopItemRepository extends JpaRepository<ShopItem, Long> {
    List<ShopItem> findByPlayerIdOrderByCreatedAtDesc(Long playerId);
}
