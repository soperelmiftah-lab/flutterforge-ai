import { NextRequest, NextResponse } from "next/server";
import { stream, chat } from "@/features/ai/chat/engine";
import { streamToResponse } from "@/features/ai/stream/sse";
import { getProvider } from "@/features/ai/provider/registry";
import { getCredential } from "@/features/ai/registry/credentials";
import { AIError, aiErrors } from "@/features/ai/errors";
import { db } from "@/lib/db";
import type { ProviderId } from "@/features/ai/provider/types";
import type { ChatMessage, ChatChunk } from "@/features/ai/chat/types";

/**
 * POST /api/v1/ai/chat
 *
 * Universal chat endpoint. Routes to the configured provider, merges prompts,
 * and returns either a JSON response (non-streaming) or an SSE stream.
 *
 * Request body:
 *   {
 *     provider, model, messages: [{role, content}],
 *     temperature?, topP?, maxTokens?, presencePenalty?, frequencyPenalty?,
 *     reasoningEffort?, stream?, customInstructions?, beginnerMode?,
 *     systemPrompt?, developerPrompt?
 *   }
 *
 * Streaming: returns text/event-stream with ChatChunk events.
 * Non-streaming: returns JSON { id, content, usage }.
 */
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "Invalid JSON body" } },
      { status: 400 }
    );
  }

  const {
    provider,
    model,
    messages,
    temperature,
    topP,
    maxTokens,
    presencePenalty,
    frequencyPenalty,
    reasoningEffort,
    stream: wantStream = true,
    customInstructions,
    beginnerMode,
    systemPrompt,
    developerPrompt,
  } = body ?? {};

  // --- Validate ---
  if (!provider || !model) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "provider and model are required" } },
      { status: 400 }
    );
  }
  if (!Array.isArray(messages)) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "messages must be an array" } },
      { status: 400 }
    );
  }

  const providerMeta = getProvider(provider as ProviderId).meta;
  if (!providerMeta.implemented) {
    return NextResponse.json(
      {
        error: {
          code: "PROVIDER_NOT_IMPLEMENTED",
          message: `Provider "${provider}" is not yet implemented. Use OpenRouter or Forge.`,
        },
      },
      { status: 501 }
    );
  }

  // --- Resolve credentials (server-side only) ---
  let apiKey: string | undefined;
  if (providerMeta.requiresApiKey) {
    try {
      apiKey = (await getCredential(provider as ProviderId)) ?? undefined;
    } catch {
      // DB might not be available — continue without credentials.
    }
    if (!apiKey) {
      return NextResponse.json(
        {
          error: {
            code: "MISSING_CREDENTIALS",
            message: `No API key configured for "${providerMeta.name}". Add one in AI Settings.`,
          },
        },
        { status: 401 }
      );
    }
  }

  // --- Build chat messages ---
  const chatMessages: ChatMessage[] = messages.map(
    (m: { role: string; content: string }, i: number) => ({
      id: `msg_${i}`,
      role: m.role,
      content: m.content,
    })
  );

  // --- Execute ---
  try {
    const engineOptions = {
      provider: provider as ProviderId,
      model,
      messages: chatMessages,
      temperature,
      topP,
      maxTokens,
      presencePenalty,
      frequencyPenalty,
      reasoningEffort,
      systemPrompt,
      developerPrompt,
      promptContext: {
        customInstructions,
        beginnerMode,
      },
      credentials: apiKey ? { apiKey } : undefined,
    };

    if (wantStream) {
      // --- Streaming (SSE) ---
      const iterable = stream(engineOptions);
      return streamToResponse(iterable, (err) => {
        const aiErr =
          err instanceof AIError
            ? err
            : aiErrors.unknown(err instanceof Error ? err.message : String(err));
        return {
          type: "error",
          error: { code: aiErr.code, message: aiErr.message },
        };
      });
    }

    // --- Non-streaming (JSON) ---
    const response = await chat(engineOptions);

    // Persist usage to DB (best-effort).
    if (response.usage) {
      recordUsage(provider, model, response.usage).catch(() => {});
    }

    return NextResponse.json({
      id: response.id,
      content: response.content,
      usage: response.usage,
      model: response.model,
      provider: response.provider,
    });
  } catch (err: unknown) {
    const aiErr =
      err instanceof AIError
        ? err
        : aiErrors.unknown(err instanceof Error ? err.message : String(err));
    const status =
      aiErr.code === "MISSING_CREDENTIALS" || aiErr.code === "INVALID_API_KEY"
        ? 401
        : aiErr.code === "RATE_LIMIT"
          ? 429
          : aiErr.code === "TIMEOUT"
            ? 504
            : 500;
    return NextResponse.json(
      { error: { code: aiErr.code, message: aiErr.message } },
      { status }
    );
  }
}

/** Best-effort usage recording for analytics/rate-limiting. */
async function recordUsage(
  provider: string,
  model: string,
  usage: { inputTokens: number; outputTokens: number; totalTokens: number }
) {
  try {
    await db.aiUsageRecord.create({
      data: {
        provider,
        model,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        totalTokens: usage.totalTokens,
      },
    });
  } catch {
    // Non-critical — ignore DB errors.
  }
}
