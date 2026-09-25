'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const { buildDashboardData } = require('../../bin/lib/track/dashboard-data');
const { makeTmpDir, cleanup } = require('../helpers/tmp-dir');

function setupProject(dir) {
  const state = {
    project: 'Demo',
    features: [
      {
        id: 'F001',
        name: 'Feature demo',
        status: 'in_progress',
        phases: {},
        userStories: [
          {
            id: 'US-001',
            title: 'HU demo',
            docsPath: 'docs/features/F001-demo/US-001/',
            phases: {
              develop: { status: 'completed', startedAt: '2026-01-01T00:00:00Z', completedAt: '2026-01-01T01:00:00Z' },
            },
          },
        ],
      },
    ],
  };
  fs.writeFileSync(path.join(dir, '.harness-state.json'), JSON.stringify(state), 'utf8');

  const tasksPath = path.join(dir, 'docs/features/F001-demo/US-001/tasks.json');
  fs.mkdirSync(path.dirname(tasksPath), { recursive: true });
  fs.writeFileSync(
    tasksPath,
    JSON.stringify({
      tasks: [
        {
          id: 'T001',
          description: 'Tarea demo',
          layer: 'Domain',
          status: 'done',
          startedAt: '2026-01-01T00:00:00Z',
          completedAt: '2026-01-01T00:30:00Z',
        },
      ],
    }),
    'utf8'
  );
}

test('buildDashboardData lee cada tasks.json una sola vez (comparte taskCache con collect())', () => {
  const dir = makeTmpDir();
  try {
    setupProject(dir);

    const originalReadFileSync = fs.readFileSync;
    let tasksJsonReads = 0;
    fs.readFileSync = (p, ...rest) => {
      if (String(p).endsWith('tasks.json')) tasksJsonReads += 1;
      return originalReadFileSync(p, ...rest);
    };

    let data;
    try {
      data = buildDashboardData(dir);
    } finally {
      fs.readFileSync = originalReadFileSync;
    }

    assert.equal(tasksJsonReads, 1, 'tasks.json de la HU no deberia leerse mas de una vez por corrida');
    assert.equal(data.features[0].hus[0].tasks[0].description, 'Tarea demo');
  } finally {
    cleanup(dir);
  }
});

test('buildDashboardData separa tokens nuevos, output y procesados (con fallback sin processed)', () => {
  const dir = makeTmpDir();
  try {
    const state = {
      project: 'Demo',
      features: [
        {
          id: 'F001',
          name: 'Feature demo',
          status: 'in_progress',
          phases: {},
          userStories: [
            {
              id: 'US-001',
              title: 'HU demo',
              docsPath: 'docs/features/F001-demo/US-001/',
              phases: {
                develop: {
                  status: 'completed',
                  startedAt: '2026-01-01T00:00:00Z',
                  completedAt: '2026-01-01T01:00:00Z',
                  tracking: {
                    tokensSource: 'claude-transcript',
                    tokens: { input: 4, output: 45, cacheCreationInput: 1200, cacheReadInput: 41000, total: 1249, processed: 42249 },
                  },
                },
                test: {
                  status: 'completed',
                  startedAt: '2026-01-01T01:00:00Z',
                  completedAt: '2026-01-01T02:00:00Z',
                  tracking: {
                    tokensSource: 'opencode-stats',
                    tokens: { input: 100, output: 50, cacheCreationInput: 0, cacheReadInput: 0, total: 150 },
                  },
                },
              },
            },
          ],
        },
      ],
    };
    fs.writeFileSync(path.join(dir, '.harness-state.json'), JSON.stringify(state), 'utf8');

    const data = buildDashboardData(dir);

    assert.equal(data.totals.tokens, 1249 + 150);
    assert.equal(data.totals.outputTokens, 45 + 50);
    assert.equal(data.totals.processedTokens, 42249 + 150);
    assert.equal(data.features[0].outputTokens, 95);
    assert.equal(data.features[0].processedTokens, 42399);
  } finally {
    cleanup(dir);
  }
});
