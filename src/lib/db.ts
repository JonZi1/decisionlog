import Dexie, { type EntityTable } from 'dexie';
import type { Decision } from './types';

const db = new Dexie('DecisionLogDB') as Dexie & {
  decisions: EntityTable<Decision, 'id'>;
};

db.version(1).stores({
  decisions: 'id, date, category, stakes, reviewDate, reviewedAt'
});

export { db };
