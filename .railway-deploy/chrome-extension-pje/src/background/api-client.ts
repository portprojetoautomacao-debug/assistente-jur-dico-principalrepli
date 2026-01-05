/**
 * Cliente API para comunicação com backend
 */

import { API_ENDPOINTS, BACKEND_URL } from '../shared/constants';
import { Expediente, ProcessoPJe, SyncResponse } from '../shared/types';
import { retry } from '../shared/utils';

export class APIClient {
  private apiKey: string | null = null;

  constructor() {
    this.loadApiKey();
  }

  private async loadApiKey(): Promise<void> {
    const result = await chrome.storage.sync.get(['apiKey']);
    this.apiKey = result.apiKey || null;
  }

  public async setApiKey(key: string): Promise<void> {
    this.apiKey = key;
    await chrome.storage.sync.set({ apiKey: key });
  }

  /**
   * Sincroniza processos com backend
   */
  public async syncProcessos(processos: ProcessoPJe[]): Promise<SyncResponse> {
    if (!this.apiKey) {
      throw new Error('API Key não configurada');
    }

    return retry(async () => {
      const response = await fetch(`${BACKEND_URL}${API_ENDPOINTS.PJE_SYNC}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey!
        },
        body: JSON.stringify({
          type: 'SYNC_PROCESSOS',
          data: processos,
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      return await response.json();
    }, 3, 2000);
  }

  /**
   * Sincroniza expedientes com backend
   */
  public async syncExpedientes(expedientes: Expediente[]): Promise<SyncResponse> {
    if (!this.apiKey) {
      throw new Error('API Key não configurada');
    }

    return retry(async () => {
      const response = await fetch(`${BACKEND_URL}${API_ENDPOINTS.PJE_SYNC}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey!
        },
        body: JSON.stringify({
          type: 'SYNC_EXPEDIENTES',
          data: expedientes,
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    }, 3, 2000);
  }

  /**
   * Verifica status do backend
   */
  public async ping(): Promise<boolean> {
    try {
      const response = await fetch(`${BACKEND_URL}${API_ENDPOINTS.STATUS}`, {
        method: 'GET',
        headers: this.apiKey ? { 'X-API-Key': this.apiKey } : {}
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
