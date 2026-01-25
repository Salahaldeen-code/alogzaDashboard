# Postman Request: Register Admin User

## Request Details

**Method:** `POST`  
**URL:** `http://localhost:3000/api/auth/create-user`  
**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "admin@alogza.com",
  "password": "Admin123!@#",
  "name": "Admin User",
  "role": "admin"
}
```

---

## Step-by-Step Instructions

### 1. Create New Request in Postman
- Click **"New"** → **"HTTP Request"**
- Name it: `Register Admin User`

### 2. Set Request Method
- Select **POST** from the dropdown

### 3. Enter URL
- URL: `http://localhost:3000/api/auth/create-user`
- (Replace `localhost:3000` with your server URL if different)

### 4. Set Headers
- Go to **Headers** tab
- Add header:
  - **Key:** `Content-Type`
  - **Value:** `application/json`

### 5. Set Body
- Go to **Body** tab
- Select **raw**
- Select **JSON** from the dropdown
- Paste the JSON body:

```json
{
  "email": "admin@alogza.com",
  "password": "Admin123!@#",
  "name": "Admin User",
  "role": "admin"
}
```

### 6. Send Request
- Click **Send**
- You should receive a **201 Created** response with user data

---

## Expected Response

### Success Response (201 Created)
```json
{
  "user": {
    "id": "uuid-string-here",
    "email": "admin@alogza.com",
    "name": "Admin User",
    "role": "admin"
  },
  "message": "User created successfully"
}
```

### Error Responses

**400 Bad Request - Missing Fields:**
```json
{
  "error": "Email, password, and name are required"
}
```

**400 Bad Request - User Already Exists:**
```json
{
  "error": "User with this email already exists"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to create user",
  "details": "error details here"
}
```

---

## Example cURL Command

If you prefer using cURL instead of Postman:

```bash
curl -X POST http://localhost:3000/api/auth/create-user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@alogza.com",
    "password": "Admin123!@#",
    "name": "Admin User",
    "role": "admin"
  }'
```

---

## Postman Collection JSON

You can import this directly into Postman:

```json
{
  "info": {
    "name": "Alogza Dashboard API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Register Admin User",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"admin@alogza.com\",\n  \"password\": \"Admin123!@#\",\n  \"name\": \"Admin User\",\n  \"role\": \"admin\"\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/auth/create-user",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "auth", "create-user"]
        }
      },
      "response": []
    }
  ]
}
```

---

## Notes

1. **Change the email and password** to your desired admin credentials
2. **Make sure your server is running** on `localhost:3000` (or update the URL)
3. **After registration**, you can use the same email/password to login at `/login`
4. **Security Note:** In production, protect or remove this endpoint as it allows user creation

---

## Test Login After Registration

After successfully registering, test the login:

**POST** `http://localhost:3000/api/auth/login`

**Body:**
```json
{
  "email": "admin@alogza.com",
  "password": "Admin123!@#"
}
```

This should return a session cookie and user data.
