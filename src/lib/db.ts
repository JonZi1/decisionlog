import Dexie, { type EntityTable } from 'dexie';
import type { Decision } from './types';

export interface CustomCategory {
  id: string;
  name: string;
  createdAt: string;
}

const db = new Dexie('DecisionLogDB') as Dexie & {
  decisions: EntityTable<Decision, 'id'>;
  categories: EntityTable<CustomCategory, 'id'>;
};

// Version 1: Initial schema
db.version(1).stores({
  decisions: 'id, date, category, stakes, reviewDate, reviewedAt'
});

// Version 2: Add custom categories table
db.version(2).stores({
  decisions: 'id, date, category, stakes, reviewDate, reviewedAt',
  categories: 'id, name'
});

// Version 3: Add structured review fields (schema already supports them, just upgrade version)
db.version(3).stores({
  decisions: 'id, date, category, stakes, reviewDate, reviewedAt',
  categories: 'id, name'
}).upgrade(async () => {
  // No data migration needed - fields are optional
  console.log('Upgraded to schema version 3');
});

export { db };

// Category management functions
export async function getCustomCategories(): Promise<CustomCategory[]> {
  return db.categories.toArray();
}

export async function addCustomCategory(name: string): Promise<CustomCategory> {
  const category: CustomCategory = {
    id: crypto.randomUUID(),
    name: name.toLowerCase().trim(),
    createdAt: new Date().toISOString(),
  };
  await db.categories.add(category);
  return category;
}

export async function deleteCustomCategory(id: string): Promise<void> {
  await db.categories.delete(id);
}

export async function renameCategory(oldName: string, newName: string): Promise<number> {
  // Update all decisions with the old category name
  const decisions = await db.decisions.where('category').equals(oldName).toArray();
  const updates = decisions.map(d =>
    db.decisions.update(d.id, { category: newName.toLowerCase().trim() })
  );
  await Promise.all(updates);

  // Update the custom category if it exists
  const customCat = await db.categories.where('name').equals(oldName).first();
  if (customCat) {
    await db.categories.update(customCat.id, { name: newName.toLowerCase().trim() });
  }

  return decisions.length;
}

export async function mergeCategories(sourceNames: string[], targetName: string): Promise<number> {
  let totalUpdated = 0;

  for (const sourceName of sourceNames) {
    if (sourceName === targetName) continue;

    const decisions = await db.decisions.where('category').equals(sourceName).toArray();
    const updates = decisions.map(d =>
      db.decisions.update(d.id, { category: targetName.toLowerCase().trim() })
    );
    await Promise.all(updates);
    totalUpdated += decisions.length;

    // Delete the source custom category if it exists
    const customCat = await db.categories.where('name').equals(sourceName).first();
    if (customCat) {
      await db.categories.delete(customCat.id);
    }
  }

  return totalUpdated;
}

export async function getAllUsedCategories(): Promise<string[]> {
  const decisions = await db.decisions.toArray();
  const categories = new Set(decisions.map(d => d.category));
  return Array.from(categories).sort();
}
