/**
 * <cron> tag - run tasks on a cron schedule without blocking
 * 
 * Usage:
 *   <cron time="* * * * *" name="daily-backup">
 *     <!-- task to run on cron schedule -->
 *   </cron>
 * 
 * Attributes:
 *   time - cron expression (required)
 *          Format: minute hour day month weekday
 *          Examples:
 *            "every-minute"   - runs every minute
 *            "0 9 * * *"      - every day at 9 AM
 *            "0 0 * * 1"      - every Monday at midnight
 *            "0 8-17 * * 1-5" - every hour 8AM-5PM, Monday-Friday
 *   name - identifier for this cron job (optional, for logging)
 * 
 * The task runs in the background and doesn't block execution.
 * In shell mode, tasks continue running until shell exit.
 */

import cron, { type ScheduledTask } from 'node-cron';
import type { DiracSession, DiracElement } from '../types/index.js';
import { integrateChildren } from '../runtime/interpreter.js';
import { substituteAttribute } from '../runtime/session.js';

interface CronJob {
  name: string;
  task: ScheduledTask;
  cronExpression: string;
  isRunning: boolean;  // Track if task is currently executing
}

// Global registry of cron jobs
const cronJobs: Map<string, CronJob> = new Map();

export async function executeCron(session: DiracSession, element: DiracElement): Promise<void> {
  const timeAttr = element.attributes.time;
  const name = element.attributes.name || `cron-${Date.now()}`;
  
  if (!timeAttr) {
    throw new Error('<cron> requires time attribute (cron expression)');
  }
  
  const cronExpression = substituteAttribute(session, timeAttr);
  
  // Validate cron expression
  if (!cron.validate(cronExpression)) {
    throw new Error(`Invalid cron expression: ${cronExpression}\nFormat: minute hour day month weekday\nExample: "0 9 * * *" (daily at 9 AM)`);
  }
  
  // Stop existing job with same name
  if (cronJobs.has(name)) {
    const existing = cronJobs.get(name)!;
    existing.task.stop();
    console.log(`[cron] Stopped existing job: ${name}`);
  }
  
  console.log(`[cron] Starting job "${name}" (${cronExpression})`);
  
  // Track running state for this job
  let isRunning = false;
  
  // Create the cron task
  const task = cron.schedule(cronExpression, async () => {
    await executeJob(session, element, name, () => isRunning, (value) => { isRunning = value; });
  }, {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone  // Use system timezone
  });
  
  // Register the job
  cronJobs.set(name, {
    name,
    task,
    cronExpression,
    isRunning: false
  });
  
  // Don't wait for completion - return immediately (non-blocking)
}

async function executeJob(
  session: DiracSession, 
  element: DiracElement, 
  name: string,
  getIsRunning: () => boolean,
  setIsRunning: (value: boolean) => void
): Promise<void> {
  // Skip if previous execution still running
  if (getIsRunning()) {
    console.log(`[cron] Skipping job "${name}" - previous execution still running`);
    return;
  }
  
  setIsRunning(true);
  console.log(`[cron] Executing job: ${name}`);
  
  try {
    // Clear previous output
    session.output = [];
    
    // Execute the children in the current session context
    await integrateChildren(session, element);
    
    // Print any output generated
    if (session.output.length > 0) {
      console.log(session.output.join(''));
    }
  } catch (error: any) {
    console.error(`[cron] Job "${name}" failed:`, error.message);
  } finally {
    setIsRunning(false);
  }
}

/**
 * Stop a cron job by name
 */
export function stopCronJob(name: string): boolean {
  const job = cronJobs.get(name);
  if (!job) {
    return false;
  }
  
  job.task.stop();
  cronJobs.delete(name);
  console.log(`[cron] Stopped job: ${name}`);
  return true;
}

/**
 * Stop all cron jobs
 */
export function stopAllCronJobs(): void {
  for (const [name, job] of cronJobs) {
    job.task.stop();
    console.log(`[cron] Stopped job: ${name}`);
  }
  cronJobs.clear();
}

/**
 * List all active cron jobs
 */
export function listCronJobs(): Array<{name: string; cronExpression: string; isRunning: boolean}> {
  return Array.from(cronJobs.values()).map(job => ({
    name: job.name,
    cronExpression: job.cronExpression,
    isRunning: job.isRunning
  }));
}
