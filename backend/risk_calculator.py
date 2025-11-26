# Risk calculation logic - Python re-implementation
# Mirrors the JavaScript logic from frontend/src/utils/riskCalculator.js
# X=Impact, Y=Likelihood, Color=Vulnerability per TILT framework

from typing import Dict, List, Any, Optional

def calc_vulnerability(answers: Dict[int, int], questions: List[Dict], osint_results: Optional[Dict] = None) -> int:
    """
    Calculate vulnerability percentage based on assessment scores.
    Returns 0-100 where 100 = fully vulnerable.
    """
    # Sanity check
    if not answers or len(answers) == 0:
        return 100
    
    total_weight = 0
    weighted_score = 0
    
    # Calculate weighted average of maturity scores
    # Maturity scale: 1 = worst, 5 = best
    # Invert: 1->1.0 (100% vulnerable), 5->0.2 (20% vulnerable)
    for q in questions:
        qid = q['id']
        if qid in answers and answers[qid] is not None:
            answer_val = answers[qid]
            normalized = (6 - answer_val) / 5  # Invert: 1->1.0, 5->0.2
            
            # Weight by importance (Critical = 3x, High = 2x, Low = 1x)
            weight = 3 if q.get('weight') == 'Critical' else (2 if q.get('weight') == 'High' else 1)
            
            weighted_score += normalized * weight
            total_weight += weight
    
    if total_weight == 0:
        return 100
    
    # Convert to percentage
    vuln = (weighted_score / total_weight) * 100
    
    # Apply OSINT adjustments to vulnerability
    # SSL and DMARC issues indicate poor security posture and increase vulnerability
    if osint_results:
        if osint_results.get('ssl') in ('F', 'Expired'):
            # Expired SSL is a serious security issue
            vuln = max(vuln, 80)
        if osint_results.get('dmarc') is False:
            # Missing DMARC indicates email security weakness
            vuln = max(vuln, 60)
    
    return round(vuln)

def calc_cloud_vulnerability(scores: Dict[int, int], criteria: List[Dict], osint_results: Optional[Dict] = None) -> Dict[str, Any]:
    """
    Calculate vulnerability for cloud scorecard.
    Scores are maturity levels (0-5) per question.
    Returns dict with score, maxScore, vulnerability, status, statusColor, missedCritical.
    """
    # Calculate weighted score: maturity score (0-5) * points for that question
    total_score = 0
    for c in criteria:
        maturity_score = scores.get(c['id'], 0)  # Default to 0 if not answered
        points = c.get('points', 0)
        weighted_points = (maturity_score / 5) * points
        total_score += weighted_points
    
    max_score = 55  # Total points available (all questions at level 5)
    
    # Check for critical failures: Critical questions with score 0
    missed_critical = any(
        c.get('criticality') == 'Critical' and 
        (scores.get(c['id']) == 0 or scores.get(c['id']) is None)
        for c in criteria
    )
    
    # Calculate vulnerability (inverse of score)
    vuln = round((1 - (total_score / max_score)) * 100) if max_score > 0 else 100
    
    # Apply OSINT adjustments to vulnerability
    # SSL and DMARC issues indicate poor security posture and increase vulnerability
    if osint_results:
        if osint_results.get('ssl') in ('F', 'Expired'):
            # Expired SSL is a serious security issue
            vuln = max(vuln, 80)
        if osint_results.get('dmarc') is False:
            # Missing DMARC indicates email security weakness
            vuln = max(vuln, 60)
    
    # Determine status based on new thresholds
    # 45-55: Elite/Low Risk (Pre-approved)
    # 30-44: Standard/Medium Risk (Standard Approval)
    # 15-29: Deficient/High Risk (Restricted)
    # 0-14: Critical Risk (REJECT)
    if missed_critical or total_score < 15:
        status = 'REJECT (Critical Risk)'
        status_color = 'red'
    elif total_score < 30:
        status = 'Restricted (Deficient)'
        status_color = 'amber'
    elif total_score < 45:
        status = 'Standard Approval'
        status_color = 'yellow'
    else:
        status = 'Elite (Pre-approved)'
        status_color = 'green'
    
    return {
        'score': round(total_score),
        'maxScore': max_score,
        'vulnerability': vuln,
        'status': status,
        'statusColor': status_color,
        'missedCritical': missed_critical,
    }

def calc_impact_likelihood(answers: Dict[int, int], questions: List[Dict], osint_results: Optional[Dict] = None) -> tuple:
    """
    Calculate impact and likelihood scores (1-5) from assessment answers.
    Returns (impact, likelihood) tuple.
    """
    # Default values
    impact = 3
    likelihood = 3
    
    if answers and len(answers) > 0:
        # Convert average maturity score to impact/likelihood
        # Higher maturity = better security = lower risk
        answer_vals = [v for v in answers.values() if v is not None]
        if answer_vals:
            avg_score = sum(answer_vals) / len(answer_vals)
            # Invert: high score = low impact/likelihood
            impact = max(1, min(5, 6 - avg_score / 1.2))
            likelihood = max(1, min(5, 6 - avg_score / 1.2))
    
    # OSINT adjustment: Only ransomware affects likelihood
    # DMARC and SSL issues are informational warnings only - they do NOT affect likelihood
    if osint_results and osint_results.get('ransomware') is True:
        likelihood = 5
    
    # Note: DMARC warnings are informational only and do not affect likelihood calculation
    # SSL issues may affect vulnerability percentage but not likelihood
    
    return (impact, likelihood)

