/**
 * <run-at> tag - run a task once at a future time (non-blocking)
 * 
 * Usage:
 *   <run-at time="2026-04-07T15:30:00" name="reminder">
 *     <!-- task to run once at specified time -->
 *   </run-at>
 * 
 * Attributes:
 *   time - When to execute (required)
 *          Formats supported:
 *            - ISO timestamp: "2026-04-07T15:30:00"
 *            - Unix timestamp (ms): "1712502600000"
 *            - Seconds from now: "+30" (30 seconds from now)
 *            - Minutes from now: "+5m" (5 minutes from now)
 *            - Hours from now: "+2h" (2 hours from now)
 *            - Days from now: "+7d" (7 days from now)
 *   name - identifier for this scheduled run (optional, for logging)
 * 
 * The task runs once at the specified time then removes itself.
 * Non-blocking - returns immediately.
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { integrateChildren } from '../runtime/interpreter.js';
import { substituteAttribute } from '../runtime/session.js';

interface ScheduledRun {
  name: string;
  timeoutId: NodeJS.Timeout;
  scheduledTime: Date;
  isRunning: boolean;
}

// Global registry of scheduled runs
const scheduledRuns: Map<string, ScheduledRun> = new Map();

export async function executeRunAt(session: DiracSession, element: DiracElement): Promise<void> {
  const timeAttr = element.attributes.time;
  const name = element.attributes.name || `run-${Date.now()}`;
  
  if (!timeAttr) {
    throw new Error('<run-at> requires time attribute');
  }
  
  const timeStr = substituteAttribute(session, timeAttr);
  const targetTime = parseTimeExpression(timeStr);
  
  if (isNaN(targetTime.getTime())) {
    throw new Error(`Invalid time expression: ${timeStr}`);
  }
  
  const now = new Date();
  const delayMs = targetTime.getTime() - now.getTime();
  
  if (delayMs < 0) {
    throw new Error(`Time is in the past: ${targetTime.toISOString()} (current: ${now.toISOString()})`);
  }
  
  // Cancel existing run with same name
  if (scheduledRuns.has(name)) {
    const existing = scheduledRuns.get(name)!;
    clearTimeout(existing.timeoutId);
    console.log(`[run-at] Cancelled existing run: ${name}`);
  }
  
  console.log(`[run-at] Scheduled "${name}" for ${targetTime.toLocaleString()} (in ${formatDuration(delayMs)})`);
  
  // Schedule the one-time execution
  const timeoutId = setTimeout(async () => {
    await executeScheduledRun(session, element, name);
    scheduledRuns.delete(name); // Remove after execution
  }, delayMs);
  
  // Register the scheduled run
  scheduledRuns.set(name, {
    name,
    timeoutId,
    scheduledTime: targetTime,
    isRunning: false
  });
  
  // Don't wait - return immediately (non-blocking)
}

async function executeScheduledRun(
  session: DiracSession,
  element: DiracElement,
  name: string
): Promise<void> {
  const run = scheduledRuns.get(name);
  if (!run) return;
  
  run.isRunning = true;
  console.log(`[run-at] Executing: ${name}`);
  
  try {
    // Clear previous output
    session.output = [];
    
    // Execute the children
    await integrateChildren(session, element);
    
    // Print any output generated
    if (session.output.length > 0) {
      console.log(session.output.join(''));
    }
  } catch (error: any) {
    console.error(`[run-at] Run "${name}" failed:`, error.message);
  } finally {
    run.isRunning = false;
  }
}

/**
 * Parse various time expression formats
 */
function parseTimeExpression(expr: string): Date {
  // Remove whitespace
  expr = expr.trim();
  
  // Relative time: +30 (seconds), +5m (minutes), +2h (hours), +7d (days)
  const relativeMatch = expr.match(/^\+(\d+)(s|m|h|d)?$/);
  if (relativeMatch) {
    const value = parseInt(relativeMatch[1], 10);
    const unit = relativeMatch[2] || 's';
    const now = Date.now();
    
    let offsetMs: number;
    switch (unit) {
      case 's': offsetMs = value * 1000; break;
      case 'm': offsetMs = value * 60 * 1000; break;
      case 'h': offsetMs = value * 60 * 60 * 1000; break;
      case 'd': offsetMs = value * 24 * 60 * 60 * 1000; break;
      default: offsetMs = value * 1000;
    }
    
    return new Date(now + offsetMs);
  }
  
  // Unix timestamp (milliseconds)
  if (/^\d+$/.test(expr)) {
    const timestamp = parseInt(expr, 10);
    return new Date(timestamp);
  }
  
  // ISO date string or any valid Date string
  return new Date(expr);
}

/**
 * Format duration in human-readable form
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Cancel a scheduled run by name
 */
export function cancelScheduledRun(name: string): boolean {
  const run = scheduledRuns.get(name);
  if (!run) {
    return false;
  }
  
  clearTimeout(run.timeoutId);
  scheduledRuns.delete(name);
  console.log(`[run-at] Cancelled: ${name}`);
  return true;
}

/**
 * Cancel all scheduled runs
 */
export function cancelAllScheduledRuns(): void {
  for (const [name, run] of scheduledRuns) {
    clearTimeout(run.timeoutId);
    console.log(`[run-at] Cancelled: ${name}`);
  }
  scheduledRuns.clear();
}

/**
 * List all scheduled runs
 */
export function listScheduledRuns(): Array<{name: string; scheduledTime: Date; isRunning: boolean}> {
  return Array.from(scheduledRuns.values()).map(run => ({
    name: run.name,
    scheduledTime: run.scheduledTime,
    isRunning: run.isRunning
  }));
}
