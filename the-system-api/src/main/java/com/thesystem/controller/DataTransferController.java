package com.thesystem.controller;

import com.thesystem.dto.DataTransferRequest;
import com.thesystem.dto.DataTransferResponse;
import com.thesystem.service.DataTransferService;
import com.thesystem.service.PlayerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;

@RestController
@RequestMapping("/api/v1/player")
public class DataTransferController {

    private final DataTransferService dataTransferService;
    private final PlayerService playerService;

    public DataTransferController(DataTransferService dataTransferService, PlayerService playerService) {
        this.dataTransferService = dataTransferService;
        this.playerService = playerService;
    }

    @PostMapping("/transfer-data")
    public ResponseEntity<DataTransferResponse> transferData(Principal principal, @RequestBody DataTransferRequest req) {
        Long sourcePlayerId = playerService.getByUsername(principal.getName()).getId();
        DataTransferResponse res = dataTransferService.transferData(sourcePlayerId, req);
        return ResponseEntity.ok(res);
    }
}
