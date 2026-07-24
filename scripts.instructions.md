---
description: "Build scripts and deployment automation for ClientPortal LRG"
applyTo: "scripts/**/*.{js,cjs,ps1,md}"
---

# 🚀 Build & Scripts Instructions - ClientPortal LRG

**ApplyTo**: Build scripts, deployment automation, utility scripts

## 📋 Scripts Overview

ClientPortal LRG uses automated scripts for **multi-portal builds**, **deployments**, and **maintenance tasks** with strict separation between LRG Media and COMUSE environments.

## 🏗️ Build System Architecture

### **Portal-Specific Builds**
```javascript
// scripts/build-portal.js pattern
const buildPortal = async (portalType) => {
  // 1. Validate portal type
  if (!['lrgmedia', 'comuse'].includes(portalType)) {
    throw new Error(`Invalid portal type: ${portalType}`);
  }
  
  // 2. Load portal configuration
  const config = await loadPortalConfig(portalType);
  
  // 3. Set environment variables
  process.env.PORTAL_TYPE = portalType;
  process.env.DATABASE_URL = config.database.url;
  
  // 4. Build with portal context
  await buildClient(config);
  await buildServer(config);
};
```

### **Configuration Management**
```javascript
// Always validate portal configurations
const validatePortalConfig = (config) => {
  const required = ['name', 'database', 'features', 'theme'];
  const missing = required.filter(key => !config[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required config: ${missing.join(', ')}`);
  }
  
  return true;
};
```

## 🎯 Script Categories

### **Build Scripts**
- `build-portal.js` - Single portal build
- `build-all-portals.js` - Build all portals
- `build-portal-config.js` - Generate portal configurations

### **Deployment Scripts**
- `deploy-portal.js` - Deploy specific portal
- `validate-portals.js` - Pre-deployment validation

### **Maintenance Scripts**
- `clean-console-logs.cjs` - Remove console logs from production
- `find-frontend-bugs.cjs` - Detect frontend issues
- `auto-fix-frontend.cjs` - Automated frontend fixes

### **Database Scripts**
- `analyze-performance-bottlenecks.js` - Database performance analysis
- `quick-performance-check.js` - Fast performance validation

## 📦 Portal Build Patterns

### **Environment Isolation**
```javascript
// GOOD: Proper environment separation
const getPortalEnv = (portalType) => {
  const baseEnv = {
    NODE_ENV: process.env.NODE_ENV || 'production',
    PORTAL_TYPE: portalType
  };
  
  // Load portal-specific environment
  const portalEnv = loadEnvFile(`.env.${portalType}`);
  
  return { ...baseEnv, ...portalEnv };
};

// ❌ BAD: Mixing portal environments
process.env.DATABASE_URL = 'mixed-database-url'; // Never do this
```

### **Build Output Management**
```javascript
// Organize builds by portal
const buildOutputPath = (portalType) => {
  return path.join('builds', portalType, 'dist');
};

// Clean previous builds safely
const cleanBuild = async (portalType) => {
  const buildPath = buildOutputPath(portalType);
  await fs.rm(buildPath, { recursive: true, force: true });
  await fs.mkdir(buildPath, { recursive: true });
};
```

## 🔧 Script Development Guidelines

### **Error Handling**
```javascript
// GOOD: Comprehensive error handling
const deployPortal = async (portalType, environment = 'production') => {
  try {
    console.log(`🚀 Deploying ${portalType} to ${environment}...`);
    
    // Validation
    await validatePortalConfig(portalType);
    await validateEnvironment(environment);
    
    // Build
    await buildPortal(portalType);
    
    // Deploy
    await uploadBuild(portalType, environment);
    
    console.log(`Successfully deployed ${portalType}`);
  } catch (error) {
    console.error(`❌ Deployment failed for ${portalType}:`, error.message);
    process.exit(1);
  }
};
```

### **Logging & Monitoring**
```javascript
// Structured logging for scripts
const logger = {
  info: (message, data = {}) => {
    console.log(`ℹ️ ${message}`, data);
  },
  warn: (message, data = {}) => {
    console.warn(`⚠️ ${message}`, data);
  },
  error: (message, error) => {
    console.error(`❌ ${message}`, error.stack || error);
  }
};
```

### **Performance Monitoring**
```javascript
// Track script execution time
const withTiming = async (taskName, task) => {
  const start = Date.now();
  console.log(`⏱️ Starting ${taskName}...`);
  
  try {
    const result = await task();
    const duration = Date.now() - start;
    console.log(`${taskName} completed in ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`❌ ${taskName} failed after ${duration}ms:`, error.message);
    throw error;
  }
};
```

## 🛠️ Common Script Patterns

### **Configuration Loading**
```javascript
// Robust config loading with validation
const loadPortalConfig = async (portalType) => {
  const configPath = `portal-configs/${portalType}.json`;
  
  if (!await fs.pathExists(configPath)) {
    throw new Error(`Configuration not found: ${configPath}`);
  }
  
  const config = await fs.readJson(configPath);
  validatePortalConfig(config);
  
  return config;
};
```

### **Dependency Checking**
```javascript
// Check required dependencies before running
const checkDependencies = async () => {
  const required = ['node', 'npm', 'prisma'];
  
  for (const dep of required) {
    try {
      await exec(`${dep} --version`);
    } catch (error) {
      throw new Error(`Missing dependency: ${dep}`);
    }
  }
};
```

### **Parallel Processing**
```javascript
// Build multiple portals in parallel
const buildAllPortals = async () => {
  const portals = ['lrgmedia', 'comuse'];
  
  const builds = portals.map(portal => 
    withTiming(`Build ${portal}`, () => buildPortal(portal))
  );
  
  await Promise.all(builds);
};
```

## 📋 Quality Assurance

### **Pre-deployment Checks**
```javascript
const validateDeployment = async (portalType) => {
  // 1. Configuration validation
  await validatePortalConfig(portalType);
  
  // 2. Build validation
  await validateBuild(portalType);
  
  // 3. Database connectivity
  await validateDatabase(portalType);
  
  // 4. Environment variables
  await validateEnvironmentVariables(portalType);
  
  console.log(`${portalType} ready for deployment`);
};
```

### **Rollback Procedures**
```javascript
const rollbackDeployment = async (portalType, previousVersion) => {
  console.log(`🔄 Rolling back ${portalType} to ${previousVersion}...`);
  
  // Restore previous build
  await restoreBuild(portalType, previousVersion);
  
  // Update configuration
  await updateConfiguration(portalType, previousVersion);
  
  console.log(`Rollback completed for ${portalType}`);
};
```

## 📚 Key Resources

- **Build Scripts**: `scripts/build-*.js`
- **Portal Configs**: `portal-configs/*.json`
- **Deployment**: `scripts/deploy-portal.js`
- **Maintenance**: `scripts/fix-*.cjs`, `scripts/find-*.cjs`

---

💡 **Scripts Focus**: Prioritize automation, reliability, and clear portal separation.

