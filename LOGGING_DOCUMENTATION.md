# Simple Text Logging System

This project includes a simple text logging system that logs errors and login details to files with automatic file size management.

## Features

- **Automatic File Size Management**: Log files are automatically rotated when they exceed 5MB
- **Structured Logging**: Logs include timestamps, log levels, and structured data
- **Dual Output**: Logs are written to both file and console for immediate visibility
- **Specialized Logging**: Includes specific methods for errors, login attempts, and authentication events

## Files Created

1. **logger.js** - The main logging utility
2. **logs/** directory - Contains log files
3. **app.log** - Main application log file

## Log File Management

- Maximum file size: 5MB
- When the log file exceeds 5MB, it is automatically rotated
- Old log files are renamed with timestamp (e.g., `app-2025-11-27T14-38-42-260Z.log`)
- The current `app.log` file is recreated empty after rotation

## Usage

### Basic Import and Setup

```javascript
import logger from './logger.js';
```

### Logging Methods

#### Error Logging
```javascript
logger.error('Error message', errorObject, { userId: '123', username: 'john' });
```

#### Login Logging
```javascript
// Successful login
logger.login('username', true, '192.168.1.1', 'Mozilla/5.0...');

// Failed login
logger.login('username', false, '192.168.1.1', 'Mozilla/5.0...');
```

#### Authentication Events
```javascript
logger.auth('LOGIN_SUCCESS', 'username', 'userId', '192.168.1.1');
logger.auth('TOKEN_VERIFICATION_FAILED', null, null, '192.168.1.1');
```

#### Security Events
```javascript
logger.security('SUSPICIOUS_ACTIVITY', { reason: 'Multiple failed attempts' }, '192.168.1.1');
```

#### General Logging
```javascript
logger.info('Information message', { key: 'value' });
logger.warning('Warning message', { warningType: 'test' });
```

## Log Format

Logs are written in the following format:
```
[2025-11-27T14:37:47.548Z] [ERROR] ERROR: Database connection failed - Connection timeout - User: admin (ID: 123)
```

### Log Entry Components:
- **Timestamp**: ISO 8601 format
- **Level**: ERROR, WARNING, INFO, etc.
- **Message**: Main log message
- **Additional Data**: Structured data in JSON format (when provided)

## Integration with Server

The logging system is already integrated into the main server.js file:

1. **Database Errors**: All database connection and query errors are logged
2. **Authentication Events**: Login attempts, token verification, WebAuthn events
3. **Security Events**: Failed authentication attempts, missing credentials
4. **Application Errors**: General application errors with context

## Testing

A test script is provided (`test-logger.js`) that demonstrates all logging functionality:

```bash
node test-logger.js
```

This creates test log entries including:
- Basic info messages
- Error logging with stack traces
- Successful and failed login attempts
- Authentication events
- Security events
- File size management testing

## Log File Locations

- **Main Log**: `logs/app.log`
- **Rotated Logs**: `logs/app-{timestamp}.log`

## Best Practices

1. **Context**: Always provide relevant context when logging (user IDs, IP addresses, etc.)
2. **Error Handling**: Log errors with sufficient detail for debugging
3. **Security**: Be careful not to log sensitive information like passwords or tokens
4. **Performance**: The logger is synchronous for reliability but may impact performance for high-volume logging

## Monitoring

Monitor the logs directory for:
- File size growth
- Error frequency
- Security events
- Authentication patterns

Regular log file rotation ensures that disk space usage remains manageable while preserving recent logs for analysis.