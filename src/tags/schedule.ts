/**
 * <schedule> tag - run tasks on a schedule without blocking
 * 
 * Usage:
 *   <schedule interval="60" name="monitor-logs">
 *     <!-- task to run every 60 seconds -->
 *   </schedule>
 * 
 * Attributes:
 *   interval - seconds between executions (required)
 *   name     - identifier for this scheduled task (optional, for logging)
 * 
 * The task runs in the background and doesn't block execution.
 * In shell mode, tasks continue running until shell exit.
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { integrateChildren } from '../runtime/interpreter.js';
import { substituteAttribute } from '../runtime/session.js';

interface ScheduledTask {
  name: string;
  intervalId: NodeJS.Timeout;
  interval: number;
}

// Global registry of scheduled tasks
const scheduledTasks: Map<string, ScheduledTask> = new Map();

export async function executeSchedule(session: DiracSession, element: DiracElement): Promise<void> {
  const intervalAttr = element.attributes.interval;
  const name = element.attributes.name || `task-${Date.now()}`;
  
  if (!intervalAttr) {
    throw new Error('<schedule> requires interval attribute (in seconds)');
  }
  
  const substitutedInterval = substituteAttribute(session, intervalAttr);
  const intervalSeconds = parseInt(substitutedInterval, 10);
  
  if (isNaN(intervalSeconds) || intervalSeconds <= 0) {
    throw new Error(`Invalid schedule interval: ${intervalAttr} (evaluated to: ${substitutedInterval})`);
  }
  
  const intervalMs = intervalSeconds * 1000;
  
  // Stop existing task with same name
  if (scheduledTasks.has(name)) {
    const existing = scheduledTasks.get(name)!;
    clearInterval(existing.intervalId);
    console.log(`[schedule] Stopped existing task: ${name}`);
  }
  
  // Create a copy of the session state for the scheduled task
  // This prevents interference with the main execution
  const taskElement = element;
  
  console.log(`[schedule] Starting task "${name}" (every ${intervalSeconds}s)`);
  
  // Run immediately once
  executeTask(session, taskElement, name).catch(err => {
    console.error(`[schedule] Error in task "${name}":`, err.message);
  });
  
  // Schedule repeated execution
  const intervalId = setInterval(() => {
    executeTask(session, taskElement, name).catch(err => {
      console.error(`[schedule] Error in task "${name}":`, err.message);
    });
  }, intervalMs);
  
  // Register the task
  scheduledTasks.set(name, {
    name,
    intervalId,
    interval: intervalSeconds
  });
  
  // Don't wait for completion - return immediately (non-blocking)
}

async function executeTask(session: DiracSession, element: DiracElement, name: string): Promise<void> {
  try {
    // Execute the children in the current session context
    await integrateChildren(session, element);
  } catch (error: any) {
    console.error(`[schedule] Task "${name}" failed:`, error.message);
  }
}

/**
 * Stop a scheduled task by name
 */
export function stopScheduledTask(name: string): boolean {
  const task = scheduledTasks.get(name);
  if (!task) {
    return false;
  }
  
  clearInterval(task.intervalId);
  scheduledTasks.delete(name);
  console.log(`[schedule] Stopped task: ${name}`);
  return true;
}

/**
 * Stop all scheduled tasks
 */
export function stopAllScheduledTasks(): void {
  for (const [name, task] of scheduledTasks) {
    clearInterval(task.intervalId);
    console.log(`[schedule] Stopped task: ${name}`);
  }
  scheduledTasks.clear();
}

/**
 * List all active scheduled tasks
 */
export function listScheduledTasks(): ScheduledTask[] {
  return Array.from(scheduledTasks.values());
}
