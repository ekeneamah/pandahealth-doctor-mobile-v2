# API Mapping Analysis - PandaHealth Doctor App

**Generated:** January 28, 2026  
**Status:** ⚠️ Multiple Mismatches Detected

---

## 📋 Executive Summary

### Critical Issues Found:
1. **8 API Path Mismatches** - Frontend expects `/doctor/*` and `/auth/profile`, backend provides `/api/*` and `/auth/me`
2. **5 Missing Endpoints** - Dashboard stats, SLA metrics, claim case, case history, and specific doctor case filtering
3. **Route Prefix Inconsistency** - Frontend uses relative paths, backend uses `/api/` prefix
4. **Need for DoctorController** - Doctor-specific endpoints scattered across CasesController

---

## 🔴 1. API PATH MISMATCHES

### Authentication Endpoints

| Frontend Expectation | Backend Reality | Status | Fix Required |
|---------------------|-----------------|--------|--------------|
| `GET /auth/profile` | `GET /api/auth/me` | ❌ MISMATCH | Frontend OR Backend |
| `POST /auth/login` | `POST /api/auth/login` | ⚠️ PREFIX | API Client Config |
| `POST /auth/logout` | `POST /api/auth/logout` | ⚠️ PREFIX | API Client Config |
| `POST /auth/refresh` | `POST /api/auth/refresh` | ⚠️ PREFIX | API Client Config |
| `POST /auth/change-password` | `POST /api/auth/change-password` | ⚠️ PREFIX | API Client Config |

**Impact:** 
- `getProfile()` will return 404
- All auth endpoints have `/api/` prefix issue

**Recommended Fix:**
```typescript
// Option 1: Update API_BASE_URL to include /api
export const API_BASE_URL = 'http://localhost:5000/api';

// Option 2: Create alias endpoint
[HttpGet("profile")] // Add to AuthController
public async Task<IActionResult> GetProfile() => await GetCurrentUser();
```

---

### Case Management Endpoints

| Frontend Expectation | Backend Reality | Status | Fix Required |
|---------------------|-----------------|--------|--------------|
| `GET /doctor/cases/pending` | `GET /api/cases/pending` | ❌ MISMATCH | New DoctorController |
| `GET /doctor/cases/my-cases` | `GET /api/cases/my-assigned-cases` | ❌ MISMATCH | New DoctorController |
| `GET /doctor/cases/{id}` | `GET /api/cases/{id}` | ⚠️ PREFIX | API Client Config |
| `POST /doctor/cases/{id}/claim` | ❌ **MISSING** | ❌ MISSING | New DoctorController |
| `POST /doctor/cases/{id}/diagnosis` | `POST /api/cases/diagnosis` | ⚠️ STRUCTURE | Restructure Request |

**Impact:**
- `getPendingCases()` returns 404
- `getMyCases()` returns 404  
- `claimCase()` returns 404
- Case detail screen broken

---

### Dashboard Endpoints

| Frontend Expectation | Backend Reality | Status | Fix Required |
|---------------------|-----------------|--------|--------------|
| `GET /doctor/dashboard/stats` | ❌ **MISSING** | ❌ MISSING | New DoctorController |
| `GET /doctor/dashboard/sla-metrics` | ❌ **MISSING** | ❌ MISSING | New DoctorController |
| `GET /doctor/cases/history` | ❌ **MISSING** | ❌ MISSING | New DoctorController |

**Impact:**
- Dashboard screen cannot load
- SLA compliance metrics unavailable
- History screen broken

---

### Chat Endpoints

| Frontend Expectation | Backend Reality | Status | Fix Required |
|---------------------|-----------------|--------|--------------|
| `GET /chat/cases/{caseId}/messages` | `GET /api/chat/cases/{caseId}/messages` | ⚠️ PREFIX | API Client Config |
| `POST /chat/messages` | `POST /api/chat/messages` | ⚠️ PREFIX | API Client Config |
| `POST /chat/cases/{caseId}/read` | `POST /api/chat/cases/{caseId}/read` | ⚠️ PREFIX | API Client Config |
| `GET /chat/threads` | `GET /api/chat/threads` | ⚠️ PREFIX | API Client Config |
| `GET /chat/unread` | `GET /api/chat/unread` | ⚠️ PREFIX | API Client Config |

**Impact:**
- All chat features work BUT require `/api/` prefix fix

---

## 🟢 2. WORKING ENDPOINTS (After Prefix Fix)

### Already Aligned:
- ✅ `POST /auth/login` → `POST /api/auth/login`
- ✅ `POST /auth/logout` → `POST /api/auth/logout`
- ✅ `POST /auth/refresh` → `POST /api/auth/refresh`
- ✅ `POST /auth/change-password` → `POST /api/auth/change-password`
- ✅ `GET /cases/{id}` → `GET /api/cases/{id}`
- ✅ All Chat endpoints (structure matches)

---

## 🟡 3. MISSING BACKEND ENDPOINTS

### High Priority - Required for App to Function:

#### 1. **Claim Case Endpoint**
```csharp
// Required in: DoctorController
[HttpPost("cases/{caseId}/claim")]
[Authorize(Policy = "DoctorOnly")]
public async Task<IActionResult> ClaimCase(string caseId)
{
    var userId = GetUserId();
    var result = await _caseService.AssignCaseToDoctorAsync(caseId, userId);
    return Ok(ApiResponse<CaseDto>.SuccessResponse(result.Data!, "Case claimed"));
}
```

#### 2. **Dashboard Stats Endpoint**
```csharp
// Required in: DoctorController
[HttpGet("dashboard/stats")]
[Authorize(Policy = "DoctorOnly")]
public async Task<IActionResult> GetDashboardStats()
{
    var userId = GetUserId();
    var stats = await _doctorService.GetDashboardStatsAsync(userId);
    return Ok(ApiResponse<DoctorDashboardStats>.SuccessResponse(stats));
}
```

#### 3. **SLA Metrics Endpoint**
```csharp
// Required in: DoctorController
[HttpGet("dashboard/sla-metrics")]
[Authorize(Policy = "DoctorOnly")]
public async Task<IActionResult> GetSLAMetrics()
{
    var userId = GetUserId();
    var metrics = await _doctorService.GetSLAMetricsAsync(userId);
    return Ok(ApiResponse<SLAMetrics>.SuccessResponse(metrics));
}
```

#### 4. **Case History Endpoint**
```csharp
// Required in: DoctorController
[HttpGet("cases/history")]
[Authorize(Policy = "DoctorOnly")]
public async Task<IActionResult> GetCaseHistory(
    [FromQuery] int page = 1, 
    [FromQuery] int pageSize = 10)
{
    var userId = GetUserId();
    var cases = await _caseService.GetDoctorCompletedCasesAsync(userId, page, pageSize);
    return Ok(ApiResponse<PaginatedResponse<CaseDto>>.SuccessResponse(cases));
}
```

#### 5. **Get Pending Cases (Doctor-specific route)**
```csharp
// Required in: DoctorController
[HttpGet("cases/pending")]
[Authorize(Policy = "DoctorOnly")]
public async Task<IActionResult> GetPendingCases(
    [FromQuery] int page = 1, 
    [FromQuery] int pageSize = 10)
{
    var result = await _caseService.GetPendingCasesForDoctorAsync(page, pageSize);
    return Ok(ApiResponse<PaginatedResponse<CaseDto>>.SuccessResponse(result));
}
```

#### 6. **Get My Cases (Doctor-specific route)**
```csharp
// Required in: DoctorController
[HttpGet("cases/my-cases")]
[Authorize(Policy = "DoctorOnly")]
public async Task<IActionResult> GetMyCases(
    [FromQuery] int page = 1, 
    [FromQuery] int pageSize = 10,
    [FromQuery] string? status = null)
{
    var userId = GetUserId();
    var result = await _caseService.GetDoctorCasesAsync(userId, page, pageSize, status);
    return Ok(ApiResponse<PaginatedResponse<CaseDto>>.SuccessResponse(result));
}
```

---

## 🎯 4. RECOMMENDED SOLUTION: Create DoctorController

### Why a Separate DoctorController?

1. **Separation of Concerns** - Doctor-specific logic separated from general case management
2. **Route Clarity** - All doctor endpoints under `/api/doctor/*`
3. **Authorization** - All endpoints have `[Authorize(Policy = "DoctorOnly")]` by default
4. **Maintainability** - Easier to find and update doctor-specific features

### Proposed DoctorController Structure:

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PandaHealth.Application.DTOs.Cases;
using PandaHealth.Application.DTOs.Common;
using PandaHealth.Application.Interfaces;
using System.Security.Claims;

namespace PandaHealth.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "DoctorOnly")]
public class DoctorController : ControllerBase
{
    private readonly ICaseService _caseService;
    private readonly IDoctorService _doctorService;
    private readonly ILogger<DoctorController> _logger;

    public DoctorController(
        ICaseService caseService,
        IDoctorService doctorService,
        ILogger<DoctorController> logger)
    {
        _caseService = caseService;
        _doctorService = doctorService;
        _logger = logger;
    }

    private string? GetUserId() => User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    // === CASE MANAGEMENT ===

    [HttpGet("cases/pending")]
    public async Task<IActionResult> GetPendingCases(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 10) { /* ... */ }

    [HttpGet("cases/my-cases")]
    public async Task<IActionResult> GetMyCases(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 10,
        [FromQuery] string? status = null) { /* ... */ }

    [HttpGet("cases/{id}")]
    public async Task<IActionResult> GetCase(string id) { /* ... */ }

    [HttpPost("cases/{caseId}/claim")]
    public async Task<IActionResult> ClaimCase(string caseId) { /* ... */ }

    [HttpPost("cases/{caseId}/diagnosis")]
    public async Task<IActionResult> SubmitDiagnosis(
        string caseId,
        [FromBody] SubmitDiagnosisRequest request) { /* ... */ }

    [HttpGet("cases/history")]
    public async Task<IActionResult> GetCaseHistory(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 10) { /* ... */ }

    // === DASHBOARD ===

    [HttpGet("dashboard/stats")]
    public async Task<IActionResult> GetDashboardStats() { /* ... */ }

    [HttpGet("dashboard/sla-metrics")]
    public async Task<IActionResult> GetSLAMetrics() { /* ... */ }
}
```

---

## 📝 5. FRONTEND SCREENS & API DEPENDENCY MAP

### LoginScreen
- ✅ `authService.login()` → `POST /api/auth/login`
- **Status:** Working (needs prefix fix)

### CasesScreen  
- ❌ `caseService.getPendingCases()` → `GET /doctor/cases/pending`
- ❌ `caseService.getMyCases()` → `GET /doctor/cases/my-cases`
- **Status:** BROKEN - Endpoints don't exist

### CaseDetailScreen
- ⚠️ `caseService.getById()` → `GET /doctor/cases/{id}`
- ❌ `caseService.claimCase()` → `POST /doctor/cases/{id}/claim`
- ❌ `caseService.submitDiagnosis()` → `POST /doctor/cases/{id}/diagnosis`
- **Status:** PARTIALLY BROKEN - Claim and diagnosis endpoints wrong

### DashboardScreen
- ❌ `caseService.getStats()` → `GET /doctor/dashboard/stats`
- ❌ `caseService.getSLAMetrics()` → `GET /doctor/dashboard/sla-metrics`
- **Status:** BROKEN - Endpoints don't exist

### HistoryScreen
- ❌ `caseService.getCompletedCases()` → `GET /doctor/cases/history`
- **Status:** BROKEN - Endpoint doesn't exist

### SettingsScreen
- ❌ `authService.getProfile()` → `GET /auth/profile` (backend has `/auth/me`)
- ⚠️ `authService.changePassword()` → `POST /auth/change-password`
- **Status:** PARTIALLY BROKEN - Profile endpoint mismatch

---

## 🛠️ 6. IMPLEMENTATION PRIORITY

### Phase 1: Quick Wins (1-2 hours)
1. ✅ Fix API prefix issue in `api-client.ts`
2. ✅ Add `/auth/profile` alias to AuthController OR update frontend to use `/auth/me`

### Phase 2: Critical Features (4-6 hours)
1. 🔨 Create `DoctorController.cs`
2. 🔨 Implement case management endpoints:
   - `GET /cases/pending`
   - `GET /cases/my-cases`
   - `GET /cases/{id}`
   - `POST /cases/{caseId}/claim`
   - `POST /cases/{caseId}/diagnosis`
   - `GET /cases/history`

### Phase 3: Dashboard (2-4 hours)
1. 🔨 Create `IDoctorService` interface
2. 🔨 Implement `DoctorService` with:
   - `GetDashboardStatsAsync()`
   - `GetSLAMetricsAsync()`
3. 🔨 Add dashboard endpoints to DoctorController

### Phase 4: Testing & Validation (2-3 hours)
1. 🧪 Test all doctor workflows end-to-end
2. 🧪 Validate SLA calculations
3. 🧪 Test case claiming and assignment

**Total Estimated Time:** 9-15 hours

---

## 🔧 7. IMMEDIATE ACTION ITEMS

### Backend Team:
1. [ ] Create `DoctorController.cs` with all doctor-specific endpoints
2. [ ] Create `IDoctorService` and `DoctorService` for dashboard logic
3. [ ] Add pagination support to case list endpoints
4. [ ] Add alias endpoint `GET /api/auth/profile` → redirects to `/api/auth/me`
5. [ ] Update diagnosis submission to accept `caseId` in route: `POST /doctor/cases/{caseId}/diagnosis`

### Frontend Team:
1. [ ] Update `API_BASE_URL` in config to include `/api` prefix
2. [ ] OR update all service calls to add `/api` prefix
3. [ ] Change `getProfile()` to call `/auth/me` instead of `/auth/profile`
4. [ ] Update diagnosis submission to use new route structure

### DevOps:
1. [ ] Update API documentation with new endpoints
2. [ ] Add health check for DoctorController
3. [ ] Configure CORS if needed for `/api/doctor/*` routes

---

## 📊 8. SUMMARY STATISTICS

| Category | Count | Status |
|----------|-------|--------|
| **Total Frontend API Calls** | 15 | - |
| **Working Endpoints** | 6 | ✅ 40% |
| **Prefix Issues Only** | 4 | ⚠️ 27% |
| **Path Mismatches** | 3 | ❌ 20% |
| **Missing Endpoints** | 5 | ❌ 33% |
| **Endpoints Needing DoctorController** | 8 | 🔨 53% |

---

## 🎯 9. FINAL RECOMMENDATIONS

### Option A: Minimal Changes (Quick Fix)
**Time:** 2-3 hours  
**Approach:** Fix prefix + add missing endpoints to existing controllers

✅ Pros: Fastest to implement  
❌ Cons: Messy architecture, harder to maintain

### Option B: Proper Architecture (Recommended)
**Time:** 9-15 hours  
**Approach:** Create DoctorController + proper service layer

✅ Pros: Clean separation, maintainable, scalable  
✅ Pros: Aligns with REST best practices  
✅ Pros: Easier to add doctor-specific features later  
❌ Cons: More initial work

**Recommendation: Choose Option B** - The additional 6-12 hours investment will save significant time in future development and debugging.

---

## 📞 NEXT STEPS

1. **Backend Lead:** Review and approve DoctorController structure
2. **Frontend Lead:** Confirm API contract matches expectations  
3. **Both Teams:** Agree on API prefix strategy (`/api` in baseURL vs. individual routes)
4. **Backend Team:** Implement DoctorController (see Phase 2 above)
5. **Frontend Team:** Update API client configuration (see Phase 1 above)
6. **QA Team:** Prepare test cases for all doctor workflows

---

**Document Owner:** GitHub Copilot  
**Last Updated:** January 28, 2026  
**Status:** Awaiting Team Review
