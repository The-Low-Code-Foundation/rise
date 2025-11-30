# Logic Patterns in Rise

> **Understanding the difference between quick throwaway logic and reusable workflows**

---

## Architecture Overview

Rise's logic system combines the best patterns from Noodl and n8n:

### 1. **Signal-Based Execution** (from Noodl)
Every node has explicit signal ports for control flow:
- `run` signal input: when to execute
- `done` signal output: fires on success
- `failed` signal output: fires on error

You wire signals between nodes to control execution order, unlike n8n's implicit top-to-bottom flow.

### 2. **JSON Output References** (from n8n)
Every node outputs structured data:
```javascript
node_output: {
  json: { /* node's data */ },
  binary: null  // for file/image data
}
```

Later nodes reference previous outputs: `$('NodeName').json.propertyName`

This is cleaner than Noodl's individual connectors for each value.

### 3. **Composable Workflows** (from Noodl)
Reusable workflows (Level 2) have:
- `done` and `failed` signal outputs (for parent flow control)
- `json` output (for returning data to parent)
- Defined inputs/outputs (like function parameters/returns)

Parent flows can call workflows and continue based on the workflow's signals and data.

---

## Overview

Rise supports two distinct patterns for creating interactive logic, each serving different use cases:

1. **Quick Logic (Level 1.5 - Phase 4)**: Fast, component-scoped, throwaway logic for simple interactions
2. **Reusable Workflows (Level 2 - Future)**: Named, callable workflows with inputs/outputs for shared business logic

This document explains both patterns, when to use each, and how they work together.

---

## Pattern 1: Quick Logic (Level 1.5 - Phase 4 MVP)

### What It Is

Quick Logic is the fastest way to add interactivity to a component. It's **throwaway logic** that's:
- **Directly attached to a component trigger** (e.g., button onClick)
- **Not named or reusable** - exists only for that specific trigger
- **Fast to create** - no ceremony, just add nodes
- **Component-scoped** - can only access data from that component's context

### Use Cases

✅ **Perfect for:**
- Simple button clicks that show alerts
- Form validation before submission
- Toggling UI state (show/hide)
- One-off animations or effects
- Component-specific interactions

❌ **Not ideal for:**
- Logic used in multiple places (use Reusable Workflows instead)
- Complex business logic (use Reusable Workflows instead)
- Logic that needs testing in isolation

### How It Works

**UI Flow:**
```
1. Click component's ⚡ icon in the visual editor
   ↓
2. Logic canvas opens (React Flow)
   ↓
3. Add nodes from palette:
   - Get Component Property (read values from other components)
   - SetState (update page state)
   - Alert (show browser alert)
   - Console (log to console)
   ↓
4. Connect nodes with wires
   ↓
5. Save (auto-saves to manifest)
   ↓
6. Preview updates immediately via HMR
```

**Example: Simple Form Validation**
```
[Submit Button onClick] ──(run)──→ [Get Component Property: email]
                                         │
                                    (done)──→ [Get Component Property: checkbox]
                                                   │
                                              (done)──→ [SetState: formData]
                                                             │
                                                        (done)──→ [Alert: "Submitted!"]
```

**Signal Flow:**
1. Button click triggers first node's `run` signal
2. Get email → `done` signal fires → triggers Get checkbox `run`
3. Get checkbox → `done` signal fires → triggers SetState `run`
4. SetState → `done` signal fires → triggers Alert `run`

**Data Flow (n8n-style JSON references):**
```javascript
// Each node outputs structured JSON
node_001 output: { json: { value: "user@example.com" }, binary: null }
node_002 output: { json: { checked: true }, binary: null }

// Later nodes reference previous outputs
SetState config:
  variable: "formData"
  value: {
    email: $('node_001').json.value,
    termsAccepted: $('node_002').json.checked
  }
```

**Manifest Structure:**
```json
{
  "components": {
    "comp_button_001": {
      "type": "button",
      "logicFlows": {
        "handleSubmit": {
          "trigger": {
            "type": "componentEvent",
            "componentId": "comp_button_001",
            "event": "onClick"
          },
          "nodes": [
            {
              "id": "node_001",
              "type": "getComponentProperty",
              "config": {
                "componentId": "comp_email_input",
                "property": "value"
              },
              "position": { "x": 100, "y": 100 }
            },
            {
              "id": "node_002",
              "type": "getComponentProperty",
              "config": {
                "componentId": "comp_checkbox",
                "property": "checked"
              },
              "position": { "x": 300, "y": 100 }
            },
            {
              "id": "node_003",
              "type": "setState",
              "config": {
                "variable": "formData",
                "value": {
                  "email": "$('node_001').json.value",
                  "termsAccepted": "$('node_002').json.checked"
                }
              },
              "position": { "x": 500, "y": 100 }
            },
            {
              "id": "node_004",
              "type": "alert",
              "config": {
                "message": "Form submitted!"
              },
              "position": { "x": 700, "y": 100 }
            }
          ],
          "connections": [
            {
              "from": "node_001",
              "fromPort": "done",
              "to": "node_002",
              "toPort": "run"
            },
            {
              "from": "node_002",
              "fromPort": "done",
              "to": "node_003",
              "toPort": "run"
            },
            {
              "from": "node_003",
              "fromPort": "done",
              "to": "node_004",
              "toPort": "run"
            }
          ]
        }
      }
    }
  }
}
```

**Generated Code:**
```jsx
export function SubmitButton() {
  const [formData, setFormData] = useState({ email: "", termsAccepted: false });

  const handleSubmit = useCallback(async () => {
    try {
      // Node 001: Get Component Property (email)
      const node_001_output = {
        json: { value: document.getElementById('email-input')?.value || '' },
        binary: null
      };
      // Signal: node_001.done → node_002.run
      
      // Node 002: Get Component Property (checkbox)
      const node_002_output = {
        json: { checked: document.getElementById('terms-checkbox')?.checked || false },
        binary: null
      };
      // Signal: node_002.done → node_003.run
      
      // Node 003: SetState (references previous node outputs)
      setFormData({
        email: node_001_output.json.value,        // $('node_001').json.value
        termsAccepted: node_002_output.json.checked  // $('node_002').json.checked
      });
      const node_003_output = { json: { updated: true }, binary: null };
      // Signal: node_003.done → node_004.run
      
      // Node 004: Alert
      alert('Form submitted!');
      const node_004_output = { json: { dismissed: true }, binary: null };
      
    } catch (error) {
      // Signal: failed → error handler
      console.error('Logic flow failed:', error);
    }
  }, []);

  return (
    <button onClick={handleSubmit}>
      Submit
    </button>
  );
}
```

### Phase 4 Scope (MVP)

**What's included:**
- ✅ onClick event triggers only
- ✅ Get Component Property node (read values from sibling components)
- ✅ SetState node (update page-level state)
- ✅ Alert node (browser alert dialog)
- ✅ Console node (console.log)
- ✅ Visual React Flow canvas for building logic
- ✅ Live preview with HMR updates

**What's NOT included (coming in Level 2):**
- ❌ Other events (onChange, onEnter, onBlur, etc.)
- ❌ Reusable workflows
- ❌ Call Workflow node
- ❌ If/Else conditional nodes
- ❌ HTTP Request nodes
- ❌ Loop nodes
- ❌ Navigate nodes

---

## Pattern 2: Reusable Workflows (Level 2 - Future)

### What It Is

Reusable Workflows are **named, callable functions** that can be invoked from multiple places with different inputs. Like functions in code, they:
- **Have a name and description**
- **Define inputs and outputs**
- **Can be called from anywhere** (based on scope)
- **Promote code reuse** - write once, call many times
- **Are testable in isolation**

### Use Cases

✅ **Perfect for:**
- Business logic used across multiple pages/components
- API calls that happen in multiple places
- Shopping cart operations (add, remove, update)
- Authentication flows
- Complex validation rules
- Data transformations

❌ **Not needed for:**
- Simple, one-off component interactions (use Quick Logic)

### How It Works

**Creating a Workflow:**
```
1. Navigator → Right-click → "New Workflow"
   ↓
2. Choose scope:
   - App-Level (accessible everywhere)
   - Page-Level (accessible on this page)
   - Component-Level (accessible to component + children)
   ↓
3. Name: "addItemToBasket"
   ↓
4. Define inputs:
   - productId: string (required)
   - quantity: number (default: 1)
   - options: object (optional)
   ↓
5. Define outputs:
   - success: boolean
   - cartTotal: number
   - error: string
   ↓
6. Build logic on canvas (same as Quick Logic, but more nodes available)
   ↓
7. Save → Now appears in Navigator under "Workflows"
```

**Calling a Workflow:**
```
[Product Card: Add Button onClick] ──(run)──→ [Get Component Property: quantity]
                                                      │
                                                 (done)──→ [Call Workflow: "addItemToBasket"]
                                                                │
                                                           (done)──→ [Show Toast: "Added!"]
                                                                │
                                                          (failed)──→ [Alert: $('workflow').json.error]
```

**Signal Flow:**
1. Button click → Get quantity runs
2. Get done → Call Workflow runs with inputs
3. Workflow executes internally
4. Workflow done signal → triggers next node
5. Workflow failed signal → triggers error handler

**Data Flow (JSON outputs):**
```javascript
// Workflow returns structured JSON output
workflow_output: {
  json: {
    success: true,
    cartTotal: 149.99,
    error: null
  },
  binary: null
}

// Parent flow can reference workflow outputs
ShowToast message: "Added! Cart total: " + $('workflow_call').json.cartTotal
Alert message: $('workflow_call').json.error  // On failed signal
```

**Call from Different Places:**
```
// Product Detail Page: Full options
[Add Button] ──(run)──→ [Get: quantity, color, size]
                              │
                         (done)──→ [Call Workflow: addItemToBasket]
                                     Inputs: { 
                                       productId: $('props').productId,
                                       quantity: $('node_001').json.value,
                                       options: { color, size }
                                     }
                                     │
                                (done)──→ [Navigate: /cart]

// Quick Add on List Page: Defaults
[Quick Add] ──(run)──→ [Call Workflow: addItemToBasket]
                         Inputs: { productId, quantity: 1, options: null }
                         │
                    (done)──→ [Show Toast: "Added!"]

// Buy Again from Order History
[Buy Again] ──(run)──→ [Get State: previousOrder]
                            │
                       (done)──→ [Call Workflow: addItemToBasket]
                                   Inputs: $('node_001').json  // Pass entire object
```

### Scope Hierarchy

**1. Component-Level Workflows**
- **Defined in:** Component's workflows section
- **Accessible to:** That component + its children
- **Use case:** Component-specific logic, animations, local validation

**2. Page-Level Workflows**
- **Defined in:** Page component's workflows section
- **Accessible to:** All components on that page
- **Use case:** Page-specific data loading, page navigation logic

**3. App-Level Workflows**
- **Defined in:** Root manifest globalWorkflows section
- **Accessible to:** Entire application
- **Use case:** Shopping cart, auth, API calls, shared business logic

### Manifest Structure

```json
{
  "manifest": {
    "version": "1.0.0",
    "schemaLevel": 2,
    
    "globalWorkflows": {
      "addItemToBasket": {
        "id": "workflow_add_basket_001",
        "displayName": "Add Item to Basket",
        "description": "Add a product to the shopping cart with validation",
        "scope": "app",
        
        "inputs": {
          "productId": { 
            "type": "string", 
            "required": true,
            "description": "Unique product identifier"
          },
          "quantity": { 
            "type": "number", 
            "default": 1,
            "description": "Number of items to add"
          },
          "options": { 
            "type": "object", 
            "required": false,
            "description": "Product options (color, size, etc.)"
          }
        },
        
        "outputs": {
          "success": { 
            "type": "boolean",
            "description": "Whether the operation succeeded"
          },
          "cartTotal": { 
            "type": "number",
            "description": "Updated cart total price"
          },
          "error": { 
            "type": "string",
            "description": "Error message if failed"
          }
        },
        
        "nodes": [
          {
            "id": "node_001",
            "type": "httpRequest",
            "config": {
              "method": "POST",
              "url": "/api/cart/add",
              "body": {
                "productId": "$('inputs').productId",
                "quantity": "$('inputs').quantity",
                "options": "$('inputs').options"
              }
            },
            "position": { "x": 100, "y": 100 }
          },
          {
            "id": "node_002",
            "type": "setState",
            "config": {
              "variable": "cart",
              "value": "$('node_001').json.cart"
            },
            "position": { "x": 300, "y": 100 }
          },
          {
            "id": "node_003",
            "type": "workflowOutput",
            "config": {
              "outputData": {
                "success": true,
                "cartTotal": "$('node_001').json.total",
                "error": null
              }
            },
            "position": { "x": 500, "y": 100 }
          },
          {
            "id": "node_error",
            "type": "workflowOutput",
            "config": {
              "outputData": {
                "success": false,
                "cartTotal": 0,
                "error": "$('node_001').json.message"
              }
            },
            "position": { "x": 500, "y": 200 }
          }
        ],
        "connections": [
          {
            "from": "node_001",
            "fromPort": "done",
            "to": "node_002",
            "toPort": "run"
          },
          {
            "from": "node_002",
            "fromPort": "done",
            "to": "node_003",
            "toPort": "run"
          },
          {
            "from": "node_001",
            "fromPort": "failed",
            "to": "node_error",
            "toPort": "run"
          }
        ]
      }
    }
  }
}
```

**Key Workflow Features:**

1. **Workflow Inputs**: Defined as parameters, accessed via `$('inputs').paramName`
2. **Internal Signal Flow**: Nodes connect via done/failed signals, just like Quick Logic
3. **Workflow Outputs**: Special "workflowOutput" node that:
   - Receives done signal from last node
   - Returns JSON data to parent flow
   - Fires workflow's done/failed signal to parent
4. **Error Handling**: Failed signals can route to error output node
5. **Parent Access**: Call Workflow node receives the output via `$('workflowCall').json`

---

## Migration Path: From Quick Logic to Reusable Workflow

As users build Quick Logic, they'll naturally discover places where they've duplicated the same logic. Rise provides an **"Extract to Workflow"** refactoring:

```
1. User notices: "I've added this same validation logic 5 times"
   ↓
2. Right-click on Quick Logic flow → "Extract to Workflow"
   ↓
3. Rise prompts:
   - Name this workflow?
   - What scope? (component/page/app)
   - Which values should be inputs?
   ↓
4. Rise converts:
   - Creates new reusable workflow
   - Replaces original Quick Logic with "Call Workflow" node
   - Maps all data connections to inputs
   ↓
5. Other duplicated flows can now use "Call Workflow" too
```

This is the **"inline function → extract to named function"** pattern developers already know!

---

## Node Types

## Signal-Based Execution Flow

Rise uses **signal-based execution** (inspired by Noodl) rather than implicit top-to-bottom ordering (like n8n). This gives you explicit control over execution order.

**Key Concepts:**

**Signals** - Control flow (when things run)
- Every node has signal inputs/outputs
- `run` signal input: triggers the node
- `done` signal output: fires when node completes successfully
- `failed` signal output: fires if node errors

**Data** - Information flow (what data passes between nodes)
- Every node outputs structured JSON: `{ json: {...}, binary: null }`
- Later nodes reference previous outputs: `$('NodeName').json.email`
- Cleaner than individual connectors for each property

**Example:**
```
[Button onClick] → (run signal)
  ↓
[Get Component Property]
  (done) → [SetState]
            (done) → [Alert]
  (failed) → [Console: "Error reading component"]
```

You explicitly wire the `done` signal to the next node's `run` signal, giving you full control over execution order and error handling.

### Phase 4 Nodes (Quick Logic)

**Get Component Property** - Read values from other components
```
┌─────────────────────────────────┐
│ Get Component Property          │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│ component: email-input          │ ← Dropdown selector
│ property: value                 │ ← Auto-populated
│                                 │
│ Signals:                        │
│  ◀ run (trigger)                │ ← Connect from previous done
│  ▶ done (success)               │ → Connect to next run
│  ▶ failed (error)               │ → Connect to error handler
│                                 │
│ Data Output:                    │
│  json: { value: "user@email" }  │ ← Access via $('NodeID').json.value
│  binary: null                   │
└─────────────────────────────────┘
```

**SetState** - Update page-level state
```
┌─────────────────────────────────┐
│ Set State                       │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│ variable: email                 │
│ value: $('node_001').json.value │ ← Reference previous node
│                                 │
│ Signals:                        │
│  ◀ run                          │
│  ▶ done                         │
│  ▶ failed                       │
│                                 │
│ Data Output:                    │
│  json: { updated: true }        │
│  binary: null                   │
└─────────────────────────────────┘
```

**Alert** - Show browser alert
```
┌─────────────────────────────────┐
│ Alert                           │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│ message: $('node_001').json     │ ← Can reference any previous node
│                                 │
│ Signals:                        │
│  ◀ run                          │
│  ▶ done (user clicked OK)       │
│                                 │
│ Data Output:                    │
│  json: { dismissed: true }      │
│  binary: null                   │
└─────────────────────────────────┘
```

**Console** - Log to browser console
```
┌─────────────────────────────────┐
│ Console                         │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│ message: $('node_001').json     │
│ level: log/warn/error           │
│                                 │
│ Signals:                        │
│  ◀ run                          │
│  ▶ done                         │
│                                 │
│ Data Output:                    │
│  json: { logged: true }         │
│  binary: null                   │
└─────────────────────────────────┘
```

### Level 2 Nodes (Reusable Workflows)

**Call Workflow** - Invoke a reusable workflow
```
┌──────────────────────────────────────┐
│ Call Workflow                        │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
│ workflow: addItemToBasket            │ ← Dropdown: available workflows
│ scope: app                           │ ← Auto-detected from workflow
│                                      │
│ Inputs (map to workflow params):     │
│  productId: $('props').productId     │
│  quantity: $('node_001').json.value  │
│  options: null                       │
│                                      │
│ Signals:                             │
│  ◀ run (trigger workflow)            │
│  ▶ done (workflow completed)         │ → Connect to success path
│  ▶ failed (workflow error)           │ → Connect to error handler
│                                      │
│ Data Output (from workflow):         │
│  json: {                             │ ← Workflow's output data
│    success: true,                    │   Access via $('thisNode').json.success
│    cartTotal: 149.99,                │   Access via $('thisNode').json.cartTotal
│    error: null                       │   Access via $('thisNode').json.error
│  }                                   │
│  binary: null                        │
└──────────────────────────────────────┘
```

**How It Works:**
1. Call Workflow node receives `run` signal
2. Passes inputs to the workflow
3. Workflow executes its internal logic (with its own signal flow)
4. Workflow hits "workflowOutput" node
5. Workflow fires `done` or `failed` signal back to Call Workflow node
6. Call Workflow node outputs the workflow's JSON data
7. Parent flow continues with next node

**Example Usage:**
```
[Button] ──(run)──→ [Get: quantity]
                         │
                    (done)──→ [Call Workflow: addItemToBasket]
                                   │
                              (done)──→ [Show Toast: $('workflow').json.cartTotal]
                                   │
                             (failed)──→ [Alert: $('workflow').json.error]
```

Plus all the Quick Logic nodes, plus:
- If/Else (conditional branching)
- Switch/Case (multiple branches)
- HTTP Request (API calls)
- Loop (array iteration)
- Navigate (route changes)
- Show Toast (notifications)
- And more...

---

## UI/UX Comparison

### Quick Logic (Phase 4)

**Navigator:**
```
📁 LoginPage
  ├─ 📄 Header
  ├─ 🔘 EmailInput
  ├─ 🔘 PasswordInput
  └─ 🔘 SubmitButton
       └─ ⚡ onClick (quick logic attached)
```

**Canvas:**
```
┌─────────────────────────────────────┐
│ Logic: SubmitButton onClick         │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│ Trigger: onClick                    │
│                                     │
│ [Get: email] → [Get: password]      │
│                      ↓              │
│               [SetState: formData]  │
│                      ↓              │
│               [Alert: "Submitted!"] │
└─────────────────────────────────────┘
```

### Reusable Workflows (Level 2)

**Navigator:**
```
📁 MyApp
  ├─ 📄 Pages
  │   ├─ Home
  │   └─ ProductDetail
  ├─ 🧩 Components
  │   ├─ ProductCard
  │   └─ CartIcon
  └─ ⚡ Workflows           ← NEW SECTION
      ├─ 🌍 App-Level
      │   ├─ addItemToBasket
      │   ├─ checkout
      │   └─ updateProfile
      ├─ 📄 Page: ProductDetail
      │   └─ loadProductDetails
      └─ 🧩 Component: ProductCard
          └─ animateAddToCart
```

**Canvas:**
```
┌──────────────────────────────────────┐
│ Workflow: addItemToBasket (App)      │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│ Inputs: productId, quantity, options │
│ Outputs: success, cartTotal, error   │
│                                      │
│ [Validate] → [HTTP Request]          │
│                    ↓                 │
│             [If: success?]           │
│              ├─ True → [SetState]    │
│              └─ False → [Set error]  │
└──────────────────────────────────────┘

Called from 5 different places ✓
```

---

## Summary Table

| Feature | Quick Logic (Phase 4) | Reusable Workflows (Level 2) |
|---------|---------------------|----------------------------|
| **Purpose** | Fast one-off interactions | Shared business logic |
| **Naming** | Auto-named by trigger | User-defined name |
| **Scope** | Component-only | Component/Page/App |
| **Reusability** | ❌ Not reusable | ✅ Call from anywhere |
| **Inputs/Outputs** | ❌ No formal interface | ✅ Defined inputs/outputs |
| **Testability** | Hard to test in isolation | ✅ Testable as unit |
| **Use Case** | Button clicks, toggles | Cart, auth, API calls |
| **Node Types** | 4 nodes (Get, Set, Alert, Console) | 15+ nodes (all Level 2) |
| **Events** | onClick only | All events |

---

## Next Steps

### For Phase 4 (Now)
1. Implement Quick Logic pattern
2. Create 4 node types
3. Build React Flow canvas UI
4. Integrate with manifest store
5. Test with simple interactions

### For Level 2 (Future)
1. Add workflow naming/scoping UI
2. Implement Call Workflow node
3. Add input/output mapping
4. Build "Extract to Workflow" refactoring
5. Add 15+ additional node types
6. Create workflow testing framework

---

**Last Updated:** 2024-11-30  
**Status:** ✅ Complete - Ready for Implementation  
**Related Docs:** SCHEMA_LEVELS.md, COMPONENT_SCHEMA.md, GLOSSARY.md