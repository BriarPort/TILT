// Risk calculation utilities
// These functions implement the TILT vulnerability scoring logic
// Note: Some calculations are now done on backend, but we keep these for client-side preview

/**
 * Calculate vulnerability percentage based on assessment scores
 * @param {Object} answers - Object mapping question IDs to maturity scores (1-5)
 * @param {Array} questions - Array of question objects with weights
 * @param {Object} osintResults - OSINT check results { ransomware: boolean, ssl: string, dmarc: boolean }
 * @returns {number} Vulnerability percentage (0-100)
 */
export function calculateVulnerability(answers, questions, osintResults = null) {
  // No answers means we have no data, assume worst case
  if (!answers || Object.keys(answers).length === 0) {
    return 100;
  }
  
  let totalWeight = 0;
  let weightedScore = 0;
  
  // Calculate weighted average of maturity scores
  // Maturity scale: 1 = worst, 5 = best
  // We invert it so 1 becomes 1.0 (100% vulnerable) and 5 becomes 0.2 (20% vulnerable)
  questions.forEach(q => {
    const answer = answers[q.id];
    if (answer !== undefined && answer !== null) {
      const normalizedScore = (6 - answer) / 5; // Invert: 1->1.0, 5->0.2
      
      // Weight by importance (Critical questions matter 3x more than Low)
      const weight = q.weight === 'Critical' ? 3 : q.weight === 'High' ? 2 : 1;
      
      weightedScore += normalizedScore * weight;
      totalWeight += weight;
    }
  });
  
  if (totalWeight === 0) {
    return 100;
  }
  
  // Convert to percentage (0-100)
  let vuln = (weightedScore / totalWeight) * 100;
  
  // Apply OSINT adjustments to vulnerability
  // SSL and DMARC issues indicate poor security posture and increase vulnerability
  if (osintResults) {
    if (osintResults.ssl === 'F' || osintResults.ssl === 'Expired') {
      // Expired SSL is a serious security issue
      vuln = Math.max(vuln, 80);
    }
    if (osintResults.dmarc === false) {
      // Missing DMARC indicates email security weakness
      vuln = Math.max(vuln, 60);
    }
  }
  
  return Math.round(vuln);
}

/**
 * Calculate vulnerability for cloud scorecard
 * @param {Object} scores - Object mapping criterion IDs to maturity scores (0-5)
 * @param {Array} criteria - Array of cloud criteria objects
 * @param {Object} osintResults - OSINT check results { ransomware: boolean, ssl: string, dmarc: boolean }
 * @returns {Object} { score, maxScore, vulnerability, status }
 */
export function calculateCloudVulnerability(scores, criteria, osintResults = null) {
  // Calculate weighted score: maturity score (0-5) * points for that question
  const totalScore = criteria.reduce((sum, item) => {
    const maturityScore = scores[item.id] || 0; // Default to 0 if not answered
    const weightedPoints = (maturityScore / 5) * (item.points || 0);
    return sum + weightedPoints;
  }, 0);
  
  const maxScore = 55; // Total points available (all questions at level 5)
  
  // Check for critical failures: Critical questions with score 0
  const missedCritical = criteria.some(c => 
    c.criticality === 'Critical' && (scores[c.id] === 0 || scores[c.id] === undefined || scores[c.id] === null)
  );
  
  // Calculate vulnerability (inverse of score)
  // Higher score = lower vulnerability
  let vuln = Math.round((1 - (totalScore / maxScore)) * 100);
  
  // Apply OSINT adjustments to vulnerability
  // SSL and DMARC issues indicate poor security posture and increase vulnerability
  if (osintResults) {
    if (osintResults.ssl === 'F' || osintResults.ssl === 'Expired') {
      // Expired SSL is a serious security issue
      vuln = Math.max(vuln, 80);
    }
    if (osintResults.dmarc === false) {
      // Missing DMARC indicates email security weakness
      vuln = Math.max(vuln, 60);
    }
  }
  
  // Determine status based on new thresholds
  // 45-55: Elite/Low Risk (Pre-approved)
  // 30-44: Standard/Medium Risk (Standard Approval)
  // 15-29: Deficient/High Risk (Restricted)
  // 0-14: Critical Risk (REJECT)
  let status = 'Elite (Pre-approved)';
  let statusColor = 'green';
  
  if (missedCritical || totalScore < 15) {
    status = 'REJECT (Critical Risk)';
    statusColor = 'red';
  } else if (totalScore < 30) {
    status = 'Restricted (Deficient)';
    statusColor = 'amber';
  } else if (totalScore < 45) {
    status = 'Standard Approval';
    statusColor = 'yellow';
  } else {
    status = 'Elite (Pre-approved)';
    statusColor = 'green';
  }
  
  return {
    score: Math.round(totalScore),
    maxScore,
    vulnerability: vuln,
    status,
    statusColor,
    missedCritical,
  };
}

/**
 * Calculate inherent risk (Impact x Likelihood)
 * Simple multiplication for the risk matrix
 * @param {number} impact - Impact score (1-5)
 * @param {number} likelihood - Likelihood score (1-5)
 * @returns {number} Risk score
 */
export function calculateInherentRisk(impact, likelihood) {
  return impact * likelihood;
}

/**
 * Get risk zone color based on impact and likelihood
 * Used for the risk matrix visualisation
 * @param {number} impact - Impact score (1-5)
 * @param {number} likelihood - Likelihood score (1-5)
 * @returns {string} Color hex code
 */
export function getRiskZoneColor(impact, likelihood) {
  const risk = calculateInherentRisk(impact, likelihood);
  
  // Risk zones: 20+ = red, 12-19 = orange, 6-11 = yellow, <6 = green
  if (risk >= 20) return '#ef4444'; // Red
  if (risk >= 12) return '#f97316'; // Orange
  if (risk >= 6) return '#eab308';   // Yellow
  return '#22c55e'; // Green
}

