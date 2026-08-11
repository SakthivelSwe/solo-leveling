package com.thesystem.service;

import com.thesystem.entity.Player;
import com.thesystem.entity.ShopItem;
import com.thesystem.exception.ApiException;
import com.thesystem.repository.PlayerRepository;
import com.thesystem.repository.ShopItemRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ShopService {

    private final ShopItemRepository shopRepo;
    private final PlayerRepository playerRepo;
    private final AiMemoryService aiMemoryService;

    public ShopService(ShopItemRepository shopRepo, PlayerRepository playerRepo, AiMemoryService aiMemoryService) {
        this.shopRepo = shopRepo;
        this.playerRepo = playerRepo;
        this.aiMemoryService = aiMemoryService;
    }

    public List<ShopItem> getShopItems(Long playerId) {
        return shopRepo.findByPlayerIdOrderByCreatedAtDesc(playerId);
    }

    public ShopItem addShopItem(Long playerId, ShopItem item) {
        item.setPlayerId(playerId);
        item.setPurchased(false);
        return shopRepo.save(item);
    }

    public void deleteShopItem(Long itemId, Long playerId) {
        ShopItem item = shopRepo.findById(itemId).orElse(null);
        if (item != null && item.getPlayerId().equals(playerId)) {
            shopRepo.delete(item);
        }
    }

    @Transactional
    public ShopItem purchaseItem(Long itemId, Long playerId) {
        ShopItem item = shopRepo.findById(itemId)
                .orElseThrow(() -> new ApiException("Item not found", HttpStatus.NOT_FOUND));

        if (!item.getPlayerId().equals(playerId)) {
            throw new ApiException("You do not have permission to purchase this item", HttpStatus.FORBIDDEN);
        }
        
        if (item.isOneTime() && item.isPurchased()) {
            throw new ApiException("Item already purchased", HttpStatus.CONFLICT);
        }

        Player player = playerRepo.findById(playerId).orElseThrow();

        if (player.getSystemGold() < item.getCost()) {
            throw new ApiException("Not enough System Gold", HttpStatus.PAYMENT_REQUIRED);
        }

        player.setSystemGold(player.getSystemGold() - item.getCost());
        playerRepo.save(player);

        if (item.isOneTime()) {
            item.setPurchased(true);
            shopRepo.save(item);
        }

        aiMemoryService.addImmediateMemory(playerId, "BEHAVIORAL", "Purchased reward from System Shop: " + item.getName() + " for " + item.getCost() + " gold.");

        return item;
    }
}
