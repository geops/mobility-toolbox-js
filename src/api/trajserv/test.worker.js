self.onmessage = function (evt) {
  console.log('Worker: Message received from main script', evt.data);
};
