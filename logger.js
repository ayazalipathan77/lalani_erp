import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SimpleLogger {
    constructor() {
        this.logDirectory = path.join(__dirname, 'logs');
        this.logFile = path.join(this.logDirectory, 'app.log');
        this.maxFileSize = 5 * 1024 * 1024; // 5MB in bytes

        // Ensure logs directory exists
        if (!fs.existsSync(this.logDirectory)) {
            fs.mkdirSync(this.logDirectory, { recursive: true });
        }
    }

    /**
     * Get current timestamp in ISO format
     */
    getTimestamp() {
        return new Date().toISOString();
    }

    /**
     * Get appropriate console method for log level
     */
    getConsoleMethod(level) {
        switch (level.toLowerCase()) {
            case 'error':
                return console.error;
            case 'warning':
                return console.warn;
            case 'info':
                return console.info;
            case 'debug':
                return console.debug;
            default:
                return console.log;
        }
    }

    /**
     * Check if log file needs to be rotated based on size
     */
    checkFileSize() {
        try {
            if (fs.existsSync(this.logFile)) {
                const stats = fs.statSync(this.logFile);
                return stats.size > this.maxFileSize;
            }
            return false;
        } catch (error) {
            console.error('Error checking file size:', error);
            return false;
        }
    }

    /**
     * Rotate log file when it exceeds size limit
     */
    rotateLogFile() {
        try {
            // Create backup with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = path.join(this.logDirectory, `app-${timestamp}.log`);

            // Rename current log file to backup
            if (fs.existsSync(this.logFile)) {
                fs.renameSync(this.logFile, backupFile);
                console.log(`Log file rotated. Backup created: ${path.basename(backupFile)}`);
            }
        } catch (error) {
            console.error('Error rotating log file:', error);
        }
    }

    /**
     * Write log entry to file
     */
    writeToFile(message, level = 'INFO') {
        try {
            const timestamp = this.getTimestamp();
            const logEntry = `[${timestamp}] [${level}] ${message}\n`;

            fs.appendFileSync(this.logFile, logEntry, 'utf8');
        } catch (error) {
            console.error('Error writing to log file:', error);
        }
    }

    /**
     * Main logging method
     */
    log(level, message, additionalData = null) {
        // Check file size and rotate if necessary
        if (this.checkFileSize()) {
            this.rotateLogFile();
        }

        let logMessage = message;

        // Add additional data if provided (for error details, user info, etc.)
        if (additionalData && typeof additionalData === 'object') {
            try {
                logMessage += ' - Data: ' + JSON.stringify(additionalData, null, 2);
            } catch (error) {
                logMessage += ' - Data: [Could not stringify additional data]';
            }
        }

        // Write to file
        this.writeToFile(logMessage, level);

        // Also log to console for immediate visibility
        const consoleMethod = this.getConsoleMethod(level);
        consoleMethod(logMessage);
    }

    /**
     * Log errors specifically
     */
    error(message, error = null, userInfo = null) {
        let logMessage = `ERROR: ${message}`;

        if (error) {
            if (error.message) logMessage += ` - ${error.message}`;
            if (error.stack) logMessage += ` - Stack: ${error.stack}`;
        }

        if (userInfo) {
            logMessage += ` - User: ${userInfo.username || 'Unknown'} (ID: ${userInfo.userId || 'Unknown'})`;
        }

        this.log('ERROR', logMessage);
    }

    /**
     * Log login attempts
     */
    login(username, success = false, ipAddress = null, userAgent = null) {
        const status = success ? 'SUCCESS' : 'FAILED';
        const message = `LOGIN ${status}: User '${username}' login attempt`;

        const additionalData = {
            ip: ipAddress || 'Unknown',
            userAgent: userAgent || 'Unknown',
            timestamp: this.getTimestamp()
        };

        this.log('INFO', message, additionalData);
    }

    /**
     * Log authentication events
     */
    auth(event, username = null, userId = null, ipAddress = null) {
        const message = `AUTH ${event}: ${username ? `User '${username}'` : 'Unknown user'}`;

        const additionalData = {
            userId: userId || 'Unknown',
            ip: ipAddress || 'Unknown',
            timestamp: this.getTimestamp()
        };

        this.log('INFO', message, additionalData);
    }

    /**
     * Log security-related events
     */
    security(event, details = null, ipAddress = null) {
        const message = `SECURITY ${event}`;

        const additionalData = {
            details: details || 'No additional details',
            ip: ipAddress || 'Unknown',
            timestamp: this.getTimestamp()
        };

        this.log('WARNING', message, additionalData);
    }

    /**
     * General info logging
     */
    info(message, additionalData = null) {
        this.log('INFO', message, additionalData);
    }

    /**
     * General warning logging
     */
    warning(message, additionalData = null) {
        this.log('WARNING', message, additionalData);
    }
}

// Create and export singleton instance
const logger = new SimpleLogger();
export default logger;