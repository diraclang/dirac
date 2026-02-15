/**
 * <environment> tag - read environment variables
 * Usage: <environment name="VAR_NAME" />
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { emit } from '../runtime/session.js';

export async function executeEnvironment(session: DiracSession, element: DiracElement): Promise<void> {
  const name = element.attributes.name;

  if (!name) {
    throw new Error('<environment> requires name attribute');
  }

  // Get environment variable value
  const value = process.env[name] || '';

  // Emit the value to output
  emit(session, value);
}
