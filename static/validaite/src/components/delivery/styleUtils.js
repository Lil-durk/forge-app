/**
 * Style utilities for delivery lead validation components
 */

export const getApprovalStatusColor = (decision) => {
  switch (decision) {
    case 'APPROVED': return '#00875A';
    case 'REJECTED': return '#DE350B';
    case 'NEEDS_REVISION': return '#FF8B00';
    default: return '#6B778C';
  }
};

export const getSeverityColor = (severity) => {
  switch (severity) {
    case 'CRITICAL': return '#DE350B';
    case 'HIGH': return '#FF8B00';
    case 'MEDIUM': return '#FFAB00';
    case 'LOW': return '#00875A';
    default: return '#6B778C';
  }
};

export const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px'
  },
  errorBox: {
    padding: '15px',
    backgroundColor: '#FFEBE6',
    border: '1px solid #DE350B',
    borderRadius: '4px',
    color: '#DE350B',
    marginBottom: '20px'
  },
  resultBox: {
    border: '1px solid #DFE1E6',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    backgroundColor: '#F4F5F7'
  },
  gridTwoColumns: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px'
  },
  scoreBox: {
    padding: '10px',
    backgroundColor: '#F4F5F7',
    borderRadius: '4px'
  },
  badge: {
    padding: '5px 15px',
    borderRadius: '20px',
    color: 'white',
    fontWeight: 'bold'
  },
  metadata: {
    marginTop: '20px',
    padding: '10px',
    backgroundColor: '#F4F5F7',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#6B778C'
  }
};
