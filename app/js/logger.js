const config = require('config');
const bunyan = require('bunyan');
const path = require('path');
const mkdirP = require('mkdirP');

function createLogger(key = "electron") {
    const logConfig = config.get("logging.bunyanLogs")[key];

    // You can't directly specify process.stdout or process.stderr in the configuration file, so provide a way to use them
    for (let stream of logConfig.streams) {
        if (stream.type === "stdout") {
            delete stream.type;
            stream.stream = process.stdout;
        } else if (stream.type === "stderr") {
            delete stream.type;
            stream.stream = process.stderr;
        }

        // Ensure existance of the directory into which the log files are to be placed
        if (stream.path) {
            mkdirP.sync(path.dirname(stream.path));
        }
    }

    const bunyanlogger = bunyan.createLogger(logConfig);

    // Isolate our system from direct dependencies on Bunyan
    const logger = {
        fatal: (...args) => bunyanlogger.fatal(...args),
        error: (...args) => bunyanlogger.error(...args),
        warn: (...args) => bunyanlogger.warn(...args),
        info: (...args) => bunyanlogger.info(...args),
        debug: (...args) => bunyanlogger.debug(...args),
        trace: (...args) => bunyanlogger.trace(...args),
        child: (options, simple) => bunyanlogger.child(options, simple)
    };

    return logger;
}

function getAllLogPaths() {
    const allPaths = [];
    const logs = config.get('logging.bunyanLogs');

    for (let logName in logs) {
        const mainStreams = logs[logName].streams.filter(stream => stream.isMainLog);
        if (mainStreams.length > 0) {
            allPaths.push(mainStreams[0].path);
        }
    }

    return allPaths;
}

// function getAllWindowsEventLogSearches() {
//     return config.get('logging.windowsEventLogs');
// }

module.exports = {
    default: createLogger(),
    createLogger,
    getAllLogPaths
};