package com.thesystem.security;

import com.thesystem.entity.Player;
import com.thesystem.repository.PlayerRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final PlayerRepository playerRepository;

    public CustomUserDetailsService(PlayerRepository playerRepository) {
        this.playerRepository = playerRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Normalize to lowercase so login is case-insensitive
        String normalised = username == null ? "" : username.trim().toLowerCase();
        Player player = playerRepository.findByUsernameIgnoreCase(normalised)
                .orElseThrow(() -> new UsernameNotFoundException("Player not found: " + username));
        return new User(player.getUsername(), player.getPassword(),
                List.of(new SimpleGrantedAuthority("ROLE_PLAYER")));
    }
}

