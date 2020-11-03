module.exports = (data) => {
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
      title: `${data.question}`,
      listItemsSequence: [],
      listItems: [
        {
          primaryText: `${data.answers[0].answerText}`,
          primaryAction: [
            {
              type: "SendEvent",
              arguments: [data.answers[0], data.sessionAttributes],
            },
            {
              type: "SetValue",
              property: "disabled",
              value: true
            }
          ]
        },
        {
          primaryText: `${data.answers[1].answerText}`,
          primaryAction: [
            {
              type: "SendEvent",
              arguments: [data.answers[1], data.sessionAttributes],
            },
            {
              type: "SetValue",
              property: "disabled",
              value: true
            }
          ],
        },
        {
          primaryText: `${data.answers[2].answerText}`,
          primaryAction: [
            {
              type: "SendEvent",
              arguments: [data.answers[2], data.sessionAttributes],
            },
            {
              type: "SetValue",
              property: "disabled",
              value: true
            }
          ],
        },
        {
          primaryText: `${data.answers[3].answerText}`,
          primaryAction: [
            {
              type: "SendEvent",
              arguments: [data.answers[3], data.sessionAttributes],
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
