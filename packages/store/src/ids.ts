import { v5 as uuidv5 } from 'uuid';

const UUID_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

export function computeStepId(normalizedText: string): string {
  return uuidv5(normalizedText, UUID_NAMESPACE);
}

export function computeScenarioId(stepIds: string[]): string {
  return uuidv5(stepIds.join(':'), UUID_NAMESPACE);
}

export function computeFeatureId(uri: string): string {
  return uuidv5(uri, UUID_NAMESPACE);
}
