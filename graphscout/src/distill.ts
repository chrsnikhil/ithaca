/**
 * Turns a raw subgraph GraphQL SDL into a compact, agent-readable model.
 *
 * Two jobs:
 *  1) Distillation — the raw SDL of a real subgraph is thousands of tokens; agents choke on
 *     it. We extract just the entities, their fields, and the queryable entry points, plus a
 *     couple of example queries. Cheap for a model to read.
 *  2) A structured view the INTELLIGENCE layer (ontology.ts / intel.ts) uses to classify a
 *     protocol (which entity/type names are present) and to find metric fields heuristically
 *     when a subgraph doesn't follow a standardized schema.
 */
import { parse, Kind } from "graphql";
import type { DocumentNode, ObjectTypeDefinitionNode, FieldDefinitionNode, TypeNode } from "graphql";

const SCALARS = new Set([
  "ID", "String", "Int", "Float", "Boolean",
  "BigInt", "BigDecimal", "Bytes", "Int8", "Timestamp",
]);

export interface DistilledField {
  name: string;
  type: string;      // rendered, e.g. "BigDecimal!" or "[Market!]!"
  base: string;      // underlying type name, e.g. "Market"
  isRelation: boolean;
  isList: boolean;
}
export interface DistilledEntity {
  name: string;
  fields: DistilledField[];
}
export interface DistilledEntryPoint {
  field: string;     // the Query field, e.g. "markets"
  returns: string;   // entity it returns, e.g. "Market"
  list: boolean;
}
export interface Distilled {
  entryPoints: DistilledEntryPoint[];
  entities: DistilledEntity[];
  entityNames: string[];   // all object type names (for classification signals)
  examples: string[];
}

function typeName(t: TypeNode): string {
  if (t.kind === Kind.NON_NULL_TYPE) return typeName(t.type) + "!";
  if (t.kind === Kind.LIST_TYPE) return "[" + typeName(t.type) + "]";
  return t.name.value;
}
function baseTypeName(t: TypeNode): string {
  if (t.kind === Kind.NON_NULL_TYPE) return baseTypeName(t.type);
  if (t.kind === Kind.LIST_TYPE) return baseTypeName(t.type);
  return t.name.value;
}
function isListType(t: TypeNode): boolean {
  if (t.kind === Kind.NON_NULL_TYPE) return isListType(t.type);
  return t.kind === Kind.LIST_TYPE;
}

/** Parse an SDL string into the distilled model. Throws with a clear message on bad input. */
export function distill(sdl: string, opts?: { maxEntities?: number; maxFields?: number }): Distilled {
  const maxEntities = opts?.maxEntities ?? 60;
  const maxFields = opts?.maxFields ?? 24;

  let doc: DocumentNode;
  try {
    doc = parse(sdl);
  } catch (e) {
    throw new Error("Could not parse schema SDL: " + (e as Error).message);
  }

  const objects = doc.definitions.filter(
    (d): d is ObjectTypeDefinitionNode => d.kind === Kind.OBJECT_TYPE_DEFINITION,
  );

  const queryType = objects.find((o) => o.name.value === "Query");
  const entryPoints: DistilledEntryPoint[] = (queryType?.fields ?? []).map((f) => ({
    field: f.name.value,
    returns: baseTypeName(f.type),
    list: isListType(f.type),
  }));

  const entityDefs = objects.filter(
    (o) => !["Query", "Subscription"].includes(o.name.value) && !o.name.value.startsWith("_"),
  );

  const entityNames = entityDefs.map((o) => o.name.value);

  const entities: DistilledEntity[] = entityDefs.slice(0, maxEntities).map((o) => {
    const fields: DistilledField[] = (o.fields ?? []).slice(0, maxFields).map((f: FieldDefinitionNode) => {
      const base = baseTypeName(f.type);
      return {
        name: f.name.value,
        type: typeName(f.type),
        base,
        isRelation: !SCALARS.has(base),
        isList: isListType(f.type),
      };
    });
    return { name: o.name.value, fields };
  });

  // Build 1-2 example queries from list entry points, using scalar fields only.
  const byName = new Map(entities.map((e) => [e.name, e]));
  const examples: string[] = [];
  for (const ep of entryPoints.filter((e) => e.list).slice(0, 3)) {
    const ent = byName.get(ep.returns);
    if (!ent) continue;
    const scalars = ent.fields.filter((f) => !f.isRelation).slice(0, 6).map((f) => f.name);
    if (!scalars.includes("id")) scalars.unshift("id");
    examples.push(`{ ${ep.field}(first: 5) { ${scalars.join(" ")} } }`);
    if (examples.length >= 2) break;
  }

  return { entryPoints, entities, entityNames, examples };
}

/** Render a distilled schema as compact text for an agent to read. */
export function formatDistilled(d: Distilled): string {
  const out: string[] = [];
  out.push("QUERYABLE ENTRY POINTS (top-level query fields):");
  out.push(d.entryPoints.map((e) => `  ${e.field}${e.list ? " (list)" : ""} -> ${e.returns}`).join("\n") || "  (none)");
  out.push("");
  out.push("ENTITIES (-> marks a relation to another entity):");
  for (const e of d.entities) {
    const fs = e.fields.map((f) => `${f.name}: ${f.type}${f.isRelation ? " ->" : ""}`).join(", ");
    out.push(`  ${e.name} { ${fs} }`);
  }
  if (d.examples.length) {
    out.push("");
    out.push("EXAMPLE QUERIES:");
    for (const ex of d.examples) out.push("  " + ex);
  }
  return out.join("\n");
}

/** Find fields on an entity whose name matches any of the given (case-insensitive) patterns. */
export function findFields(entity: DistilledEntity | undefined, patterns: RegExp[]): DistilledField[] {
  if (!entity) return [];
  return entity.fields.filter((f) => patterns.some((p) => p.test(f.name)));
}
