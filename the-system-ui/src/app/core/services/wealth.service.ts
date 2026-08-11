import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAssets(): Observable<FinancialAsset[]> {
    return this.http.get<FinancialAsset[]>(`${this.apiUrl}/wealth/assets`);
  }

  buyAsset(name: string, type: string, shares: number, cost: number, assetYield: number): Observable<FinancialAsset> {
    return this.http.post<FinancialAsset>(`${this.apiUrl}/wealth/assets/buy`, {
      name,
      type,
      shares,
      cost,
      yield: assetYield
    });
  }
}
