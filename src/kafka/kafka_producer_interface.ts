import { IRequestKafkaHeader } from '../request/request_interface';

export interface IKafkaProducerOptions {
  headers?: IRequestKafkaHeader;
}
