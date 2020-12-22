const { TCPGelf } = require('./dist');

function start() {
  const host = 'graylog.test.fozzy.lan';
  const port = 12203;

  const socket = new TCPGelf({ host, port });
  socket.on('error', console.log);

  let c = 0;
  const i = setInterval(() => {
    if (c > 10) {
      clearInterval(i);
    }

    socket.send({
      short_message: Math.random().toString(),
      full_message: Math.cos(123),
    });
    c++;
  }, 16);
}

start();
