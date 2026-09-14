/**
 * <return> tag - set the current subroutine's return value
 *
 * Sets session.isReturn = true (short-circuiting remaining siblings in the
 * current subroutine body, same mechanism <break> uses for loops) and stores
 * the evaluated value in session.returnValue, which the call site can then
 * capture via the `result` attribute on <call>/direct-tag calls.
 *
 * Usage:
 *   <return><variable name="sum" /></return>
 *   <return value="42" />
 *   <return>plain text</return>
 */

import type { DiracSession, DiracElement } from '../types/index.js';
import { getVariable, substituteVariables, setOutputBoundary, popAndCaptureOutput } from '../runtime/session.js';
import { integrateChildren } from '../runtime/interpreter.js';

export async function executeReturn(session: DiracSession, element: DiracElement): Promise<void> {
  const valueAttr = element.attributes?.value;

  let value: any;

  if (valueAttr !== undefined) {
    value = substituteVariables(session, valueAttr);
  } else if (
    element.children &&
    element.children.length === 1 &&
    element.children[0].tag === 'variable'
  ) {
    // Direct variable reference - preserve the actual value/type instead of
    // stringifying it through output capture.
    const varName = element.children[0].attributes?.name;
    value = varName ? getVariable(session, varName) : undefined;
  } else if (element.children && element.children.length > 0) {
    // Mixed/complex content - capture rendered output as the value,
    // consistent with how <defvar> and <output> handle nested children.
    const oldBoundary = setOutputBoundary(session);
    await integrateChildren(session, element);
    value = popAndCaptureOutput(session);
    session.outputBoundary = oldBoundary;
  } else if (element.text) {
    value = substituteVariables(session, element.text);
  } else {
    value = undefined;
  }

  session.returnValue = value;
  session.isReturn = true;
}
