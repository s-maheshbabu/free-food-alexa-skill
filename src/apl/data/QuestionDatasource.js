module.exports = (roundAnswers, correctAnswerIndex) => {
  //TODO: Input validation and testing?
  return {
    textListData: {
      type: "object",
      objectId: "textListSample",
      backgroundImage: {
        contentDescription: null,
        smallSourceUrl: null,
        largeSourceUrl: null,
        sources: [
          {
            url: "https://d2o906d8ln7ui1.cloudfront.net/images/templates_v2/bg_cheese_1.jpg",
            size: "small",
            widthPixels: 0,
            heightPixels: 0
          },
          {
            url: "https://d2o906d8ln7ui1.cloudfront.net/images/templates_v2/bg_cheese_1.jpg",
            size: "large",
            widthPixels: 0,
            heightPixels: 0
          }
        ]
      },
      title: "<<The question should go here>>",
      listItemsSequence: [],
      listItems: [
        {
          primaryText: `${roundAnswers[0]}`,
          primaryAction: [
            {
              type: "SendEvent",
              arguments: [
                1,
                `${roundAnswers[1]}`,
                `USER_INITIATED`,
              ]
            },
            {
              type: "SetValue",
              property: "disabled",
              value: true
            }
          ]
        },
        {
          primaryText: `${roundAnswers[1]}`,
          primaryAction: [
            {
              type: "SendEvent",
              arguments: [
                1,
                `${roundAnswers[1]}`,
                `USER_INITIATED`,
              ]
            },
            {
              type: "SetValue",
              property: "disabled",
              value: true
            }
          ],
        },
        {
          primaryText: `${roundAnswers[2]}`,
          primaryAction: [
            {
              type: "SendEvent",
              arguments: [
                2,
                `${roundAnswers[2]}`,
                `USER_INITIATED`,
              ]
            },
            {
              type: "SetValue",
              property: "disabled",
              value: true
            }
          ],
        },
        {
          primaryText: `${roundAnswers[3]}`,
          primaryAction: [
            {
              type: "SendEvent",
              arguments: [
                3,
                `${roundAnswers[3]}`,
                `USER_INITIATED`,
              ]
            },
            {
              type: "SetValue",
              property: "disabled",
              value: true
            }
          ],
        }
      ],
      logoUrl: "https://d2o906d8ln7ui1.cloudfront.net/images/templates_v2/icon_cheese.png",
      hintText: "You can tap on the answers too"
    }
  };
};
