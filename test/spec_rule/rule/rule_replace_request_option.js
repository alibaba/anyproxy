//rule scheme :
module.exports = {

  *beforeSendRequest(requestDetail) {
    const newOption = requestDetail.requestOptions;
    if (newOption.hostname === 'localhost' && newOption.path === '/test/should_replace_option') {
      newOption.path = '/test/new_replace_option';
      return {
        requestOptions: newOption
      }
    }
  }
};
