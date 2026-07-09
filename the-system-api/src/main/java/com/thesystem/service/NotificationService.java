package com.thesystem.service;

import com.thesystem.entity.Notification;
import com.thesystem.entity.Player;
import com.thesystem.repository.NotificationRepository;
import com.thesystem.repository.PlayerRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final PlayerRepository playerRepository;
    private final SseService sseService;

    public NotificationService(NotificationRepository notificationRepository,
                               PlayerRepository playerRepository,
                               SseService sseService) {
        this.notificationRepository = notificationRepository;
        this.playerRepository = playerRepository;
        this.sseService = sseService;
    }

    public Notification push(Long playerId, String title, String message, String type) {
        Notification saved = notificationRepository.save(new Notification(playerId, title, message, type));
        emit(playerId, saved);
        return saved;
    }

    /** Broadcast a System alert to every player (used by the scheduler). */
    public void broadcast(String title, String message, String type) {
        for (Player p : playerRepository.findAll()) {
            Notification saved = notificationRepository.save(new Notification(p.getId(), title, message, type));
            emit(p.getId(), saved);
        }
    }

    /** Push the new notification + fresh unread count to the player's live stream. */
    private void emit(Long playerId, Notification notification) {
        sseService.send(playerId, "notification", Map.of(
                "notification", notification,
                "unreadCount", unreadCount(playerId)));
    }

    public List<Notification> recent(Long playerId) {
        return notificationRepository.findTop50ByPlayerIdOrderByCreatedAtDesc(playerId);
    }

    public long unreadCount(Long playerId) {
        return notificationRepository.countByPlayerIdAndReadFalse(playerId);
    }

    public void markRead(Long playerId, Long id) {
        notificationRepository.findById(id)
                .filter(n -> n.getPlayerId().equals(playerId))
                .ifPresent(n -> { n.setRead(true); notificationRepository.save(n); });
    }

    public void markAllRead(Long playerId) {
        List<Notification> list = notificationRepository.findTop50ByPlayerIdOrderByCreatedAtDesc(playerId);
        list.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(list);
    }
}

