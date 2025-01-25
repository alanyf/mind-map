(function () {
  const cozeWebSDK = new CozeWebSDK.WebChatClient({
    /**
     * Agent configuration information.
     * @param config.bot_id - Agent ID.
     */
    config: {
      bot_id: '7463306757596266546',
    },
    /**
     * The auth property is used to configure the authentication method.
     * @param type - Authentication method, default type is 'unauth', which means no authentication is required; it is recommended to set it to 'token', which means authentication is done through PAT (Personal Access Token) or OAuth.
     * @param token - When the type is set to 'token', you need to configure the PAT (Personal Access Token) or OAuth access key.
     * @param onRefreshToken - When the access key expires, a new key can be set as needed.
     */
    auth: {
      type: 'token',
      token:
        'pat_xIdcZEOQq2Mcqd38DIc6WmbIvyWjUShVNGv55y7Ua8M3azWdEl4yzP5bedEzqfbC',
      onRefreshToken: async () =>
        'pat_xIdcZEOQq2Mcqd38DIc6WmbIvyWjUShVNGv55y7Ua8M3azWdEl4yzP5bedEzqfbC',
    },
    /**
     * The userInfo parameter is used to set the display of agent user information in the chat box.
     * @param userInfo.id - ID of the agent user.
     * @param userInfo.url - URL address of the user's avatar.
     * @param userInfo.nickname - Nickname of the agent user.
     */
    userInfo: {
      id: '1235',
      url: 'https://lf-coze-web-cdn.coze.cn/obj/coze-web-cn/obric/coze/favicon.1970.png',
      nickname: 'User',
    },
    ui: {
      /**
       * The ui.base parameter is used to add the overall UI effect of the chat window.
       * @param base.icon - Application icon URL.
       * @param base.layout - Layout style of the agent chat box window, which can be set as 'pc' or'mobile'.
       * @param base.lang - System language of the agent, which can be set as 'en' or 'zh-CN'.
       * @param base.zIndex - The z-index of the chat box.
       */
      base: {
        icon: 'https://p3-flow-imagex-sign.byteimg.com/ocean-cloud-tos/FileBizType.BIZ_BOT_ICON/90578087318531_1737687081785241132_iXBySNwZEu.png',
        layout: 'pc',
        lang: 'en',
        zIndex: -1,
      },
      /**
       * Control the UI and basic capabilities of the chat box.
       * @param chatBot.title - The title of the chatbox
       * @param chatBot.uploadable - Whether file uploading is supported.
       * @param chatBot.width - The width of the agent window on PC is measured in px, default is 460.
       * @param chatBot.el - Container for setting the placement of the chat box (Element).
       */
      chatBot: {
        title: '思维导图',
        uploadable: false,
        width: 390,
      },
      /**
       * Controls whether to display the floating ball at the bottom right corner of the page.
       */
      asstBtn: {
        isNeed: false,
      },
      /**
       * The ui.footer parameter is used to add the footer of the chat window.
       * @param footer.isShow - Whether to display the bottom copy module.
       * @param footer.expressionText - The text information displayed at the bottom.
       * @param footer.linkvars - The link copy and link address in the footer.
       */
      footer: {
        isShow: false,
        expressionText: 'Powered by &',
        linkvars: {
          name: {
            text: 'A',
            link: 'https://www.test1.com',
          },
          name1: {
            text: 'B',
            link: 'https://www.test2.com',
          },
        },
      },
    },
  });

  function findElementsByTextXPath(text, container) {
    const xpath = `//*[contains(text(), '${text}')]`;
    const result = [];
    const nodesSnapshot = document.evaluate(
      xpath,
      container,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null,
    );
    for (let i = 0; i < nodesSnapshot.snapshotLength; i++) {
      result.push(nodesSnapshot.snapshotItem(i));
    }
    return result;
  }

  function findParent(childDom, callback) {
    let currentNode = childDom.parentElement;
    while (currentNode) {
      if (callback(currentNode)) {
        return currentNode;
      }
      currentNode = currentNode.parentElement;
    }
    return null;
  }

  function getAnser(userQuery) {
    const container = document.querySelector(
      '[data-testid="chat-area.message-content"]',
    );
    const queryDom = findElementsByTextXPath(userQuery, container)?.[0];
    const queryMessageDom = findParent(queryDom, dom =>
      dom.getAttribute('data-message-id'),
    );

    const anserMsgDom = Array.from(queryMessageDom.parentElement.children).find(
      e => e.getAttribute('data-message-id'),
    );

    const jsonDom = anserMsgDom.querySelector('.language-json');

    const jsonText = jsonDom.innerText.trim();
    return jsonText;
  }
  setTimeout(() => {
    cozeWebSDK.showChatBot();
    console.log(cozeWebSDK);
    console.log('sdk', CozeWebSDK);
  }, 2000);
})();
