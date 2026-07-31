package com.thesystem.controller;

import com.thesystem.entity.ShopItem;
import com.thesystem.security.CurrentPlayer;
import com.thesystem.service.ShopService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/shop")
public class ShopController {

    private final ShopService shopService;
    private final CurrentPlayer currentPlayer;

    public ShopController(ShopService shopService, CurrentPlayer currentPlayer) {
        this.shopService = shopService;
        this.currentPlayer = currentPlayer;
    }

    @GetMapping
    public List<ShopItem> getShopItems(Principal p) {
        return shopService.getShopItems(currentPlayer.id(p));
    }

    @PostMapping
    public ShopItem addShopItem(Principal p, @RequestBody ShopItem item) {
        return shopService.addShopItem(currentPlayer.id(p), item);
    }

    @DeleteMapping("/{itemId}")
    public ResponseEntity<Void> deleteShopItem(Principal p, @PathVariable Long itemId) {
        shopService.deleteShopItem(itemId, currentPlayer.id(p));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{itemId}/purchase")
    public ResponseEntity<?> purchaseItem(Principal p, @PathVariable Long itemId) {
        try {
            ShopItem purchased = shopService.purchaseItem(itemId, currentPlayer.id(p));
            return ResponseEntity.ok(purchased);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
