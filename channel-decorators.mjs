/**
 * Decorate Asynchronous Channel with generic emitter
 * @kind function
 * @name withEmitter
 */
export const withEmitter = (
  channel,
  emitter,
  data = "data",
  end = "end",
  error = "error"
) => {
  emitter.addListener(data, channel.put.bind(channel));
  emitter.addListener(end, channel.break.bind(channel));
  emitter.addListener(error, channel.throw.bind(channel));
  return channel;
};

/**
 * Decorate Asynchronous Channel with websocket
 * @kind function
 * @name withWebSocket
 */
export const withWebSocket = (channel, websocket) => {
  websocket.onmessage = channel.put.bind(channel);
  websocket.onclose = channel.break.bind(channel);
  websocket.onerror = channel.throw.bind(channel);
  return channel;
};
