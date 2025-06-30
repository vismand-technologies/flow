# ThreeNodes.js Core Architectural Patterns

This document identifies and describes the core architectural patterns from ThreeNodes.js that we'll preserve and implement using modern technologies for our AI Workflow Process Designer.

## 1. Node-Based Architecture

### Key Components

#### Node Model
- Base class for all nodes
- Handles inputs, outputs, and computation
- Manages node lifecycle and state

```
Core pattern: Each node is a self-contained unit with:
- Input fields (receiving data)
- Output fields (providing data)
- Computation logic (transforming inputs to outputs)
- Metadata (position, name, type)
```

#### Fields System
- Strongly typed inputs/outputs
- Type validation
- Value propagation

```
Core pattern: Fields are typed connection points that:
- Validate incoming data against expected types
- Transform data when necessary
- Can be dynamically created and connected
```

#### Connections
- Links between output and input fields
- Data flow management
- Propagation of changes

```
Core pattern: Connections create a directed graph where:
- Data flows from outputs to inputs
- Updates trigger downstream recomputation
- Cycles are detected and managed
```

## 2. Execution Model

### Computation Approach
- Dirty tracking (only compute when inputs change)
- Dependency resolution (compute nodes in correct order)
- Lazy evaluation (compute only when results are needed)

```
Core pattern: The execution follows a demand-driven model:
- When outputs are requested, check if inputs changed
- If inputs changed, recompute and mark as clean
- Propagate changes downstream through connections
```

### Runtime Behavior
- Event-based updates
- Recursive propagation
- Batch processing capabilities

```
Core pattern: Changes propagate through the system:
- Input changes trigger node recomputation
- Output changes trigger connected nodes to recompute
- System optimizes to minimize unnecessary computation
```

## 3. Extension Mechanisms

### Node Type System
- Registration system for node types
- Grouping and categorization
- Discovery and instantiation

```
Core pattern: Node types are registered in a registry that:
- Maintains metadata about available node types
- Organizes nodes into logical groups
- Provides factory methods for instantiation
```

### Plugin Architecture
- Custom node definitions
- External integrations
- Feature toggling

```
Core pattern: The system can be extended via plugins:
- New node types can be registered at runtime
- External systems can be integrated via adapter nodes
- Features can be enabled/disabled through configuration
```

## 4. Visual Programming Interface

### Canvas System
- Node positioning and layout
- Connection visualization
- Selection and interaction

```
Core pattern: The visual workspace provides:
- Spatial organization of nodes
- Visual representation of data flow
- Direct manipulation of the program structure
```

### Property Editing
- Dynamic property inspectors
- Type-specific editors
- Real-time feedback

```
Core pattern: Node properties can be edited through:
- Type-appropriate editors and controls
- Immediate feedback on changes
- Context-aware validation
```

## 5. Serialization and Persistence

### Graph Serialization
- JSON representation of the entire graph
- Node positions and connections
- Property values and types

```
Core pattern: The entire program state can be:
- Serialized to a standard format
- Persisted for later restoration
- Shared between instances
```

### Import/Export Mechanisms
- Loading saved graphs
- Exporting to various formats
- Sharing capabilities

```
Core pattern: Workflows can be:
- Saved and loaded from storage
- Exported to different formats
- Imported from external sources
```

## Implementation Recommendations

1. **Replace CoffeeScript with TypeScript**
   - Strong typing will improve the fields system
   - Interface definitions will clarify extension points
   - Modern JS features will simplify the codebase

2. **Replace Backbone with Modern Frameworks**
   - Use React for UI components
   - Use Redux or Context API for state management
   - Use React Flow or similar for the node graph visualization

3. **Modernize the Event System**
   - Use RxJS for reactive programming
   - Implement proper event bubbling and capturing
   - Support asynchronous operations natively

4. **Enhance Extensibility**
   - Use dependency injection for better testability
   - Implement proper plugin architecture
   - Support dynamic loading of node definitions

These core architectural patterns will serve as the foundation for our AI Workflow Process Designer, preserving the powerful visual programming paradigm while modernizing the implementation and extending it for business processes and AI capabilities.
