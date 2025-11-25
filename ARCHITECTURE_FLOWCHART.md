# ValidAIte Architecture Flowchart

## Complete Application Flow

```mermaid
flowchart TD
    %% User Actions
    A[User Opens ValidAIte in JSM] --> B{File Source?}
    B -->|Upload New File| C[User Selects Excel File]
    B -->|From Jira Ticket| D[User Selects Attachment]
    
    %% File Upload Path
    C --> E[FileUpload Component]
    E --> F["File Validation
    (.xlsx/.xls check)"]
    F -->|Valid| G["FileReader API
    Reads File"]
    F -->|Invalid| H[Show Error Message]
    
    %% File Processing
    G --> I["XLSX Library
    Parses Excel Data"]
    I --> J["App.js State Update
    setExcelData"]
    
    %% Jira Attachment Path
    D --> K[JiraIntegration Component]
    K --> L[Backend: getIssueAttachments]
    L --> M[Jira API Call]
    M --> N[processExcelAttachment]
    N --> O[Download & Parse Attachment]
    O --> J
    
    %% Data Validation Flow
    J --> P[Automatic Validation Trigger]
    P --> Q["Frontend: invoke
    ('validateExcelData')"]
    
    %% Backend Processing
    Q --> R["Backend: src/index.js
    resolver.define('validateExcelData')"]
    R --> S["validation.js
    validateExcelData function"]
    
    %% AI Processing
    S --> T["Generate AI Prompt
    generateValidationPrompt"]
    T --> U["Prepare Data Sample
    (First 10 rows)"]
    U --> V["OpenAI API Call
    callOpenAIValidation"]
    
    %% AI Analysis
    V --> W["OpenAI GPT-3.5-turbo
    Analyzes Data"]
    W --> X["AI Response
    JSON with validation results"]
    
    %% Response Processing
    X --> Y["Parse AI Response
    parseValidationResponse"]
    Y --> Z["Format Results
    Clean JSON"]
    Z --> AA["Return to Frontend
    Success + Validation Data"]
    
    %% Error Handling
    V -->|API Error| BB["Error Handling
    Return error message"]
    Y -->|Parse Error| BB
    BB --> CC[Display Error to User]
    
    %% Results Display
    AA --> DD["App.js State Update
    setValidationResult"]
    DD --> EE[ValidationResults Component]
    EE --> FF[Display Results Dashboard]
    
    %% Results Components
    FF --> GG["Overall Score
    (0-100)"]
    FF --> HH["Issues List
    (Errors, Warnings, Info)"]
    FF --> II["Recommendations
    AI Suggestions"]
    FF --> JJ["Data Statistics
    Rows, Columns, Headers"]
    
    %% Data Preview
    J --> KK[DataPreview Component]
    KK --> LL["Show First 5 Rows
    in Table Format"]
    
    %% Monitoring & Storage
    P --> MM["Monitor File Upload
    monitorFileUpload"]
    MM --> NN["Storage Service
    Track Upload Status"]
    NN --> OO["Update File Status
    updateFileValidationStatus"]
    
    %% Styling
    classDef userAction fill:#e1f5fe
    classDef frontend fill:#f3e5f5
    classDef backend fill:#e8f5e8
    classDef ai fill:#fff3e0
    classDef storage fill:#fce4ec
    classDef display fill:#e0f2f1
    
    class A,B,C,D userAction
    class E,F,G,I,J,K,P,Q,DD,EE,FF,KK frontend
    class R,S,L,M,N,O,MM,NN,OO backend
    class T,U,V,W,X,Y,Z ai
    class AA,BB,CC storage
    class GG,HH,II,JJ,LL display
```

## Component Architecture

```mermaid
flowchart LR
    %% Main App Structure
    A["App.js
    Main Controller"] --> B["FileUpload
    Component"]
    A --> C["DataPreview
    Component"]
    A --> D["ValidationResults
    Component"]
    A --> E["JiraIntegration
    Component"]
    A --> F["ApiTest
    Component"]
    
    %% Backend Services
    G["index.js
    Resolver Hub"] --> H["validation.js
    AI Service"]
    G --> I["storage.js
    Data Storage"]
    G --> J["jira.js
    Jira Integration"]
    G --> K["openai.js
    AI Configuration"]
    
    %% External Services
    H --> L["OpenAI API
    GPT-3.5-turbo"]
    J --> M["Jira Service
    Management API"]
    I --> N["Forge Storage
    Key-Value Store"]
    
    %% Data Flow
    A -->|invoke| G
    G -->|results| A
    
    %% Styling
    classDef frontend fill:#e3f2fd
    classDef backend fill:#e8f5e8
    classDef external fill:#fff3e0
    
    class A,B,C,D,E,F frontend
    class G,H,I,J,K backend
    class L,M,N external
```

## Data Validation Process Detail

```mermaid
flowchart TD
    A[Excel Data Input] --> B["Extract Headers
    Object.keys(data[0])"]
    B --> C["Get Data Sample
    First 10 rows"]
    C --> D["Generate AI Prompt
    Include validation rules"]
    
    D --> E["AI Prompt Structure:
    - Headers list
    - Sample data JSON
    - Validation rules
    - Expected JSON format"]
    
    E --> F["OpenAI API Call
    Model: gpt-3.5-turbo
    Temperature: 0.3
    Max tokens: 2000"]
    
    F --> G["AI Analysis Checks:
    ✓ Missing values
    ✓ Data type consistency
    ✓ Format validation
    ✓ Duplicates
    ✓ Outliers
    ✓ Data quality"]
    
    G --> H["AI Response Format:
    {
      isValid: boolean,
      overallScore: 0-100,
      issues: [...],
      summary: string,
      recommendations: [...]
    }"]
    
    H --> I["Parse & Clean Response
    Remove markdown
    Extract JSON"]
    
    I --> J["Return Structured Result
    + Data statistics
    + Success status"]
    
    %% Styling
    classDef process fill:#e8f5e8
    classDef ai fill:#fff3e0
    classDef data fill:#e1f5fe
    
    class A,B,C,J data
    class D,E,I process
    class F,G,H ai
```

## File Upload & Processing Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FC as FileUpload Component
    participant A as App.js
    participant FR as FileReader API
    participant X as XLSX Library
    participant B as Backend
    participant AI as OpenAI API
    participant VR as ValidationResults
    
    U->>FC: Select Excel file
    FC->>A: handleFileUpload(event)
    A->>A: Validate file extension
    A->>FR: readAsArrayBuffer(file)
    FR->>X: Parse Excel data
    X->>A: Return JSON data
    A->>A: setExcelData(jsonData)
    A->>B: invoke('validateExcelData')
    B->>AI: Send data + prompt
    AI->>B: Return validation results
    B->>A: Return formatted response
    A->>A: setValidationResult(result)
    A->>VR: Display results
    VR->>U: Show validation dashboard
```

## Key Features Breakdown

```mermaid
mindmap
  root((ValidAIte Features))
    File Processing
      Excel Upload (.xlsx/.xls)
      Drag & Drop Interface
      File Validation
      Data Preview (5 rows)
    AI Validation
      OpenAI GPT-3.5-turbo
      Smart Data Analysis
      Custom Validation Rules
      Comprehensive Scoring (0-100)
    Results Display
      Issue Categorization
      Row-level Problems
      Actionable Recommendations
      Data Quality Metrics
    Jira Integration
      Attachment Processing
      Issue Context
      Upload Monitoring
      Status Tracking
    Error Handling
      API Error Management
      File Format Validation
      User-friendly Messages
      Fallback Mechanisms
```

This flowchart shows the complete journey from when a user opens the app to when they see the final validation results, including all the technical components working behind the scenes.
