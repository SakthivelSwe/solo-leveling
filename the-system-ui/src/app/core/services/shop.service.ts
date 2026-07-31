import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ShopItem {
  id?: number;
  playerId?: number;
  name: string;
  description: string;
  cost: number;
  icon: string;
  isOneTime: boolean;
  isPurchased: boolean;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ShopService {
  private api = `${environment.apiUrl}/shop`;

  constructor(private http: HttpClient) {}

  getShopItems(): Observable<ShopItem[]> {
    return this.http.get<ShopItem[]>(this.api);
  }

  addShopItem(item: Partial<ShopItem>): Observable<ShopItem> {
    return this.http.post<ShopItem>(this.api, item);
  }

  deleteShopItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  purchaseItem(id: number): Observable<ShopItem> {
    return this.http.post<ShopItem>(`${this.api}/${id}/purchase`, {});
  }
}
