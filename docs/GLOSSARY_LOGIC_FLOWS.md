# Rise Glossary

> Comprehensive terminology reference for Rise visual application builder

---

## Core Concepts

### **Rise**
Visual low-code React application builder that generates clean, maintainable code without vendor lock-in.

### **Manifest**
JSON file that serves as the source of truth for all visual components, logic flows, state, and application structure. Located in the project root as `rise.manifest.json`.

### **Schema Level**
Version of the manifest schema indicating which features are available:
- **Level 1** (MVP): Static components, basic properties
- **Level 1.5** (Phase 4): Level 1 + Quick Logic (onClick, simple nodes)
- **Level 2** (Post-MVP): Expressions, reusable workflows, full logic system
- **Level 3** (Advanced): Database connections, real-time data, AI features

---

## Component Terms

### **Component**
Reusable UI element defined in the manifest. Three types:
- **Basic**: button, input, div, text
- **Composite**: UserCard, Navigation, etc.
- **Container**: Layout components that hold other components

### **Component ID**
Unique identifier for a component in the manifest, format: `comp_name_001` (semantic + numeric).

### **Display Name**
Human-readable name shown in the visual editor, e.g., "UserCard", "SubmitButton".

### **Component Hierarchy**
The parent-child tree structure of components. MVP limit: 5 levels deep, 20 children per component.

### **Props** (Properties)
Inputs to a component passed from parent. Like function parameters.

```jsx
<Button label="Click me" disabled={false} />
//      ↑ props
```

---

## Property Types (Schema Level 1)

### **Static Property**
A fixed value that doesn't change:
```json
{
  "type": "static",
  "value": "Hello World"
}
```

### **Prop Property**
A property passed from parent component:
```json
{
  "type": "prop",
  "dataType": "string",
  "required": true
}
```

---

## Logic System Terms (Level 1.5+)

### **Signal-Based Execution**
Control flow pattern where nodes have explicit signal ports (`run`, `done`, `failed`) that you wire together to define execution order. Inspired by Noodl. Much better than implicit top-to-bottom execution (n8n's approach).

### **Signal Ports**
Connection points on nodes for control flow:
- **run** (input): Triggers the node to execute
- **done** (output): Fires when node completes successfully
- **failed** (output): Fires when node encounters an error

### **JSON Output**
Every node outputs structured data: `{ json: {...}, binary: null }`. Later nodes reference previous outputs using expressions like `$('NodeName').json.propertyName`. Inspired by n8n's approach.

### **Node Reference Expression**
Syntax for accessing previous node outputs: `$('NodeName').json.propertyName`. Example: `$('node_001').json.value` gets the value property from node_001's JSON output.

### **Quick Logic**
Fast, throwaway logic attached directly to a component trigger (e.g., button onClick). Not reusable, scoped to that specific interaction. Perfect for simple button clicks, form validation, and one-off interactions. See LOGIC_PATTERNS.md.

### **Logic Canvas**
Visual node-based editor for creating interactive logic using React Flow. Used for both Quick Logic (Phase 4) and Reusable Workflows (Level 2).

### **Logic Flow**
A connected sequence of logic nodes that executes in response to a trigger. In Quick Logic, it's directly attached to a component event. In Reusable Workflows, it can be called from multiple places.

### **Logic Node**
Individual unit of logic in the canvas. Each node performs one operation and can connect to other nodes via signal ports.

**Phase 4 Nodes (Quick Logic):**
- **Get Component Property**: Read values from other components on the page
- **Set State**: Update page-level state variables
- **Alert**: Show browser alert dialog
- **Console**: Log messages to browser console

**Level 2 Nodes (Reusable Workflows):**
- **Call Workflow**: Invoke a reusable workflow
- **Workflow Output**: Return data from a workflow to its caller
- **If/Else**: Conditional branching
- **HTTP Request**: API calls
- **Loop**: Array iteration
- **Navigate**: Route changes
- And many more...

### **Get Component Property Node** (Phase 4)
Node that reads the current value or state from another component on the same page. Enables logic to access data from sibling components without coupling them. Examples:
- Read the value of an input field
- Check if a checkbox is checked
- Get the selected option from a dropdown

Similar to Noodl's component connections, but accessed through a node rather than a global canvas. Outputs: `{ json: { value: "..." }, binary: null }`

### **Reusable Workflow** (Level 2)
Named, callable logic workflow with defined inputs and outputs that can be invoked from multiple places. Like a function in code. Examples: "addItemToBasket", "validateEmail", "fetchUserProfile". 

Workflows have:
- `done` and `failed` signal outputs (for parent flow control)
- `json` output (for returning data to parent)
- Defined input parameters (like function arguments)
- Internal signal-based logic flow

See LOGIC_PATTERNS.md.

### **Call Workflow Node** (Level 2)
Node that invokes a reusable workflow, passing inputs and receiving outputs via signals and JSON. Similar to n8n's "Execute Workflow" node. Enables logic reuse across multiple components and pages.

Receives:
- Input parameters (mapped to workflow inputs)
- `run` signal (trigger)

Outputs:
- `done` signal (workflow completed successfully)
- `failed` signal (workflow error)
- `json` data (workflow's return value)

### **Workflow Output Node** (Level 2)
Special node inside a reusable workflow that returns data to the calling flow. Receives the workflow's final data, then fires the workflow's `done` or `failed` signal back to the Call Workflow node with the JSON output.

### **Workflow Scope** (Level 2)
The visibility level of a reusable workflow:
- **Component-Level**: Accessible to that component + children
- **Page-Level**: Accessible to all components on that page
- **App-Level**: Accessible throughout the entire application

---

## State Management Terms (Level 2+)

### **State**
Data that can change over time, triggering re-renders:
- **Local State**: Component-specific (useState)
- **Page State**: Shared across components on a page
- **App State**: Global, shared across the entire app

### **Persistent Reactive State**
State that survives across logic flow executions and automatically triggers component re-renders. Unlike ephemeral function-local variables.

```javascript
// Ephemeral state (dies after function)
function handler() {
  let toggle = true;  // Lost when function ends
}

// Persistent state (survives)
Page State: { toggle: false }
Logic Flow A: Sets toggle = true
Logic Flow B: Reads toggle (still true!)
```

---

## Expression System Terms (Level 2+)

### **Expression**
User-written JavaScript code that computes a value:
```json
{
  "type": "expression",
  "expression": "props.user.firstName + ' ' + props.user.lastName"
}
```

### **Template Expression**
Inline expression in a string using `{{ }}` syntax:
```json
{
  "label": "Welcome, {{state.userName}}!"
}
```

### **Computed Property**
A derived value that updates automatically (uses `useMemo`):
```json
{
  "computedProperties": {
    "fullName": {
      "expression": "props.firstName + ' ' + props.lastName"
    }
  }
}
```

### **Global Function**
User-defined reusable function available everywhere:
```json
{
  "globalFunctions": {
    "user.formatTimeAgo": {
      "code": "function formatTimeAgo(date) { ... }"
    }
  }
}
```

---

## Code Generation Terms

### **Generated Code**
Clean, standard React code produced by Rise from the manifest. Can be deployed anywhere (Vercel, Netlify, etc.) without vendor lock-in.

### **Code Generator**
System component that transforms the manifest into deployable React code. Uses templates and the manifest as source of truth.

### **HMR** (Hot Module Replacement)
Live preview technology that updates the running app without full page refresh when code changes.

---

## Development Terms

### **Phase**
Development milestone in the project roadmap:
- **Phase 0**: Foundation (security, file watching, schema validation)
- **Phase 1**: Application shell (Electron, three-panel layout)
- **Phase 2**: Component management (manifest store, tree UI)
- **Phase 3**: Visual editing (component addition, properties)
- **Phase 4**: Logic system (Quick Logic with React Flow)
- **Phase 5**: Polish (AI generation, testing, documentation)

### **Navigator Panel**
Left panel in Rise showing the component tree, file structure, and (in Level 2) workflows.

### **Properties Panel**
Right panel showing editable properties for the selected component.

### **Preview Panel**
Center panel showing live preview of the application with embedded Vite dev server.

### **React Flow**
Third-party library used for the visual node-based logic canvas. Provides draggable nodes, connections, and canvas controls.

---

## File System Terms

### **File Watcher**
System that monitors generated files for changes and updates the manifest accordingly. Uses SHA-256 hashing to detect modifications.

### **Hash Detection**
Technique using SHA-256 checksums to determine if a file has actually changed, preventing infinite loops between manifest updates and file generation.

---

## Security Terms

### **Expression Sandbox**
Isolated execution environment for user-written expressions that prevents access to dangerous APIs (eval, Function constructor, etc.).

### **API Key Manager**
Secure storage system for Claude API keys using OS-level credential storage (Keychain on macOS, Credential Manager on Windows).

### **Input Sanitizer**
Security component that validates and sanitizes user input to prevent XSS, path traversal, and injection attacks.

---

## Comparison Terms

### **Noodl-style**
Refers to Noodl's visual node-based approach where logic and components share the same canvas. Rise uses separate canvases for clarity.

### **n8n-style**
Refers to n8n's workflow system where reusable workflows can be called from multiple places. Rise's Reusable Workflows (Level 2) follow this pattern.

### **Bubble-style**
Refers to Bubble's hosted runtime approach. Rise generates deployable code instead, avoiding vendor lock-in.

### **Vendor Lock-in**
Situation where users can't take their application outside the platform. Rise avoids this by generating standard React code.

---

## Common Abbreviations

- **MVP**: Minimum Viable Product (Phase 4 deliverable)
- **HMR**: Hot Module Replacement (live preview)
- **API**: Application Programming Interface
- **UI**: User Interface
- **UX**: User Experience
- **JSON**: JavaScript Object Notation
- **JSX**: JavaScript XML (React syntax)
- **SHA**: Secure Hash Algorithm (for file change detection)

---

## Related Documentation

- **[LOGIC_PATTERNS.md](./LOGIC_PATTERNS.md)** - Detailed explanation of Quick Logic vs Reusable Workflows
- **[SCHEMA_LEVELS.md](./SCHEMA_LEVELS.md)** - Complete schema level definitions
- **[COMPONENT_SCHEMA.md](./COMPONENT_SCHEMA.md)** - Manifest schema reference
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture overview

---

**Last Updated:** 2024-11-30  
**Status:** ✅ Complete  
**Maintainer:** Rise Documentation Team