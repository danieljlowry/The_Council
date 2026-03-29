What the logic appears to be is a **sequential multi-model relay**, not a parallel ensemble.

The intended logic looks like this:

1. `Primary Prompt` is the anchor for the whole council run.
2. A `Crown model` goes first and produces the initial answer.
3. That answer is passed to the next model, then the next, then the next.
4. Each downstream model seems to receive:
   - the original `Primary Prompt`
   - the previous model’s response
5. The whole chain repeats for up to `MAX_ROUND = 2`.
6. Round 1 is for **exploration / initial response**.
7. Round 2 is for **refinement / critique of the first-pass findings**.
8. After the last model in the last round, the system produces the final output.

So architecturally, this is closer to a **baton-passing debate/synthesis loop** than a “multiple models answer independently and then vote” setup.

Your repo already reflects that same mental model. The schema explicitly has:
- a `primaryPrompt`
- a special `CROWN` slot
- multiple ordered agent slots
- numbered rounds
- per-round message sequences

```50:59:backend/prisma/schema.prisma
/// User-owned workspace for a multi-agent debate (1–4 agents, 2 rounds).
model Council {
  id            String        @id @default(uuid()) @db.Uuid
  ownerId       String        @map("owner_id") @db.Uuid
  title         String
  /// Layer 1: primary prompt — anchors the whole session.
  primaryPrompt String        @map("primary_prompt") @db.Text
  status        CouncilStatus @default(DRAFT)
  /// Final combined summary after round 2 (for UI).
  finalSummary  String?       @map("final_summary") @db.Text
```

```72:80:backend/prisma/schema.prisma
/// One row per agent slot (Crown + up to three follow-ups) for a council.
model CouncilAgent {
  id          String    @id @default(uuid()) @db.Uuid
  councilId   String    @map("council_id") @db.Uuid
  slot        AgentSlot
  displayName String    @map("display_name")
  specialty   String    @db.Text
  /// Optional OpenRouter / model identifier for orchestration.
  modelKey    String?   @map("model_key")
```

And the current run-page mock already simulates this exact “cycle through ordered models for N rounds” behavior:

```266:281:frontend/app/(authenticated)/council/[id]/page.tsx
if (!councilData || orderedModels.length === 0 || isFinished || relayStartedRef.current) {
  return;
}

relayStartedRef.current = true;
let cancelled = false;

if (USE_MOCK_RELAY) {
  const runMockRelay = async () => {
    const existingLogCount = logs.length;
    const startCycle = Math.floor(existingLogCount / orderedModels.length) + 1;
    const startStepIndex = existingLogCount % orderedModels.length;
    let nextSequence = logs[logs.length - 1]?.sequence ?? 0;
    let finalSummary = councilData.finalSummary ?? logs[logs.length - 1]?.content ?? "";
```

```281:350:frontend/app/(authenticated)/council/[id]/page.tsx
for (let cycleNumber = startCycle; cycleNumber <= councilData.rounds.length; cycleNumber += 1) {
  // ...
  for (let stepIndex = firstStepIndex; stepIndex < orderedModels.length; stepIndex += 1) {
    const activeModel = orderedModels[stepIndex];
    setCurrentCycle(cycleNumber);
    setCurrentStepIndex(stepIndex);
    setIsProcessing(true);

    await waitForMockStep();

    nextSequence += 1;
    finalSummary = getFakeMessage(activeModel.modelId, cycleNumber);

    const newLog: LogEntry = {
      id: `mock-${cycleNumber}-${stepIndex}-${nextSequence}`,
      modelId: activeModel.modelId,
      modelName: activeModel.name,
      role: activeModel.role,
      cycle: cycleNumber,
      step: stepIndex + 1,
      content: finalSummary,
      // ...
    };
```

## My read of the whiteboard
The most likely prompt contract per model is something like:

- `system`: role/specialty for that agent
- `input`: original `Primary Prompt`
- `context`: previous model’s latest response
- maybe also: prior round summary / memory

That matches your schema too, because `CouncilRound.memorySummary` looks like a natural fit for “what survived from the previous round,” and `userFeedback` fits “human critique between round 1 and round 2.”

## What the “Crown” probably means
The crown model is probably the **lead model**:
- it frames the initial answer in round 1
- in round 2 it may re-open based on prior outputs or summaries
- it may also be the best/default synthesis model

In other words, the crown is not just “first in UI order”; it likely has a distinct orchestration role.

## Important ambiguities in the drawing
The board is useful, but it leaves a few implementation-critical details unspecified:

- Does each model see only the **immediately previous response**, or the **full transcript so far**?
- In round 2, does the crown model receive:
  - only the last model’s round-1 response, or
  - a compressed round-1 summary?
- Is the final answer just the **last model’s output**, or a separate final synthesis call?
- Are all models given the same primary prompt plus different role instructions, or does the crown get a special system prompt?
- Does round 2 always happen, or only when confidence is low / critique is needed?

Those decisions will strongly affect quality and cost.

## Best interpretation as implementation logic
If I had to translate the board into backend orchestration pseudocode, I’d read it like this:

```ts
for (round = 1; round <= 2; round++) {
  let baton =
    round === 1
      ? primaryPrompt
      : roundOneSummaryOrLastResponse;

  for (agent of orderedAgents) {
    const response = await callOpenRouter({
      model: agent.modelKey,
      primaryPrompt,
      round,
      previousResponse: baton,
      role: agent.specialty,
      transcriptSoFar,
    });

    saveMessage(round, agent, response);
    baton = response;
  }

  saveRoundSummary(round, summarizeRoundMessages());
}

finalSummary = baton; // or separate synth step
completeCouncil(finalSummary);
```

## Practical recommendation
If you want this architecture to be stable, I’d define the backend around **three layers of context**:

- `Layer 1`: immutable `primaryPrompt`
- `Layer 2`: recent baton/transcript for the current round
- `Layer 3`: compressed `memorySummary` from previous round(s)

That would line up very cleanly with your schema and the whiteboard.

My short conclusion: the board describes a **two-round, sequential relay of specialized models, led by a crown model, with the original prompt preserved throughout and each model refining the previous model’s answer**.

If you want, I can next turn this whiteboard into a concrete backend spec for `/api/council/[id]/run`, including request flow, prompt template structure, and what each DB write should happen at each step.