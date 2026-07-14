/**
 * @module features/cloud/containers
 *
 * Docker — Flutter Docker images, Android SDK images, cached layers.
 */

import type { DockerImage } from "../types";

export const dockerImages: DockerImage[] = [
  { id: "img-flutter-322", name: "flutter", tag: "3.22.0", flutterVersion: "3.22.0", androidSdk: true, cachedLayers: 12, sizeMb: 2400 },
  { id: "img-flutter-319", name: "flutter", tag: "3.19.0", flutterVersion: "3.19.0", androidSdk: true, cachedLayers: 10, sizeMb: 2200 },
  { id: "img-flutter-web", name: "flutter-web", tag: "3.22.0", flutterVersion: "3.22.0", androidSdk: false, cachedLayers: 8, sizeMb: 1800 },
  { id: "img-android-sdk", name: "android-sdk", tag: "34", flutterVersion: "", androidSdk: true, cachedLayers: 6, sizeMb: 1500 },
];

export function listImages(): DockerImage[] { return [...dockerImages]; }
export function getImage(id: string): DockerImage | undefined { return dockerImages.find((i) => i.id === id); }
export function getTotalCacheSize(): number { return dockerImages.reduce((s, i) => s + i.sizeMb, 0); }
