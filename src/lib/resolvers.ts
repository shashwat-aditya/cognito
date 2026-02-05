export function resolveTemplate(template: string, variables: Record<string, string>) {
  return template.replace(/@(\w+)/g, (match, key) => {
    return variables[key] || match;
  });
}

export function resolveNodePrompt(
  template: string,
  projectVariables: Record<string, string>,
  runtimeVariables: Record<string, any>
) {
  // Merge variables, runtime takes precedence
  const mergedVariables = { ...projectVariables };
  Object.entries(runtimeVariables).forEach(([key, val]) => {
    const rawValue = val?.value !== undefined ? val.value : val;
    mergedVariables[key] = Array.isArray(rawValue) ? rawValue.join(", ") : String(rawValue);
  });

  return resolveTemplate(template, mergedVariables);
}
