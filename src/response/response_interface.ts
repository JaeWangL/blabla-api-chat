import { IncomingMessage } from 'http';

export type IResponseKafka = {
  firstValue?: IncomingMessage;
  lastValue?: IncomingMessage;
};
