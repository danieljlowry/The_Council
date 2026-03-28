Figma Make

Design a high-fidelity desktop-first web app prototype called "The Council".

The provided design is for reference and for you to use

The Council is an AI web app where a user logs in, selects multiple LLMs, chooses one preferred crowned model, asks a question, and watches the models process the question through a structured relay across multiple cycles. The crowned model always goes first. Each following model receives the previous model’s output, refines it from its own role or perspective, and passes it on. After the last model finishes the last cycle, the user receives one final council response.

Create a polished, production-quality Figma prototype with reusable components, variants, clear information architecture, and clickable flows from login to final result. Build the full user journey, not isolated screens.

Brand and style direction:
- Product name: The Council
- Product concept: a premium AI council that passes reasoning sequentially through multiple models
- Tone: intelligent, premium, structured, modern, slightly playful but still professional
- Primary brand colors:
  - Cobalt Blue: #002D72
  - Emerald Green: #007749
- Use white and soft neutral surfaces for the main product background
- Use cobalt blue for structure, navigation emphasis, active controls, and system identity
- Use emerald green for progress completion, success states, and the final response-ready state
- Use a warm amber accent only for warnings and invalid question states
- Use a modern SaaS design language with rounded corners, subtle shadows, crisp spacing, refined typography, and strong hierarchy
- Make this feel investor-demo ready, not like a rough hackathon mockup

Layout requirements:
- Design primarily for desktop around 1440px width
- Use a stable 3-column application layout:
  - Left sidebar for app branding, search, previous debates, and navigation
  - Large center workspace for setup, council stage, and process visualization
  - Right panel for the live council log / structured message relay
- Also create one tablet adaptation where the right panel becomes narrower or stacks below the center content
- Keep the shell consistent throughout the flow so it feels like one real product

Core product behavior:
- The user submits one question
- The user selects multiple LLMs to join the council
- One selected LLM is marked as preferred and visually given a crown
- The crowned model always goes first and acts as the starting model in the sequence
- The remaining selected models follow in a fixed order after the crown
- The process is not a free-form many-to-many chat debate
- The process is a strict sequential relay
- One cycle means the output passes through all selected models once in order
- If multiple cycles are selected, the sequence repeats from the crowned model using the previous cycle’s output as the new context
- The user receives one final answer only, produced by the last model in the final cycle
- The UI must clearly communicate ordered handoff, not chaotic discussion
- The crown is functionally important, not decorative only

Use this concrete mockup example:
- User question:
  "Should early-stage startups prioritize speed or reliability when building their MVP?"
- Selected models:
  - GPT-5, crowned, role: Generalist
  - Claude, role: Realist
  - Llama, role: Creative Strategist
- Number of cycles:
  - 2
- Relay order:
  - Cycle 1: GPT-5 -> Claude -> Llama
  - Cycle 2: GPT-5 -> Claude -> Llama
- The final answer shown to the user is the output from Llama at the end of Cycle 2

Model role direction:
- Crowned model: generalist / jack-of-all-trades / first framing model
- Claude: realist / critical tradeoff reviewer
- Llama: creative strategist / synthesis-oriented reframer
- Make role badges visible on model cards and in the log
- Show that each model contributes a different lens to the process

Build these screens and prototype states in order:

1. Login screen
Create a polished login page for The Council.
Requirements:
- Split-screen or balanced modern composition
- Include product wordmark: The Council
- Include a short tagline such as:
  - "Ask a question. Let the council think it through."
- Add:
  - Email field
  - Password field
  - Continue button
  - Sign in with Google button
  - Forgot password link
  - Sign up link
- Include polished field states:
  - default
  - focused
  - error
- Add a subtle hero illustration or abstract AI/council visual that hints at multiple models collaborating
- This screen should feel premium and credible

2. Post-login dashboard / home
Create the main application shell after login.
Requirements:
- Left sidebar includes:
  - The Council logo/header
  - search bar
  - “New Council” or “New Debate” primary CTA
  - list of previous chats/debates such as:
    - Analog Clock React app
    - Simple Design System
    - Figma variable planning
    - OKLCH token algorithm
    - Component naming advice
  - user profile/avatar area near the bottom
- Center panel shows a welcome state inviting the user to start a new council run
- Right panel shows an empty state for the council log
- Keep the layout consistent with later screens

3. Setup screen for a new council
This is the setup experience before the relay begins.
Requirements:
- Preserve the full 3-column shell
- The center area should introduce the council visually with an ordered stage or table concept
- Show selected model cards or avatars arranged in explicit sequence, not randomly
- The crowned model must always appear first
- Show empty slots or add-model buttons if helpful
- Include a clear setup form with:
  - optional debate title / session name
  - question input textarea
  - cycles selector
  - selected models section
  - preferred crowned model selection
  - ordered model list
  - start council button
- Include cycle options such as:
  - 1 cycle
  - 2 cycles
  - 3 cycles
  - custom
- Add helper copy:
  - "One cycle means the response passes through every selected model once."
  - "The crowned model always starts."
  - "Each model receives the previous model’s output."
  - "After the final model completes the last cycle, the council returns one final answer."
- Show role badges on each selected model
- Let non-crowned models be reorderable in concept, but keep the crowned model locked in the first position
- Make the setup feel structured and easy to understand

4. Invalid prompt / non-question state
Create a setup variant where the user entered a statement instead of a question.
Example invalid input:
- "Build me a productivity app"
Requirements:
- Show a clear warning flag or warning banner near the question field
- The warning should say something like:
  - "The Council only starts when you ask a question."
  - "Please rewrite your prompt as a question."
- Disable or visually block the start action
- Preserve the rest of the setup information so the user understands only the prompt format is invalid
- Use a polished amber warning style that still fits the brand palette
- This should be a deliberate and well-designed validation state, not an afterthought

5. Valid setup ready state
Create the completed setup state before launch.
Requirements:
- Show the user has:
  - selected GPT-5, Claude, and Llama
  - crowned GPT-5
  - chosen 2 cycles
  - entered the valid startup question
- The start council button should be fully enabled
- The relay order should be visually obvious:
  - GPT-5 -> Claude -> Llama
- Make the center stage feel exciting and memorable while still practical for implementation

6. Council relay in progress: start state
This is the main experience after the user starts the process.
Requirements:
- Keep the left sidebar and overall app shell visible
- Center panel should show the selected models in a clear sequential chain
- The crowned model is visually emphasized with a crown and appears first
- Show a clear process header with information like:
  - "Council in Progress"
  - "Cycle 1 of 2"
  - "Step 1 of 3"
- Add a progress bar or step tracker that reflects:
  - current cycle
  - current model in sequence
  - total completion
- Highlight the current active model only
- Show directional arrows or handoff visuals between models
- The right panel should show a live council log, but the messages must appear in strict sequence
- The first message must come from GPT-5 in Cycle 1, Step 1
- Add a typing/processing indicator only for the active model

7. Council relay in progress: mid-cycle state
Create a later state in the same council run.
Requirements:
- Show Cycle 1 partway through
- Example:
  - GPT-5 has already spoken
  - Claude is active or has just responded
  - Llama is next
- The right-side panel should show ordered entries with metadata:
  - model name
  - role
  - cycle number
  - step number
- Visually group or label messages by cycle
- Make the log feel like a structured reasoning relay, not a social group chat
- Show baton-passing behavior with arrows, progress chips, connectors, or subtle motion cues

8. Council relay in progress: cycle completed state
Create the state after the first full cycle is finished.
Requirements:
- Show that Cycle 1 is complete
- The last message in Cycle 1 should be from Llama
- Add a visible transition indicating the process is restarting from the crowned model for Cycle 2
- The center panel should update to:
  - "Cycle 2 of 2"
  - "Step 1 of 3"
- The right panel should clearly separate Cycle 1 from Cycle 2 with dividers or labels
- Make it obvious that the output from Cycle 1 is now being passed back to GPT-5 to begin Cycle 2

9. Council relay in progress: final cycle near completion
Create a state near the end of the full process.
Requirements:
- Show Cycle 2 in progress
- Example:
  - GPT-5 and Claude have already responded in Cycle 2
  - Llama is the current active model
- Progress indicator should be close to complete
- Right panel should show all previous steps in order:
  - Cycle 1: GPT-5 -> Claude -> Llama
  - Cycle 2: GPT-5 -> Claude -> Llama
- Only the current active model should have typing or processing UI
- Make the interface readable even with a longer log

10. Final response ready notification state
After the last model in the last cycle finishes, create the completion state.
Requirements:
- Show a prominent success badge near the top of the interface
- Use emerald green to indicate completion
- Example badge labels:
  - "Final Council Response Ready"
  - "Council Output Complete"
- Progress indicator should now show 100% complete
- No model should be actively speaking anymore
- The center panel should look resolved and finished
- The right log should show the full completed relay
- The UI should clearly communicate that the system has finished and one final answer is available

11. Final council response modal
When the completion badge is clicked, open a polished centered modal.
Requirements:
- Modal title:
  - "Final Council Response"
- Include:
  - a small status badge like "Completed after 2 cycles"
  - the final answer text
  - a compact summary of the participating models and their roles
  - metadata such as:
    - Started by crowned model
    - Passed through 3 models
    - Completed in 2 cycles
  - Close button
  - Optional secondary actions:
    - Save debate
    - Start new council
- Add a line such as:
  - "Generated after sequential review by 3 models across 2 cycles."
- Make the modal feel like the climax of a deliberate structured reasoning process
- Use premium spacing, readable line length, strong visual hierarchy, and refined motion if applicable

12. Completed / saved debate state
Create the final persisted state after closing the modal.
Requirements:
- Show the completed council run saved in the left sidebar history
- The center panel can show a completed council stage or resolved process state
- The right panel should remain readable as an archived council log
- The final response should still be accessible through a “View Response” or “View Conclusion” action
- This should feel like the end of the journey and a reusable saved artifact

Message content requirements:
- Do not use lorem ipsum for the council log
- Use thoughtful sample writing that reflects each model’s role
- Keep the log intelligent and concise
- The sequence must reflect structured handoff:
  - GPT-5 frames the initial answer
  - Claude reviews tradeoffs and realism
  - Llama reframes or synthesizes creatively
  - Then the second cycle repeats using the evolving output
- Make the final response feel more refined than the earlier steps

Component requirements:
Build reusable components and variants for:
- sidebar nav item
- search field
- model token / model card
- crowned preferred state
- role badge
- add-model button
- ordered sequence / handoff connector
- question input
- warning flag / validation banner
- cycles selector
- primary and secondary buttons
- council log message item
- typing / processing indicator
- cycle divider
- progress bar / step tracker
- success badge
- modal
- archived debate row
Use Auto Layout wherever appropriate and keep the system implementation-ready.

Interaction requirements for prototype:
- Login button goes to dashboard
- New Council goes to setup
- Invalid prompt state is reachable from setup
- Valid setup launches the council process
- In-progress states advance from:
  - start state
  - mid-cycle
  - cycle complete
  - final cycle near completion
  - response ready
- Clicking the completion badge opens the final response modal
- Closing the modal returns to the completed debate screen
- Prototype links should clearly demonstrate the end-to-end user journey

Visual behavior requirements:
- The crown must always remain attached to the first model in the chain
- The center stage should emphasize ordered progression more than equal discussion
- Use arrows, node progression, linked cards, or directional handoff cues
- The right panel should feel like a logged reasoning relay rather than a casual group chat
- Preserve premium SaaS quality throughout
- Keep the design specific enough that frontend engineers can implement it directly

Output expectation:
- Produce a polished connected Figma prototype for the full user journey from login to final council response
- Include reusable components, clear state variants, and interaction flow
- Make the relay logic extremely obvious visually
- Make the design feel distinctive, memorable, and implementation-ready