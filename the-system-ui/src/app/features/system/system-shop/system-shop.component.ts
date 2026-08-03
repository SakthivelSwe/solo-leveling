import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ShopService, ShopItem } from '../../../core/services/shop.service';
import { WealthService, FinancialAsset } from '../../../core/services/wealth.service';
import { PlayerService } from '../../../core/services/player.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-system-shop',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule],
  templateUrl: './system-shop.component.html',
  styleUrls: ['./system-shop.component.scss']
})
export class SystemShopComponent implements OnInit {
  activeTab = signal<'REWARDS' | 'ASSETS'>('REWARDS');
  
  items = signal<ShopItem[]>([]);
  assets = signal<FinancialAsset[]>([]);
  systemGold = signal<number>(0);
  
  // Rewards modal
  showAddModal = signal<boolean>(false);
  newItem: Partial<ShopItem> = { name: '', description: '', cost: 100, icon: '📦', isOneTime: false };

  // Assets modal
  showBuyAssetModal = signal<boolean>(false);
  newAsset: {name: string, type: string, shares: number, cost: number, yield: number} = {
    name: 'S&P 500 Index Fund', type: 'INDEX_FUND', shares: 1, cost: 1000, yield: 2
  };

  totalDailyYield = computed(() => {
    return this.assets().reduce((sum, asset) => sum + (asset.shares * asset.yield), 0);
  });

  constructor(
    private shop: ShopService, 
    private wealth: WealthService,
    private playerService: PlayerService,
    private snack: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.shop.getShopItems().subscribe(v => this.items.set(v));
    this.wealth.getAssets().subscribe(v => this.assets.set(v));
    this.playerService.getProfile().subscribe(v => {
      this.systemGold.set(v.systemGold || 0);
    });
  }

  setTab(tab: 'REWARDS' | 'ASSETS') {
    this.activeTab.set(tab);
  }

  // --- REWARDS LOGIC ---
  buy(item: ShopItem) {
    if (this.systemGold() < item.cost) {
      this.snack.open('Not enough System Gold ◈', '', { duration: 3000, panelClass: ['snack-danger'] });
      return;
    }
    
    this.shop.purchaseItem(item.id!).subscribe({
      next: (purchased) => {
        this.systemGold.update(g => g - item.cost);
        if (item.isOneTime) {
          const arr = this.items().map(i => i.id === purchased.id ? purchased : i);
          this.items.set(arr);
        }
        this.snack.open('Item purchased! ◈', '', { duration: 2000, panelClass: ['snack-success'] });
      },
      error: (e) => this.snack.open('Error: ' + (e.error?.error || 'Purchase failed'), '', { duration: 3000, panelClass: ['snack-danger'] })
    });
  }

  deleteItem(id: number) {
    this.shop.deleteShopItem(id).subscribe(() => {
      this.items.set(this.items().filter(i => i.id !== id));
    });
  }

  openAddModal() {
    this.newItem = { name: '', description: '', cost: 100, icon: '📦', isOneTime: false };
    this.showAddModal.set(true);
  }

  closeAddModal() {
    this.showAddModal.set(false);
  }

  saveNewItem() {
    this.shop.addShopItem(this.newItem).subscribe(res => {
      this.items.update(arr => [res, ...arr]);
      this.closeAddModal();
    });
  }

  // --- ASSETS LOGIC ---
  openBuyAssetModal() {
    this.showBuyAssetModal.set(true);
  }

  closeBuyAssetModal() {
    this.showBuyAssetModal.set(false);
  }

  buyAsset() {
    const totalCost = this.newAsset.shares * this.newAsset.cost;
    if (this.systemGold() < totalCost) {
      this.snack.open('Not enough System Gold ◈', '', { duration: 3000, panelClass: ['snack-danger'] });
      return;
    }
    this.wealth.buyAsset(
      this.newAsset.name,
      this.newAsset.type,
      this.newAsset.shares,
      this.newAsset.cost,
      this.newAsset.yield
    ).subscribe({
      next: (asset) => {
        this.systemGold.update(g => g - totalCost);
        // Refresh assets list
        this.wealth.getAssets().subscribe(v => this.assets.set(v));
        this.closeBuyAssetModal();
        this.snack.open('Asset acquired! 📈', '', { duration: 2000, panelClass: ['snack-success'] });
      },
      error: (e) => this.snack.open('Error: ' + (e.error?.error || 'Purchase failed'), '', { duration: 3000, panelClass: ['snack-danger'] })
    });
  }
}