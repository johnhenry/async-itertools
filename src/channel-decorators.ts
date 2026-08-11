import type { AsyncChannel } from "./async-channel.ts";

interface EmitterLike {
  addListener(event: string, listener: (...args: never[]) => unknown): unknown;
}

interface WebSocketLike {
  onmessage: ((event: unknown) => unknown) | null;
  onclose: ((event?: unknown) => unknown) | null;
  onerror: ((event?: unknown) => unknown) | null;
}

/**
 * Decorate Asynchronous Channel with generic emitter
 * @kind function
 * @name withEmitter
 */
export const withEmitter = <T, C extends AsyncChannel<T>>(
  channel: C,
  emitter: EmitterLike,
  data = "data",
  end = "end",
  error = "error"
): C => {
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
export const withWebSocket = <T, C extends AsyncChannel<T>>(
  channel: C,
  websocket: WebSocketLike
): C => {
  websocket.onmessage = channel.put.bind(channel) as (
    event: unknown
  ) => unknown;
  websocket.onclose = channel.break.bind(channel);
  websocket.onerror = channel.throw.bind(channel) as (
    event?: unknown
  ) => unknown;
  return channel;
};
