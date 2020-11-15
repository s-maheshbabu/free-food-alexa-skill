module.exports = (isWon, incorrectAnswers, score, skippedAnswers, newGameEventName, totalNumberOfQuestions) => {
  //TODO: Input validation and testing?
  return {
    incorrectAnswers: incorrectAnswers,
    isWon: isWon,
    score: score,
    skippedAnswers: skippedAnswers,
    newGameEventName: newGameEventName,
    totalNumberOfQuestions: totalNumberOfQuestions,
  };
};
