/**
 * @module features/workspace-intelligence/actions
 *
 * Code Action placeholder contracts. These are the interfaces future phases
 * implement to provide IDE-like code intelligence:
 *
 *   - RefactorEngine       — extract widget, extract method, inline, etc.
 *   - RenameSymbol         — rename a symbol across the project
 *   - FindReferences       — find all usages of a symbol
 *   - GoToDefinition       — jump to a symbol's declaration
 *   - ImplementationFinder — find implementations of an abstract interface
 *
 * Phase 3 ships the contracts only. Each throws NOT_IMPLEMENTED.
 */

import type {
  WorkspacePath,
  SymbolRef,
} from "@/features/workspace-intelligence/types";
import { aiErrors } from "@/features/ai/errors";

/** A location in a file. */
export interface SourceLocation {
  path: WorkspacePath;
  line: number;
  column: number;
}

/** A text edit to apply. */
export interface TextEdit {
  path: WorkspacePath;
  range: { startLine: number; startColumn: number; endLine: number; endColumn: number };
  newText: string;
}

/** Refactor kinds. */
export type RefactorKind =
  | "extract-widget"
  | "extract-method"
  | "inline"
  | "convert-to-stateless"
  | "convert-to-stateful"
  | "wrap-with"
  | "move-to-file";

/** A refactor operation. */
export interface RefactorOperation {
  kind: RefactorKind;
  label: string;
  description: string;
  edits: TextEdit[];
}

/** The refactor engine contract. */
export interface RefactorEngine {
  listRefactors(location: SourceLocation): Promise<RefactorOperation[]>;
  applyRefactor(refactor: RefactorOperation): Promise<void>;
}

/** Stub refactor engine. */
export class StubRefactorEngine implements RefactorEngine {
  async listRefactors(_location: SourceLocation): Promise<RefactorOperation[]> {
    throw aiErrors.notImplemented("Refactor Engine");
  }
  async applyRefactor(_refactor: RefactorOperation): Promise<void> {
    throw aiErrors.notImplemented("Refactor Engine");
  }
}

/** The rename symbol contract. */
export interface RenameSymbol {
  /** Preview all locations that would be renamed. */
  previewRename(location: SourceLocation, newName: string): Promise<TextEdit[]>;
  /** Apply the rename. */
  apply(location: SourceLocation, newName: string): Promise<void>;
}

export class StubRenameSymbol implements RenameSymbol {
  async previewRename(_location: SourceLocation, _newName: string): Promise<TextEdit[]> {
    throw aiErrors.notImplemented("Rename Symbol");
  }
  async apply(_location: SourceLocation, _newName: string): Promise<void> {
    throw aiErrors.notImplemented("Rename Symbol");
  }
}

/** A reference location. */
export interface ReferenceLocation extends SourceLocation {
  symbol: SymbolRef;
  /** Whether this is a definition (vs a usage). */
  isDefinition: boolean;
}

/** The find-references contract. */
export interface FindReferences {
  findAll(symbol: SymbolRef): Promise<ReferenceLocation[]>;
}

export class StubFindReferences implements FindReferences {
  async findAll(_symbol: SymbolRef): Promise<ReferenceLocation[]> {
    throw aiErrors.notImplemented("Find References");
  }
}

/** The go-to-definition contract. */
export interface GoToDefinition {
  resolve(location: SourceLocation): Promise<SourceLocation | null>;
}

export class StubGoToDefinition implements GoToDefinition {
  async resolve(_location: SourceLocation): Promise<SourceLocation | null> {
    throw aiErrors.notImplemented("Go To Definition");
  }
}

/** The implementation finder contract. */
export interface ImplementationFinder {
  findImplementations(symbol: SymbolRef): Promise<SymbolRef[]>;
}

export class StubImplementationFinder implements ImplementationFinder {
  async findImplementations(_symbol: SymbolRef): Promise<SymbolRef[]> {
    throw aiErrors.notImplemented("Implementation Finder");
  }
}

/** All code-action singletons (stubs in Phase 3). */
export const refactorEngine: RefactorEngine = new StubRefactorEngine();
export const renameSymbol: RenameSymbol = new StubRenameSymbol();
export const findReferences: FindReferences = new StubFindReferences();
export const goToDefinition: GoToDefinition = new StubGoToDefinition();
export const implementationFinder: ImplementationFinder = new StubImplementationFinder();
