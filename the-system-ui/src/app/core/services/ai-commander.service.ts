import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AiCommanderBriefingDTO } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AiCommanderService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/v1/ai/commander`;

  getMorningBriefing(): Observable<AiCommanderBriefingDTO> {
    return this.http.get<AiCommanderBriefingDTO>(`${this.apiUrl}/briefing`);
  }
}
