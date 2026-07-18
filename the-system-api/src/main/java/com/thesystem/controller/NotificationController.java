package com.thesystem.controller;

import com.thesystem.entity.Notification;
import com.thesystem.security.CurrentPlayer;
import com.thesystem.service.NotificationService;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final CurrentPlayer currentPlayer;

    public NotificationController(NotificationService notificationService, CurrentPlayer currentPlayer) {
        this.notificationService = notificationService;
        this.currentPlayer = currentPlayer;
    }

    @GetMapping
    public List<Notification> list(Principal principal) {
        return notificationService.recent(currentPlayer.id(principal));
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount(Principal principal) {
        return Map.of("count", notificationService.unreadCount(currentPlayer.id(principal)));
    }

    @PostMapping("/{id}/read")
    public void markRead(Principal principal, @PathVariable Long id) {
        notificationService.markRead(currentPlayer.id(principal), id);
    }

    @PostMapping("/read-all")
    public void markAllRead(Principal principal) {
        notificationService.markAllRead(currentPlayer.id(principal));
    }
}

