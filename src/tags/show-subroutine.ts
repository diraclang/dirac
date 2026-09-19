/**
 * <show-subroutine> tag - Serialize subroutine definition from session stack
 *
 * Usage:
 *   <show-subroutine name="my-sub" />
 *   <show-subroutine name="my-sub" format="braket" />
 *   <show-subroutine name="my-sub" selection="1" />
 *   <show-subroutine name="my-sub" selection="all" output="subSrc" />
 */

import type { DiracSession, DiracElement, Subroutine } from '../types/index.js';
import { emit, setVariable } from '../runtime/session.js';
import {
  serializeSubroutineForTraining,
  serializeSubroutineToBraKet,
} from '../utils/subroutine-serializer.js';

export async function executeShowSubroutine(session: DiracSession, element: DiracElement): Promise<void> {
  const name = element.attributes.name;
  const format = (element.attributes.format || 'xml').toLowerCase();
  const outputVar = element.attributes.output;
  const selectionAttr = element.attributes.selection;

  if (!name) {
    throw new Error('<show-subroutine> requires name attribute');
  }

  if (format !== 'xml' && format !== 'braket') {
    throw new Error('<show-subroutine> format must be "xml" or "braket"');
  }

  const matches = session.subroutines.filter((sub) => sub.name === name);
  if (matches.length === 0) {
    throw new Error(`Subroutine '${name}' not found in session`);
  }

  let selected: Subroutine[];

  if (!selectionAttr) {
    // Default to most recent stack definition.
    selected = [matches[matches.length - 1]];
  } else if (selectionAttr.toLowerCase() === 'all' || selectionAttr === '*') {
    selected = matches;
  } else {
    const selection = parseInt(selectionAttr, 10);
    if (Number.isNaN(selection) || selection < 1 || selection > matches.length) {
      throw new Error(`<show-subroutine> selection must be 1-${matches.length}, all, or *`);
    }
    selected = [matches[selection - 1]];
  }

  const chunks = selected.map((sub) => {
    if (format === 'braket') {
      return stripEditingHeader(serializeSubroutineToBraKet(sub));
    }
    return serializeSubroutineForTraining(sub);
  });

  const output = chunks.join('\n\n');

  if (outputVar) {
    setVariable(session, outputVar, output, false);
  } else {
    emit(session, output);
    if (!output.endsWith('\n')) {
      emit(session, '\n');
    }
  }
}

function stripEditingHeader(content: string): string {
  const lines = content.split('\n');
  if (lines[0]?.startsWith('<!-- Editing subroutine:') && lines[1] === '') {
    return lines.slice(2).join('\n');
  }
  return content;
}
