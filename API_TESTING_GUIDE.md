# API Testing Guide - PandaHealth Doctor Endpoints

## Base URL
```
https://pandahealthapi-linux-cbb2faancjdre6ae.westeurope-01.azurewebsites.net/api
```

## Authentication

All endpoints require a valid Firebase JWT token in the Authorization header:

```http
Authorization: Bearer <your-firebase-jwt-token>
```

### How to Get Token (via Login)

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "email": "doctor@example.com",
  "password": "YourPassword123!",
  "deviceFingerprint": "test-device-123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "doc123",
    "email": "doctor@example.com",
    "fullName": "Dr. John Doe",
    "role": "Doctor",
    "idToken": "eyJhbGc...",
    "refreshToken": "AMf-v...",
    "expiresIn": 3600,
    "sessionId": "session-123"
  },
  "message": "Login successful",
  "errors": [],
  "timestamp": "2026-01-28T10:00:00Z"
}
```

Use the `idToken` for subsequent requests.

---

## Doctor Endpoints

### 1. Get Pending Cases

**Endpoint:** `GET /api/doctor/cases/pending`

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `pageSize` (optional, default: 10, max: 100) - Items per page
- `priority` (optional) - Filter by priority: "Low", "Medium", "High", "Urgent"

**Example Request:**
```bash
curl -X GET "https://pandahealthapi-linux-cbb2faancjdre6ae.westeurope-01.azurewebsites.net/api/doctor/cases/pending?page=1&pageSize=20&priority=High" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "case-123",
        "caseNumber": "CS-2026-001234",
        "priority": "High",
        "status": "AwaitingDoctor",
        "patientPhone": "+234 800 123 4567",
        "patientAgeRange": "Adult (26-35)",
        "patientGender": "Male",
        "symptoms": "Severe headache, fever",
        "pmvId": "pmv-123",
        "createdBy": "PMV Name",
        "createdAt": "2026-01-28T09:30:00Z"
      }
    ],
    "total": 45,
    "page": 1,
    "pageSize": 20,
    "totalPages": 3
  },
  "message": "Pending cases retrieved successfully"
}
```

---

### 2. Get My Assigned Cases

**Endpoint:** `GET /api/doctor/cases/my-cases`

**Query Parameters:**
- `page` (optional, default: 1)
- `pageSize` (optional, default: 10, max: 100)
- `status` (optional) - Filter by status: "AwaitingDoctor", "InReview", "Completed"

**Example Request:**
```bash
curl -X GET "https://pandahealthapi-linux-cbb2faancjdre6ae.westeurope-01.azurewebsites.net/api/doctor/cases/my-cases?page=1&pageSize=10&status=InReview" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:** Same structure as pending cases

---

### 3. Get Case Details

**Endpoint:** `GET /api/doctor/cases/{id}`

**Example Request:**
```bash
curl -X GET "https://pandahealthapi-linux-cbb2faancjdre6ae.westeurope-01.azurewebsites.net/api/doctor/cases/case-123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "case-123",
    "caseNumber": "CS-2026-001234",
    "priority": "High",
    "status": "AwaitingDoctor",
    "patientPhone": "+234 800 123 4567",
    "patientAgeRange": "Adult (26-35)",
    "patientGender": "Male",
    "symptoms": "Severe headache, fever, body aches",
    "vitals": {
      "temperature": 38.5,
      "bloodPressure": "140/90",
      "heartRate": 95
    },
    "notes": "Patient reports symptoms for 3 days",
    "pmvId": "pmv-123",
    "createdBy": "PMV Name",
    "createdAt": "2026-01-28T09:30:00Z"
  },
  "message": "Case retrieved successfully"
}
```

---

### 4. Claim Case

**Endpoint:** `POST /api/doctor/cases/{caseId}/claim`

**Example Request:**
```bash
curl -X POST "https://pandahealthapi-linux-cbb2faancjdre6ae.westeurope-01.azurewebsites.net/api/doctor/cases/case-123/claim" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "case-123",
    "caseNumber": "CS-2026-001234",
    "doctorId": "doc-123",
    "status": "InReview"
  },
  "message": "Case claimed successfully"
}
```

---

### 5. Submit Diagnosis

**Endpoint:** `POST /api/doctor/cases/{caseId}/diagnosis`

**Request Body:**
```json
{
  "diagnosis": "Acute upper respiratory tract infection",
  "doctorAdvice": "Rest, drink plenty of fluids, and take medications as prescribed",
  "prescriptions": [
    {
      "drugName": "Paracetamol",
      "dosage": "500mg",
      "frequency": "3 times daily",
      "durationDays": 7,
      "instructions": "Take after meals"
    },
    {
      "drugName": "Amoxicillin",
      "dosage": "250mg",
      "frequency": "2 times daily",
      "durationDays": 5,
      "instructions": "Complete full course"
    }
  ]
}
```

**Example Request:**
```bash
curl -X POST "https://pandahealthapi-linux-cbb2faancjdre6ae.westeurope-01.azurewebsites.net/api/doctor/cases/case-123/diagnosis" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "diagnosis": "Acute upper respiratory tract infection",
    "doctorAdvice": "Rest and take medications as prescribed",
    "prescriptions": [...]
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "case-123",
    "caseNumber": "CS-2026-001234",
    "status": "Completed",
    "diagnosis": "Acute upper respiratory tract infection",
    "doctorAdvice": "Rest and take medications as prescribed",
    "prescriptions": [...],
    "diagnosisSubmittedAt": "2026-01-28T10:15:00Z"
  },
  "message": "Diagnosis submitted successfully"
}
```

---

### 6. Get Case History

**Endpoint:** `GET /api/doctor/cases/history`

**Query Parameters:**
- `page` (optional, default: 1)
- `pageSize` (optional, default: 10, max: 100)

**Example Request:**
```bash
curl -X GET "https://pandahealthapi-linux-cbb2faancjdre6ae.westeurope-01.azurewebsites.net/api/doctor/cases/history?page=1&pageSize=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:** Same structure as pending cases, but only completed cases

---

### 7. Get Dashboard Statistics

**Endpoint:** `GET /api/doctor/dashboard/stats`

**Example Request:**
```bash
curl -X GET "https://pandahealthapi-linux-cbb2faancjdre6ae.westeurope-01.azurewebsites.net/api/doctor/dashboard/stats" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pendingCases": 12,
    "inReviewCases": 3,
    "completedToday": 8,
    "completedThisWeek": 45,
    "averageResponseTime": 18,
    "slaComplianceRate": 94.5,
    "totalCasesHandled": 520
  },
  "message": "Dashboard statistics retrieved successfully"
}
```

---

### 8. Get SLA Metrics

**Endpoint:** `GET /api/doctor/dashboard/sla-metrics`

**Example Request:**
```bash
curl -X GET "https://pandahealthapi-linux-cbb2faancjdre6ae.westeurope-01.azurewebsites.net/api/doctor/dashboard/sla-metrics" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCases": 50,
    "withinSla": 47,
    "atRisk": 2,
    "breached": 1,
    "averageResponseTime": 18,
    "targetResponseTime": 30
  },
  "message": "SLA metrics retrieved successfully"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "data": null,
  "message": "Invalid pagination parameters. Page must be >= 1 and PageSize must be between 1 and 100.",
  "errors": [],
  "timestamp": "2026-01-28T10:00:00Z"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "data": null,
  "message": "User not authenticated",
  "errors": [],
  "timestamp": "2026-01-28T10:00:00Z"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "data": null,
  "message": "Access denied. Doctor role required.",
  "errors": [],
  "timestamp": "2026-01-28T10:00:00Z"
}
```

### 404 Not Found
```json
{
  "success": false,
  "data": null,
  "message": "Case not found",
  "errors": [],
  "timestamp": "2026-01-28T10:00:00Z"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "data": null,
  "message": "An error occurred while retrieving pending cases",
  "errors": [],
  "timestamp": "2026-01-28T10:00:00Z"
}
```

---

## Postman Collection

You can import this collection into Postman for easy testing:

```json
{
  "info": {
    "name": "PandaHealth Doctor API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "https://pandahealthapi-linux-cbb2faancjdre6ae.westeurope-01.azurewebsites.net/api",
      "type": "string"
    },
    {
      "key": "token",
      "value": "",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "Login",
      "request": {
        "method": "POST",
        "header": [],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"doctor@example.com\",\n  \"password\": \"Password123!\",\n  \"deviceFingerprint\": \"postman-test\"\n}",
          "options": {
            "raw": {
              "language": "json"
            }
          }
        },
        "url": {
          "raw": "{{baseUrl}}/auth/login",
          "host": ["{{baseUrl}}"],
          "path": ["auth", "login"]
        }
      }
    },
    {
      "name": "Get Pending Cases",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/doctor/cases/pending?page=1&pageSize=10",
          "host": ["{{baseUrl}}"],
          "path": ["doctor", "cases", "pending"],
          "query": [
            {"key": "page", "value": "1"},
            {"key": "pageSize", "value": "10"}
          ]
        }
      }
    }
  ]
}
```

---

## Testing Tips

1. **Get a valid token first** by calling the login endpoint
2. **Copy the idToken** from the response
3. **Add to Authorization header** as `Bearer <token>`
4. **Test pagination** by varying page and pageSize parameters
5. **Test filtering** by adding priority/status parameters
6. **Monitor console logs** on both backend and frontend for debugging

---

## Rate Limits

- **Global:** 100 requests per minute
- **Auth endpoints:** 5 attempts per 5 minutes
- **Per user:** 10 concurrent requests

If you hit rate limits, you'll receive a `429 Too Many Requests` response.

---

**Last Updated:** January 28, 2026
