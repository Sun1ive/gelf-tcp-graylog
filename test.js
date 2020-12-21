const { TCPGelf } = require('./dist');

function start() {
  const host = 'graylog.test.fozzy.lan';
  const port = 12203;

  const socket = new TCPGelf({ host, port });
  socket.on('error', console.log);
  socket.send({ short_message: '123', full_message: 84953284923 });
}

start();
