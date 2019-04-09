module.exports = {
  *summary() {
    return 'The rule to replace websocket message';
  },

  *beforeSendWsMessageToClient(requestDetail) {
    const message = requestDetail.data;
    try {
      const messageObject = JSON.parse(message);
      if (messageObject.type === 'onMessage') {
        messageObject.content = 'replaced by beforeSendWsMessageToClient';
        return {
          data: JSON.stringify(messageObject),
        }
      }
    } catch (err) { /* ignore error */ }

    return null;
  },

  *beforeSendWsMessageToServer() {
    return {
      data: 'replaced by beforeSendWsMessageToServer',
    };
  },
};
