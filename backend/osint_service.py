# OSINT service - Python re-implementation
# Security checks using free public feeds per TILT Section 5
# Placeholder implementation - real API integration can be added later

import requests
import ssl
import socket
import json
import time
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime

# Config tweaks
CACHE_TTL_HOURS = 24
RANSOM_CACHE_PATH = Path(__file__).parent / 'ransom_cache.json'
RATE_LIMIT_DELAY = 0.5  # 500ms between requests

# In-memory cache (simple dict with timestamps)
_cache: Dict[str, tuple] = {}  # key -> (value, timestamp)

def _get_cache(key: str, ttl_seconds: int = 300) -> Optional[Any]:
    """Get from cache if not expired."""
    if key in _cache:
        val, timestamp = _cache[key]
        if time.time() - timestamp < ttl_seconds:
            return val
        del _cache[key]
    return None

def _set_cache(key: str, value: Any):
    """Set cache value."""
    _cache[key] = (value, time.time())

def fetch_ransomware_list() -> List[Dict]:
    """Fetch ransomware leak list from Ransomwatch GitHub. Uses file cache."""
    url = 'https://raw.githubusercontent.com/joshhighet/ransomwatch/main/posts.json'
    cache_age = CACHE_TTL_HOURS * 3600
    
    try:
        # Check file cache
        if RANSOM_CACHE_PATH.exists():
            stat = RANSOM_CACHE_PATH.stat()
            age = time.time() - stat.st_mtime
            
            if age < cache_age:
                with open(RANSOM_CACHE_PATH, 'r') as f:
                    return json.load(f)
        
        # Fetch from GitHub
        resp = requests.get(url, timeout=30, headers={'User-Agent': 'TILT-Dashboard/1.0'})
        resp.raise_for_status()
        
        data = resp.json()
        
        # Write to cache
        with open(RANSOM_CACHE_PATH, 'w') as f:
            json.dump(data, f)
        
        return data
    except Exception as e:
        print(f'Error fetching ransomware list: {e}')
        
        # Try to use stale cache if available
        if RANSOM_CACHE_PATH.exists():
            try:
                with open(RANSOM_CACHE_PATH, 'r') as f:
                    return json.load(f)
            except:
                pass
        
        return []

def check_vendor_ransomware(vendor_name: str, vendor_domain: str = '') -> bool:
    """Check if vendor appears in ransomware leak database."""
    # Sanity check
    if not vendor_name and not vendor_domain:
        return False
    
    try:
        list_data = fetch_ransomware_list()
        if not list_data:
            return False
        
        name = (vendor_name or '').lower().strip()
        domain = (vendor_domain or '').lower().strip()
        
        if not name and not domain:
            return False
        
        # Search through posts
        for post in list_data:
            title = (post.get('post_title') or '').lower()
            
            # Exact match
            if name and name in title:
                return True
            if domain and domain in title:
                return True
            
            # Fuzzy match: key words > 3 chars
            words = [w for w in name.split() if len(w) > 3]
            for word in words:
                if word in title:
                    return True
        
        return False
    except Exception as e:
        print(f'Error checking ransomware: {e}')
        return False  # Fail safe

def check_dmarc(domain: str) -> Dict[str, Any]:
    """Check DMARC record for domain. Returns dict with has_dmarc (bool) and policy (str)."""
    # Sanity check
    if not domain or not domain.strip():
        return {'has_dmarc': False, 'policy': None, 'domain': domain}
    
    cache_key = f'dmarc_{domain}'
    cached = _get_cache(cache_key, 300)
    if cached is not None:
        return cached
    
    try:
        import dns.resolver
        records = dns.resolver.resolve(f'_dmarc.{domain}', 'TXT')
        for record in records:
            txt = ''.join([str(r) for r in record.strings])
            if txt.lower().startswith('v=dmarc1'):
                # Try to extract policy (p=none, p=quarantine, p=reject)
                policy = 'none'
                if 'p=reject' in txt.lower():
                    policy = 'reject'
                elif 'p=quarantine' in txt.lower():
                    policy = 'quarantine'
                elif 'p=none' in txt.lower():
                    policy = 'none'
                
                result = {'has_dmarc': True, 'policy': policy, 'domain': domain}
                _set_cache(cache_key, result)
                return result
        result = {'has_dmarc': False, 'policy': None, 'domain': domain}
        _set_cache(cache_key, result)
        return result
    except Exception:
        # DNS errors mean no DMARC
        result = {'has_dmarc': False, 'policy': None, 'domain': domain}
        _set_cache(cache_key, result)
        return result

def get_certificate_stats(domain: str) -> Dict[str, Any]:
    """Get SSL certificate stats. Returns grade (A/B/C/F) and days remaining."""
    # Sanity check
    if not domain or not domain.strip():
        return {'valid': False, 'daysRemaining': 0, 'grade': 'F'}
    
    cache_key = f'ssl_{domain}'
    cached = _get_cache(cache_key, 300)
    if cached is not None:
        return cached
    
    try:
        # Connect and get certificate
        context = ssl.create_default_context()
        with socket.create_connection((domain, 443), timeout=5) as sock:
            with context.wrap_socket(sock, server_hostname=domain) as ssock:
                cert = ssock.getpeercert()
        
        # Parse expiration
        exp_str = cert.get('notAfter')
        if exp_str:
            exp_date = datetime.strptime(exp_str, '%b %d %H:%M:%S %Y %Z')
            days_remaining = (exp_date - datetime.now()).days
            
            # Grade: A (60+), B (30-60), C (7-30), F (<7 or expired)
            if days_remaining < 0:
                grade = 'F'
            elif days_remaining < 7:
                grade = 'F'
            elif days_remaining < 30:
                grade = 'C'
            elif days_remaining < 60:
                grade = 'B'
            else:
                grade = 'A'
            
            result = {
                'valid': days_remaining > 0,
                'daysRemaining': days_remaining,
                'grade': grade,
            }
            _set_cache(cache_key, result)
            return result
    except Exception as e:
        print(f'Error checking SSL for {domain}: {e}')
    
    # Fail safe: assume invalid
    result = {'valid': False, 'daysRemaining': 0, 'grade': 'F'}
    _set_cache(cache_key, result)
    return result

def scan_vendor(primary_domain: str, osint_urls: Dict[str, str]) -> Dict[str, Any]:
    """
    Run full OSINT scan for a vendor.
    Returns dict with warnings list and osintResults.
    """
    warnings = []
    osint_results = {
        'ransomware': None,
        'ssl': None,
        'dmarc': None,
    }
    
    vendor_name = osint_urls.get('vendor_name', '')
    
    # Check ransomware
    if vendor_name or primary_domain:
        found = check_vendor_ransomware(vendor_name, primary_domain)
        osint_results['ransomware'] = found
        if found:
            warnings.append({
                'type': 'ransomware',
                'severity': 'Critical',
                'message': f'Vendor "{vendor_name}" found in ransomware leak database',
                'source': 'Ransomwatch GitHub',
            })
        time.sleep(RATE_LIMIT_DELAY)
    
    # Check SSL
    if primary_domain:
        ssl_stats = get_certificate_stats(primary_domain)
        osint_results['ssl'] = ssl_stats['grade']
        
        if ssl_stats['grade'] == 'F':
            warnings.append({
                'type': 'ssl',
                'severity': 'High',
                'message': f'SSL certificate expired or expiring soon ({ssl_stats["daysRemaining"]} days)',
                'source': 'Certificate validation',
            })
        elif ssl_stats['grade'] == 'C':
            warnings.append({
                'type': 'ssl',
                'severity': 'Medium',
                'message': f'SSL certificate expiring in {ssl_stats["daysRemaining"]} days',
                'source': 'Certificate validation',
            })
        time.sleep(RATE_LIMIT_DELAY)
    
    # Check DMARC - check subdomains first, then primary domain if no subdomains specified
    dmarc_subdomains = osint_urls.get('dmarc_subdomains', '')
    dmarc_checked = False
    
    if dmarc_subdomains:
        # Check each subdomain (comma-separated)
        subdomains = [s.strip() for s in dmarc_subdomains.split(',') if s.strip()]
        dmarc_results = []
        
        for subdomain in subdomains:
            result = check_dmarc(subdomain)
            dmarc_results.append(result)
            time.sleep(RATE_LIMIT_DELAY)
        
        # Determine overall DMARC status
        has_any_dmarc = any(r['has_dmarc'] for r in dmarc_results)
        all_have_dmarc = all(r['has_dmarc'] for r in dmarc_results)
        
        osint_results['dmarc'] = has_any_dmarc
        dmarc_checked = True
        
        # Create warning if none of the subdomains have DMARC
        if not has_any_dmarc:
            checked_domains = ', '.join([r['domain'] for r in dmarc_results])
            warnings.append({
                'type': 'dmarc',
                'severity': 'Medium',
                'message': f'No DMARC record found on specified email subdomains ({checked_domains})',
                'source': 'DNS TXT record check',
                'checked_domains': checked_domains,
            })
        elif not all_have_dmarc:
            # Some have DMARC, some don't - informational
            missing = [r['domain'] for r in dmarc_results if not r['has_dmarc']]
            warnings.append({
                'type': 'dmarc',
                'severity': 'Low',
                'message': f'Some email subdomains missing DMARC: {", ".join(missing)}',
                'source': 'DNS TXT record check',
                'checked_domains': ', '.join([r['domain'] for r in dmarc_results]),
            })
    
    # If no subdomains specified, check primary domain
    if not dmarc_checked and primary_domain:
        result = check_dmarc(primary_domain)
        osint_results['dmarc'] = result['has_dmarc']
        if not result['has_dmarc']:
            warnings.append({
                'type': 'dmarc',
                'severity': 'Medium',
                'message': f'No DMARC record found on primary domain ({primary_domain}). Consider specifying email subdomains if emails are sent from subdomains.',
                'source': 'DNS TXT record check',
                'checked_domains': primary_domain,
            })
    
    return {
        'warnings': warnings,
        'osintResults': osint_results,
    }

