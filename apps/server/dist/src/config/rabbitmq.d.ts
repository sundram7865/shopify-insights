import { Channel } from 'amqplib';
declare class RabbitMQService {
    private connection;
    private channel;
    connect(): Promise<void>;
    getChannel(): Channel;
}
export declare const rabbitMQ: RabbitMQService;
export {};
//# sourceMappingURL=rabbitmq.d.ts.map