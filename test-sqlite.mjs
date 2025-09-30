#!/usr/bin/env node

// Simple test to verify in-memory database functionality works
import { InMemoryTestDatabase } from './tests/in-memory-db.ts';

async function testInMemory() {
  console.log('🧪 Testing in-memory database implementation...');

  try {
    const db = new InMemoryTestDatabase(':memory:');
    const connectionString = await db.initialize();
    console.log('✅ Database initialized:', connectionString);

    // Test basic operations
    await db.execute(
      'INSERT OR REPLACE INTO obsidian_chunks (id, content, embedding, metadata, file_path) VALUES (?, ?, ?, ?, ?)',
      ['test-1', 'Test content', null, null, '/test/file.md']
    );

    const results = await db.query('SELECT * FROM obsidian_chunks WHERE content LIKE ?', ['%Test%']);
    console.log('✅ Query results:', results);

    const stats = await db.query('SELECT COUNT(*) as total_chunks FROM obsidian_chunks');
    console.log('✅ Stats:', stats);

    await db.close();
    console.log('✅ Database closed successfully');

    console.log('🎉 In-memory database test passed!');
  } catch (error) {
    console.error('❌ In-memory database test failed:', error);
    process.exit(1);
  }
}

testInMemory();

