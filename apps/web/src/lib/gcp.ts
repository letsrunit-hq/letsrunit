// Uses ADC (Workload Identity on Cloud Run)
import { Firestore } from '@google-cloud/firestore';
import { Storage } from '@google-cloud/storage';
import { PubSub } from '@google-cloud/pubsub';

export const firestore = new Firestore();
export const storage = new Storage();
export const pubsub = new PubSub();

export const ARTIFACT_BUCKET = process.env.ARTIFACT_BUCKET!;
export const PROJECT = process.env.GCP_PROJECT!;
export const REGION = process.env.GCP_REGION ?? 'europe-west4';
