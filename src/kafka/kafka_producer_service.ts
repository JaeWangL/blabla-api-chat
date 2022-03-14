import { firstValueFrom, lastValueFrom, timeout } from 'rxjs';
import { Inject, Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientKafka } from '@nestjs/microservices';
import { IRequestKafka } from '../request/request_interface';
import { IResponseKafka } from '../response/response_interface';
import { KAFKA_PRODUCER_INSYNC_SERVICE_NAME, KAFKA_TOPICS_SUBSCRIBE } from './kafka_constant';
import { IKafkaProducerOptions } from './kafka_producer_interface';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const KSUID = require('ksuid');

@Injectable()
export class KafkaProducerService implements OnApplicationBootstrap, OnModuleDestroy {
  protected logger = new Logger(KafkaProducerService.name);

  private readonly timeout: number;

  constructor(
    @Inject(KAFKA_PRODUCER_INSYNC_SERVICE_NAME)
    private readonly kafkaInsync: ClientKafka,
    private readonly configService: ConfigService,
  ) {
    this.timeout = this.configService.get<number>('kafka.timeout');
  }

  async onApplicationBootstrap(): Promise<void> {
    /* TODO: Handle subscrbing of send's response
    const topics: string[] = [...new Set(KAFKA_TOPICS_SUBSCRIBE)];
    for (const topic of topics) {
      this.kafkaInsync.subscribeToResponseOf(topic);
    }
    */

    await this.kafkaInsync.connect();

    this.logger.log('Kafka Client Connected');
  }

  async onModuleDestroy(): Promise<void> {
    await this.kafkaInsync.close();
  }

  /**
   * Send event without subscrbing response
   */
  async emit<T>(topic: string, data: T, options?: IKafkaProducerOptions): Promise<void> {
    const request: IRequestKafka<T> = {
      key: await this.createId(),
      value: data,
      headers: options && options.headers ? options.headers : undefined,
    };

    this.kafkaInsync.emit(topic, request).pipe(timeout(this.timeout));
  }

  /**
   * Send topic with response
   */
  async send<T>(topic: string, data: T, options?: IKafkaProducerOptions): Promise<IResponseKafka> {
    const request: IRequestKafka<T> = {
      key: await this.createId(),
      value: data,
      headers: options && options.headers ? options.headers : undefined,
    };

    const kafka = this.kafkaInsync;
    const firstValue = await firstValueFrom(
      kafka.send<any, IRequestKafka<T>>(topic, request).pipe(timeout(this.timeout)),
    );
    const lastValue = await lastValueFrom(
      kafka.send<any, IRequestKafka<T>>(topic, request).pipe(timeout(this.timeout)),
    );

    return {
      firstValue,
      lastValue,
    };
  }

  private async createId(): Promise<string> {
    const rand = await KSUID.random();
    const timestamp = `${new Date().valueOf()}`;
    return `${timestamp}-${rand.toString()}`;
  }
}
