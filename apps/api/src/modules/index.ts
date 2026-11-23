import type { Router } from 'express';
import { authModule } from './auth/index.js';
import { cargosModule } from './cargos/index.js';
import { bidsModule } from './bids/index.js';
import { escrowModule } from './escrow/index.js';
import { trackingModule } from './tracking/index.js';

export interface AppModule {
  prefix: string;
  router: Router;
}

/**
 * دامنه‌های کسب‌وکار، هر کدام یک ماژول مستقل.
 * افزودن بخش جدید: پوشه‌ای در modules/ بسازید که AppModule صادر کند و اینجا ثبتش کنید.
 */
export const modules: AppModule[] = [
  authModule,
  cargosModule,
  bidsModule,
  escrowModule,
  trackingModule,
];
