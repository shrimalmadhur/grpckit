import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as fs from 'fs';

export interface GrpcService {
  name: string;
  methods: GrpcMethod[];
}

export interface GrpcMethod {
  name: string;
  requestType: string;
  responseType: string;
  requestStream: boolean;
  responseStream: boolean;
}

export interface GrpcStream {
  id: string;
  call:
    | grpc.ClientDuplexStream<any, any>
    | grpc.ClientReadableStream<any>
    | grpc.ClientWritableStream<any>;
}

export interface ConnectionOptions {
  useTls?: boolean;
  caCert?: string;
  clientCert?: string;
  clientKey?: string;
  metadata?: Record<string, string>;
  deadline?: number;
}

export class GrpcEngine {
  private client: grpc.Client | null = null;
  private connectionUrl: string = '';
  private services: Map<string, GrpcService> = new Map();
  private streams: Map<string, GrpcStream> = new Map();
  private streamCounter = 0;
  private reflectionClient: any = null; // Store reflection client for method invocation
  private protoDescriptor: any = null; // Store proto descriptor for proto-based services

  async connect(url: string, options: ConnectionOptions = {}): Promise<void> {
    this.connectionUrl = url;

    let credentials: grpc.ChannelCredentials;

    if (options.useTls) {
      if (options.caCert && options.clientCert && options.clientKey) {
        // mTLS
        const caCert = fs.readFileSync(options.caCert);
        const clientCert = fs.readFileSync(options.clientCert);
        const clientKey = fs.readFileSync(options.clientKey);

        credentials = grpc.credentials.createSsl(caCert, clientKey, clientCert);
      } else {
        // TLS
        credentials = grpc.credentials.createSsl();
      }
    } else {
      // Insecure
      credentials = grpc.credentials.createInsecure();
    }

    this.client = new grpc.Client(url, credentials);

    // Test connection
    await new Promise<void>((resolve, reject) => {
      const deadline = new Date();
      deadline.setSeconds(deadline.getSeconds() + 5);

      this.client!.waitForReady(deadline, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      this.client.close();
      this.client = null;
    }
    this.services.clear();
    this.streams.clear();
    this.protoDescriptor = null;
    this.reflectionClient = null;
  }

  async discover(): Promise<GrpcService[]> {
    if (!this.client) {
      throw new Error('Not connected to gRPC server');
    }

    const timeoutMs = 5000;
    let timeoutHandle: NodeJS.Timeout | null = null;
    let didTimeout = false;

    try {
      const { GrpcReflection } = require('grpc-js-reflection-client');
      const host = this.connectionUrl.replace(/^https?:\/\//, '');
      const credentials = grpc.credentials.createInsecure();
      this.reflectionClient = new GrpcReflection(host, credentials);

      // Clear proto descriptor when using reflection
      this.protoDescriptor = null;

      const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
        return new Promise((resolve, reject) => {
          timeoutHandle = setTimeout(() => {
            didTimeout = true;
            reject(new Error('Reflection discovery timed out'));
          }, ms);
          promise.then(
            (res) => {
              if (!didTimeout) {
                clearTimeout(timeoutHandle!);
                resolve(res);
              }
            },
            (err) => {
              if (!didTimeout) {
                clearTimeout(timeoutHandle!);
                reject(err);
              }
            }
          );
        });
      };

      const services = (await withTimeout(
        this.reflectionClient.listServices(),
        timeoutMs
      )) as any[];
      const result: GrpcService[] = [];

      for (const serviceName of services) {
        try {
          const methods = (await withTimeout(
            this.reflectionClient.listMethods(serviceName),
            timeoutMs
          )) as any[];
          const serviceMethods: GrpcMethod[] = methods.map((method: any) => ({
            name: method.name || '',
            requestType: method.inputType || '',
            responseType: method.outputType || '',
            requestStream: method.clientStreaming || false,
            responseStream: method.serverStreaming || false,
          }));
          result.push({
            name: serviceName,
            methods: serviceMethods,
          });
        } catch (error) {
          result.push({
            name: serviceName,
            methods: [],
          });
        }
      }

      // Store the discovered services in the services Map for method invocation
      this.services.clear();
      for (const service of result) {
        this.services.set(service.name, service);
      }

      return result;
    } catch (error) {
      return [];
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle);
    }
  }

  async invokeUnary(
    serviceName: string,
    methodName: string,
    request: any,
    options: { metadata?: Record<string, string>; deadline?: number } = {}
  ): Promise<any> {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    const method = service.methods.find((m) => m.name === methodName);
    if (!method) {
      throw new Error(
        `Method ${methodName} not found in service ${serviceName}`
      );
    }

    if (method.requestStream || method.responseStream) {
      throw new Error(`Method ${methodName} is not unary`);
    }

    try {
      let grpcClient: any;

      // Check if we have a proto descriptor (proto-based services)
      if (this.protoDescriptor) {
        // Navigate to the service in the proto descriptor
        const serviceParts = serviceName.split('.');
        let serviceConstructor = this.protoDescriptor;
        for (const part of serviceParts) {
          serviceConstructor = serviceConstructor[part];
          if (!serviceConstructor) {
            throw new Error(
              `Service ${serviceName} not found in proto descriptor`
            );
          }
        }

        // Create the gRPC client from proto descriptor
        grpcClient = new serviceConstructor(
          this.connectionUrl,
          grpc.credentials.createInsecure()
        );
      } else if (this.reflectionClient) {
        // Get the proto descriptor for this service via reflection
        const descriptor =
          await this.reflectionClient.getDescriptorBySymbol(serviceName);

        // Create package object from descriptor
        const packageObject = descriptor.getPackageObject({
          keepCase: true,
          enums: String,
          longs: String,
          defaults: true,
          oneofs: true,
        });

        // Navigate to the service in the package object
        const serviceParts = serviceName.split('.');
        let serviceConstructor = packageObject;
        for (const part of serviceParts) {
          serviceConstructor = serviceConstructor[part];
          if (!serviceConstructor) {
            throw new Error(
              `Service ${serviceName} not found in package object`
            );
          }
        }

        // Create the gRPC client
        grpcClient = new serviceConstructor(
          this.connectionUrl,
          grpc.credentials.createInsecure()
        );
      } else {
        throw new Error(
          'No proto descriptor or reflection client available. Please import a proto file or discover services first.'
        );
      }

      // Call the method
      const response = await new Promise((resolve, reject) => {
        const metadata = new grpc.Metadata();
        if (options.metadata) {
          Object.entries(options.metadata).forEach(([key, value]) => {
            metadata.set(key, value);
          });
        }

        const callOptions: any = {};
        if (options.deadline) {
          const deadline = new Date();
          deadline.setMilliseconds(
            deadline.getMilliseconds() + options.deadline
          );
          callOptions.deadline = deadline;
        }

        grpcClient[methodName](
          request,
          metadata,
          callOptions,
          (error: any, response: any) => {
            if (error) {
              reject(error);
            } else {
              resolve(response);
            }
          }
        );
      });

      return response;
    } catch (error) {
      throw error;
    }
  }

  async invokeStream(
    serviceName: string,
    methodName: string,
    request: any,
    options: { metadata?: Record<string, string>; deadline?: number } = {}
  ): Promise<GrpcStream> {
    if (!this.client) {
      throw new Error('Not connected to gRPC server');
    }

    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    const method = service.methods.find((m) => m.name === methodName);
    if (!method) {
      throw new Error(
        `Method ${methodName} not found in service ${serviceName}`
      );
    }

    const metadata = new grpc.Metadata();
    if (options.metadata) {
      Object.entries(options.metadata).forEach(([key, value]) => {
        metadata.set(key, value);
      });
    }

    const callOptions: grpc.CallOptions = {};
    if (options.deadline) {
      const deadline = new Date();
      deadline.setMilliseconds(deadline.getMilliseconds() + options.deadline);
      callOptions.deadline = deadline;
    }

    let call:
      | grpc.ClientDuplexStream<any, any>
      | grpc.ClientReadableStream<any>
      | grpc.ClientWritableStream<any>;

    if (method.requestStream && method.responseStream) {
      // Bidirectional streaming
      call = this.client.makeBidiStreamRequest(
        `/${serviceName}/${methodName}`,
        (arg: any) => Buffer.from(JSON.stringify(arg)),
        (buffer: Buffer) => JSON.parse(buffer.toString()),
        metadata,
        callOptions
      );
    } else if (method.requestStream) {
      // Client streaming
      call = this.client.makeClientStreamRequest(
        `/${serviceName}/${methodName}`,
        (arg: any) => Buffer.from(JSON.stringify(arg)),
        (buffer: Buffer) => JSON.parse(buffer.toString()),
        metadata,
        callOptions,
        () => {}
      );
    } else if (method.responseStream) {
      // Server streaming
      call = this.client.makeServerStreamRequest(
        `/${serviceName}/${methodName}`,
        (arg: any) => Buffer.from(JSON.stringify(arg)),
        (buffer: Buffer) => JSON.parse(buffer.toString()),
        request,
        metadata,
        callOptions
      );
    } else {
      throw new Error(`Method ${methodName} is not streaming`);
    }

    const streamId = `stream_${++this.streamCounter}`;
    const stream: GrpcStream = { id: streamId, call };
    this.streams.set(streamId, stream);

    return stream;
  }

  async importProto(filePath: string): Promise<GrpcService[]> {
    try {
      const packageDefinition = protoLoader.loadSync(filePath, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      });

      const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
      const services: GrpcService[] = [];

      // Look for services in the package definition keys
      // Services typically have names like "package.ServiceName" while messages don't have methods
      const packageKeys = Object.keys(packageDefinition);

      for (const packageKey of packageKeys) {
        // Get the definition from the package
        const definition = packageDefinition[packageKey];

        // Check if this is a service definition (has methods)
        if (
          definition &&
          typeof definition === 'object' &&
          'service' in definition
        ) {
          const serviceDef = (definition as any)['service'];
          const methods: GrpcMethod[] = [];

          // Extract methods from the service definition
          if (serviceDef && typeof serviceDef === 'object') {
            for (const [methodName, methodDef] of Object.entries(serviceDef)) {
              if (typeof methodDef === 'object' && methodDef !== null) {
                const method = methodDef as any;

                methods.push({
                  name: methodName,
                  requestType:
                    method.requestType?.type?.name ||
                    method.requestType?.name ||
                    'Unknown',
                  responseType:
                    method.responseType?.type?.name ||
                    method.responseType?.name ||
                    'Unknown',
                  requestStream: method.requestStream || false,
                  responseStream: method.responseStream || false,
                });
              }
            }
          }

          if (methods.length > 0) {
            services.push({
              name: packageKey,
              methods,
            });
          }
        }
      }

      // Alternative approach: Look for service constructors in the proto descriptor
      if (services.length === 0) {
        const findServices = (obj: any, prefix: string = ''): void => {
          for (const [key, value] of Object.entries(obj)) {
            if (value && typeof value === 'function') {
              const fullName = prefix ? `${prefix}.${key}` : key;

              // Check if this function has a service property (gRPC service constructor)
              if ((value as any).service) {
                const serviceDef = (value as any).service;
                const methods: GrpcMethod[] = [];

                for (const [methodName, methodDef] of Object.entries(
                  serviceDef
                )) {
                  if (typeof methodDef === 'object' && methodDef !== null) {
                    const method = methodDef as any;

                    methods.push({
                      name: methodName,
                      requestType:
                        method.requestType?.type?.name ||
                        method.requestType?.name ||
                        'Unknown',
                      responseType:
                        method.responseType?.type?.name ||
                        method.responseType?.name ||
                        'Unknown',
                      requestStream: method.requestStream || false,
                      responseStream: method.responseStream || false,
                    });
                  }
                }

                if (methods.length > 0) {
                  services.push({
                    name: fullName,
                    methods,
                  });
                }
              }
            } else if (
              value &&
              typeof value === 'object' &&
              !Array.isArray(value)
            ) {
              const fullName = prefix ? `${prefix}.${key}` : key;
              findServices(value, fullName);
            }
          }
        };

        findServices(protoDescriptor);
      }

      // Store the proto descriptor for method invocation
      this.protoDescriptor = protoDescriptor;

      // Clear current services and store the new ones from proto file
      this.services.clear();
      for (const service of services) {
        this.services.set(service.name, service);
      }

      return services;
    } catch (error) {
      throw new Error(
        `Failed to import proto file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  getStream(streamId: string): GrpcStream | undefined {
    return this.streams.get(streamId);
  }

  closeStream(streamId: string): void {
    const stream = this.streams.get(streamId);
    if (stream) {
      stream.call.cancel();
      this.streams.delete(streamId);
    }
  }

  isConnected(): boolean {
    return this.client !== null;
  }

  getConnectionUrl(): string {
    return this.connectionUrl;
  }
}
