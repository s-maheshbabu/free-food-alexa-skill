module.exports = (isWon, incorrectAnswers, score, skippedAnswers, totalNumberOfQuestions) => {
  //TODO: Input validation and testing?
  return {
    incorrectAnswers: incorrectAnswers,
    isWon: isWon,
    score: score,
    skippedAnswers: skippedAnswers,
    totalNumberOfQuestions: totalNumberOfQuestions,
  };
};
