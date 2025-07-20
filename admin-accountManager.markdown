# Admin-AccountManager Node Operations Documentation

This document describes the operations supported by the `Admin-AccountManager` Node-RED node, including the required input `msg` format and the expected output `msg` format for each operation. The node handles user account management tasks (e.g., create, update, delete, login) using a PostgreSQL database via an `event-pg-config` node.

## General Notes
- **Node Configuration**: The `Admin-AccountManager` node requires an `event-pg-config` node to be configured with valid PostgreSQL connection details (host, port, user, password, database).
- **Input Message**: The input `msg` must include `msg.operation` (case-insensitive) to specify the operation and `msg.payload` containing the operation-specific data.
- **Output Message**: The output `msg` typically includes `msg.payload` with a `success` boolean and either `data` (on success) or `error` (on failure). For the `login` operation, `msg.cookies` may also be set.
- **Error Handling**: If an operation fails, `msg.payload` contains `{ success: false, error: { code, message, details } }`, where `code` is a specific error code (e.g., `VALIDATION_ERROR`, `USERNAME_EXISTS`), `message` describes the error, and `details` may provide additional context (e.g., validation errors).

## Supported Operations

### 1. Create Account (`create`)
Creates a new user account in the database.

#### Input `msg`
```json
{
  "operation": "create",
  "payload": {
    "fullname": "string", // Required: Full name of the user (non-empty)
    "role": "string",     // Required: One of ["administrator", "operator", "maintenance", "dev"]
    "username": "string", // Required: Unique username (non-empty)
    "password": "string", // Required: Password (minimum 6 characters)
    "status": "string"    // Required: One of ["active", "inactive"]
  }
}
```

#### Output `msg`
- **Success**:
  ```json
  {
    "payload": {
      "success": true,
      "data": { "id": "uuid" } // UUID of the created account
    },
    "topic": "createAccount"
  }
  ```
- **Error** (e.g., username already exists):
  ```json
  {
    "payload": {
      "success": false,
      "error": {
        "code": "USERNAME_EXISTS",
        "message": "Username already exists"
      }
    }
  }
  ```

#### Example
```json
{
  "operation": "create",
  "payload": {
    "fullname": "John Doe",
    "role": "administrator",
    "username": "johndoe",
    "password": "secure123",
    "status": "active"
  }
}
```

### 2. Update Account (`update`)
Updates an existing account’s details.

#### Input `msg`
```json
{
  "operation": "update",
  "payload": {
    "id": "uuid",         // Required: UUID of the account to update
    "fullname": "string", // Optional: New full name
    "role": "string",     // Optional: One of ["administrator", "operator", "maintenance", "dev"]
    "username": "string", // Optional: New username (must be unique)
    "password": "string", // Optional: New password (minimum 6 characters)
    "status": "string"    // Optional: One of ["active", "inactive"]
  }
}
```

#### Output `msg`
- **Success**:
  ```json
  {
    "payload": {
      "success": true,
      "data": { "id": "uuid" } // UUID of the updated account
    },
    "topic": "updateAccount"
  }
  ```
- **Error** (e.g., invalid UUID):
  ```json
  {
    "payload": {
      "success": false,
      "error": {
        "code": "VALIDATION_ERROR",
        "message": "Invalid payload",
        "details": [{ /* AJV validation errors */ }]
      }
    }
  }
  ```

#### Example
```json
{
  "operation": "update",
  "payload": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "fullname": "Jane Doe",
    "role": "operator",
    "status": "inactive"
  }
}
```

### 3. Delete Account (`delete`)
Soft-deletes an account by setting its `delete_at` timestamp.

#### Input `msg`
```json
{
  "operation": "delete",
  "payload": {
    "id": "uuid" // Required: UUID of the account to soft-delete
  }
}
```

#### Output `msg`
- **Success**:
  ```json
  {
    "payload": {
      "success": true,
      "data": { "id": "uuid" } // UUID of the deleted account
    },
    "topic": "deleteAccount"
  }
  ```
- **Error** (e.g., account not found):
  ```json
  {
    "payload": {
      "success": false,
      "error": {
        "code": "INTERNAL_ERROR",
        "message": "No rows affected"
      }
    }
  }
  ```

#### Example
```json
{
  "operation": "delete",
  "payload": {
    "id": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

### 4. Hard Delete Account (`harddelete`)
Permanently deletes an account from the database.

#### Input `msg`
```json
{
  "operation": "harddelete",
  "payload": {
    "id": "uuid" // Required: UUID of the account to hard-delete
  }
}
```

#### Output `msg`
- **Success**:
  ```json
  {
    "payload": {
      "success": true,
      "data": { "id": "uuid", "deletedCount": 1 } // UUID and number of deleted rows
    },
    "topic": "hardDeleteAccount"
  }
  ```
- **Error** (e.g., account not found):
  ```json
  {
    "payload": {
      "success": false,
      "error": {
        "code": "INTERNAL_ERROR",
        "message": "No rows affected"
      }
    }
  }
  ```

#### Example
```json
{
  "operation": "harddelete",
  "payload": {
    "id": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

### 5. Find Account (`find`)
Retrieves details of a single account by ID.

#### Input `msg`
```json
{
  "operation": "find",
  "payload": {
    "id": "uuid" // Required: UUID of the account to find
  }
}
```

#### Output `msg`
- **Success**:
  ```json
  {
    "payload": {
      "success": true,
      "data": {
        "id": "uuid",
        "fullname": "string",
        "role": "string",
        "username": "string",
        "status": "string",
        "created_at": "timestamp",
        "updated_at": "timestamp",
        "last_login": "timestamp",
        "delete_at": null
      }
    },
    "topic": "findAccount"
  }
  ```
- **Error** (e.g., account not found):
  ```json
  {
    "payload": {
      "success": true,
      "data": null
    },
    "topic": "findAccount"
  }
  ```

#### Example
```json
{
  "operation": "find",
  "payload": {
    "id": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

### 6. Find All Accounts (`findall`)
Retrieves all active accounts, ordered by fullname.

#### Input `msg`
```json
{
  "operation": "findall",
  "payload": {} // No specific fields required
}
```

#### Output `msg`
- **Success**:
  ```json
  {
    "payload": {
      "success": true,
      "data": [
        {
          "id": "uuid",
          "fullname": "string",
          "role": "string",
          "username": "string",
          "status": "string",
          "created_at": "timestamp",
          "updated_at": "timestamp",
          "last_login": "timestamp",
          "delete_at": null
        },
        ...
      ]
    },
    "topic": "findAllAccounts"
  }
  ```
- **Error** (e.g., validation error):
  ```json
  {
    "payload": {
      "success": false,
      "error": {
        "code": "VALIDATION_ERROR",
        "message": "Invalid payload",
        "details": [{ /* AJV validation errors */ }]
      }
    }
  }
  ```

#### Example
```json
{
  "operation": "findall",
  "payload": {}
}
```

### 7. Login Account (`login`)
Authenticates a user and sets a session cookie.

#### Input `msg`
```json
{
  "operation": "login",
  "payload": {
    "username": "string", // Required: Username (non-empty)
    "password": "string"  // Required: Password (minimum 6 characters)
  }
}
```

#### Output `msg`
- **Success**:
  ```json
  {
    "payload": {
      "success": true,
      "data": {
        "id": "uuid",
        "fullname": "string",
        "role": "string",
        "username": "string",
        "status": "string",
        "created_at": "timestamp",
        "updated_at": "timestamp",
        "last_login": "timestamp",
        "delete_at": null
      }
    },
    "cookies": {
      "accountId": {
        "value": { /* user object */ },
        "options": { "httpOnly": true, "path": "/" }
      }
    },
    "topic": "loginAccount"
  }
  ```
- **Error** (e.g., wrong password):
  ```json
  {
    "payload": {
      "success": false,
      "error": {
        "code": "INVALID_CREDENTIALS",
        "message": "Wrong password"
      }
    }
  }
  ```

#### Example
```json
{
  "operation": "login",
  "payload": {
    "username": "johndoe",
    "password": "secure123"
  }
}
```

### 8. Logout (`logout`)
Clears the session cookie.

#### Input `msg`
```json
{
  "operation": "logout",
  "payload": {} // No specific fields required
}
```

#### Output `msg`
- **Success**:
  ```json
  {
    "payload": { "success": true },
    "cookies": {
      "accountId": {
        "value": "",
        "options": { "expires": "1970-01-01T00:00:00.000Z", "path": "/" }
      }
    },
    "topic": undefined
  }
  ```
- **Error**: Not applicable (logout always succeeds).

#### Example
```json
{
  "operation": "logout",
  "payload": {}
}
```

### 9. Get Deleted Account (`getdeletedaccount`)
Retrieves details of a soft-deleted account by ID.

#### Input `msg`
```json
{
  "operation": "getdeletedaccount",
  "payload": {
    "id": "uuid" // Required: UUID of the soft-deleted account
  }
}
```

#### Output `msg`
- **Success**:
  ```json
  {
    "payload": {
      "success": true,
      "data": {
        "id": "uuid",
        "fullname": "string",
        "role": "string",
        "username": "string",
        "status": "string",
        "created_at": "timestamp",
        "updated_at": "timestamp",
        "last_login": "timestamp",
        "delete_at": "timestamp"
      }
    },
    "topic": "getDeletedAccount"
  }
  ```
- **Error** (e.g., account not found):
  ```json
  {
    "payload": {
      "success": true,
      "data": null
    },
    "topic": "getDeletedAccount"
  }
  ```

#### Example
```json
{
  "operation": "getdeletedaccount",
  "payload": {
    "id": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

### 10. Get All Deleted Accounts (`getalldeletedaccount`)
Retrieves all soft-deleted accounts, ordered by deletion time (descending).

#### Input `msg`
```json
{
  "operation": "getalldeletedaccount",
  "payload": {} // No specific fields required
}
```

#### Output `msg`
- **Success**:
  ```json
  {
    "payload": {
      "success": true,
      "data": [
        {
          "id": "uuid",
          "fullname": "string",
          "role": "string",
          "username": "string",
          "status": "string",
          "created_at": "timestamp",
          "updated_at": "timestamp",
          "last_login": "timestamp",
          "delete_at": "timestamp"
        },
        ...
      ]
    },
    "topic": "getAllDeletedAccount"
  }
  ```
- **Error** (e.g., validation error):
  ```json
  {
    "payload": {
      "success": false,
      "error": {
        "code": "VALIDATION_ERROR",
        "message": "Invalid payload",
        "details": [{ /* AJV validation errors */ }]
      }
    }
  }
  ```

#### Example
```json
{
  "operation": "getalldeletedaccount",
  "payload": {}
}
```

### 11. Recover Deleted Account (`recoverdeletedaccount`)
Restores a soft-deleted account by clearing its `delete_at` timestamp.

#### Input `msg`
```json
{
  "operation": "recoverdeletedaccount",
  "payload": {
    "id": "uuid" // Required: UUID of the soft-deleted account
  }
}
```

#### Output `msg`
- **Success**:
  ```json
  {
    "payload": {
      "success": true,
      "data": { "id": "uuid", "recovered": 1 } // UUID and number of recovered rows
    },
    "topic": "recoverDeletedAccount"
  }
  ```
- **Error** (e.g., account not found):
  ```json
  {
    "payload": {
      "success": true,
      "data": { "id": "uuid", "recovered": 0 }
    },
    "topic": "recoverDeletedAccount"
  }
  ```

#### Example
```json
{
  "operation": "recoverdeletedaccount",
  "payload": {
    "id": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

## Common Error Codes
- `UNKNOWN_OPERATION`: Invalid or unsupported `msg.operation`.
- `VALIDATION_ERROR`: Invalid `msg.payload` format (includes `details` with AJV validation errors).
- `USERNAME_EXISTS`: Username is already in use for `create` or `update`.
- `USER_NOT_FOUND`: Username not found for `login`.
- `INVALID_CREDENTIALS`: Incorrect password for `login`.
- `INTERNAL_ERROR`: General database or server error.

## Notes
- **UUID Format**: The `id` field must be a valid UUID (e.g., `123e4567-e89b-12d3-a456-426614174000`).
- **Node Status**: The node updates its status in the Node-RED editor:
    - Blue dot (`processing`): Operation is in progress.
    - Green dot (`<operation>` or `logout`): Operation succeeded.
    - Red ring (`<error code>` or `ERROR`): Operation failed.
    - Grey ring (`disconnected`): Node is closed.
- **FlowFuse Dashboard Integration**: Use with `ui-template` nodes to create a user management interface (e.g., list accounts, handle logins) in FlowFuse Dashboard 2.0.
- **Dependencies**: Ensure the `event-pg-config` node is configured and the database is accessible.