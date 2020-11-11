module.exports = (isWon, incorrectAnswers, score, skipped, totalNumberOfQuestions) => {
  //TODO: Input validation and testing?
  return {
    isWon: isWon,
    incorrectAnswers: incorrectAnswers,
    score: score,
    skipped: skipped,
    totalNumberOfQuestions: totalNumberOfQuestions,
  };
};
