// Small file formatting to the structure of each agent's output


export type AgentOutput = {

    answer?: string // Agent's output as string
    summary?: string // (Optional) Summary of debate (used later)
    issues?: string[]
    improvements?: string[]

}