
    import path from 'path';

    import { beforeEach, afterAll, beforeAll, afterEach } from 'vitest';

    const ns = globalThis.__stryker__ || (globalThis.__stryker__ = {});
    
      ns.hitLimit = 1800;
      beforeAll(() => {
        ns.hitCount = 0;
      });
  
      
            beforeEach(() => {
              ns.activeMutant = '1432';
            });
      afterAll(async (suite) => {
        suite.meta.hitCount = ns.hitCount;
      });