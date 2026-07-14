import { NextResponse } from "next/server";
export async function POST() { return NextResponse.json({ data: { id: "tree_1", root: { id: "n1", type: "Scaffold", category: "material", properties: {}, children: [], canBeConst: false, rebuildCost: 0.3 }, nodeCount: 1, maxDepth: 1, validated: true, optimized: false, warnings: [] } }); }
