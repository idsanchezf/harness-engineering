'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { loadState, findFeature, findHu } = require('./store');

function nowIso() {
  return new Date().toISOString();
}

function tasksPath(projectDir, featureId, huId) {
  const state = loadState(projectDir);
  const hu = findHu(findFeature(state, featureId), huId);
  if (!hu.docsPath) throw new Error(`La HU ${huId} no tiene docsPath registrado`);
  return path.join(projectDir, hu.docsPath, 'tasks.json');
}

function loadTasks(projectDir, featureId, huId) {
  const p = tasksPath(projectDir, featureId, huId);
  if (!fs.existsSync(p)) throw new Error(`tasks.json no encontrado: ${p}`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function saveTasks(projectDir, featureId, huId, data) {
  fs.writeFileSync(tasksPath(projectDir, featureId, huId), JSON.stringify(data, null, 2) + '\n', 'utf8');
  return data;
}

function list(projectDir, featureId, huId) {
  return loadTasks(projectDir, featureId, huId).tasks;
}

function progress(projectDir, featureId, huId) {
  const tasks = loadTasks(projectDir, featureId, huId).tasks;
  const done = tasks.filter((t) => t.status === 'done').length;
  return { total: tasks.length, done, percent: tasks.length ? Math.round((done / tasks.length) * 100) : 0 };
}

function setTaskStatus(projectDir, featureId, huId, taskId, statusValue, extra) {
  const data = loadTasks(projectDir, featureId, huId);
  const task = data.tasks.find((t) => t.id === taskId);
  if (!task) throw new Error(`Tarea no encontrada: ${taskId}`);
  task.status = statusValue;
  Object.assign(task, extra || {});
  return saveTasks(projectDir, featureId, huId, data);
}

function taskStart(projectDir, featureId, huId, taskId) {
  return setTaskStatus(projectDir, featureId, huId, taskId, 'in_progress', { startedAt: nowIso() });
}

function taskDone(projectDir, featureId, huId, taskId) {
  return setTaskStatus(projectDir, featureId, huId, taskId, 'done', { completedAt: nowIso() });
}

function taskBlock(projectDir, featureId, huId, taskId, motivo) {
  return setTaskStatus(projectDir, featureId, huId, taskId, 'blocked', { blockedReason: motivo || null });
}

module.exports = { list, progress, taskStart, taskDone, taskBlock };
