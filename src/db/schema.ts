import { pgTable, text, uuid, integer, timestamp, jsonb, pgEnum, uniqueIndex, numeric, boolean, unique, index } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// --- Enums ---

export const versionStatusEnum = pgEnum('version_status', ['draft', 'published', 'archived']);
export const runStatusEnum = pgEnum('run_status', ['running', 'waiting', 'ended', 'error']);
export const stepStatusEnum = pgEnum('step_status', ['STARTED', 'SUCCEEDED', 'FAILED']);
export const runEventTypeEnum = pgEnum('run_event_type', ['USER_MESSAGE', 'AGENT_OUTPUT', 'TOOL_RESULT', 'SYSTEM']);
export const toolTypeEnum = pgEnum('tool_type', ['HTTP_REQUEST']);

// --- Tables ---

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => [
  index('projects_user_id_idx').on(table.userId),
]);

export const projectVariables = pgTable('project_variables', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  key: text('key').notNull(),
  value: text('value').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  unique('project_variables_project_id_key_unique').on(table.projectId, table.key),
  index('project_variables_project_id_idx').on(table.projectId),
]);


export const graphs = pgTable('graphs', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => [
  index('graphs_project_id_idx').on(table.projectId),
]);

export const graphVersions = pgTable('graph_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  graphId: uuid('graph_id').notNull().references(() => graphs.id, { onDelete: 'cascade' }),
  versionNumber: integer('version_number').notNull(),
  status: versionStatusEnum('status').default('draft').notNull(),
  isActive: boolean('is_active').default(false).notNull(),
  publicToken: text('public_token'),
  visitCount: integer('visit_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('graph_versions_graph_id_idx').on(table.graphId),
  uniqueIndex('graph_versions_public_token_idx').on(table.publicToken),
]);

export const graphNodes = pgTable('graph_nodes', {
  id: uuid('id').primaryKey().defaultRandom(),
  versionId: uuid('version_id').notNull().references(() => graphVersions.id, { onDelete: 'cascade' }),
  nodeKey: text('node_key').notNull(),
  title: text('title').notNull(),
  systemPromptTemplate: text('system_prompt_template'),
  structuredOutputSchema: jsonb('structured_output_schema').notNull(),
  structuredOutputConfig: jsonb('structured_output_config'),
  config: jsonb('config'),
  formConfig: jsonb('form_config'),
  reportConfig: jsonb('report_config'),
  position: jsonb('position'),
}, (table) => [
  unique('graph_nodes_version_id_node_key_unique').on(table.versionId, table.nodeKey),
  index('graph_nodes_version_id_idx').on(table.versionId),
]);

export const graphEdges = pgTable('graph_edges', {
  id: uuid('id').primaryKey().defaultRandom(),
  versionId: uuid('version_id').notNull().references(() => graphVersions.id, { onDelete: 'cascade' }),
  edgeKey: text('edge_key').notNull(),
  fromNodeKey: text('from_node_key').notNull(),
  toNodeKey: text('to_node_key').notNull(),
  priority: integer('priority').default(0),
  llmPromptTemplate: text('llm_prompt_template').notNull(),
  llmModel: text('llm_model'),
  threshold: numeric('threshold'),
  routerOutputSchema: jsonb('router_output_schema').default({ pass: 'boolean', confidence: 'number', reason: 'string?' }),
  fallback: boolean('fallback').default(false).notNull(),
}, (table) => [
  unique('graph_edges_version_id_edge_key_unique').on(table.versionId, table.edgeKey),
  index('graph_edges_version_id_idx').on(table.versionId),
  // Partial unique index to enforce only one fallback per fromNodeKey in a version
  uniqueIndex('graph_edges_one_fallback_per_node_idx')
    .on(table.versionId, table.fromNodeKey)
    .where(sql`fallback = true`),
]);

export const nodeSteps = pgTable('node_steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  versionId: uuid('version_id').notNull().references(() => graphVersions.id, { onDelete: 'cascade' }),
  stepKey: text('step_key').notNull(),
  nodeKey: text('node_key').notNull(),
  stepOrder: integer('step_order').notNull(),
  type: toolTypeEnum('type').notNull(),
  config: jsonb('config').notNull(),
}, (table) => [
  index('node_steps_version_id_idx').on(table.versionId),
  index('node_steps_node_key_idx').on(table.nodeKey),
]);

export const compiledGraphs = pgTable('compiled_graphs', {
  versionId: uuid('version_id').primaryKey().references(() => graphVersions.id, { onDelete: 'cascade' }),
  checksum: text('checksum').notNull(),
  compiledJson: jsonb('compiled_json').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- Runtime Tables ---

export const runs = pgTable('runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  graphId: uuid('graph_id').notNull().references(() => graphs.id),
  versionId: uuid('version_id').notNull().references(() => graphVersions.id),
  status: runStatusEnum('status').default('running').notNull(),
  currentNodeKey: text('current_node_key'),
  stateVersion: integer('state_version').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('runs_user_id_idx').on(table.userId),
  index('runs_project_id_idx').on(table.projectId),
  index('runs_graph_id_idx').on(table.graphId),
  index('runs_status_idx').on(table.status),
]);

export const runState = pgTable('run_state', {
  runId: uuid('run_id').primaryKey().references(() => runs.id, { onDelete: 'cascade' }),
  state: jsonb('state').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const runEvents = pgTable('run_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').notNull().references(() => runs.id, { onDelete: 'cascade' }),
  seq: integer('seq').notNull(),
  type: runEventTypeEnum('type').notNull(),
  payload: jsonb('payload').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  unique('run_events_run_id_seq_unique').on(table.runId, table.seq),
  index('run_events_run_id_idx').on(table.runId),
]);

export const runSteps = pgTable('run_steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').notNull().references(() => runs.id, { onDelete: 'cascade' }),
  stepNo: integer('step_no').notNull(),
  nodeKey: text('node_key').notNull(),
  status: stepStatusEnum('status').notNull(),
  input: jsonb('input'),
  output: jsonb('output'),
  error: jsonb('error'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
  cost: jsonb('cost'),
}, (table) => [
  unique('run_steps_run_id_step_no_unique').on(table.runId, table.stepNo),
  index('run_steps_run_id_idx').on(table.runId),
]);

export const toolInvocations = pgTable('tool_invocations', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').notNull().references(() => runs.id, { onDelete: 'cascade' }),
  stepNo: integer('step_no').notNull(),
  toolType: toolTypeEnum('tool_type').notNull(),
  request: jsonb('request'),
  response: jsonb('response'),
  status: text('status'),
  latencyMs: integer('latency_ms'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('tool_invocations_run_id_idx').on(table.runId),
]);

export const projectThemes = pgTable('project_themes', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  lightPrimary: text('light_primary').notNull().default('#000000'),
  lightSecondary: text('light_secondary').notNull().default('#ffffff'),
  lightBackground: text('light_background').notNull().default('#ffffff'),
  lightText: text('light_text').notNull().default('#000000'),
  darkPrimary: text('dark_primary').notNull().default('#ffffff'),
  darkSecondary: text('dark_secondary').notNull().default('#000000'),
  darkBackground: text('dark_background').notNull().default('#000000'),
  darkText: text('dark_text').notNull().default('#ffffff'),
  fontStyle: text('font_style').notNull().default('Inter'),
  mode: text('mode').notNull().default('light'),
  splashUrl: text('splash_url'),
  transitionUrl: text('transition_url'),
  logoUrl: text('logo_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  unique('project_themes_project_id_unique').on(table.projectId),
  index('project_themes_project_id_idx').on(table.projectId),
]);

export const userJourneys = pgTable('user_journeys', {
  id: uuid('id').primaryKey().defaultRandom(),
  versionId: uuid('version_id').notNull().references(() => graphVersions.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  summary: jsonb('summary').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('user_journeys_version_id_idx').on(table.versionId),
]);

// --- Relations ---

export const projectsRelations = relations(projects, ({ many, one }) => ({
  graphs: many(graphs),
  runs: many(runs),
  variables: many(projectVariables),
  theme: one(projectThemes, { fields: [projects.id], references: [projectThemes.projectId] }),
}));

export const projectThemesRelations = relations(projectThemes, ({ one }) => ({
  project: one(projects, { fields: [projectThemes.projectId], references: [projects.id] }),
}));

export const projectVariablesRelations = relations(projectVariables, ({ one }) => ({
  project: one(projects, { fields: [projectVariables.projectId], references: [projects.id] }),
}));


export const graphsRelations = relations(graphs, ({ one, many }) => ({
  project: one(projects, { fields: [graphs.projectId], references: [projects.id] }),
  versions: many(graphVersions),
  runs: many(runs),
}));

export const graphVersionsRelations = relations(graphVersions, ({ one, many }) => ({
  graph: one(graphs, { fields: [graphVersions.graphId], references: [graphs.id] }),
  nodes: many(graphNodes),
  edges: many(graphEdges),
  steps: many(nodeSteps),
  compiled: one(compiledGraphs, { fields: [graphVersions.id], references: [compiledGraphs.versionId] }),
  runs: many(runs),
  journeys: many(userJourneys),
}));

export const graphNodesRelations = relations(graphNodes, ({ one, many }) => ({
  version: one(graphVersions, { fields: [graphNodes.versionId], references: [graphVersions.id] }),
  steps: many(nodeSteps),
}));

export const graphEdgesRelations = relations(graphEdges, ({ one }) => ({
  version: one(graphVersions, { fields: [graphEdges.versionId], references: [graphVersions.id] }),
}));

export const nodeStepsRelations = relations(nodeSteps, ({ one }) => ({
  version: one(graphVersions, { fields: [nodeSteps.versionId], references: [graphVersions.id] }),
  node: one(graphNodes, { fields: [nodeSteps.nodeKey, nodeSteps.versionId], references: [graphNodes.nodeKey, graphNodes.versionId] }),
}));

export const compiledGraphsRelations = relations(compiledGraphs, ({ one }) => ({
  version: one(graphVersions, { fields: [compiledGraphs.versionId], references: [graphVersions.id] }),
}));

export const runsRelations = relations(runs, ({ one, many }) => ({
  user: one(projects, { fields: [runs.projectId], references: [projects.id] }), // Assuming userId is external
  project: one(projects, { fields: [runs.projectId], references: [projects.id] }),
  graph: one(graphs, { fields: [runs.graphId], references: [graphs.id] }),
  version: one(graphVersions, { fields: [runs.versionId], references: [graphVersions.id] }),
  state: one(runState, { fields: [runs.id], references: [runState.runId] }),
  events: many(runEvents),
  steps: many(runSteps),
  toolInvocations: many(toolInvocations),
}));

export const runEventsRelations = relations(runEvents, ({ one }) => ({
  run: one(runs, { fields: [runEvents.runId], references: [runs.id] }),
}));

export const runStepsRelations = relations(runSteps, ({ one }) => ({
  run: one(runs, { fields: [runSteps.runId], references: [runs.id] }),
}));

export const toolInvocationsRelations = relations(toolInvocations, ({ one }) => ({
  run: one(runs, { fields: [toolInvocations.runId], references: [runs.id] }),
}));

export const userJourneysRelations = relations(userJourneys, ({ one }) => ({
  version: one(graphVersions, { fields: [userJourneys.versionId], references: [graphVersions.id] }),
}));
