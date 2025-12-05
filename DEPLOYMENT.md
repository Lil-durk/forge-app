# Quick Deployment Guide for JSM Forge App

## For Quick Code Updates

When you make changes to your code and want to deploy them quickly to Jira Service Management, follow these commands in order:

### 1. Build the Frontend (if you changed React code)
```bash
cd static/validaite && npm run build && cd ../..
```

### 2. Deploy to Atlassian
```bash
forge deploy
```

### 3. Install/Update in Your JSM Instance
```bash
forge install
```

## Complete Workflow Commands

### For Development (Local Testing)
```bash
forge tunnel
```

### For Production Deployment
```bash
cd static/validaite && npm run build && cd ../..

# 2. Deploy to Atlassian Cloud
forge deploy

# 3. Install in your JSM instance (first time only)
forge install

# 4. Or upgrade existing installation
forge install --upgrade
```

## ⚡ One-Line Quick Update
```bash
cd static/validaite && npm run build && cd ../.. && forge deploy
```

## Command Explanations

- **`npm run build`**: Compiles your React app into optimized production files
- **`forge deploy`**: Uploads your app code to Atlassian's servers
- **`forge install`**: Installs the app in your Jira Service Management instance
- **`forge install --upgrade`**: Updates an existing installation
- **`forge tunnel`**: Runs the app locally for development/testing

## Typical Development Cycle

1. **Make code changes** in `src/` or `static/validaite/src/`
2. **Test locally**: `forge tunnel`
3. **Build frontend**: `cd static/validaite && npm run build && cd ../..`
4. **Deploy**: `forge deploy`
5. **Update JSM**: `forge install --upgrade` (if needed)

## Pro Tips

- Use `forge tunnel` for rapid development - no deployment needed
- Only run `forge install` once per environment
- Use `forge install --upgrade` for subsequent updates
- The build step is only needed if you changed React code
- Backend changes (in `src/index.js`) only need `forge deploy`

## Checking Status

```bash
forge install list

forge logs

forge status
