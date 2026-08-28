#!/usr/bin/env python3
"""
Minimal fail2ban-regex replacement for Windows.
Analyzes nginx access.log against fail2ban filter patterns.
"""
import re
import sys
import os
from datetime import datetime


def parse_nginx_log_line(line):
    """Parse a single nginx access.log line."""
    # Format: IP - - [date] "METHOD URL PROTOCOL" status size "referer" "ua" "-"
    pattern = r'^(\S+) - \S+ \[.*?\] "\S+ (\S+) \S+" (\d+) '
    match = re.match(pattern, line)
    if match:
        return {
            'ip': match.group(1),
            'url': match.group(2),
            'status': match.group(3),
            'line': line.strip()
        }
    return None


def extract_variables(filter_content):
    """Extract variable definitions from filter file."""
    variables = {}
    for line in filter_content.split('\n'):
        line = line.strip()
        if '=' in line and not line.startswith('#') and not line.startswith('['):
            key, value = line.split('=', 1)
            key = key.strip()
            value = value.strip()
            # Only keep simple variables (not failregex/ignoreregex/datepattern)
            if key not in ('failregex', 'ignoreregex', 'datepattern', 'enabled', 'port', 'filter', 'logpath', 'maxretry', 'maxlines'):
                # ConfigParser simulation: %% → % (except in %(variable)s references)
                import re as _re
                value = _re.sub(r'%%(?!s\b|[^%])', '%', value)
                variables[key] = value
    return variables


def expand_variables(pattern, variables):
    """Expand %(variable)s references in pattern."""
    for key, value in variables.items():
        pattern = pattern.replace(f'%({key})s', value)
    return pattern


def extract_failregex(filter_content):
    """Extract failregex patterns from filter file."""
    patterns = []
    in_failregex = False
    for line in filter_content.split('\n'):
        line = line.strip()
        if line.startswith('failregex'):
            in_failregex = True
            # Check if pattern is on same line
            if '=' in line:
                pattern = line.split('=', 1)[1].strip()
                if pattern:
                    patterns.append(pattern)
            continue
        if in_failregex:
            # Stop on section headers, comments, or new definitions
            if line.startswith('[') or line.startswith('#') or line.startswith('ignoreregex') or line.startswith('datepattern'):
                in_failregex = False
                continue
            if line.startswith('^') or line.startswith('\\\\'):
                patterns.append(line)
            elif patterns:  # Continuation of previous pattern
                patterns[-1] += line
    # ConfigParser simulation: %% → % in patterns (for datepattern, url_encoded, etc.)
    patterns = [p.replace('%%', '%') for p in patterns]
    return patterns


def extract_ignoreregex(filter_content):
    """Extract ignoreregex patterns from filter file."""
    patterns = []
    in_ignoreregex = False
    for line in filter_content.split('\n'):
        line = line.strip()
        if line.startswith('ignoreregex'):
            in_ignoreregex = True
            if '=' in line:
                pattern = line.split('=', 1)[1].strip()
                if pattern:
                    patterns.append(pattern)
            continue
        if in_ignoreregex:
            if line.startswith('[') or line.startswith('#'):
                in_ignoreregex = False
                continue
            if line.startswith('/') or line.startswith('^'):
                patterns.append(line)
            elif patterns:
                patterns[-1] += line
    return patterns


def convert_failregex_to_python(pattern):
    """Convert fail2ban regex pattern to Python regex."""
    # Replace <HOST> with IP capture group
    pattern = pattern.replace('<HOST>', r'(?P<host>\S+)')
    # Handle datepattern variables if needed
    return pattern


def test_filter(log_file, filter_file):
    """Test a filter against a log file."""
    print(f"Testing filter: {filter_file}")
    print(f"Log file: {log_file}")
    print("-" * 60)
    
    # Read filter
    with open(filter_file, 'r', encoding='utf-8', errors='ignore') as f:
        filter_content = f.read()
    
    # Extract and expand variables
    variables = extract_variables(filter_content)
    
    failregex_patterns = extract_failregex(filter_content)
    ignoreregex_patterns = extract_ignoreregex(filter_content)
    
    # Expand variables in patterns
    failregex_patterns = [expand_variables(p, variables) for p in failregex_patterns]
    
    print(f"Failregex patterns: {len(failregex_patterns)}")
    print(f"Ignore patterns: {len(ignoreregex_patterns)}")
    print()
    
    # Convert patterns to Python regex
    python_patterns = []
    for p in failregex_patterns:
        try:
            python_patterns.append(re.compile(convert_failregex_to_python(p)))
        except re.error as e:
            print(f"Invalid pattern: {p[:50]}... Error: {e}")
    
    ignore_patterns = []
    for p in ignoreregex_patterns:
        try:
            ignore_patterns.append(re.compile(p))
        except re.error:
            pass
    
    # Read log
    with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()
    
    matched = 0
    ignored = 0
    missed = 0
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Check ignore patterns first
        ignored_by_pattern = False
        for ip in ignore_patterns:
            if ip.search(line):
                ignored += 1
                ignored_by_pattern = True
                break
        
        if ignored_by_pattern:
            continue
        
        # Check failregex patterns
        found_match = False
        for pattern in python_patterns:
            if pattern.search(line):
                matched += 1
                found_match = True
                break
        
        if not found_match:
            missed += 1
    
    print(f"Lines: {len(lines)}")
    print(f"Ignored: {ignored}")
    print(f"Matched: {matched}")
    print(f"Missed: {missed}")
    print()
    
    if matched > 0:
        print("✅ FILTER MATCHES LOG ENTRIES")
    else:
        print("❌ NO MATCHES FOUND")
    
    return matched


def main():
    if len(sys.argv) < 3:
        print("Usage: python fail2ban-regex.py <log_file> <filter_file>")
        print()
        print("Example:")
        print("  python fail2ban-regex.py access.log nginx-webscan.conf")
        sys.exit(1)
    
    log_file = sys.argv[1]
    filter_file = sys.argv[2]
    
    if not os.path.exists(log_file):
        print(f"Error: Log file not found: {log_file}")
        sys.exit(1)
    
    if not os.path.exists(filter_file):
        print(f"Error: Filter file not found: {filter_file}")
        sys.exit(1)
    
    test_filter(log_file, filter_file)


if __name__ == '__main__':
    main()
