import type { DiracSession, DiracElement } from '../types/index.js';
import { setVariable } from '../runtime/session.js';

/**
 * <require_module name="mongodb" var="mongo" />
 * Loads a Node.js module and stores it in a session variable.
 */
export async function executeRequireModule(session: DiracSession, element: DiracElement): Promise<void> {
  const name = element.attributes.name;
  const varName = element.attributes.var || name;
  if (!name) throw new Error('<require_module> missing name attribute');
  try {
    // Dynamically import the module (ESM compatible)
    const mod = await import(name);
    setVariable(session, varName, mod, true); // visible: true
  } catch (err) {
    throw new Error(`<require_module> failed to load module '${name}': ${err}`);
  }
}
