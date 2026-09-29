export default {
  title: 'System Logs',
  source: 'Instance: {{instanceId}} · File: {{fileName}}',
  status: {
    connecting: 'Connecting...',
    connected: 'Live',
    disconnected: 'Disconnected',
  },
  searchPlaceholder: 'Filter lines...',
  levels: {
    error: 'Error',
    warn: 'Warn',
    info: 'Info',
    debug: 'Debug',
  },
  maxLines: 'Max lines',
  pause: 'Pause',
  resume: 'Resume ({{count}} new)',
  clear: 'Clear',
  reconnect: 'Reconnect',
  jumpToLatest: 'Jump to latest',
  fileNotFound: 'Log file {{fileName}} not found: waiting for it to be created',
  linesCount: 'Showing {{visible}} of {{total}} lines',
  markers: {
    rotated: 'log file rotated',
    skipped: 'too many lines written: some lines skipped',
    truncated: 'older lines not loaded',
  },
}
