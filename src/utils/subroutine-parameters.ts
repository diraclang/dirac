import type { DiracElement, ParameterMetadata } from '../types/index.js';

interface NormalizedSubroutineDefinition {
  attributes: Record<string, string>;
  children: DiracElement[];
  parameters: ParameterMetadata[];
}

function isIgnorableTextNode(element: DiracElement): boolean {
  return !element.tag && !((element.text || '').trim());
}

export function isSubroutineParameterDeclarationBlock(element: DiracElement): boolean {
  if (element.tag !== 'parameters' || !!element.attributes.select) {
    return false;
  }

  const meaningfulChildren = (element.children || []).filter(child => !isIgnorableTextNode(child));
  return meaningfulChildren.length > 0 && meaningfulChildren.every(child => child.tag === 'param');
}

function parseParameterSpec(name: string, spec: string): ParameterMetadata {
  const parts = spec.split(':');
  const parameter: ParameterMetadata = {
    name,
    type: parts[0] || 'string',
    required: parts[1] === 'required',
    description: parts[2] || undefined,
  };

  if (parts.length > 3 && parts[3]) {
    parameter.enum = parts[3].split('|');
  }

  if (parts.length > 4 && parts[4]) {
    parameter.example = parts[4];
  }

  return parameter;
}

function buildParameterSpec(parameter: ParameterMetadata): string {
  const parts: string[] = [parameter.type || 'string'];

  if (parameter.required) {
    parts.push('required');
  }

  if (parameter.description) {
    if (!parameter.required) {
      parts.push('');
    }
    parts.push(parameter.description);
  }

  return parts.join(':');
}

function parseDeclaredParameter(element: DiracElement): ParameterMetadata {
  const name = element.attributes.name?.trim();
  if (!name) {
    throw new Error('<param> inside <parameters> requires name attribute');
  }

  const requiredValue = (element.attributes.required || '').trim().toLowerCase();
  const enumValue = element.attributes.enum?.trim();

  return {
    name,
    type: element.attributes.type?.trim() || 'string',
    required: requiredValue === 'true' || requiredValue === 'required' || requiredValue === 'yes' || requiredValue === '1',
    description: element.attributes.description?.trim() || undefined,
    enum: enumValue ? enumValue.split('|').map(part => part.trim()).filter(Boolean) : undefined,
    example: element.attributes.example?.trim() || undefined,
  };
}

export function normalizeSubroutineDefinition(element: DiracElement): NormalizedSubroutineDefinition {
  const attributes = { ...element.attributes };
  const children: DiracElement[] = [];
  const declaredParameters = new Map<string, ParameterMetadata>();

  for (const child of element.children || []) {
    if (!isSubroutineParameterDeclarationBlock(child)) {
      children.push(child);
      continue;
    }

    for (const paramChild of child.children || []) {
      if (isIgnorableTextNode(paramChild)) {
        continue;
      }

      if (paramChild.tag !== 'param') {
        throw new Error('<parameters> declaration inside <subroutine> only supports <param ... /> children');
      }

      const parameter = parseDeclaredParameter(paramChild);
      declaredParameters.set(parameter.name, parameter);

      const attrName = `param-${parameter.name}`;
      if (!(attrName in attributes)) {
        attributes[attrName] = buildParameterSpec(parameter);
      }
    }
  }

  const parameters: ParameterMetadata[] = [];
  for (const [attrName, attrValue] of Object.entries(attributes)) {
    if (!attrName.startsWith('param-')) {
      continue;
    }

    const paramName = attrName.substring(6);
    const parameter = parseParameterSpec(paramName, attrValue);
    const declared = declaredParameters.get(paramName);
    if (declared) {
      parameter.enum = parameter.enum || declared.enum;
      parameter.example = parameter.example || declared.example;
      parameter.description = parameter.description || declared.description;
    }
    parameters.push(parameter);
  }

  return { attributes, children, parameters };
}

export function extractSubroutineParameters(element: DiracElement): ParameterMetadata[] {
  return normalizeSubroutineDefinition(element).parameters;
}