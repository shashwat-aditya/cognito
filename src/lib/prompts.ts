/**
 * Static Gemini System Prompts and Instructions
 */

export const INTERACTIVE_INSTRUCTION = `
Response Format (JSON):
{
  "concise_text": "A brief, punchy version of the response",
  "buttons": [
    { "label": "Button Label", "next_message": "What the user would say if they clicked this" }
  ]
}
Maintain your persona but be extremely concise in 'concise_text'.
`;

export const EVALUATE_NEXT_NODE_PROMPT = (currentNodeKey: string, outgoingEdges: any[], lastMessages: any[]) => `
    Analyze the following conversation and decide if the current task/node is completed.
    If completed, decide which node to transition to based on the available next steps.

    Current Node: ${currentNodeKey}
    Available Transitions:
    ${outgoingEdges.map(e => `- To ${e.toNodeKey}: ${e.resolvedLlmPrompt}`).join("\n")}

    Recent Conversation History:
    ${lastMessages.map(msg => `${msg.role}: ${msg.parts[0].text}`).join("\n")}

    Respond with a JSON object:
    {
      "completed": boolean,
      "nextNodeKey": string | null (the node key if completed, else null),
      "reason": string
    }
  `;

export const INITIATE_CONVERSATION_PROMPT = "Please start the conversation and greet the user based on your persona.";

export const VISUAL_TEMPLATE_PROMPT = (projectId: string) => `
    Generate a high-end, abstract, and minimal SVG animation code (max 3000 chars) that will serve as a universal loading background for an agentic workflow project with ID: ${projectId}.
    Aesthetics:
    - Use a deep indigo and white color palette.
    - Abstract shapes (circles, lines, or waves) that move subtly.
    - Modern, glassmorphic feel.
    - Responsive (viewBox="0 0 100 100").
    - The animation should be constant and looping (using <animate> or CSS <style>).
    - Avoid text or specific icons, keep it abstract.
    
    Respond with a JSON object:
    {
      "visual_code": "string (the SVG code)"
    }
  `;

export const SUMMARY_PROMPT_BASE = `
    Analyze the following conversation between an AI Agent and a Visitor.
    Generate a concise, professional, and useful summary of the interaction.
    Focus on:
    1. The visitor's primary intent or needs.
    2. Key information provided by the visitor (including form data if present).
    3. The overall outcome or next steps discussed.
    
    Keep the summary structured with bullet points and under 200 words.
  `;

export const SUMMARY_PROMPT_TEMPLATE = (instructions: string, cleanHistory: any[]) => `
    ${instructions}
    
    Conversation History:
    ${cleanHistory.map(msg => `${msg.role.toUpperCase()}: ${msg.parts[0].text}`).join("\n")}
    
    Respond with a JSON object:
    {
      "summary": "string"
    }
  `;
