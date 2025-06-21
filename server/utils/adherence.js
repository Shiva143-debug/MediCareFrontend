// server/utils/adherence.js

function calculateAdherence(taken, total) {
  if (total === 0) return 0;
  return Number(((taken / total) * 100).toFixed(2));
}

module.exports = {
  calculateAdherence
};
