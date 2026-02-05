"use server";

import { db } from "@/db";
import { getWorkflowData } from "./workflow";
import { getProjectVariables } from "./variables";
import { getGeminiModel } from "../gemini";
import { resolveTemplate } from "../resolvers";
import { WorkflowNode, WorkflowEdge } from "./workflow";

export interface PreviewConfig {
  graph: any;
  version: any;
  nodes: (WorkflowNode & { resolvedSystemPrompt: string })[];
  edges: (WorkflowEdge & { resolvedLlmPrompt: string })[];
  variables: Record<string, string>;
}

export async function getPreviewConfig(projectId: string, versionId?: string, skipAuth = false): Promise<PreviewConfig> {
  const workflow = await getWorkflowData(projectId, versionId, skipAuth);
  const variables = await getProjectVariables(projectId, skipAuth);

  const variableMap = variables.reduce((acc, v: any) => {
    acc[v.key] = v.value;
    return acc;
  }, {} as Record<string, string>);

  const resolvedNodes = workflow.nodes.map((node: any) => ({
    ...(node as WorkflowNode),
    resolvedSystemPrompt: resolveTemplate(node.systemPromptTemplate || "", variableMap)
  }));

  const resolvedEdges = workflow.edges.map((edge: any) => ({
    ...(edge as WorkflowEdge),
    resolvedLlmPrompt: resolveTemplate(edge.llmPromptTemplate || "", variableMap)
  }));

  return {
    ...workflow,
    nodes: resolvedNodes,
    edges: resolvedEdges,
    variables: variableMap
  };
}


export type ChatMessage = {
  role: "user" | "model" | "system";
  parts: { text: string }[];
  interactive?: {
    concise_text: string;
    buttons: { label: string; next_message: string }[];
  };
};

import { 
  INTERACTIVE_INSTRUCTION, 
  EVALUATE_NEXT_NODE_PROMPT, 
  INITIATE_CONVERSATION_PROMPT, 
  SUMMARY_PROMPT_BASE, 
  SUMMARY_PROMPT_TEMPLATE 
} from "../prompts";

export async function chatWithAgent(
  systemPrompt: string,
  history: ChatMessage[],
  userInput: string
) {
  const model = getGeminiModel();
  
  const mappedHistory = history.map(msg => ({
    role: msg.role === "system" ? "user" : (msg.role as any),
    parts: msg.parts
  }));

  // Gemini requires the first message to be from 'user'
  if (mappedHistory.length > 0 && mappedHistory[0].role === "model") {
    mappedHistory.unshift({
      role: "user",
      parts: [
        { 
          text: "System context established. Please introduce yourself and begin the conversation based on your persona." 
        }
      ]
    });
  }

  // Create a chat session with the system prompt and history
  const chat = model.startChat({
    systemInstruction: {
      role: "system",
      parts: [{ text: systemPrompt + "\n" + INTERACTIVE_INSTRUCTION }]
    },
    history: mappedHistory,
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const result = await chat.sendMessage(userInput);
  const text = result.response.text();
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    return JSON.parse(text.substring(start, end + 1));
  } catch (err) {
    console.error("Failed to parse chat response:", text);
    throw new Error("Invalid agent response format");
  }
}

export async function evaluateNextNode(
  currentNodeKey: string,
  history: ChatMessage[],
  edges: WorkflowEdge[]
) {
  const outgoingEdges = edges.filter(e => e.fromNodeKey === currentNodeKey);
  if (outgoingEdges.length === 0) return { completed: false, nextNodeKey: null };

  const model = getGeminiModel();
  
  const lastMessages = history.slice(-10);

  const prompt = EVALUATE_NEXT_NODE_PROMPT(currentNodeKey, outgoingEdges, lastMessages);

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const text = result.response.text();
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    return JSON.parse(text.substring(start, end + 1));
  } catch (err) {
    console.error("Failed to parse evaluation response:", text);
    return { completed: false, nextNodeKey: null, reason: "Parsing error" };
  }
}

export async function initiateAgentConversation(systemPrompt: string) {
  const model = getGeminiModel();
  
  const result = await model.generateContent({
    systemInstruction: {
      role: "system",
      parts: [{ text: systemPrompt + "\n" + INTERACTIVE_INSTRUCTION }]
    },
    contents: [{ role: "user", parts: [{ text: INITIATE_CONVERSATION_PROMPT }] }],
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const text = result.response.text();
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    return JSON.parse(text.substring(start, end + 1));
  } catch (err) {
    console.error("Failed to parse initial message:", text);
    throw new Error("Failed to start agent conversation");
  }
}



export async function generateConversationSummary(history: ChatMessage[], customInstructions?: string) {
  const model = getGeminiModel();
  
  // Filter out system messages for the summary
  const cleanHistory = history.filter(m => m.role !== 'system' as any);
  
  const instructions = customInstructions ? `
    ${customInstructions}
    
    CRITICAL: Ensure the response is a valid JSON object. Escape all double quotes and newlines within the summary string.
  ` : `
    ${SUMMARY_PROMPT_BASE}
    CRITICAL: Ensure the response is a valid JSON object. Escape all double quotes and newlines within the summary string.
  `;
  
  const prompt = SUMMARY_PROMPT_TEMPLATE(instructions, cleanHistory);


  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const text = result.response.text();
    // More robust parsing: find the first { and last }
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error("No JSON found in response");
    
    const jsonStr = text.substring(start, end + 1);
    return JSON.parse(jsonStr) as { summary: string };
  } catch (error) {
    console.error("Failed to generate or parse conversation summary:", error);
    return {
      summary: "### Conversation Recap\n\n*   **Intent**: The visitor engaged with the agent to explore available options.\n*   **Key Points**: Several topics were discussed throughout the session.\n*   **Outcome**: The conversation provided initial context for the visitor's needs.\n\n*(Note: Automated summary generation encountered a temporary issue. Full chat remains available for review.)*"
    };
  }
}
