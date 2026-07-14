/** State Management */
import type { StateManagementInfo } from "../types";
export type StateManagementKind = "riverpod" | "bloc" | "cubit" | "provider" | "getx" | "valuenotifier" | "changenotifier" | "inheritedwidget";
export const stateManagementOptions: StateManagementInfo[] = [
  { kind: "riverpod" as any, name: "Riverpod", description: "Reactive caching & state management. Compile-safe, testable.", pros: ["Compile-safe", "No BuildContext", "AutoDispose"], cons: ["Learning curve"], useCases: ["App-wide state", "API caching", "DI"], packages: ["flutter_riverpod"] },
  { kind: "bloc" as any, name: "Bloc", description: "Predictable state with events and states.", pros: ["Separation of concerns", "Testable"], cons: ["More boilerplate"], useCases: ["Complex logic", "Event-driven"], packages: ["flutter_bloc"] },
  { kind: "provider" as any, name: "Provider", description: "DI wrapper around InheritedWidget.", pros: ["Simple", "Lightweight"], cons: ["BuildContext dependent"], useCases: ["Simple DI", "Small apps"], packages: ["provider"] },
];
export function getStateManagement(kind: string): StateManagementInfo | undefined { return stateManagementOptions.find(s => s.kind === kind); }
