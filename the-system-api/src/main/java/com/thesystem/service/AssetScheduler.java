package com.thesystem.service;

import com.thesystem.entity.FinancialAsset;
import com.thesystem.entity.Player;
import com.thesystem.repository.FinancialAssetRepository;
import com.thesystem.repository.PlayerRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AssetScheduler {

    private static final Logger log = LoggerFactory.getLogger(AssetScheduler.class);
    private final FinancialAssetRepository assetRepo;
    private final PlayerRepository playerRepo;

    public AssetScheduler(FinancialAssetRepository assetRepo, PlayerRepository playerRepo) {
        this.assetRepo = assetRepo;
        this.playerRepo = playerRepo;
    }

    /**
     * Runs every midnight to yield daily gold from all financial assets.
     */
    @Scheduled(cron = "0 0 0 * * ?") // Midnight
    @Transactional
    public void yieldDailyGold() {
        log.info("Processing daily yields for Financial Assets...");
        List<FinancialAsset> allAssets = assetRepo.findAll();
        
        for (FinancialAsset asset : allAssets) {
            if (asset.getDailyGoldYield() > 0) {
                playerRepo.findById(asset.getPlayerId()).ifPresent(player -> {
                    player.setSystemGold(player.getSystemGold() + asset.getDailyGoldYield());
                    playerRepo.save(player);
                    log.info("Yielded {} gold to player {} from asset {}", 
                            asset.getDailyGoldYield(), player.getUsername(), asset.getName());
                });
            }
        }
        log.info("Finished processing daily yields.");
    }
}
