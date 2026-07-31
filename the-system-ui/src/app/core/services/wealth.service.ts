import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FinancialAsset {
  id?: number;
  playerId?: number;
  name: string;
  type: string;
  shares: number;
  cost: number;
  yield: number;
  level: number;
}

@Injectable({ providedIn: 'root' })
export class WealthService {
  constructor(private http: HttpClient) {}

  getAssets(): Observable<FinancialAsset[]> {
    return this.http.get<FinancialAsset[]>('/api/v1/wealth/assets');
  }

  buyAsset(name: string, type: string, shares: number, cost: number, assetYield: number): Observable<FinancialAsset> {
    return this.http.post<FinancialAsset>('/api/v1/wealth/assets/buy', {
      name,
      type,
      shares,
      cost,
      yield: assetYield
    });
  }
}
