# User Authentication API Documentation

## Base URL
All endpoints are prefixed with `/api/auth`

---

## 1. Login

**Endpoint:** `POST /api/auth/login`

**Description:** Authenticate a user and create a session

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "yourpassword123"
}
```

**Success Response (200):**
```json
{
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "name": "User Name",
    "role": "admin"
  },
  "message": "Login successful"
}
```

**Error Response (400):**
```json
{
  "error": "Email and password are required"
}
```

**Error Response (401):**
```json
{
  "error": "Invalid email or password"
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

---

## 2. Logout

**Endpoint:** `POST /api/auth/logout`

**Description:** Destroy the current user session

**Request Body:** None

**Success Response (200):**
```json
{
  "message": "Logout successful"
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Cookie: session_id=your_session_cookie"
```

---

## 3. Get Current Session

**Endpoint:** `GET /api/auth/session`

**Description:** Get the current authenticated user's session information

**Request Body:** None

**Headers:** 
- Cookie: `session_id=your_session_cookie` (automatically sent by browser)

**Success Response (200):**
```json
{
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "name": "User Name",
    "role": "admin"
  }
}
```

**No Session Response (200):**
```json
{
  "user": null
}
```

**Example cURL:**
```bash
curl -X GET http://localhost:3000/api/auth/session \
  -H "Cookie: session_id=your_session_cookie"
```

---

## 4. Create User

**Endpoint:** `POST /api/auth/create-user`

**Description:** Create a new user account (utility endpoint for initial setup)

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "securepassword123",
  "name": "User Full Name",
  "role": "admin"
}
```

**Field Descriptions:**
- `email` (required): User's email address (must be unique)
- `password` (required): User's password (will be hashed)
- `name` (required): User's full name
- `role` (optional): User role - one of: `"admin"`, `"developer"`, `"general"` (default: `"general"`)

**Success Response (201):**
```json
{
  "user": {
    "id": "uuid-string",
    "email": "newuser@example.com",
    "name": "User Full Name",
    "role": "admin"
  },
  "message": "User created successfully"
}
```

**Error Response (400):**
```json
{
  "error": "Email, password, and name are required"
}
```

**Error Response (400):**
```json
{
  "error": "User with this email already exists"
}
```

**Example cURL:**
```bash
# Create Admin User
curl -X POST http://localhost:3000/api/auth/create-user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123",
    "name": "Admin User",
    "role": "admin"
  }'

# Create Developer User
curl -X POST http://localhost:3000/api/auth/create-user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "developer@example.com",
    "password": "dev123",
    "name": "Developer User",
    "role": "developer"
  }'

# Create General User
curl -X POST http://localhost:3000/api/auth/create-user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "user123",
    "name": "General User",
    "role": "general"
  }'
```

---

## User Roles

The system supports three user roles:

1. **admin**: Full access to admin panel and all features
2. **developer**: Access to developer dashboard and task management
3. **general**: Standard user access to dashboard features

---

## Session Management

- Sessions are stored in HTTP-only cookies named `session_id`
- Sessions expire after 7 days
- Session data is base64-encoded JSON containing user information
- Sessions are automatically validated on each request via middleware

---

## Authentication Flow

1. **Login:**
   - User submits email and password
   - Server validates credentials
   - If valid, creates session cookie
   - Returns user data

2. **Accessing Protected Routes:**
   - Middleware checks for session cookie
   - If no session, redirects to `/login`
   - If session exists, validates and allows access

3. **Role-Based Access:**
   - Admin routes (`/admin/*`) require `role: "admin"`
   - Other routes accessible to all authenticated users
   - Navigation items filtered based on user role

4. **Logout:**
   - Destroys session cookie
   - Redirects to login page

---

## Example: Complete Authentication Flow

### Step 1: Create a User
```bash
POST /api/auth/create-user
{
  "email": "test@example.com",
  "password": "test123",
  "name": "Test User",
  "role": "developer"
}
```

### Step 2: Login
```bash
POST /api/auth/login
{
  "email": "test@example.com",
  "password": "test123"
}
```

Response includes session cookie (automatically handled by browser)

### Step 3: Check Session
```bash
GET /api/auth/session
```

Returns current user information

### Step 4: Access Protected Routes
All routes except `/login` require authentication. The middleware automatically handles this.

### Step 5: Logout
```bash
POST /api/auth/logout
```

Destroys session and redirects to login

---

## Notes

- Passwords are hashed using bcrypt with 10 salt rounds
- Email addresses are stored in lowercase
- Session cookies are HTTP-only for security
- In production, consider using a proper session store (Redis, database) instead of cookie-based sessions

