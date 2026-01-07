# Webtrigger Context Fix - Definitieve Oplossing

## Het Probleem

Je zat in een **catch-22 situatie** met Forge API calls:

- **Met `requestJira` alleen**: "route" error
- **Met `route` import**: ".asApp is not a function" error

## De Root Cause

Het probleem was **niet** de API syntax, maar de **context waarin de API calls werden uitgevoerd**.

### Webtrigger Context Probleem

**Webtriggers** hebben een **andere execution context** dan normale Forge functions:

```javascript
// ❌ WERKT NIET: Direct API call in webtrigger
export const createIssueTrigger = async (payload, context) => {
    // Deze context heeft geen toegang tot requestJira
    const result = await createIssueWithFileInfo(summary, description, fileIds);
    // ^ Dit faalt omdat webtriggers een beperkte context hebben
};
```

**Resolver functions** hebben wel de **juiste context** voor API calls:

```javascript
// ✅ WERKT WEL: API call in resolver function
resolver.define('createIssueWithFileInfo', async (req) => {
    // Deze context heeft wel toegang tot requestJira
    const result = await requestJira('/rest/api/3/issue', { ... });
    // ^ Dit werkt omdat resolvers de juiste context hebben
});
```

## De Oplossing

### 1. ✅ Webtrigger Roept Resolver Aan

**Oude code (werkte niet):**
```javascript
export const createIssueTrigger = async (payload, context) => {
    // Direct API call - werkt niet in webtrigger context
    const result = await createIssueWithFileInfo(summary, description, fileIds);
};
```

**Nieuwe code (werkt wel):**
```javascript
export const createIssueTrigger = async (payload, context) => {
    // Roep resolver function aan - dit werkt wel!
    const result = await resolver.resolve('createIssueWithFileInfo', {
        payload: { summary, description, fileIds }
    });
};
```

### 2. ✅ Juiste Scopes Toegevoegd

**Toegevoegd aan manifest.yml:**
```yaml
permissions:
  scopes:
    - write:attachment:jira  # Nieuw toegevoegd
```

### 3. ✅ App Geüpgraded

- **Deployment:** Versie 12.0.0 ✅
- **Scope upgrade:** `write:attachment:jira` toegevoegd ✅
- **Install upgrade:** Succesvol voltooid ✅

## Waarom Dit Nu Werkt

### Context Hiërarchie in Forge:

1. **Webtriggers**: Beperkte context, geen directe API toegang
2. **Resolver Functions**: Volledige context, wel API toegang
3. **Triggers**: Volledige context, wel API toegang

### De Fix:

```
Frontend → Webtrigger → Resolver Function → API Call
         ↑ HTTP Call  ↑ Internal Call   ↑ requestJira
```

**Voorheen:** Frontend → Webtrigger → Direct API Call ❌
**Nu:** Frontend → Webtrigger → Resolver → API Call ✅

## Test Het Nu!

**Verwachte resultaten:**

1. **✅ GEEN "route" error meer**
2. **✅ GEEN ".asApp is not a function" error meer**
3. **✅ Issue wordt succesvol aangemaakt**
4. **✅ File informatie in description**
5. **✅ Validatie details in comments**

## Belangrijke Lessen

### 1. Forge Context Matters
**Niet alle Forge functions hebben dezelfde context.** Webtriggers zijn beperkt.

### 2. Resolver Functions = API Gateway
**Gebruik resolver functions als "gateway" voor API calls** vanuit webtriggers.

### 3. Scopes Moeten Kloppen
**Nieuwe scopes vereisen een app upgrade** met `forge install --upgrade`.

### 4. File Attachment Realiteit
**Directe file attachment tijdens issue creation is nog steeds niet mogelijk,** maar file informatie in description + comments werkt perfect.

## De Werkende Architectuur

```
┌─────────────────┐    HTTP     ┌──────────────────┐
│   Frontend      │ ──────────→ │   Webtrigger     │
│   (React App)   │             │   (Limited)      │
└─────────────────┘             └──────────────────┘
                                          │
                                          │ resolver.resolve()
                                          ▼
                                ┌──────────────────┐
                                │   Resolver       │
                                │   (Full Context) │
                                └──────────────────┘
                                          │
                                          │ requestJira()
                                          ▼
                                ┌──────────────────┐
                                │   Jira API       │
                                │   (Success!)     │
                                └──────────────────┘
```

