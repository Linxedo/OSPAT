export const FATIGUE_STATUS = {
  NORMAL: 'Normal',
  LOW_FATIGUE: 'Low Fatigue',
  INTERMEDIATE_FATIGUE: 'Intermediate Fatigue',
  SEVERE_FATIGUE: 'Severe Fatigue'
}

export const FATIGUE_COLORS = {
  [FATIGUE_STATUS.NORMAL]: '#4CAF50',
  [FATIGUE_STATUS.LOW_FATIGUE]: '#FF9800',
  [FATIGUE_STATUS.INTERMEDIATE_FATIGUE]: '#FFC107',
  [FATIGUE_STATUS.SEVERE_FATIGUE]: '#F44336'
}

export const FATIGUE_BADGE_VARIANTS = {
  [FATIGUE_STATUS.NORMAL]: 'success',
  [FATIGUE_STATUS.LOW_FATIGUE]: 'warning',
  [FATIGUE_STATUS.INTERMEDIATE_FATIGUE]: 'warning',
  [FATIGUE_STATUS.SEVERE_FATIGUE]: 'danger'
}

export const calculateFatigueStatus = (totalScore, minimumPassingScore) => {
  if (totalScore >= minimumPassingScore) {
    return FATIGUE_STATUS.NORMAL
  }
  
  const difference = minimumPassingScore - totalScore
  const threshold = Math.floor(minimumPassingScore / 4)
  
  if (difference <= threshold) {
    return FATIGUE_STATUS.LOW_FATIGUE
  } else if (difference <= threshold * 2) {
    return FATIGUE_STATUS.INTERMEDIATE_FATIGUE
  } else {
    return FATIGUE_STATUS.SEVERE_FATIGUE
  }
}

export const getFatigueColor = (status) => {
  return FATIGUE_COLORS[status] || FATIGUE_COLORS[FATIGUE_STATUS.SEVERE_FATIGUE]
}

export const getFatigueBadgeVariant = (status) => {
  return FATIGUE_BADGE_VARIANTS[status] || FATIGUE_BADGE_VARIANTS[FATIGUE_STATUS.SEVERE_FATIGUE]
}
